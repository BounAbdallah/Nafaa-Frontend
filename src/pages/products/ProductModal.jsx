import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Package, Zap, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

const schema = z.object({
  name:           z.string().min(1, 'Nom requis'),
  type:           z.enum(['product', 'service', 'material']),
  category_id:    z.any().transform(v => v === '' || isNaN(v) ? null : Number(v)).optional().nullable(),
  unit:           z.string().min(1, 'Unité requise'),
  selling_price:  z.coerce.number().min(0, 'Prix invalide'),
  cost_price:     z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().int().min(0).optional(),
  stock_alert:    z.coerce.number().int().min(0).optional(),
  description:    z.string().optional(),
  sku:            z.string().optional(),
  is_active:      z.boolean().optional(),
})

export default function ProductModal({ product, meta, onClose, onSaved }) {
  const { user } = useAuthStore()
  const isManufacturer = user?.tenant?.profile_type === 'manufacturer'
  
  const isEdit = !!product?.id
  const [imagePreview, setImagePreview] = useState(product?.image || null)
  const [imageFile, setImageFile]       = useState(null)

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { ...product }
      : { type: 'product', unit: 'pièce', is_active: true, stock_alert: 5 },
  })
  const type = watch('type')

  useEffect(() => { 
    if (product) {
      reset(product)
      setImagePreview(product.image)
    } 
  }, [product, reset])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          // Convertir les booléens pour FormData (qui n'accepte que des strings/blobs)
          if (typeof val === 'boolean') {
            formData.append(key, val ? '1' : '0')
          } else {
            formData.append(key, val)
          }
        }
      })
      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (isEdit) await productService.update(product.id, formData)
      else        await productService.create(formData)
      
      toast.success(isEdit ? 'Produit mis à jour.' : 'Produit ajouté.')
      onSaved()
    } catch (err) {
      const msg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : err.response?.data?.message || 'Erreur.'
      toast.error(msg)
    }
  }

  const field = (name, label, props = {}) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">{label}</label>
      <input
        {...register(name)}
        {...props}
        className={cn('input-field', errors[name] && 'border-danger focus:border-danger focus:ring-danger/20')}
      />
      {errors[name] && <p className="text-xs text-danger">{errors[name].message}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-modal shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-6 pb-6 space-y-4">
            {/* Image Upload */}
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-card border-2 border-dashed border-muted-300 flex items-center justify-center overflow-hidden bg-muted-50 group-hover:border-primary-400 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-muted-300 group-hover:text-primary-400 transition-colors" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                  <Plus size={16} />
                </div>
              </div>
            </div>

            {isManufacturer && (
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Type d'article</label>
                <Controller name="type" control={control} render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'product',  label: 'Produit',   icon: Package },
                      { value: 'material', label: 'Matière',   icon: Package },
                      { value: 'service',  label: 'Service',   icon: Zap },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2 px-3 rounded-btn border text-xs font-medium transition-all',
                          field.value === t.value 
                            ? 'bg-primary-50 border-primary-500 text-primary-700' 
                            : 'bg-surface border-muted-300 text-muted-600 hover:border-muted-400'
                        )}
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                )} />
              </div>
            )}

            {!isManufacturer && <input type="hidden" {...register('type')} value="product" />}

            {/* Nom + SKU */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">{field('name', 'Nom', { placeholder: 'ex: Tissu Bazin' })}</div>
              <div>{field('sku', 'SKU', { placeholder: 'ex: TXT-001' })}</div>
            </div>

            {/* Catégorie + Unité */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Catégorie</label>
                <Controller name="category_id" control={control} render={({ field }) => (
                  <select {...field} value={field.value || ''} className="input-field appearance-none">
                    <option value="">— Aucune —</option>
                    {meta?.dynamic_categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Unité</label>
                <Controller name="unit" control={control} render={({ field }) => (
                  <select {...field} className={cn('input-field appearance-none', errors.unit && 'border-danger')}>
                    <option value="">— Choisir —</option>
                    {(meta?.units ?? []).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                )} />
                {errors.unit && <p className="text-xs text-danger">{errors.unit.message}</p>}
              </div>
            </div>

            {/* Prix */}
            <div className="grid grid-cols-2 gap-3">
              {field('selling_price', 'Prix de vente (FCFA)', { type: 'number', placeholder: '0' })}
              {field('cost_price', 'Prix de revient (FCFA)', { type: 'number', placeholder: '0' })}
            </div>

            {/* Stock (produit ou matière) */}
            {(type === 'product' || type === 'material') && (
              <div className="grid grid-cols-2 gap-3">
                {field('stock_quantity', 'Stock actuel', { type: 'number', placeholder: '0' })}
                {field('stock_alert', "Seuil d'alerte", { type: 'number', placeholder: '5' })}
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Description</label>
              <textarea {...register('description')} rows={2} placeholder="Description optionnelle…" className="input-field resize-none" />
            </div>

            {/* Actif */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-500 rounded" />
              <span className="text-sm font-sans text-navy">Produit actif (visible dans les commandes)</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-muted-100 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
            {isSubmitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
          </button>
        </div>
      </div>
    </div>
  )
}

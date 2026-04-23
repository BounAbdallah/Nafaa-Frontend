import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productService } from '@/services/productService'
import toast from 'react-hot-toast'
import { Package, Zap, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'

const schema = z.object({
  name:           z.string().min(1, 'Nom requis'),
  type:           z.enum(['product', 'service']),
  category:       z.string().optional(),
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
  const isEdit = !!product
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

            {/* Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[{v:'product',l:'Produit',icon:Package},{v:'service',l:'Service',icon:Zap}].map(({v,l,icon:Icon}) => (
                  <label key={v} className={cn(
                    'flex items-center gap-2.5 p-3 rounded-card border cursor-pointer transition-all',
                    watch('type') === v ? 'border-primary-400 bg-primary-50' : 'border-muted-300 hover:border-muted-500'
                  )}>
                    <input type="radio" value={v} {...register('type')} className="sr-only" />
                    <Icon size={16} className={watch('type') === v ? 'text-primary-500' : 'text-muted-500'} />
                    <span className="text-sm font-sans font-medium text-navy">{l}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Nom + SKU */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">{field('name', 'Nom', { placeholder: 'ex: Tissu Bazin' })}</div>
              <div>{field('sku', 'SKU', { placeholder: 'ex: TXT-001' })}</div>
            </div>

            {/* Catégorie + Unité */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Catégorie</label>
                <Controller name="category" control={control} render={({ field }) => (
                  <select {...field} className="input-field appearance-none">
                    <option value="">— Aucune —</option>
                    {meta?.categories?.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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

            {/* Stock (produit uniquement) */}
            {type === 'product' && (
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

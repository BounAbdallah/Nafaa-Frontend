import { useEffect, useState, lazy, Suspense } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { productService } from '@/services/productService'
import { categoryService } from '@/services/categoryService'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Package, Zap, X, Loader2, Image as ImageIcon, Plus, Tag, Check, ScanLine } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCurrency } from '@/utils/currency'

const BarcodeScanner = lazy(() => import('@/components/BarcodeScanner'))

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
  const { symbol } = useCurrency()

  const isEdit = !!product?.id
  const [imagePreview, setImagePreview] = useState(product?.image || null)
  const [imageFile, setImageFile]       = useState(null)

  const [categories, setCategories]     = useState([])
  const [catsLoading, setCatsLoading]   = useState(true)
  const [showNewCat, setShowNewCat]     = useState(false)
  const [newCatName, setNewCatName]     = useState('')
  const [newCatSaving, setNewCatSaving] = useState(false)

  const [showScanner, setShowScanner]   = useState(false)
  const [scanLoading, setScanLoading]   = useState(false)

  const {
    register, handleSubmit, watch, reset, control, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: product
      ? { ...product }
      : { type: 'product', unit: 'pièce', is_active: true, stock_alert: 5 },
  })
  const type = watch('type')

  useEffect(() => {
    setCatsLoading(true)
    categoryService.getAll({ per_page: 100 })
      .then(r => setCategories(r.data?.categories ?? []))
      .catch(() => {})
      .finally(() => setCatsLoading(false))
  }, [])

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

  // Scan d'un code-barres → recherche Open Food Facts → pré-remplissage
  const handleBarcodeScan = async (code) => {
    setShowScanner(false)
    setScanLoading(true)
    try {
      const res = await productService.lookupBarcode(code)
      const data = res.data ?? {}

      // Le code-barres devient le SKU dans tous les cas
      setValue('sku', data.barcode || code, { shouldValidate: true })

      if (data.found) {
        if (data.name)     setValue('name', data.name, { shouldValidate: true })
        if (data.category) setValue('category', data.category, { shouldValidate: true })

        // Image distante → fichier local pour qu'elle soit enregistrée
        if (data.image_url) {
          try {
            const blob = await (await fetch(data.image_url)).blob()
            if (blob && blob.size > 0) {
              const file = new File([blob], 'produit.jpg', { type: blob.type || 'image/jpeg' })
              setImageFile(file)
              setImagePreview(URL.createObjectURL(blob))
            }
          } catch { /* image facultative — on ignore si le téléchargement échoue */ }
        }

        toast.success(`Produit reconnu : ${data.name}`)
      } else {
        toast('Code enregistré, mais produit inconnu. Complétez le nom manuellement.', { icon: 'ℹ️' })
      }
    } catch {
      toast.error('Recherche impossible. Saisissez le produit manuellement.')
    } finally {
      setScanLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setNewCatSaving(true)
    try {
      const res     = await categoryService.create({ name: newCatName.trim(), is_active: true })
      const created = res.data?.category
      if (created) {
        setCategories(prev => [...prev, created])
        setValue('category_id', created.id)
        toast.success(`Catégorie « ${created.name} » créée`)
      }
      setNewCatName('')
      setShowNewCat(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur création catégorie')
    } finally {
      setNewCatSaving(false)
    }
  }

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (key === 'image') return  // géré séparément via imageFile
        if (val !== undefined && val !== null) {
          if (typeof val === 'boolean') formData.append(key, val ? '1' : '0')
          else formData.append(key, val)
        }
      })
      if (imageFile) formData.append('image', imageFile)

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
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-surface rounded-t-2xl sm:rounded-modal shadow-2xl w-full sm:max-w-xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-muted-100 shrink-0">
          <h3 className="font-display font-bold text-navy">
            {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-muted-500 hover:text-navy rounded-btn hover:bg-muted-100">
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1">
          <div className="px-5 sm:px-6 py-4 space-y-4">

            {/* Image upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-card border-2 border-dashed border-muted-300 flex items-center justify-center overflow-hidden bg-muted-50 group-hover:border-primary-400 transition-colors">
                  {imagePreview
                    ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    : <ImageIcon size={22} className="text-muted-300 group-hover:text-primary-400 transition-colors" />
                  }
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg pointer-events-none group-hover:scale-110 transition-transform">
                  <Plus size={14} />
                </div>
              </div>
            </div>

            {/* Scan code-barres → pré-remplissage */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              disabled={scanLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn border border-dashed border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors text-sm font-sans font-semibold disabled:opacity-60"
            >
              {scanLoading
                ? <><Loader2 size={16} className="animate-spin" />Recherche du produit…</>
                : <><ScanLine size={16} />Scanner le code-barres pour remplir automatiquement</>
              }
            </button>

            {/* Type (manufacturer seulement) */}
            {isManufacturer && (
              <div className="space-y-1.5">
                <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Type d'article</label>
                <Controller name="type" control={control} render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'product',  label: 'Produit', icon: Package },
                      { value: 'material', label: 'Matière', icon: Package },
                      { value: 'service',  label: 'Service', icon: Zap },
                    ].map(t => (
                      <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-btn border text-xs font-medium transition-all',
                          field.value === t.value
                            ? 'bg-primary-50 border-primary-500 text-primary-700'
                            : 'bg-surface border-muted-300 text-muted-600 hover:border-muted-400'
                        )}>
                        <t.icon size={13} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                )} />
              </div>
            )}

            {!isManufacturer && <input type="hidden" {...register('type')} value="product" />}

            {/* Nom + SKU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">{field('name', 'Nom', { placeholder: 'ex: Tissu Bazin' })}</div>
              <div>{field('sku', 'SKU', { placeholder: 'ex: TXT-001' })}</div>
            </div>

            {/* Catégorie + Unité */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Catégorie */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Catégorie</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCat(v => !v)}
                    className={cn(
                      'flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded transition-colors',
                      showNewCat
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-primary-500 hover:text-primary-700 hover:bg-primary-50'
                    )}
                  >
                    <Tag size={11} /> Nouvelle
                  </button>
                </div>

                {showNewCat && (
                  <div className="flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-150">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  { e.preventDefault(); handleCreateCategory() }
                        if (e.key === 'Escape') { setShowNewCat(false) }
                      }}
                      placeholder="Nom de la catégorie…"
                      className="input-field text-xs h-8 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={newCatSaving || !newCatName.trim()}
                      className="h-8 w-8 flex items-center justify-center rounded-btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-40 shrink-0"
                    >
                      {newCatSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewCat(false); setNewCatName('') }}
                      className="h-8 w-8 flex items-center justify-center rounded-btn border border-muted-200 text-muted-400 hover:text-muted-600 shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <Controller name="category_id" control={control} render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ''}
                    className="input-field appearance-none"
                    disabled={catsLoading}
                  >
                    <option value="">— Aucune —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {!catsLoading && categories.length === 0 && (
                      <option value="" disabled>Aucune catégorie — créez-en une ci-dessus</option>
                    )}
                  </select>
                )} />
              </div>

              {/* Unité */}
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

            {/* Prix vente + Prix revient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {field('selling_price', `Prix de vente (${symbol})`, { type: 'number', placeholder: '0' })}
              {field('cost_price',    `Prix de revient (${symbol})`, { type: 'number', placeholder: '0' })}
            </div>

            {/* Stock */}
            {(type === 'product' || type === 'material') && (
              <div className="grid grid-cols-2 gap-3">
                {field('stock_quantity', 'Stock actuel',    { type: 'number', placeholder: '0' })}
                {field('stock_alert',    "Seuil d'alerte",  { type: 'number', placeholder: '5' })}
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Description</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Description optionnelle…"
                className="input-field resize-none"
              />
            </div>

            {/* Actif */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-primary-500 rounded" />
              <span className="text-sm font-sans text-navy">Produit actif (visible dans les commandes)</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-muted-100 shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 h-11">Annuler</button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="btn-primary flex-1 h-11 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {isSubmitting ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Ajouter')}
          </button>
        </div>
      </div>

      {/* Scanner de code-barres */}
      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
            lastResult=""
          />
        </Suspense>
      )}
    </div>
  )
}

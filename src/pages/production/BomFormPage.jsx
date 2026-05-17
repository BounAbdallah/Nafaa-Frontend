import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { bomService } from '@/services/bomService'
import { useCurrency } from '@/utils/currency'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Save, X, Loader2, ArrowLeft, Beaker,
  TrendingDown, Info, ShoppingCart, Calculator
} from 'lucide-react'
import { cn } from '@/utils/cn'

const schema = z.object({
  product_id: z.coerce.number().min(1, 'Produit fini requis'),
  name: z.string().optional(),
  quantity: z.coerce.number().min(0.001, 'Quantité de base requise'),
  waste_percentage: z.coerce.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
  items: z.array(z.object({
    ingredient_id: z.coerce.number().min(1, 'Ingrédient requis'),
    quantity: z.coerce.number().min(0.0001, 'Quantité requise')
  })).min(1, 'Ajoutez au moins un ingrédient')
})

export default function BomFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const { format: fmt } = useCurrency()
  const [loading, setLoading] = useState(isEdit)
  const [meta, setMeta] = useState({ products: [], ingredients: [] })

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: '',
      name: '',
      quantity: 1,
      waste_percentage: 0,
      is_active: true,
      items: [{ ingredient_id: '', quantity: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchItems = watch('items')
  const watchWaste = watch('waste_percentage')

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const metaRes = await bomService.getMeta()
        setMeta(metaRes.data)

        if (isEdit) {
          const bomRes = await bomService.getById(id)
          const bom = bomRes.data
          setValue('product_id', bom.product_id)
          setValue('name', bom.name || '')
          setValue('quantity', bom.quantity)
          setValue('waste_percentage', bom.waste_percentage)
          setValue('is_active', bom.is_active)
          setValue('items', bom.items.map(item => ({
            ingredient_id: item.ingredient_id,
            quantity: item.quantity
          })))
        }
      } catch (err) {
        toast.error('Erreur lors du chargement des données')
        navigate('/production/boms')
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [id, isEdit, setValue, navigate])

  const onSubmit = async (data) => {
    try {
      if (isEdit) await bomService.update(id, data)
      else await bomService.create(data)
      toast.success(isEdit ? 'Recette mise à jour' : 'Recette créée')
      navigate('/production/boms')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const calculateTotalCost = () => {
    let total = 0
    watchItems.forEach(item => {
      const ing = meta.ingredients.find(i => i.id === Number(item.ingredient_id))
      if (ing) {
        total += (Number(item.quantity) || 0) * (ing.cost_price || 0)
      }
    })
    return total * (1 + (Number(watchWaste) || 0) / 100)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
        <p className="text-muted-500 font-medium">Chargement de la recette...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link to="/production/boms" className="p-2 text-muted-500 hover:text-navy hover:bg-surface rounded-btn border border-transparent hover:border-muted-300 transition-all shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-navy tracking-tight">
            {isEdit ? 'Modifier la Recette' : 'Nouvelle Recette (BOM)'}
          </h1>
          <p className="text-muted-500 text-sm hidden sm:block">Précisez les composants et les pertes pour la fabrication.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">

          {/* Informations de base */}
          <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-muted-200 bg-muted-50/50">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wider">
                <Beaker size={16} className="text-primary-500" /> Informations de base
              </h2>
            </div>
            <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Produit Fini à fabriquer *</label>
                  <select
                    {...register('product_id')}
                    className={cn("input-field appearance-none", errors.product_id && "border-danger")}
                    disabled={isEdit}
                  >
                    <option value="">Sélectionner un produit</option>
                    {meta.products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                  {errors.product_id && <p className="text-[11px] text-danger font-medium">{errors.product_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Nom de la recette (Optionnel)</label>
                  <input
                    {...register('name')}
                    placeholder="Ex: Formule standard, Batch hiver..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Quantité produite pour cette recette *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      {...register('quantity')}
                      className={cn("input-field pr-16", errors.quantity && "border-danger")}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-400">
                      UNITÉ
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-500">Ex: 100 pour une recette qui produit 100 savons.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-700 uppercase tracking-wide">Pertes automatiques (%)</label>
                  <div className="relative">
                    <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 text-danger/50" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      {...register('waste_percentage')}
                      className="input-field pl-10 pr-12 text-danger font-bold"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-danger">%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ingrédients */}
          <div className="bg-surface rounded-card shadow-card border border-muted-300 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-muted-200 bg-muted-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wider">
                <ShoppingCart size={16} className="text-primary-500" /> Ingrédients & Matières Premières
              </h2>
              <button
                type="button"
                onClick={() => append({ ingredient_id: '', quantity: 0 })}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1.5 transition-all"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Ajouter un ingrédient</span><span className="sm:hidden">Ajouter</span>
              </button>
            </div>

            {/* Table on sm+ */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted-50/50 border-b border-muted-200">
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-wider">Ingrédient</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-wider w-40">Quantité</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-muted-500 uppercase tracking-wider w-32 text-right hidden sm:table-cell">Coût Est.</th>
                    <th className="px-6 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-100">
                  {fields.map((field, index) => {
                    const ingId = watchItems[index]?.ingredient_id
                    const ingredient = meta.ingredients.find(i => i.id === Number(ingId))
                    const cost = ingredient ? (Number(watchItems[index]?.quantity) || 0) * ingredient.cost_price : 0

                    return (
                      <tr key={field.id} className="group hover:bg-muted-50/30 transition-all">
                        <td className="px-6 py-4">
                          <select
                            {...register(`items.${index}.ingredient_id`)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-navy cursor-pointer"
                          >
                            <option value="">Sélectionner...</option>
                            {meta.ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.0001"
                              {...register(`items.${index}.quantity`)}
                              className="w-full bg-muted-100/50 border border-muted-200 rounded px-2 py-1 text-sm font-bold text-navy focus:outline-none focus:border-primary-400"
                            />
                            <span className="text-[10px] font-bold text-muted-400 uppercase">{ingredient?.unit || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right hidden sm:table-cell">
                          <span className="text-sm font-medium text-muted-600">{fmt(cost)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-muted-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {errors.items && <p className="px-6 py-3 text-[11px] text-danger font-medium">{errors.items.message}</p>}
            </div>

            {/* Mobile ingredient cards */}
            <div className="sm:hidden divide-y divide-muted-100">
              {fields.map((field, index) => {
                const ingId = watchItems[index]?.ingredient_id
                const ingredient = meta.ingredients.find(i => i.id === Number(ingId))
                const cost = ingredient ? (Number(watchItems[index]?.quantity) || 0) * ingredient.cost_price : 0

                return (
                  <div key={field.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-muted-400 uppercase">Ingrédient {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-muted-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <select
                      {...register(`items.${index}.ingredient_id`)}
                      className="input-field text-sm"
                    >
                      <option value="">Sélectionner un ingrédient...</option>
                      {meta.ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-muted-400 uppercase">Quantité</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            {...register(`items.${index}.quantity`)}
                            className="input-field font-bold text-navy"
                          />
                          <span className="text-[10px] font-bold text-muted-400 uppercase shrink-0">{ingredient?.unit || '—'}</span>
                        </div>
                      </div>
                      {cost > 0 && (
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-muted-400 uppercase">Coût est.</div>
                          <div className="text-sm font-bold text-navy">{fmt(cost)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {errors.items && <p className="px-4 py-3 text-[11px] text-danger font-medium">{errors.items.message}</p>}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => append({ ingredient_id: '', quantity: 0 })}
                  className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} /> Ajouter un ingrédient
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Recap */}
        <div className="space-y-5 sm:space-y-6">
          <div className="bg-surface rounded-card shadow-card border border-muted-300 p-4 sm:p-5 lg:sticky lg:top-24">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-5 sm:mb-6 flex items-center gap-2">
              <Calculator size={18} className="text-primary-500" /> Résumé Théorique
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-500">Total Ingrédients</span>
                <span className="font-bold text-navy">{fmt(calculateTotalCost() / (1 + (watchWaste / 100)))}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-500">Pertes (+{watchWaste}%)</span>
                <span className="font-bold text-danger">{fmt(calculateTotalCost() - (calculateTotalCost() / (1 + (watchWaste / 100))))}</span>
              </div>
              <div className="h-px bg-muted-200 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-navy uppercase">Coût de revient total</span>
                <span className="text-lg font-black text-primary-600">{fmt(calculateTotalCost())}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-500 italic">Coût unitaire estimé</span>
                <span className="font-medium text-muted-700">{fmt(calculateTotalCost() / (Number(watch('quantity')) || 1))}</span>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                <span>{isEdit ? 'Enregistrer les modifications' : 'Créer la recette'}</span>
              </button>
              <Link to="/production/boms" className="w-full btn-secondary py-3 flex items-center justify-center">
                Annuler
              </Link>
            </div>

            <div className="mt-5 sm:mt-6 p-4 sm:p-5 bg-muted-50 rounded-lg border border-muted-200">
              <div className="flex gap-3">
                <Info size={16} className="text-primary-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-600 leading-relaxed">
                  Ce coût est basé sur le <span className="font-bold">prix d'achat actuel</span> de vos ingrédients. Il peut varier lors de la fabrication réelle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

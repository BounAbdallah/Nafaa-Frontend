import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { catalogService } from '@/services/catalogService'
import { useAuthStore } from '@/store/authStore'
import { COUNTRIES } from '@/utils/currency'
import { confirmDialog } from '@/utils/confirm'
import toast from 'react-hot-toast'
import {
  PackageSearch, Plus, X, Loader2, Search, Trash2, Pencil,
  ScanLine, Image as ImageIcon, ChevronLeft, ChevronRight, Globe,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import CountryFilter from '@/components/admin/CountryFilter'

const BarcodeScanner = lazy(() => import('@/components/BarcodeScanner'))

const CATEGORIES = [
  ['alimentaire', 'Alimentaire'], ['textile', 'Textile & Habillement'],
  ['electronique', 'Électronique'], ['informatique', 'Informatique'],
  ['mobilier', 'Mobilier & Décoration'], ['cosmetique', 'Cosmétique & Beauté'],
  ['sante', 'Santé & Pharmacie'], ['construction', 'Construction & BTP'],
  ['agriculture', 'Agriculture'], ['transport', 'Transport & Logistique'],
  ['services', 'Services'], ['autre', 'Autre'],
]
const UNITS = ['pièce', 'kg', 'g', 'litre', 'cl', 'ml', 'm', 'boîte', 'carton', 'sac']

const countryLabel = (code) => COUNTRIES.find(c => c.code === code)?.label ?? code

export default function CatalogManagement() {
  const role = useAuthStore(s => s.role)
  const isSuper = role === 'super_admin'

  const [items, setItems]     = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [country, setCountry] = useState('')
  const [modal, setModal]     = useState(null) // 'add' | item

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search)  params.search = search
      if (country) params.country = country
      const r = await catalogService.getAll(params)
      setItems(r.data.products)
      setMeta(r.data.meta)
    } catch { toast.error('Impossible de charger le catalogue.') }
    finally { setLoading(false) }
  }, [page, search, country])

  useEffect(() => {
    const t = setTimeout(fetchItems, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [fetchItems])

  const handleDelete = async (item) => {
    if (!(await confirmDialog({
      title: `Retirer « ${item.name} » du catalogue ?`,
      text: 'Les commerçants ne le verront plus lors d\'un scan.',
      confirmText: 'Retirer',
    }))) return
    try {
      const r = await catalogService.remove(item.id)
      toast.success(r.message)
      fetchItems()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-navy flex items-center gap-2">
            <PackageSearch size={22} className="text-primary-500" />
            Catalogue produits
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Produits locaux reconnus au scan par les commerçants de {isSuper ? 'chaque pays' : 'votre pays'}.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CountryFilter value={country} onChange={(c) => { setCountry(c); setPage(1) }} className="w-40" />
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Ajouter
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, marque ou code-barres…"
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50">
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Produit</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden sm:table-cell">Code-barres</th>
                <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide hidden md:table-cell">Catégorie</th>
                {isSuper && <th className="text-left py-3 px-4 text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</th>}
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-40 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><div className="h-4 w-28 bg-muted-100 rounded" /></td>
                    <td className="py-3 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-muted-100 rounded" /></td>
                    {isSuper && <td className="py-3 px-4"><div className="h-4 w-12 bg-muted-100 rounded" /></td>}
                    <td className="py-3 px-4" />
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={isSuper ? 5 : 4} className="py-16 text-center">
                    <PackageSearch size={32} className="mx-auto text-muted-300 mb-3" />
                    <p className="text-sm font-sans text-muted-500">Aucun produit dans le catalogue.</p>
                    <button onClick={() => setModal('add')} className="btn-primary mt-4 mx-auto text-xs py-2 px-4">
                      Ajouter le premier produit
                    </button>
                  </td>
                </tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-primary-50/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-card bg-muted-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <ImageIcon size={15} className="text-muted-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-sans font-semibold text-navy truncate max-w-[200px]">{item.name}</p>
                        {item.brand && <p className="text-[11px] text-muted-500">{item.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="text-xs font-mono text-muted-600">{item.barcode}</span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-xs text-muted-700">
                      {CATEGORIES.find(([k]) => k === item.category)?.[1] ?? '—'}
                    </span>
                  </td>
                  {isSuper && (
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy">
                        <Globe size={11} className="text-primary-500" />{item.country_code}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(item)} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5" title="Retirer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-muted-200">
            <p className="text-xs text-muted-500">{meta.total} produits — page {meta.current_page}/{meta.last_page}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronLeft size={15} /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-btn border border-muted-200 text-muted-600 disabled:opacity-40 hover:bg-muted-50"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <CatalogModal
          item={modal === 'add' ? null : modal}
          isSuper={isSuper}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchItems() }}
        />
      )}
    </div>
  )
}

// ── Modal création / édition ──────────────────────────────────────────────────
function CatalogModal({ item, isSuper, onClose, onSaved }) {
  const isEdit = !!item
  const [barcode, setBarcode]   = useState(item?.barcode ?? '')
  const [name, setName]         = useState(item?.name ?? '')
  const [brand, setBrand]       = useState(item?.brand ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [unit, setUnit]         = useState(item?.default_unit ?? '')
  const [countryCode, setCountryCode] = useState(item?.country_code ?? 'SN')
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(item?.image ?? null)
  const [showScanner, setShowScanner] = useState(false)
  const [saving, setSaving]     = useState(false)

  const onImage = (e) => {
    const f = e.target.files[0]
    if (f) {
      setImageFile(f)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(f)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || (!isEdit && !barcode.trim())) {
      toast.error('Code-barres et nom requis.')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      if (!isEdit) { fd.append('barcode', barcode); fd.append('country_code', countryCode) }
      fd.append('name', name)
      if (brand)    fd.append('brand', brand)
      if (category) fd.append('category', category)
      if (unit)     fd.append('default_unit', unit)
      if (imageFile) fd.append('image', imageFile)

      const r = isEdit ? await catalogService.update(item.id, fd) : await catalogService.create(fd)
      toast.success(r.message)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface rounded-card w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted-200 sticky top-0 bg-surface z-10">
          <h3 className="font-display font-bold text-navy">{isEdit ? 'Modifier le produit' : 'Ajouter au catalogue'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-btn text-muted-500 hover:bg-muted-100"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Image */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-card border-2 border-dashed border-muted-300 flex items-center justify-center overflow-hidden bg-muted-50 group-hover:border-primary-400">
                {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-muted-300" />}
              </div>
              <input type="file" accept="image/*" onChange={onImage} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
          </div>

          {/* Code-barres (création seulement) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Code-barres</label>
              <div className="flex gap-2">
                <input className="input-field flex-1" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Ex : 6181100340014" inputMode="numeric" />
                <button type="button" onClick={() => setShowScanner(true)} className="btn-secondary px-3 shrink-0" title="Scanner">
                  <ScanLine size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Pays (super admin, création) */}
          {!isEdit && isSuper && (
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Pays</label>
              <select className="input-field w-full" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Nom du produit</label>
            <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Ex : Jus de bissap Dakar" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Marque</label>
              <input className="input-field w-full" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Optionnel" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Unité</label>
              <select className="input-field w-full" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="">—</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-semibold text-muted-700 uppercase tracking-wide">Catégorie</label>
            <select className="input-field w-full" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">—</option>
              {CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {isEdit ? 'Enregistrer' : 'Ajouter au catalogue'}
          </button>
        </form>
      </div>

      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onScan={(code) => { setBarcode(code); setShowScanner(false) }}
            onClose={() => setShowScanner(false)}
            lastResult=""
          />
        </Suspense>
      )}
    </div>
  )
}

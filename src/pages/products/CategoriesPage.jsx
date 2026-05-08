import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { categoryService } from '@/services/categoryService'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, FolderTree, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function CategoriesPage() {
  const { isAdmin } = useAuthStore()
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await categoryService.getAll()
      setCategories(res.data.categories)
    } catch {
      toast.error('Impossible de charger les catégories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleDelete = async (cat) => {
    if (cat.products_count > 0) {
      toast.error('Impossible de supprimer une catégorie contenant des produits.')
      return
    }
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return
    try {
      await categoryService.delete(cat.id)
      toast.success('Catégorie supprimée.')
      fetchCategories()
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
            <FolderTree className="text-primary-500" />
            Catégories
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">Gérez vos catégories de produits</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Ajouter
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-muted-300 bg-muted-100/50 text-xs font-semibold text-muted-700 uppercase tracking-wide">
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4 hidden sm:table-cell">Description</th>
                <th className="py-3 px-4 text-center">Produits</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-100">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-muted-500">Chargement...</td></tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-500">
                    <FolderTree size={32} className="mx-auto mb-3 opacity-50" />
                    Aucune catégorie trouvée.
                  </td>
                </tr>
              ) : (
                categories.map(c => (
                  <tr key={c.id} className="hover:bg-muted-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-navy">{c.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-500 hidden sm:table-cell">{c.description || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {c.products_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-badge',
                        c.is_active ? 'bg-green-50 text-success' : 'bg-muted-100 text-muted-500'
                      )}>
                        {c.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin() && (
                          <>
                            <button onClick={() => setModal(c)} className="p-1.5 rounded-btn text-muted-500 hover:text-primary-500 hover:bg-primary-50">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(c)} className="p-1.5 rounded-btn text-muted-500 hover:text-danger hover:bg-danger/5">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <CategoryModal
          category={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchCategories() }}
        />
      )}
    </div>
  )
}

function CategoryModal({ category, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (category) {
        await categoryService.update(category.id, formData)
        toast.success('Catégorie mise à jour.')
      } else {
        await categoryService.create(formData)
        toast.success('Catégorie créée.')
      }
      onSaved()
    } catch {
      toast.error('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-modal shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-muted-100 bg-muted-50/50">
          <h2 className="font-display font-bold text-lg text-navy">
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted-100 text-muted-500 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Nom</label>
            <input
              required
              className="input-field"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Description</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-muted-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-navy">Catégorie active</span>
          </label>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
              {loading ? '...' : category ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

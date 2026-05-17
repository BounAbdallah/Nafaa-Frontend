import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { confirmDialog } from '@/utils/confirm'
import { useCurrency } from '@/utils/currency'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Zap,
  Users,
  HardDrive,
  Box,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function PacksManagement() {
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const { format: fmt } = useCurrency()

  const fetchPacks = async () => {
    setLoading(true)
    try {
      const res = await adminService.getPacks()
      setPacks(res.data.packs)
    } catch (err) {
      toast.error('Erreur lors du chargement des packs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacks()
  }, [])

  const handleDelete = async (id) => {
    if (!(await confirmDialog({
      title: 'Supprimer ce pack ?',
      text: 'Cette action est irréversible. Les espaces utilisant ce pack seront affectés.',
      confirmText: 'Supprimer',
      type: 'danger'
    }))) return
    try {
      await adminService.deletePack(id)
      toast.success('Pack supprimé')
      fetchPacks()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-500" />
            Gestion des Packs
          </h1>
          <p className="text-sm font-sans text-muted-500 mt-1">
            Configurez les offres et limites pour vos clients
          </p>
        </div>

        <Link to="/admin/packs/new" className="self-start sm:self-auto">
          <Button variant="primary" className="gap-2 w-full sm:w-auto">
            <Plus size={18} />
            <span className="hidden sm:inline">Créer un nouveau Pack</span>
            <span className="sm:hidden">Nouveau Pack</span>
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-3">
          <Package className="w-12 h-12 text-muted-200" />
          <p className="text-muted-400 font-sans text-sm">Aucun pack configuré pour le moment.</p>
          <Link to="/admin/packs/new">
            <Button variant="primary" className="gap-2 mt-1">
              <Plus size={16} />
              <span>Créer le premier Pack</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              fmt={fmt}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PackCard({ pack, fmt, onDelete }) {
  return (
    <div className="card group hover:border-primary-300 transition-all overflow-hidden flex flex-col">
      {/* Pack Header */}
      <div className="p-4 sm:p-5 border-b border-muted-100">
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "w-10 h-10 rounded-card flex items-center justify-center",
            pack.price === 0 ? "bg-muted-50 text-muted-500" : "bg-primary-50 text-primary-500"
          )}>
            <Zap size={20} />
          </div>
          <div className="flex gap-1">
            <Link
              to={`/admin/packs/${pack.id}`}
              className="p-2 hover:bg-muted-100 rounded-btn transition-colors text-muted-400 hover:text-primary-500"
              title="Modifier"
            >
              <Edit2 size={16} />
            </Link>
            <button
              onClick={() => onDelete(pack.id)}
              className="p-2 hover:bg-red-50 rounded-btn transition-colors text-muted-400 hover:text-danger"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-display font-bold text-navy">{pack.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl sm:text-2xl font-display font-black text-navy">
            {fmt(Number(pack.price))}
          </span>
          <span className="text-xs font-sans text-muted-500 font-bold uppercase tracking-widest">/ mois</span>
        </div>
      </div>

      {/* Pack Limits */}
      <div className="p-4 sm:p-5 flex-1 space-y-3 bg-muted-50/30">
        <div className="flex items-center gap-3">
          <Users size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Utilisateurs</p>
            <p className="text-sm font-sans font-bold text-navy">
              {pack.limits?.users === -1 ? 'Illimité' : `${pack.limits?.users} membres`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Box size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Produits</p>
            <p className="text-sm font-sans font-bold text-navy">
              {pack.limits?.products === -1 ? 'Illimité' : `${pack.limits?.products} articles`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HardDrive size={15} className="text-muted-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted-400 uppercase tracking-widest">Stockage</p>
            <p className="text-sm font-sans font-bold text-navy">{pack.limits?.storage_gb} GB</p>
          </div>
        </div>
      </div>

      {/* Pack Footer */}
      <div className="p-4 bg-white border-t border-muted-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-2 h-2 rounded-full", pack.is_active ? "bg-success" : "bg-muted-300")} />
          <span className="text-[10px] font-bold text-muted-500 uppercase tracking-widest">
            {pack.is_active ? 'Actif' : 'Désactivé'}
          </span>
        </div>
        <Link
          to={`/admin/packs/${pack.id}`}
          className="text-xs font-bold text-primary-500 hover:underline flex items-center gap-1"
        >
          Détails <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

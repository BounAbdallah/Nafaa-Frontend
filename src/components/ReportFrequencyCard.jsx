import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'
import { FileBarChart, Loader2, Check } from 'lucide-react'
import { cn } from '@/utils/cn'

const OPTIONS = [
  { value: '',        label: 'Désactivé' },
  { value: 'daily',   label: 'Journalier' },
  { value: 'weekly',  label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
]

/**
 * Carte de réglage des rapports automatiques (e-mail + notification in-app).
 * Utilisable par l'admin d'espace comme par les admins plateforme.
 */
export default function ReportFrequencyCard() {
  const { user } = useAuthStore()
  const [value, setValue]   = useState(user?.report_frequency ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const save = async (newValue) => {
    setValue(newValue)
    setSaving(true)
    setSaved(false)
    try {
      await authService.updateProfile({ report_frequency: newValue || null })
      setSaved(true)
      toast.success(newValue
        ? `Rapports ${OPTIONS.find(o => o.value === newValue)?.label.toLowerCase()}s activés.`
        : 'Rapports automatiques désactivés.')
      // Rafraîchir le store pour persister la préférence localement
      try { await useAuthStore.getState().initAuth() } catch { /* ignore */ }
    } catch {
      toast.error('Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card p-4 sm:p-5 space-y-3">
      <div>
        <h2 className="font-display font-semibold text-navy flex items-center gap-2">
          <FileBarChart size={16} className="text-muted-400" />
          Rapports automatiques
          {saving && <Loader2 size={13} className="animate-spin text-muted-400" />}
          {saved && !saving && <Check size={14} className="text-success" />}
        </h2>
        <p className="text-xs text-muted-500 mt-1">
          Recevez un résumé de votre activité par e-mail et dans l'application,
          à la fréquence de votre choix.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => save(opt.value)}
            disabled={saving}
            className={cn(
              'px-3.5 py-2 rounded-btn text-xs font-sans font-semibold border transition-colors disabled:opacity-60',
              value === opt.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-muted-200 text-muted-600 hover:border-primary-300 hover:text-primary-600'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value && (
        <p className="text-[11px] text-muted-400">
          {value === 'daily'   && 'Envoyé chaque matin, couvre la journée précédente.'}
          {value === 'weekly'  && 'Envoyé le lundi matin, couvre la semaine précédente.'}
          {value === 'monthly' && 'Envoyé le 1er du mois, couvre le mois précédent.'}
        </p>
      )}
    </div>
  )
}

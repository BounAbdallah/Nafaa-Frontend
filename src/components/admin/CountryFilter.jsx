import { useAuthStore } from '@/store/authStore'
import { COUNTRIES } from '@/utils/currency'

/**
 * Sélecteur de pays global pour les pages admin.
 * - super_admin : choisit un pays ou « Tous les pays » (global)
 * - country_admin : masqué (verrouillé sur son pays côté serveur)
 */
export default function CountryFilter({ value, onChange, className = '' }) {
  const role = useAuthStore(s => s.role)

  if (role !== 'super_admin') return null

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`input-field h-10 text-sm bg-surface ${className}`}
      title="Filtrer par pays"
    >
      <option value="">🌍 Tous les pays</option>
      {COUNTRIES.map(c => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  )
}

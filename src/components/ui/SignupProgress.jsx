import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

const STEPS = [
  { label: 'Compte' },
  { label: 'Entreprise' },
  { label: 'Profil' },
  { label: 'Plan' },
]

/**
 * Bandeau de progression affiché en haut du flux inscription.
 * currentStep: 1 = Register, 2 = Wizard step 1, 3 = Wizard step 2, 4 = Wizard step 3
 */
export default function SignupProgress({ currentStep = 1 }) {
  return (
    <div className="w-full bg-[#0F1E30] px-4 py-3">
      <div className="max-w-sm mx-auto flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const idx   = i + 1
          const done  = idx < currentStep
          const active = idx === currentStep

          return (
            <div key={step.label} className="flex items-center gap-1 flex-1 last:flex-none">
              {/* Dot + label */}
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300',
                  done   && 'bg-[#3AA0D8] text-white',
                  active && 'bg-white text-[#0F1E30] ring-2 ring-white/30',
                  !done && !active && 'bg-white/10 text-white/30',
                )}>
                  {done ? <Check size={10} /> : idx}
                </div>
                <span className={cn(
                  'text-[9px] font-bold uppercase tracking-wide transition-colors duration-300 hidden sm:block',
                  active ? 'text-white' : done ? 'text-[#3AA0D8]' : 'text-white/30',
                )}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] rounded-full mx-1 overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-[#3AA0D8] transition-all duration-500"
                    style={{ width: done ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

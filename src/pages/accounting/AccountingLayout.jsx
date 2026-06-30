import { useState } from 'react'
import { Calculator, BookOpen, Scale, Library, BarChart2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

const AccountingPage = lazy(() => import('./AccountingPage'))
const JournalPage    = lazy(() => import('./JournalPage'))
const BalancePage    = lazy(() => import('./BalancePage'))
const LedgerPage     = lazy(() => import('./LedgerPage'))
const StatementsPage = lazy(() => import('./StatementsPage'))

const TABS = [
  { id: 'dashboard',   label: 'Tableau de bord',  icon: Calculator,  desc: 'Niveau 1' },
  { id: 'journal',     label: 'Journal',           icon: BookOpen,    desc: 'Niveau 2' },
  { id: 'ledger',      label: 'Grand livre',       icon: Library,     desc: 'Niveau 2' },
  { id: 'balance',     label: 'Balance',           icon: Scale,       desc: 'Niveau 2' },
  { id: 'statements',  label: 'États financiers',  icon: BarChart2,   desc: 'Niveau 2' },
]

export default function AccountingLayout() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="space-y-0">
      {/* Navigation horizontale */}
      <div className="flex items-center gap-0.5 border-b border-muted-100 overflow-x-auto pb-0 mb-5">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px shrink-0',
                tab === t.id
                  ? 'border-primary-500 text-primary-500 bg-primary-50/30'
                  : 'border-transparent text-muted-500 hover:text-navy hover:bg-muted-50'
              )}
            >
              <Icon size={14} />
              {t.label}
              {t.desc === 'Niveau 2' && (
                <span className="text-[9px] bg-amber-100 text-amber-600 px-1 py-0.5 rounded font-bold leading-none">N2</span>
              )}
            </button>
          )
        })}
      </div>

      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-primary-500" /></div>}>
        {tab === 'dashboard'  && <AccountingPage />}
        {tab === 'journal'    && <JournalPage />}
        {tab === 'ledger'     && <LedgerPage />}
        {tab === 'balance'    && <BalancePage />}
        {tab === 'statements' && <StatementsPage />}
      </Suspense>
    </div>
  )
}

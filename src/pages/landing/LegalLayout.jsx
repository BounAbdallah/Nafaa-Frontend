import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function QiwamLogo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <svg width={32} height={32} viewBox="0 0 52 52" fill="none">
        <rect x="0"  y="0"  width="22" height="22" rx="4" fill="#3AA0D8"/>
        <rect x="26" y="0"  width="22" height="22" rx="4" fill="#3AA0D8" opacity=".7"/>
        <rect x="0"  y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity=".45"/>
        <rect x="26" y="26" width="22" height="22" rx="4" fill="#3AA0D8" opacity=".25"/>
        <circle cx="48" cy="48" r="4" fill="#E8A020"/>
      </svg>
      <span className="font-black text-lg tracking-tight text-[#0F1E30]">
        Qiwam <span className="text-[#3AA0D8]">ERP</span>
      </span>
    </Link>
  )
}

const pages = [
  { label: 'Confidentialité', path: '/legal/privacy'  },
  { label: 'CGU',             path: '/legal/terms'    },
  { label: 'Contact',         path: '/legal/contact'  },
  { label: 'Support',         path: '/legal/support'  },
]

export default function LegalLayout({ title, children }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-[#F4F8FB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8EFF5] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <QiwamLogo />
          <Link to="/"
            className="flex items-center gap-2 text-sm text-[#7A90A4] hover:text-[#0F1E30] transition-colors">
            <ArrowLeft size={15}/>
            Retour au portail
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar nav */}
          <aside className="lg:w-52 shrink-0">
            <div className="lg:sticky lg:top-24">
              <p className="text-[10px] text-[#7A90A4] font-bold uppercase tracking-widest mb-3 px-3">Légal</p>
              <nav className="space-y-0.5">
                {pages.map(p => (
                  <Link
                    key={p.path}
                    to={p.path}
                    className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === p.path
                        ? 'bg-[#0F1E30] text-white'
                        : 'text-[#3D5268] hover:bg-white hover:text-[#0F1E30]'
                    }`}
                  >
                    {p.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#E8EFF5] shadow-sm px-8 sm:px-12 py-10">
              <h1 className="text-3xl sm:text-4xl font-black text-[#0F1E30] mb-2 tracking-tight">{title}</h1>
              <p className="text-xs text-[#7A90A4] mb-10 pb-8 border-b border-[#E8EFF5]">
                Qiwam ERP · Noor Web Services · Dakar, Sénégal
              </p>
              <div className="prose-qiwam">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="border-t border-[#E8EFF5] py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#7A90A4]">© 2026 Qiwam ERP · Noor Web Services. Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            {pages.map(p => (
              <Link key={p.path} to={p.path} className="text-xs text-[#7A90A4] hover:text-[#0F1E30] transition-colors">
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

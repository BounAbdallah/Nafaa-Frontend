import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react'
import { count as queueCount } from '@/services/offlineQueue'
import { processQueue } from '@/services/syncService'
import { cn } from '@/utils/cn'

export default function OfflineBanner() {
  const [online,  setOnline]  = useState(navigator.onLine)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)

  // Écouter les changements réseau
  useEffect(() => {
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Écouter les changements de file
  useEffect(() => {
    const refresh = async () => { setPending(await queueCount()) }
    refresh()
    window.addEventListener('qiwam:queue-changed', refresh)
    return () => window.removeEventListener('qiwam:queue-changed', refresh)
  }, [])

  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    await processQueue()
    setSyncing(false)
    setPending(await queueCount())
  }

  // Rien à afficher si en ligne et rien en attente
  if (online && pending === 0) return null

  return (
    <div className={cn(
      'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl',
      'text-sm font-semibold backdrop-blur-sm border',
      'transition-all duration-300 animate-in slide-in-from-bottom-4',
      !online
        ? 'bg-slate-900/95 border-slate-700 text-white'
        : 'bg-amber-900/95 border-amber-700 text-amber-100'
    )}>
      {!online ? (
        <>
          <WifiOff size={16} className="text-red-400 shrink-0" />
          <span>Mode hors ligne</span>
          {pending > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {pending} en attente
            </span>
          )}
        </>
      ) : (
        <>
          <CloudOff size={16} className="text-amber-400 shrink-0" />
          <span>{pending} opération{pending > 1 ? 's' : ''} à synchroniser</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-white px-3 py-1 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sync…' : 'Sync'}
          </button>
        </>
      )}
    </div>
  )
}

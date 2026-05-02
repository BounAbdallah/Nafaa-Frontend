import { useState, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

const PRESETS = [
  { id: 'today',   label: "Aujourd'hui" },
  { id: 'week',    label: "Cette semaine" },
  { id: 'month',   label: "Ce mois-ci" },
  { id: 'year',    label: "Cette année" },
  { id: 'custom',  label: "Personnalisé" },
]

export default function DateRangePicker({ onRangeChange, defaultPreset = 'month', className }) {
  const [periodPreset, setPeriodPreset] = useState(defaultPreset)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const calculateDates = (preset) => {
    const today = new Date()
    let start, end

    if (preset === 'today') {
      start = new Date()
      end = new Date()
    } else if (preset === 'week') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(today.setDate(diff))
      end = new Date(start)
      end.setDate(end.getDate() + 6)
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (preset === 'year') {
      start = new Date(today.getFullYear(), 0, 1)
      end = new Date(today.getFullYear(), 11, 31)
    }

    return {
      start: start?.toISOString().split('T')[0],
      end: end?.toISOString().split('T')[0]
    }
  }

  // Initial load
  useEffect(() => {
    if (periodPreset !== 'custom') {
      const { start, end } = calculateDates(periodPreset)
      setStartDate(start)
      setEndDate(end)
      onRangeChange({ start, end, preset: periodPreset })
    }
  }, [])

  const handlePresetChange = (preset) => {
    setPeriodPreset(preset)
    if (preset !== 'custom') {
      const { start, end } = calculateDates(preset)
      setStartDate(start)
      setEndDate(end)
      onRangeChange({ start, end, preset })
    }
  }

  const handleCustomDateChange = (type, value) => {
    if (type === 'start') setStartDate(value)
    else setEndDate(value)
    
    // Trigger change only if both dates are present in custom mode
    const newStart = type === 'start' ? value : startDate
    const newEnd = type === 'end' ? value : endDate
    if (newStart && newEnd) {
      onRangeChange({ start: newStart, end: newEnd, preset: 'custom' })
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2", className)}>
      <div className="relative inline-block w-full sm:w-auto">
        <select 
          value={periodPreset} 
          onChange={(e) => handlePresetChange(e.target.value)}
          className="appearance-none bg-surface border border-muted-300 rounded-btn pl-9 pr-10 py-2 text-sm font-sans font-medium text-navy focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all cursor-pointer w-full"
        >
          {PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
      </div>
      
      {periodPreset === 'custom' && (
        <div className="flex items-center gap-1.5 bg-surface px-2 py-1.5 rounded-btn border border-muted-300 animate-in fade-in slide-in-from-left-2 duration-200">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className="bg-transparent text-xs font-bold text-navy focus:outline-none w-[115px] cursor-pointer"
          />
          <div className="w-2 h-px bg-muted-300"></div>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="bg-transparent text-xs font-bold text-navy focus:outline-none w-[115px] cursor-pointer"
          />
        </div>
      )}
    </div>
  )
}

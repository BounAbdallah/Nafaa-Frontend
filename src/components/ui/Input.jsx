import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, className, ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-display font-semibold text-navy">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Icon className="w-4 h-4 text-muted-500" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface border border-muted-300 rounded-btn py-[10px] text-navy placeholder-muted-500 text-sm',
            'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
            'transition-all duration-150',
            Icon ? 'pl-10 pr-4' : 'px-4',
            error && 'border-danger focus:border-danger focus:ring-[#FDECEA]',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-500">{hint}</p>
      )}
    </div>
  )
})

export default Input

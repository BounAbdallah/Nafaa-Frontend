import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-display font-semibold rounded-btn transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-blue hover:shadow-none',
    secondary: 'bg-transparent text-primary-500 border-[1.5px] border-primary-500 hover:bg-primary-50',
    ghost:     'bg-transparent text-navy border-[1.5px] border-muted-300 hover:bg-muted-100 font-medium',
    danger:    'bg-danger hover:bg-[#c54e24] text-white',
    navy:      'bg-navy hover:bg-navy-soft text-white',
  }

  const sizes = {
    sm: 'text-xs px-3.5 py-[7px]',
    md: 'text-sm px-[22px] py-[10px]',
    lg: 'text-sm px-[22px] py-[11px]',
    xl: 'text-base px-8 py-[13px]',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </>
      ) : children}
    </button>
  )
}

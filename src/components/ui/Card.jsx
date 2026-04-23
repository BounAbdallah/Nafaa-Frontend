import { cn } from '@/utils/cn'

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface border border-muted-300 rounded-card shadow-card p-5',
        hover && 'hover:border-primary-300 hover:shadow-blue transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

import { cn } from '@/utils/cn'

/**
 * Qiwam ERP Logo Component
 * Based on the new graphic charter.
 */
export default function Logo({ 
  className, 
  size = 32, 
  showText = true, 
  variant = 'dark', // 'dark', 'light', 'blue'
  textClassName
}) {
  const isDark = variant === 'dark';
  const isBlue = variant === 'blue';
  
  const iconColor = isBlue ? 'white' : '#3AA0D8';
  const textColor = isDark ? 'text-white' : 'text-navy';
  const subtextColor = isDark ? 'text-white/40' : 'text-muted-500';

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="shrink-0">
        <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
          {/* Module haut-gauche */}
          <rect x="0" y="0" width="22" height="22" rx="4" fill={iconColor}/>
          {/* Module haut-droit */}
          <rect x="26" y="0" width="22" height="22" rx="4" fill={iconColor} opacity="0.7"/>
          {/* Module bas-gauche */}
          <rect x="0" y="26" width="22" height="22" rx="4" fill={iconColor} opacity="0.45"/>
          {/* Module bas-droit */}
          <rect x="26" y="26" width="22" height="22" rx="4" fill={iconColor} opacity="0.25"/>
          {/* Accent dot */}
          <circle cx="48" cy="48" r="4" fill="#E8A020"/>
        </svg>
      </div>
      
      {showText && (
        <div className={cn("overflow-hidden flex flex-col", textClassName)}>
          <div className={cn(
            "font-display font-black tracking-tighter leading-none uppercase",
            size > 40 ? "text-2xl" : "text-base",
            textColor
          )}>
            Qiwam
          </div>
          <div className={cn(
            "font-display font-medium tracking-[0.2em] uppercase",
            size > 40 ? "text-[10px]" : "text-[8px]",
            subtextColor,
            "-mt-0.5"
          )}>
            ERP 
          </div>
        </div>
      )}
    </div>
  );
}

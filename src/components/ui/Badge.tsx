// src/components/ui/Badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray'
  className?: string
}

const variants = {
  green:  'bg-[#2DCC8F]/10 border-[#2DCC8F]/20 text-[#2DCC8F]',
  red:    'bg-[#FF5E5E]/10 border-[#FF5E5E]/20 text-[#FF5E5E]',
  amber:  'bg-[#F5A623]/10 border-[#F5A623]/20 text-[#F5A623]',
  blue:   'bg-[#5B8DEF]/10 border-[#5B8DEF]/20 text-[#5B8DEF]',
  purple: 'bg-[#A78BFA]/10 border-[#A78BFA]/20 text-[#A78BFA]',
  gray:   'bg-white/[0.06] border-white/10 text-white/40',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

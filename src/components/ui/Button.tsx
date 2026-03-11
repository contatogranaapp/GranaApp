'use client'
// src/components/ui/Button.tsx

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#2DCC8F] text-[#0C0C0F] hover:opacity-88 hover:-translate-y-px active:translate-y-0',
    ghost:   'bg-[#1C1C22] border border-white/[0.07] text-white/50 hover:text-white hover:border-white/20',
    danger:  'bg-[#FF5E5E]/10 border border-[#FF5E5E]/20 text-[#FF5E5E] hover:bg-[#FF5E5E]/15',
    outline: 'border border-white/[0.12] text-white/70 hover:text-white hover:border-white/25 bg-transparent',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
}

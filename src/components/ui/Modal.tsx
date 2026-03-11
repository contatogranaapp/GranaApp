'use client'
// src/components/ui/Modal.tsx

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  // Fechar com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Bloquear scroll do body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Previne hidratação incorreta no SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!open || !mounted) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-[480px]', lg: 'max-w-lg' }
  const { createPortal } = require('react-dom')

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* CARD DO MODAL — centralizado, com scroll interno */}
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-[#141418] border border-white/[0.1] shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          sizes[size]
        )}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05]"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-5 pr-8 flex-shrink-0">
            {title && (
              <h2 className="font-serif text-xl leading-tight">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-white/45 mt-1">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body
  )
}

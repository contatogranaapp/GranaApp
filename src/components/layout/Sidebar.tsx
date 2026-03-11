'use client'
// src/components/layout/Sidebar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile
}

const NAV_ITEMS = [
  { href: '/dashboard',   icon: '◼', label: 'Visão Geral' },
  { href: '/transacoes',  icon: '↕', label: 'Transações' },
  { href: '/metas',       icon: '◎', label: 'Metas' },
  { href: '/relatorios',  icon: '⌒', label: 'Relatórios' },
  { href: '/chat',        icon: '✦', label: 'Chat com IA' },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] min-h-screen flex-shrink-0 bg-[#141418] border-r border-white/[0.07] flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 bg-[#2DCC8F] rounded-[9px] flex items-center justify-center font-serif italic font-black text-base text-[#0C0C0F]">
          G
        </div>
        <span className="font-serif italic text-lg">Grana</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-white/20 px-2 mb-1">
          Principal
        </p>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150',
              pathname === item.href
                ? 'bg-[#2DCC8F]/10 text-[#2DCC8F]'
                : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            <span className="w-4 text-center text-[13px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.07] pt-4">
        <div className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-white/[0.03] transition-all">
          <div className="w-8 h-8 bg-gradient-to-br from-[#2DCC8F] to-[#1aa870] rounded-[9px] flex items-center justify-center text-[13px] font-bold text-[#0C0C0F] flex-shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium truncate">{profile.name}</p>
            <p className="text-[10px] text-[#2DCC8F] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#2DCC8F] rounded-full inline-block animate-pulse-dot" />
              {profile.plan === 'pro' ? 'Grana Pro' : 'Gratuito'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

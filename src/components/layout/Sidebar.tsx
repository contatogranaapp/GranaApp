'use client'
// src/components/layout/Sidebar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',    icon: '◼', label: 'Início' },
  { href: '/transacoes',   icon: '↕', label: 'Transações' },
  { href: '/metas',        icon: '◎', label: 'Metas' },
  { href: '/relatorios',   icon: '⌒', label: 'Relatórios' },
  { href: '/chat',         icon: '✦', label: 'IA' },
]

const NAV_ITEMS_EXTRA = [
  { href: '/orcamento',    icon: '🎯', label: 'Orçamento' },
  { href: '/planejamento', icon: '📅', label: 'Planejamento' },
  { href: '/cartoes',      icon: '💳', label: 'Cartões' },
  { href: '/recorrentes',  icon: '🔄', label: 'Recorrentes' },
]

interface SidebarProps {
  profile: any
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* ── DESKTOP SIDEBAR ──────────────────────────── */}
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        flexShrink: 0,
        backgroundColor: '#141418',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }} className="desktop-sidebar">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', marginBottom: '32px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#2DCC8F', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '15px', color: '#0C0C0F' }}>
            G
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '18px', color: '#F0EFE8' }}>Grana</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 8px', marginBottom: '4px' }}>
            Principal
          </p>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '12px',
                fontSize: '13px', fontWeight: active ? 600 : 400,
                textDecoration: 'none', transition: 'all 0.15s',
                backgroundColor: active ? 'rgba(45,204,143,0.1)' : 'transparent',
                color: active ? '#2DCC8F' : 'rgba(255,255,255,0.4)',
              }}>
                <span style={{ width: '16px', textAlign: 'center', fontSize: '13px' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', padding: '0 8px', marginBottom: '4px', marginTop: '16px' }}>
            Ferramentas
          </p>
          {NAV_ITEMS_EXTRA.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '12px',
                fontSize: '13px', fontWeight: active ? 600 : 400,
                textDecoration: 'none', transition: 'all 0.15s',
                backgroundColor: active ? 'rgba(45,204,143,0.1)' : 'transparent',
                color: active ? '#2DCC8F' : 'rgba(255,255,255,0.4)',
              }}>
                <span style={{ width: '16px', textAlign: 'center', fontSize: '13px' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2DCC8F, #1aa870)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#0C0C0F', flexShrink: 0 }}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#F0EFE8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name}</p>
              <p style={{ fontSize: '10px', color: '#2DCC8F', margin: 0 }}>
                {profile?.plan === 'pro' ? 'Grana Pro' : 'Gratuito'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ────────────────────────── */}
      <nav style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '64px',
        backgroundColor: '#141418',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }} className="mobile-bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '8px 16px', borderRadius: '12px',
              textDecoration: 'none', transition: 'all 0.15s',
              color: active ? '#2DCC8F' : 'rgba(255,255,255,0.3)',
            }}>
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400, fontFamily: 'DM Sans, system-ui, sans-serif' }}>
                {item.label}
              </span>
              {active && (
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#2DCC8F' }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Espaço para o bottom nav não sobrepor conteúdo */}
      <div className="mobile-bottom-spacer" style={{ height: '64px' }} />
    </>
  )
}

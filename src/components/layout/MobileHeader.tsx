'use client'

export function MobileHeader({ profile }: { profile: any }) {
  return (
    // Mostrar apenas em mobile (via classe CSS)
    <header className="mobile-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: '#141418',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', backgroundColor: '#2DCC8F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 900, fontSize: '13px', color: '#0C0C0F' }}>
          G
        </div>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16px', color: '#F0EFE8' }}>Grana</span>
      </div>

      {/* Avatar */}
      <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2DCC8F, #1aa870)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#0C0C0F' }}>
        {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
      </div>
    </header>
  )
}

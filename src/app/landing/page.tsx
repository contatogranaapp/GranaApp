// src/app/landing/page.tsx

import Link from 'next/link'

export const metadata = {
  title: 'Grana — Seu dinheiro organizado de vez',
  description: 'Assistente financeiro pessoal com IA para brasileiros. Chega de planilha.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0F] text-[#F0EFE8]">

      {/* ── NAVBAR ───────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] sticky top-0 bg-[#0C0C0F]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2DCC8F] rounded-[10px] flex items-center justify-center font-serif italic font-black text-base text-[#0C0C0F]">
            G
          </div>
          <span style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="italic text-lg">Grana</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#precos" className="hover:text-white transition-colors">Preços</a>
        </div>

        <Link
          href="/login"
          className="bg-[#2DCC8F] text-[#0C0C0F] font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-all hover:-translate-y-px"
        >
          Começar grátis →
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────── */}
      <section className="px-8 pt-24 pb-20 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Texto */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-[#2DCC8F]/10 border border-[#2DCC8F]/20 rounded-full px-4 py-1.5 text-xs text-[#2DCC8F] font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-[#2DCC8F] rounded-full" style={{ animation: 'pulseDot 2s infinite' }} />
              IA Financeira para Brasileiros
            </div>

            <h1 style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-6xl lg:text-7xl leading-[1.05] mb-6">
              Seu dinheiro<br />
              <span className="text-[#2DCC8F] underline decoration-[#2DCC8F]/40 underline-offset-4">organizado</span><br />
              de vez.
            </h1>

            <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-md">
              Chega de planilha. Chega de caderninho. Fale com o Grana como você fala com um amigo e ele organiza tudo por você.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/login"
                className="bg-[#2DCC8F] text-[#0C0C0F] font-bold px-7 py-4 rounded-xl text-base hover:opacity-88 transition-all hover:-translate-y-px"
              >
                Começar grátis — é rápido →
              </Link>
            </div>

            <p className="text-xs text-white/25 mt-4">Sem cartão de crédito. 7 dias grátis no Pro.</p>

            {/* Social proof */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex" style={{ gap: '-8px' }}>
                {[
                  { letter: 'M', color: '#FF5E5E' },
                  { letter: 'J', color: '#5B8DEF' },
                  { letter: 'A', color: '#F5A623' },
                  { letter: 'L', color: '#A78BFA' },
                ].map((u, i) => (
                  <div
                    key={u.letter}
                    className="w-8 h-8 rounded-full border-2 border-[#0C0C0F] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: u.color, marginLeft: i > 0 ? '-8px' : 0, zIndex: 4 - i, position: 'relative' }}
                  >
                    {u.letter}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold">⭐⭐⭐⭐⭐</div>
                <div className="text-[10px] text-white/35">+500 pessoas organizando as finanças</div>
              </div>
            </div>
          </div>

          {/* App mockup */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="w-[320px] bg-[#141418] border border-white/[0.08] rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-white/35">Bom dia, 👋</p>
                  <p style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-xl">Marina</p>
                </div>
                <div className="w-10 h-10 bg-[#2DCC8F] rounded-full flex items-center justify-center font-bold text-[#0C0C0F]">M</div>
              </div>

              <div className="bg-[#2DCC8F] rounded-2xl p-4 mb-4">
                <p className="text-[11px] text-[#0C0C0F]/60 mb-1">Saldo disponível</p>
                <p style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-3xl text-[#0C0C0F] font-bold">R$ 3.847,00</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-[#0C0C0F]/60">Março 2026</p>
                  <p className="text-[11px] text-[#0C0C0F] font-semibold">↑ +R$ 420 esse mês</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button className="flex items-center justify-center gap-2 bg-[#1C1C22] border border-white/[0.07] rounded-xl py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                  <span className="text-[#2DCC8F]">+</span> Receita
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#1C1C22] border border-white/[0.07] rounded-xl py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                  <span className="text-[#FF5E5E]">−</span> Gasto
                </button>
              </div>

              <div className="bg-[#1C1C22] rounded-xl p-3 border border-white/[0.05]">
                <p className="text-[10px] text-[#2DCC8F] font-semibold mb-1.5">✦ Assistente Grana</p>
                <p className="text-xs text-white/65 leading-relaxed">
                  Oi Marina! Você gastou R$ 340 a mais em restaurantes este mês. Quer ver onde dá pra economizar? 🍕
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────── */}
      <section id="recursos" className="px-8 py-20 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#2DCC8F] mb-3">Recursos</p>
            <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-4xl mb-4">
              Tudo que você precisa,<br />nada que você não precisa.
            </h2>
            <p className="text-white/45 max-w-md mx-auto">
              Simples de usar, poderoso o suficiente para mudar sua relação com o dinheiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '✦',
                title: 'IA que entende você',
                desc: 'Diga "gastei 45 no mercado hoje" e o Grana registra, categoriza e analisa. Em português, do jeito que você fala.',
                color: '#2DCC8F',
              },
              {
                icon: '📊',
                title: 'Dashboard inteligente',
                desc: 'Veja seus gastos por categoria, evolução mensal e saúde financeira com um score atualizado em tempo real.',
                color: '#5B8DEF',
              },
              {
                icon: '🎯',
                title: 'Metas com planejamento',
                desc: 'Defina uma meta, o Grana calcula quanto guardar por mês e acompanha seu progresso automaticamente.',
                color: '#F5A623',
              },
              {
                icon: '🔔',
                title: 'Alertas inteligentes',
                desc: 'Receba avisos quando estiver perto do limite de uma categoria ou quando a meta mensal precisar de atenção.',
                color: '#FF5E5E',
              },
              {
                icon: '📄',
                title: 'Relatório mensal em PDF',
                desc: 'Todo mês, um relatório completo da sua vida financeira — pronto para baixar e guardar.',
                color: '#A78BFA',
              },
              {
                icon: '🔒',
                title: 'Segurança total',
                desc: 'Seus dados são seus. Criptografia de ponta a ponta, autenticação sem senha e backups automáticos.',
                color: '#2DCC8F',
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-[#141418] border border-white/[0.07] rounded-2xl p-6 hover:border-white/15 transition-colors"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: `${feat.color}15` }}
                >
                  {feat.icon}
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ─────────────────────── */}
      <section id="como-funciona" className="px-8 py-20 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#2DCC8F] mb-3">Como funciona</p>
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-4xl mb-14">
            Em 3 passos você já está<br />no controle.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crie sua conta', desc: 'Só o email. Sem senha. Um link mágico e você já está dentro em segundos.' },
              { step: '02', title: 'Configure em 2 min', desc: 'Informe sua renda, suas contas e seus objetivos. A IA já começa a trabalhar pra você.' },
              { step: '03', title: 'Converse e acompanhe', desc: 'Registre gastos pelo chat, veja o dashboard e deixa o Grana te dar os insights.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#2DCC8F]/10 border border-[#2DCC8F]/20 flex items-center justify-center mb-4">
                  <span style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-2xl text-[#2DCC8F]">{s.step}</span>
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ───────────────────────────── */}
      <section id="precos" className="px-8 py-20 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#2DCC8F] mb-3">Preços</p>
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-4xl mb-4">
            Simples e transparente.
          </h2>
          <p className="text-white/45 mb-12">Sem surpresas. Cancela quando quiser.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-[#141418] border border-white/[0.07] rounded-2xl p-7 text-left">
              <p className="text-sm font-semibold text-white/50 mb-1">Gratuito</p>
              <p style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-4xl mb-1">R$ 0</p>
              <p className="text-xs text-white/35 mb-6">para sempre</p>
              <ul className="flex flex-col gap-2.5 mb-7 text-sm text-white/60">
                {['Lançamentos manuais', 'Dashboard básico', '1 conta bancária', '20 mensagens IA/mês', 'Metas (até 2)'].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#2DCC8F]">✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/login" className="btn-ghost w-full text-center block py-3 rounded-xl text-sm font-semibold">
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#141418] border border-[#2DCC8F]/30 rounded-2xl p-7 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#2DCC8F]/10 border border-[#2DCC8F]/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#2DCC8F]">
                MAIS POPULAR
              </div>
              <p className="text-sm font-semibold text-[#2DCC8F] mb-1">Grana Pro</p>
              <p style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-4xl mb-1">R$ 50</p>
              <p className="text-xs text-white/35 mb-6">por mês · 7 dias grátis</p>
              <ul className="flex flex-col gap-2.5 mb-7 text-sm text-white/70">
                {[
                  'Tudo do plano gratuito',
                  'IA ilimitada',
                  'Contas ilimitadas',
                  'Metas ilimitadas',
                  'Relatório PDF mensal',
                  'Alertas inteligentes',
                  'Suporte prioritário',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#2DCC8F]">✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/login" className="btn-primary w-full text-center block py-3 rounded-xl text-sm font-semibold">
                Começar 7 dias grátis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────── */}
      <section className="px-8 py-20 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="text-5xl mb-4">
            Pronto pra organizar<br />seu dinheiro de vez?
          </h2>
          <p className="text-white/45 mb-8">
            Junte-se a centenas de brasileiros que já estão no controle das finanças.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-block px-8 py-4 text-base rounded-xl"
          >
            Começar grátis agora →
          </Link>
          <p className="text-xs text-white/20 mt-4">Sem cartão. Sem complicação. 🔒</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer className="border-t border-white/[0.05] px-8 py-8 text-center text-xs text-white/25">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-5 h-5 bg-[#2DCC8F] rounded-md flex items-center justify-center font-serif italic font-black text-[10px] text-[#0C0C0F]">G</div>
          <span style={{ fontFamily: 'Instrument Serif, Georgia, serif' }} className="italic">Grana</span>
        </div>
        <p>© 2026 Grana. Feito com ☕ no Brasil.</p>
      </footer>
    </div>
  )
}

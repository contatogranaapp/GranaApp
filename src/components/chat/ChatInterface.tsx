'use client'
// src/components/chat/ChatInterface.tsx

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, TrendingDown, TrendingUp, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Profile, MonthlySummary, Goal, Transaction } from '@/types'

interface Props {
  profile: Pick<Profile, 'name' | 'monthly_income' | 'plan'>
  summary: MonthlySummary | null
  goals: Goal[]
  recentTransactions: Pick<Transaction, 'type' | 'description' | 'amount' | 'date'>[]
  isPro: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  tx?: { tipo: string; valor: number; descricao: string; categoria: string } | null
  insight?: { titulo: string; texto: string } | null
  streaming?: boolean
}

const QUICK_PROMPTS = [
  { emoji: '📊', text: 'Como estão minhas finanças esse mês?' },
  { emoji: '💡', text: 'Onde posso economizar?' },
  { emoji: '🎯', text: 'Como estão minhas metas?' },
  { emoji: '📈', text: 'Dicas para guardar mais dinheiro' },
]

function parseSpecial(text: string) {
  const txMatch = text.match(/\[\[TX:([^\]]+)\]\]/)
  const insightMatch = text.match(/\[\[INSIGHT:([^\]]+)\]\]/)
  const jsonMatch = text.match(/\|\|\|JSON\|\|\|([\s\S]*?)(\|\|\|END_JSON\|\|\||$)/)
  
  const clean = text
    .replace(/\[\[TX:[^\]]+\]\]/g, '')
    .replace(/\[\[INSIGHT:[^\]]+\]\]/g, '')
    .replace(/\|\|\|JSON\|\|\|([\s\S]*?)(\|\|\|END_JSON\|\|\||$)/g, '')
    .trim()

  let tx = null
  if (txMatch) {
    const [tipo, valor, descricao, categoria] = txMatch[1].split('|')
    tx = { tipo, valor: parseFloat(valor), descricao, categoria: categoria ?? '' }
  }

  let insight = null
  if (insightMatch) {
    const [titulo, texto] = insightMatch[1].split('|')
    insight = { titulo, texto }
  }

  let transactionJson = null
  if (jsonMatch) {
    try {
      if (jsonMatch[1].trim() && jsonMatch[2] === '|||END_JSON|||') {
        transactionJson = JSON.parse(jsonMatch[1].trim())
      }
    } catch {}
  }

  return { clean, tx, insight, transactionJson }
}

export function ChatInterface({ profile, summary, goals, recentTransactions, isPro }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      content: `Oi, ${profile.name.split(' ')[0]}! 👋 Sou o Grana, seu assistente financeiro.\n\nPosso te ajudar a registrar gastos, analisar suas finanças e planejar suas metas. Como posso ajudar hoje?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Use Next.js Router for refreshing server components seamlessly
  const { useRouter } = require('next/navigation')
  const router = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    setInput('')
    setShowQuick(false)

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg }
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setLoading(true)

    const history = [...messages, userMsg]
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: { profile, summary, goals, recentTransactions },
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === aiMsg.id ? { ...m, content: json.message ?? 'Erro ao processar.', streaming: false } : m
        ))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break

          try {
            const parsed = JSON.parse(payload)
            if (parsed.text) {
              full += parsed.text
              const { clean, tx, insight } = parseSpecial(full)
              setMessages(prev => prev.map(m =>
                m.id === aiMsg.id ? { ...m, content: clean, tx, insight } : m
              ))
            }
          } catch { /* linha incompleta, ignorar */ }
        }
      }

      // Final process - handle transaction creation
      const { clean, transactionJson } = parseSpecial(full)
      if (transactionJson?.action === 'CREATE_TRANSACTION' && transactionJson.transaction) {
        const t = transactionJson.transaction
        const mapCategory = (c: string) => {
          const map: Record<string,string> = {
            'Alimentação': 'cat_alimentacao', 'Transporte': 'cat_transporte',
            'Moradia': 'cat_moradia', 'Saúde': 'cat_saude', 'Lazer': 'cat_lazer',
            'Educação': 'cat_educacao', 'Assinaturas': 'cat_assinaturas', 'Salário': 'cat_salario'
          }
          return map[c] || 'cat_outros_gast'
        }

        try {
          // Must use Supabase client directly (same as AddTransactionButton)
          // because the server API route can't read the localStorage-based session (401)
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: true, storageKey: 'grana-auth', storage: window.localStorage } }
          )
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) throw new Error('Sessão não encontrada')
          
          const { error: dbError } = await supabase.from('transactions').insert({
            user_id: session.user.id,
            type: t.tipo.toLowerCase() === 'receita' ? 'income' : 'expense',
            amount: Number(t.valor),
            description: t.descricao,
            date: t.data || new Date().toISOString().split("T")[0],
            category_id: mapCategory(t.categoria),
            is_installment: false,
            is_recurring: false,
            source: 'ai_chat',
          })
          
          if (dbError) throw new Error(dbError.message)
          
          setMessages(prev => prev.map(m =>
            m.id === aiMsg.id ? { ...m, content: clean + "\n\n✅ *Lançamento registrado com sucesso!*" } : m
          ))
          
          router.refresh()
        } catch (e) {
          console.error("Erro ao processar transação da IA:", e)
        }
      }

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, content: 'Erro de conexão. Tente novamente.', streaming: false } : m
      ))
    } finally {
      setLoading(false)
      setMessages(prev => prev.map(m =>
        m.id === aiMsg.id ? { ...m, streaming: false } : m
      ))
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.07] bg-[#0C0C0F]/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2DCC8F]/10 border border-[#2DCC8F]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#2DCC8F]" />
          </div>
          <div>
            <p className="font-semibold text-sm">Assistente Grana</p>
            <p className="text-[11px] text-[#2DCC8F] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#2DCC8F] rounded-full animate-pulse-dot" />
              Online · IA financeira personalizada
            </p>
          </div>
        </div>

        {/* Mini summary */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="text-white/30">Saldo</div>
            <div className="font-semibold text-[#2DCC8F]">
              {formatCurrency((summary?.total_income ?? 0) - (summary?.total_expense ?? 0))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-white/30">Gastos</div>
            <div className="font-semibold text-[#FF5E5E]">
              {formatCurrency(summary?.total_expense ?? 0)}
            </div>
          </div>
          {!isPro && (
            <div className="bg-[#2DCC8F]/10 border border-[#2DCC8F]/20 rounded-lg px-3 py-1.5 text-[#2DCC8F] text-[11px] font-semibold cursor-pointer hover:bg-[#2DCC8F]/15 transition-colors">
              ✦ Upgrade Pro
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${
              msg.role === 'assistant'
                ? 'bg-[#2DCC8F]/10 border border-[#2DCC8F]/15 text-[#2DCC8F]'
                : 'bg-white/[0.06] text-white/50'
            }`}>
              {msg.role === 'assistant' ? '✦' : profile.name.charAt(0)}
            </div>

            <div className={`max-w-[75%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : ''}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-[#1C1C22] border border-white/[0.06] rounded-tl-sm'
                  : 'bg-[#2DCC8F]/10 border border-[#2DCC8F]/15 rounded-tr-sm'
              }`}>
                {msg.streaming ? (
                  <div className="flex gap-1 py-0.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#2DCC8F]/50 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* Transaction Card */}
              {msg.tx && (
                <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  msg.tx.tipo === 'receita'
                    ? 'bg-[#2DCC8F]/08 border border-[#2DCC8F]/20'
                    : 'bg-[#FF5E5E]/07 border border-[#FF5E5E]/20'
                }`}>
                  {msg.tx.tipo === 'receita'
                    ? <TrendingUp className="w-4 h-4 text-[#2DCC8F] flex-shrink-0" />
                    : <TrendingDown className="w-4 h-4 text-[#FF5E5E] flex-shrink-0" />
                  }
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{msg.tx.descricao}</p>
                    <p className="text-[10px] text-white/40">{msg.tx.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${msg.tx.tipo === 'receita' ? 'text-[#2DCC8F]' : 'text-[#FF5E5E]'}`}>
                      {msg.tx.tipo === 'receita' ? '+' : '-'} {formatCurrency(msg.tx.valor)}
                    </p>
                    <p className="text-[10px] text-[#2DCC8F]">✓ Registrado</p>
                  </div>
                </div>
              )}

              {/* Insight Card */}
              {msg.insight && (
                <div className="bg-[#F5A623]/08 border border-[#F5A623]/20 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-bold text-[#F5A623] mb-1">💡 {msg.insight.titulo}</p>
                  <p className="text-xs text-white/60 leading-relaxed">{msg.insight.texto}</p>
                </div>
              )}

              <p className="text-[10px] text-white/20 px-1">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {showQuick && (
        <div className="px-4 md:px-8 pb-3 flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q.text}
              onClick={() => send(q.text)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1C1C22] border border-white/[0.07] hover:border-[#2DCC8F]/30 hover:text-white text-white/40 rounded-full text-xs transition-all duration-150"
            >
              {q.emoji} {q.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-8 pb-6 border-t border-white/[0.06] pt-3">
        <div className="flex items-end gap-3 bg-[#141418] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#2DCC8F]/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ex: gastei 45 reais no mercado hoje..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-[#F0EFE8] placeholder-white/25 resize-none outline-none max-h-28 leading-relaxed caret-[#2DCC8F]"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-[#2DCC8F] hover:opacity-85 hover:-translate-y-px"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-[#0C0C0F] animate-spin" />
              : <Send className="w-3.5 h-3.5 text-[#0C0C0F]" />
            }
          </button>
        </div>
        <p className="text-center text-[10px] text-white/15 mt-2">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}

// src/app/api/webhooks/stripe/route.ts

import { NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type Stripe from 'stripe'

// App Router: desabilitar body parser para esta rota
export const dynamic = 'force-dynamic'


export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('❌ Webhook signature inválida:', err)
    return NextResponse.json({ error: 'Signature inválida' }, { status: 400 })
  }

  console.log(`📦 Stripe event: ${event.type}`)

  switch (event.type) {
    // Assinatura criada ou atualizada (upgrade, downgrade, renovação)
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const plan = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free'

      const supabaseAdmin = getSupabaseAdmin()
      await supabaseAdmin
        .from('profiles')
        .update({ plan, stripe_subscription_id: sub.id })
        .eq('stripe_customer_id', sub.customer as string)

      console.log(`✅ Plano → ${plan} para customer ${sub.customer}`)
      break
    }

    // Assinatura cancelada
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      const supabaseAdmin = getSupabaseAdmin()
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_customer_id', sub.customer as string)

      console.log(`❌ Assinatura cancelada para customer ${sub.customer}`)
      break
    }

    // Pagamento falhou — você pode enviar email de aviso aqui
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(`⚠️  Pagamento falhou para customer ${invoice.customer}`)
      // TODO: enviar email via Resend
      break
    }

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

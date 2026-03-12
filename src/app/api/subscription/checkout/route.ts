// src/app/api/subscription/checkout/route.ts

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-server'
import { stripe, STRIPE_PRICE_ID, PRO_TRIAL_DAYS } from '@/lib/stripe'

export async function POST() {
  const supabase = createApiClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, name')
    .eq('id', session.user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

  // Criar ou recuperar customer no Stripe
  let customerId = profile.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? session.user.email,
      name: profile.name,
      metadata: { supabase_user_id: session.user.id },
    })
    customerId = customer.id

    // Salvar customer ID no perfil
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', session.user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/dashboard`,
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: PRO_TRIAL_DAYS,
      metadata: { supabase_user_id: session.user.id },
    },
    payment_method_types: ['card'],
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: checkoutSession.url })
}

// src/lib/stripe.ts

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const STRIPE_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

// Preço exibido (em sync com o Stripe)
export const PRO_PRICE_BRL = 50
export const PRO_TRIAL_DAYS = 7

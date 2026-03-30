import Stripe from 'stripe'

// Lazily instantiated so missing env var doesn't crash unrelated pages
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' })
  }
  return _stripe
}

/** Convert a euro amount to cents for Stripe */
export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

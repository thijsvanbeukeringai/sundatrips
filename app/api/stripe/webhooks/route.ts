import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const stripe = getStripe()

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as any
      const userId  = account.metadata?.supabase_user_id
      if (!userId) break
      await supabase
        .from('profiles')
        .update({
          stripe_onboarding_done: account.details_submitted,
          stripe_charges_enabled: account.charges_enabled,
        })
        .eq('id', userId)
      break
    }

    case 'payment_intent.succeeded': {
      const pi        = event.data.object as any
      const bookingId = pi.metadata?.booking_id
      if (!bookingId) break
      await supabase
        .from('bookings')
        .update({
          stripe_payment_intent_id: pi.id,
          stripe_payment_status:    'paid',
          status:                   'confirmed',
        })
        .eq('id', bookingId)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi        = event.data.object as any
      const bookingId = pi.metadata?.booking_id
      if (!bookingId) break
      await supabase
        .from('bookings')
        .update({ stripe_payment_status: 'failed' })
        .eq('id', bookingId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('account')
  if (!accountId) return NextResponse.json({ error: 'Missing account' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  if (profile?.stripe_account_id !== accountId) {
    return NextResponse.json({ error: 'Account mismatch' }, { status: 403 })
  }

  const stripe  = getStripe()
  const account = await stripe.accounts.retrieve(accountId)

  await supabase
    .from('profiles')
    .update({
      stripe_onboarding_done: account.details_submitted,
      stripe_charges_enabled: account.charges_enabled,
    })
    .eq('id', user.id)

  return NextResponse.json({
    details_submitted: account.details_submitted,
    charges_enabled:   account.charges_enabled,
    payouts_enabled:   account.payouts_enabled,
  })
}

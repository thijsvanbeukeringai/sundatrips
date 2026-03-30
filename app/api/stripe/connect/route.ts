import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = getStripe()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, full_name, email')
    .eq('id', user.id)
    .single()

  let accountId = profile?.stripe_account_id as string | null

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'NL',
      email: profile?.email,
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      business_profile: {
        mcc:                '7011',
        product_description: 'Tourism stays, trips and activities in Indonesia',
      },
      metadata: { supabase_user_id: user.id },
    })
    accountId = account.id
    await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${SITE_URL}/dashboard/settings?stripe=refresh`,
    return_url:  `${SITE_URL}/dashboard/settings?stripe=return&account=${accountId}`,
    type:        'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}

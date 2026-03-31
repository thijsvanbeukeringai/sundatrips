import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types'
import StripeConnectButton from '@/components/dashboard/StripeConnectButton'
import StripeStatusChecker from '@/components/dashboard/StripeStatusChecker'
import ProfileEditForm from '@/components/dashboard/ProfileEditForm'
import { CheckCircle, AlertCircle, ExternalLink, CreditCard, User } from 'lucide-react'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { stripe?: string; account?: string }
}) {
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = data as Profile

  const stripeReturn  = searchParams.stripe === 'return'
  const stripeRefresh = searchParams.stripe === 'refresh'
  const accountId     = searchParams.account

  return (
    <div className="p-6 sm:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-jungle-800">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your profile and payment setup.</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-jungle-50 rounded-xl flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-jungle-700" />
          </div>
          <h2 className="font-semibold text-gray-800">Profile</h2>
        </div>

        <ProfileEditForm
          fullName={profile.full_name}
          email={profile.email}
          phone={profile.phone ?? null}
          role={profile.role}
        />
      </div>

      {/* Stripe Connect */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Stripe Payouts</h2>
            <p className="text-xs text-gray-400">Connect your Stripe account to receive booking payments directly.</p>
          </div>
        </div>

        {/* Return from Stripe — trigger status check */}
        {stripeReturn && accountId && (
          <StripeStatusChecker accountId={accountId} />
        )}

        {/* Refresh (link expired) */}
        {stripeRefresh && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Your onboarding link expired. Click below to get a new one.</span>
          </div>
        )}

        {/* Connected & enabled */}
        {profile.stripe_charges_enabled && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Stripe account connected</p>
              <p className="text-xs mt-0.5 text-green-600">You will receive 90% of each booking amount directly to your bank account.</p>
            </div>
          </div>
        )}

        {/* Connected but not fully onboarded */}
        {profile.stripe_account_id && profile.stripe_onboarding_done && !profile.stripe_charges_enabled && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Account pending verification</p>
              <p className="text-xs mt-0.5">Stripe is reviewing your account. This usually takes 1–2 business days.</p>
            </div>
          </div>
        )}

        {/* Not connected yet */}
        {!profile.stripe_account_id && (
          <p className="text-sm text-gray-500">
            Not connected yet. Set up your Stripe account to receive payments from bookings.
            Sunda Trips retains a <strong>10% platform fee</strong>; you keep 90%.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <StripeConnectButton
            hasAccount={!!profile.stripe_account_id}
            chargesEnabled={profile.stripe_charges_enabled}
          />

          {profile.stripe_account_id && (
            <a
              href={`https://dashboard.stripe.com/express-dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open Stripe Dashboard
            </a>
          )}
        </div>

        <div className="pt-2 border-t border-gray-50 text-xs text-gray-400 space-y-1">
          <p>Payments are processed by Stripe. Sunda Trips never stores your card or bank details.</p>
          <p>Payouts are sent by Stripe directly to your bank account on their standard schedule.</p>
        </div>
      </div>
    </div>
  )
}

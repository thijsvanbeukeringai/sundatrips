'use client'

import { useState, useTransition } from 'react'
import { updateOwnerStripe } from '@/app/actions/admin'
import { Check, ExternalLink, AlertCircle, CheckCircle2, Save } from 'lucide-react'

export default function StripeSettingsForm({
  ownerId,
  stripeAccountId,
  onboardingDone,
  chargesEnabled,
}: {
  ownerId:         string
  stripeAccountId: string | null
  onboardingDone:  boolean
  chargesEnabled:  boolean
}) {
  const [accountId,  setAccountId]  = useState(stripeAccountId ?? '')
  const [onboarded,  setOnboarded]  = useState(onboardingDone)
  const [charges,    setCharges]    = useState(chargesEnabled)
  const [saved,      setSaved]      = useState(false)
  const [pending, startTransition]  = useTransition()

  function saveAccountId() {
    startTransition(async () => {
      await updateOwnerStripe(ownerId, {
        stripe_account_id:      accountId.trim() || null,
        stripe_onboarding_done: onboarded,
        stripe_charges_enabled: charges,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function toggleOnboarding() {
    const next = !onboarded
    setOnboarded(next)
    startTransition(() => { void updateOwnerStripe(ownerId, { stripe_onboarding_done: next }) })
  }

  function toggleCharges() {
    const next = !charges
    setCharges(next)
    startTransition(() => { void updateOwnerStripe(ownerId, { stripe_charges_enabled: next }) })
  }

  return (
    <div className="space-y-4">
      {/* Account ID */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
          Stripe Account ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="acct_1ABC2xyz..."
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-jungle-500 focus:border-transparent font-mono"
          />
          <button
            onClick={saveAccountId}
            disabled={pending}
            className="flex items-center gap-1.5 bg-jungle-700 hover:bg-jungle-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Find this in the Stripe Dashboard → Connect → Accounts
        </p>
      </div>

      {/* Status toggles */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={toggleOnboarding}
          disabled={pending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 ${
            onboarded
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          {onboarded
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4 text-gray-400" />
          }
          Onboarding {onboarded ? 'complete' : 'pending'}
        </button>

        <button
          onClick={toggleCharges}
          disabled={pending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all disabled:opacity-50 ${
            charges
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          {charges
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4 text-gray-400" />
          }
          Charges {charges ? 'enabled' : 'disabled'}
        </button>
      </div>

      {/* Stripe dashboard link */}
      {accountId && (
        <a
          href={`https://dashboard.stripe.com/connect/accounts/${accountId.trim()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Stripe Dashboard
        </a>
      )}
    </div>
  )
}

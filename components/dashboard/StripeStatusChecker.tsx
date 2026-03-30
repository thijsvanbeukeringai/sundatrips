'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

// Called after Stripe onboarding redirect returns to settings?stripe=return&account=...
// Makes a single request to verify and persist the account status.
export default function StripeStatusChecker({ accountId }: { accountId: string }) {
  const [status, setStatus] = useState<'loading' | 'enabled' | 'pending' | 'error'>('loading')

  useEffect(() => {
    fetch(`/api/stripe/connect/status?account=${encodeURIComponent(accountId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.charges_enabled) setStatus('enabled')
        else if (data.details_submitted) setStatus('pending')
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [accountId])

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 bg-gray-50 text-gray-500 text-sm px-4 py-3 rounded-xl">
        <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
        Verifying your Stripe account…
      </div>
    )
  }

  if (status === 'enabled') {
    return (
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Stripe connected successfully!</p>
          <p className="text-xs mt-0.5 text-green-600">You can now receive booking payments directly.</p>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Setup submitted — pending Stripe review</p>
          <p className="text-xs mt-0.5">Usually 1–2 business days. We'll update your status automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>Could not verify Stripe status. Please try connecting again.</span>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CreditCard, RefreshCw, CheckCircle } from 'lucide-react'

interface Props {
  hasAccount:     boolean
  chargesEnabled: boolean
}

export default function StripeConnectButton({ hasAccount, chargesEnabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  if (chargesEnabled) {
    return (
      <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 font-semibold text-sm px-4 py-2.5 rounded-xl">
        <CheckCircle className="w-4 h-4" />
        Payouts Active
      </span>
    )
  }

  async function connect() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
      }
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={loading}
        className="inline-flex items-center gap-2 bg-[#635BFF] hover:bg-[#4f48cc] disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#635BFF]/30"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
          </svg>
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {loading ? 'Redirecting to Stripe…' : hasAccount ? 'Resume Stripe Setup' : 'Connect Stripe Account'}
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  )
}

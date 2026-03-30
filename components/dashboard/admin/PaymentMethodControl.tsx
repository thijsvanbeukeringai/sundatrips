'use client'

import { useTransition } from 'react'
import { setOwnerPaymentMethods } from '@/app/actions/admin'
import type { AllowedPaymentMethods } from '@/lib/types'

const OPTIONS: { value: AllowedPaymentMethods; label: string; description: string }[] = [
  { value: 'all',         label: 'Cash + Online',  description: 'Both payment methods allowed' },
  { value: 'cash_only',   label: 'Cash only',       description: 'Only cash on arrival' },
  { value: 'online_only', label: 'Online only',     description: 'Only Stripe / online payments' },
]

export default function PaymentMethodControl({
  ownerId,
  current,
}: {
  ownerId: string
  current: AllowedPaymentMethods
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-1.5 flex-wrap">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          disabled={pending}
          title={opt.description}
          onClick={() => {
            if (opt.value === current) return
            startTransition(() => setOwnerPaymentMethods(ownerId, opt.value))
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
            current === opt.value
              ? 'bg-jungle-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

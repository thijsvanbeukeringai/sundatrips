'use client'

import { useState, useEffect } from 'react'
import { getPartnerCustomers } from '@/app/actions/partner'
import { Users, Mail, Phone, CalendarDays, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

type Customer = {
  name: string
  email: string
  phone: string | null
  bookingCount: number
  lastBooking: string
}

export default function PortalCustomersPage() {
  const { t, lang } = useI18n()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPartnerCustomers().then(data => {
      setCustomers(data)
      setLoading(false)
    })
  }, [])

  const locale = lang === 'id' ? 'id-ID' : 'en-GB'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    )
  }

  // Group alphabetically
  const grouped = customers.reduce<Record<string, Customer[]>>((acc, c) => {
    const letter = c.name[0]?.toUpperCase() ?? '#'
    ;(acc[letter] ??= []).push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">{t.portal.customers.title}</h1>
        <span className="text-sm text-gray-400">{customers.length} {t.portal.customers.total}</span>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-12 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">{t.portal.customers.noCustomers}</p>
          <p className="text-sm text-gray-400 mt-1">{t.portal.customers.noCustomersSub}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, group]) => (
            <div key={letter}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{letter}</p>
              <div className="space-y-1.5">
                {group.map(c => (
                  <div key={c.email} className="bg-white border border-gray-100 rounded-2xl px-3 sm:px-4 py-3 sm:py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                        <div className="mt-1.5 space-y-1">
                          <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {c.email}
                          </p>
                          {c.phone && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-jungle-700">
                          {c.bookingCount} {c.bookingCount === 1 ? t.portal.customers.booking : t.portal.customers.bookings}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 justify-end">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(c.lastBooking).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

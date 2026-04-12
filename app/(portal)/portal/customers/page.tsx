import { getPartnerCustomers } from '@/app/actions/partner'
import { Users, Mail, Phone, CalendarDays } from 'lucide-react'

export default async function PortalCustomersPage() {
  const customers = await getPartnerCustomers()

  // Group alphabetically
  const grouped = customers.reduce<Record<string, typeof customers>>((acc, c) => {
    const letter = c.name[0]?.toUpperCase() ?? '#'
    ;(acc[letter] ??= []).push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Customers</h1>
        <span className="text-sm text-gray-400">{customers.length} total</span>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-12 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No customers yet</p>
          <p className="text-sm text-gray-400 mt-1">Guests will appear here once bookings are made</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, group]) => (
            <div key={letter}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{letter}</p>
              <div className="space-y-1.5">
                {group.map(c => (
                  <div key={c.email} className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <div className="mt-1.5 space-y-1">
                          <p className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {c.email}
                          </p>
                          {c.phone && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-jungle-700">
                          {c.bookingCount} {c.bookingCount === 1 ? 'booking' : 'bookings'}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 justify-end">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(c.lastBooking).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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

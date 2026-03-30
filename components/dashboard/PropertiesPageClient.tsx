'use client'

import Link from 'next/link'
import { Plus, Building2, MapPin, Pencil, Bed, Compass, Activity, CalendarDays, LayoutList, Car } from 'lucide-react'
import type { Property } from '@/lib/types'
import DeletePropertyButton from '@/components/dashboard/DeletePropertyButton'
import ToggleActiveButton from '@/components/dashboard/ToggleActiveButton'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  stay:     <Bed className="w-3.5 h-3.5" />,
  trip:     <Compass className="w-3.5 h-3.5" />,
  activity: <Activity className="w-3.5 h-3.5" />,
  transfer: <Car className="w-3.5 h-3.5" />,
}

const TYPE_COLORS: Record<string, string> = {
  stay:     'bg-blue-50 text-blue-700',
  trip:     'bg-jungle-50 text-jungle-700',
  activity: 'bg-sunset-50 text-sunset-600',
  transfer: 'bg-gray-100 text-gray-700',
}

export default function PropertiesPageClient({ properties }: { properties: Property[] }) {
  const { t, lang } = useI18n()
  const pr = t.properties

  const active     = properties.filter(p => p.is_active).length
  const stays      = properties.filter(p => p.type === 'stay').length
  const trips      = properties.filter(p => p.type === 'trip').length
  const activities = properties.filter(p => p.type === 'activity').length
  const transfers  = properties.filter(p => p.type === 'transfer').length

  const stats = [
    { label: pr.stays,      count: stays,      color: 'text-blue-700',    bg: 'bg-blue-50' },
    { label: pr.trips,      count: trips,      color: 'text-jungle-700',  bg: 'bg-jungle-50' },
    { label: pr.activities, count: activities, color: 'text-sunset-600',  bg: 'bg-sunset-50' },
    { label: pr.transfers,  count: transfers,  color: 'text-gray-700',    bg: 'bg-gray-100' },
  ]

  function participantLabel(type: string) {
    if (type === 'stay')     return pr.guests
    if (type === 'trip')     return pr.people
    return pr.participants
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">{pr.title}</h1>
          <p className="text-gray-400 text-sm mt-1">
            {properties.length} {properties.length !== 1 ? pr.listingsPlural : pr.listings} · {active} {pr.active}
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 text-sm"
        >
          <Plus className="w-4 h-4" />
          {pr.newListing}
        </Link>
      </div>

      {/* Stats row */}
      {properties.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, count, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
              <p className={`font-display text-2xl font-bold ${color}`}>{count}</p>
              <p className={`text-xs font-semibold ${color} opacity-70 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">{pr.noListings}</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">{pr.noListingsSub}</p>
          <Link
            href="/dashboard/properties/new"
            className="inline-flex items-center gap-2 bg-jungle-800 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-jungle-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {pr.createFirst}
          </Link>
        </div>
      )}

      {/* List */}
      {properties.length > 0 && (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors overflow-hidden">

              {/* Main row */}
              <div className="p-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Building2 className="w-7 h-7" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}>
                      {TYPE_ICONS[p.type]}
                      {t.types[p.type as keyof typeof t.types]}
                    </span>
                    {p.tag && (
                      <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{p.tag}</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {p.location} · {p.island}
                  </p>
                  {p.max_capacity && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pr.maxGuests} {p.max_capacity} {participantLabel(p.type)}
                      {p.duration ? ` · ${p.duration}` : ''}
                    </p>
                  )}
                </div>

                {/* Price + status */}
                <div className="flex-shrink-0 text-right flex flex-col items-end gap-2">
                  <div>
                    <p className="font-display font-bold text-lg text-jungle-800">{formatPriceRaw(p.price_per_unit, lang)}</p>
                    <p className="text-xs text-gray-400">{pr.perUnit} {p.price_unit}</p>
                  </div>
                  <ToggleActiveButton id={p.id} isActive={p.is_active} />
                </div>
              </div>

              {/* Action footer */}
              <div className="border-t border-gray-50 px-3 py-2 flex items-center gap-1 bg-gray-50/50 flex-wrap">
                <Link
                  href={`/dashboard/properties/${p.id}/availability`}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-jungle-700 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {pr.availability}
                </Link>
                <Link
                  href={`/dashboard/properties/${p.id}/variants`}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-jungle-700 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  {pr.variantLabel[p.type as keyof typeof pr.variantLabel]}
                </Link>
                <Link
                  href={`/dashboard/properties/${p.id}/edit`}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {pr.edit}
                </Link>
                <DeletePropertyButton id={p.id} name={p.name} />
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}

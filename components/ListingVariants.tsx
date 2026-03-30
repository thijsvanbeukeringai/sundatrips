'use client'

import { Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import type { ListingVariant, PropertyType } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

export default function ListingVariants({
  variants,
  propertyType,
  onBook,
}: {
  variants:     ListingVariant[]
  propertyType: PropertyType
  onBook?:      (variantId: string) => void
}) {
  const { t, lang } = useI18n()
  const active = variants.filter(v => v.is_active)
  if (active.length === 0) return null

  const SECTION_LABEL: Record<PropertyType, string> = {
    stay:     t.variants.publicStay,
    trip:     t.variants.publicTrip,
    activity: t.variants.publicActivity,
    transfer: t.variants.publicTransfer,
  }

  const UNIT_LABEL: Record<string, string> = {
    night:   `/ ${t.common.night}`,
    person:  `/ ${t.common.person}`,
    session: `/ ${t.common.session}`,
    day:     `/ ${t.common.day}`,
    trip:    `/ ${t.common.trip}`,
    vehicle: `/ ${t.common.vehicle}`,
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">{SECTION_LABEL[propertyType]}</h2>
      <div className="space-y-3">
        {active.map(v => (
          <div
            key={v.id}
            className="border border-gray-200 rounded-2xl p-5 hover:border-jungle-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{v.name}</h3>
                  {v.from_location && v.to_location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      <span>{v.from_location}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{v.to_location}</span>
                    </span>
                  )}
                </div>

                {v.description && (
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{v.description}</p>
                )}

                {v.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {v.amenities.map(a => (
                      <span key={a} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                        <CheckCircle2 className="w-3 h-3 text-jungle-500 flex-shrink-0" />
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {v.max_capacity && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Users className="w-3 h-3" />
                    {t.listing.maxGuests} {v.max_capacity} {propertyType === 'stay' ? t.variants.guests : t.variants.people}
                  </p>
                )}
              </div>

              {/* Right: price + CTA */}
              <div className="flex-shrink-0 text-right flex flex-col items-end gap-3">
                <div>
                  <span className="font-display text-2xl font-bold text-jungle-800">
                    {formatPriceRaw(v.price_per_unit, lang)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">
                    {UNIT_LABEL[v.price_unit] ?? `/ ${v.price_unit}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onBook?.(v.id)}
                  className="inline-flex items-center gap-1.5 bg-jungle-800 hover:bg-jungle-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  {t.variants.requestBook}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

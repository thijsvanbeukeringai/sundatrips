'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Clock, Users } from 'lucide-react'
import type { Property } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

export default function ListingsGrid({ properties }: { properties: Property[] }) {
  const { t, lang } = useI18n()

  function displayUnit(unit: string, type: string): string {
    const key = (unit === 'night' && type !== 'stay') ? 'person' : unit
    return t.common[key as keyof typeof t.common] ?? unit
  }

  if (properties.length === 0) {
    return (
      <div className="py-24 text-center text-gray-400">
        <p className="text-lg font-medium">{t.listings.noResults}</p>
        <Link href="/listings" className="mt-4 inline-block text-sm text-jungle-700 hover:underline">
          {t.listings.clearFilters}
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {properties.map(p => (
        <Link
          key={p.id}
          href={`/listings/${p.id}`}
          className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
        >
          <div className="relative h-48 overflow-hidden bg-gray-100 flex-shrink-0">
            {p.images[0] ? (
              <Image
                src={p.images[0]} alt={p.name} fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-jungle-100 to-jungle-200" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            {p.tag && (
              <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-gray-700">
                {p.tag}
              </span>
            )}
            <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-jungle-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
              {p.island}
            </span>
            {p.duration && (
              <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />{p.duration}
              </span>
            )}
          </div>

          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-jungle-800 transition-colors leading-snug text-sm truncate">
                  {p.name}
                </h3>
                <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />{p.location}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-gray-800">{t.listings.new}</span>
              </div>
            </div>

            <div className="mt-3 flex gap-1.5 overflow-hidden h-6">
              {p.amenities.slice(0, 2).map(a => (
                <span key={a} className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md leading-none whitespace-nowrap flex-shrink-0">{a}</span>
              ))}
              {p.amenities.length > 2 && (
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md leading-none whitespace-nowrap flex-shrink-0">+{p.amenities.length - 2}</span>
              )}
            </div>

            {p.max_capacity && (
              <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-2">
                <Users className="w-3 h-3" />{t.listings.maxGuests} {p.max_capacity}
              </p>
            )}

            <div className="mt-auto pt-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 capitalize">{p.type}</span>
              <div className="text-right">
                <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(p.price_per_unit, lang)}</span>
                <span className="text-xs text-gray-400"> / {displayUnit(p.price_unit, p.type)}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

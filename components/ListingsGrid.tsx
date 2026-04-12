'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Clock, Users, Car, Languages, Route } from 'lucide-react'
import type { Property } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

function TransferCard({ p, t, lang }: { p: Property; t: any; lang: 'en' | 'id' }) {
  const owner = (p as any).owner
  const displayName = owner?.company_name || p.name
  const displayImage = owner?.company_logo || p.images[0]
  const displayLocation = owner?.company_location || p.location
  const displayIsland = owner?.company_island || p.island
  const ownerLanguages: string[] = owner?.languages ?? []

  return (
    <Link
      href={`/listings/${p.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-jungle-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Driver image with dark overlay */}
      <div className="relative h-48 overflow-hidden bg-jungle-800 flex-shrink-0">
        {displayImage ? (
          <Image
            src={displayImage} alt={displayName} fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jungle-700 to-jungle-900 flex items-center justify-center">
            <Car className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Transfer badge */}
        <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-jungle-800/90 text-white backdrop-blur-sm">
          <Car className="w-3 h-3" />
          {t.types.transfer}
        </span>

        <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-jungle-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
          {displayIsland}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Company name + location */}
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-jungle-800 transition-colors leading-snug text-sm truncate">
            {displayName}
          </h3>
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />{displayLocation}
          </p>
        </div>

        {/* Driver features */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(ownerLanguages.includes('English') || p.english_speaking) && (
            <span className="flex items-center gap-1 text-[11px] text-jungle-700 bg-jungle-50 px-2 py-1 rounded-md leading-none whitespace-nowrap">
              <Languages className="w-3 h-3" />English
            </span>
          )}
          {p.max_capacity && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md leading-none whitespace-nowrap">
              <Users className="w-3 h-3" />Max {p.max_capacity}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md leading-none whitespace-nowrap">
            <Route className="w-3 h-3" />Custom routes
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          <span className="text-[11px] text-gray-400">
            {t.types.transfer}
          </span>
          <div className="text-right">
            <span className="text-xs text-gray-400">from </span>
            <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(p.price_per_unit, lang)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function DefaultCard({ p, t, lang, displayUnit }: { p: Property; t: any; lang: 'en' | 'id'; displayUnit: (unit: string, type: string) => string }) {
  return (
    <Link
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
          <span className="text-[11px] text-gray-400 capitalize">
            {t.types[p.type as keyof typeof t.types] ?? p.type}
          </span>
          <div className="text-right">
            <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(p.price_per_unit, lang)}</span>
            <span className="text-xs text-gray-400"> / {displayUnit(p.price_unit, p.type)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

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
      {properties.map(p =>
        p.type === 'transfer'
          ? <TransferCard key={p.id} p={p} t={t} lang={lang} />
          : <DefaultCard key={p.id} p={p} t={t} lang={lang} displayUnit={displayUnit} />
      )}
    </div>
  )
}

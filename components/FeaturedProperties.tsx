'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Star, MapPin, Wifi, Waves, Coffee, Heart, Clock, Users, Compass, Car, Languages, Route } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Property } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const STAY_ICONS: Record<string, React.ReactNode> = {
  wifi:      <Wifi className="w-3.5 h-3.5" />,
  beach:     <Waves className="w-3.5 h-3.5" />,
  coffee:    <Coffee className="w-3.5 h-3.5" />,
  breakfast: <Coffee className="w-3.5 h-3.5" />,
}

function tagColor(tag: string | null | undefined): string {
  const t = (tag ?? '').toLowerCase()
  if (t.includes('beach') || t.includes('surf') || t.includes('ocean') || t.includes('sea') || t.includes('snorkel'))
    return 'bg-blue-100 text-blue-700'
  if (t.includes('jungle') || t.includes('forest') || t.includes('mountain') || t.includes('volcano') || t.includes('trek'))
    return 'bg-jungle-100 text-jungle-800'
  if (t.includes('cultural') || t.includes('temple') || t.includes('cooking') || t.includes('hands'))
    return 'bg-amber-100 text-amber-700'
  if (t.includes('wellness') || t.includes('yoga') || t.includes('spa') || t.includes('meditation'))
    return 'bg-purple-100 text-purple-700'
  if (t.includes('sunrise') || t.includes('sunset'))
    return 'bg-orange-100 text-orange-700'
  if (t.includes('gili') || t.includes('island'))
    return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-600'
}

type Tab = 'all' | 'stays' | 'trips' | 'activities' | 'transfers'
const ISLAND_FILTERS = ['All Islands', 'Lombok', 'Bali', 'Gili Islands'] as const
type IslandFilter = typeof ISLAND_FILTERS[number]

const cardVariants = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

function TransferFeaturedCard({ p, t, lang }: { p: Property; t: any; lang: 'en' | 'id' }) {
  const owner = (p as any).owner
  const displayName = owner?.company_name || p.name
  const displayImage = owner?.company_logo || p.images[0]
  const displayLocation = owner?.company_location || p.location
  const displayIsland = owner?.company_island || p.island
  const ownerLanguages: string[] = owner?.languages ?? []

  return (
    <Link
      href={`/listings/${p.id}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-jungle-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-44 overflow-hidden flex-shrink-0 bg-jungle-800">
        {displayImage ? (
          <Image src={displayImage} alt={displayName} fill unoptimized
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jungle-700 to-jungle-900 flex items-center justify-center">
            <Car className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-jungle-800/90 text-white backdrop-blur-sm">
          <Car className="w-3 h-3" />{t.types.transfer}
        </span>
        <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-jungle-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">
          {displayIsland}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-jungle-800 transition-colors leading-snug text-sm truncate">{displayName}</h3>
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />{displayLocation}
          </p>
        </div>
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
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          <span className="text-[11px] text-gray-400">{t.types.transfer}</span>
          <div className="text-right">
            <span className="text-xs text-gray-400">from </span>
            <span className="font-display text-lg font-bold text-jungle-800">{formatPriceRaw(p.price_per_unit, lang)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function FeaturedProperties({ properties }: { properties: Property[] }) {
  const [tab, setTab]       = useState<Tab>('all')
  const [island, setIsland] = useState<IslandFilter>('All Islands')
  const { t, lang }         = useI18n()

  const TABS = [
    { id: 'all'        as Tab, label: t.featured.all },
    { id: 'stays'      as Tab, label: t.featured.stays },
    { id: 'trips'      as Tab, label: t.featured.trips },
    { id: 'activities' as Tab, label: t.featured.activities },
    { id: 'transfers'  as Tab, label: t.featured.transfers },
  ]

  function displayUnit(unit: string, type: string): string {
    const unitKey = (unit === 'night' && type !== 'stay') ? 'person' : unit
    return t.common[unitKey as keyof typeof t.common] ?? unit
  }

  const visible = properties.filter((p) => {
    const catMap: Record<string, string> = { stay: 'stays', trip: 'trips', activity: 'activities', transfer: 'transfers' }
    const catMatch  = tab === 'all' || catMap[p.type] === tab
    const isleMatch = island === 'All Islands' || p.island === island
    return catMatch && isleMatch
  })

  return (
    <section id="destinations" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-sunset-500 text-sm font-bold uppercase tracking-widest mb-2">{t.featured.eyebrow}</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-jungle-800 leading-tight">
                {t.featured.title}
              </h2>
              <p className="mt-3 text-gray-500 text-lg max-w-lg">
                {t.featured.subtitle}
              </p>
            </div>

            {/* Island filter */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              {ISLAND_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setIsland(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    island === f
                      ? 'bg-jungle-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'All Islands' ? t.featured.allIslands : f}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 mt-6 border-b border-gray-100 pb-0">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  tab === id ? 'text-jungle-800' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
                {tab === id && (
                  <m.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunset-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </m.div>

        {/* Grid */}
        <m.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {visible.slice(0, 8).map((p) => (
              <m.div
                key={p.id}
                layout
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full"
              >
              {p.type === 'transfer' ? (
                <TransferFeaturedCard p={p} t={t} lang={lang} />
              ) : (
                /* ── Default card ── */
                <Link
                  href={`/listings/${p.id}`}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
                >
                  <div className="relative h-44 overflow-hidden flex-shrink-0 bg-gray-100">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-jungle-100 to-jungle-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    {p.tag && (
                      <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full ${tagColor(p.tag)}`}>{p.tag}</span>
                    )}
                    <button onClick={e => e.preventDefault()} className="absolute top-3 right-3 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors" />
                    </button>
                    {p.duration && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />{p.duration}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold text-white bg-jungle-800/80 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider">{p.island}</span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-jungle-800 transition-colors leading-snug text-sm truncate">{p.name}</h3>
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
                      {p.amenities.slice(0, 2).map((a) => (
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
              )}
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>

        {visible.length === 0 && (
          <div className="py-20 text-center text-gray-400">
            <Compass className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t.featured.noMatch}</p>
          </div>
        )}

        {/* View more */}
        {visible.length > 0 && (
          <div className="mt-12 text-center">
            <Link href="/listings" className="inline-flex items-center gap-2 border-2 border-jungle-800 text-jungle-800 hover:bg-jungle-800 hover:text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200">
              {t.featured.viewAll}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, ArrowLeft, Bed, Compass, Activity, Star, CheckCircle2, ArrowRight, Route, Languages, Search, X } from 'lucide-react'
import type { Property, AvailabilityBlock, TimeSlot, ListingVariant, SlotAvailability } from '@/lib/types'
import { groupAmenities } from '@/lib/amenities'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import { getAvailableVariants } from '@/app/actions/availability'
import PublicAvailabilityCalendar from '@/components/PublicAvailabilityCalendar'
import ActivityDatePicker from '@/components/ActivityDatePicker'
import ListingVariants from '@/components/ListingVariants'
import ListingGallery from '@/components/ListingGallery'
import PublicBookingForm from '@/components/PublicBookingForm'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const TYPE_COLORS: Record<string, string> = {
  stay:     'bg-blue-100 text-blue-700',
  trip:     'bg-jungle-100 text-jungle-800',
  activity: 'bg-sunset-100 text-sunset-700',
  transfer: 'bg-gray-100 text-gray-700',
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
  stay:     <Bed className="w-4 h-4" />,
  trip:     <Compass className="w-4 h-4" />,
  activity: <Activity className="w-4 h-4" />,
  transfer: <Activity className="w-4 h-4" />,
}

interface Props {
  property:          Property
  availabilityBlocks: AvailabilityBlock[]
  timeSlots:         TimeSlot[]
  variants:          ListingVariant[]
  slotAvailability:  SlotAvailability[]
}

export default function ListingDetailClient({ property: p, availabilityBlocks, timeSlots, variants, slotAvailability }: Props) {
  const { t, lang } = useI18n()
  const isActivity  = p.type === 'activity' || p.type === 'trip'
  const [triggerVariantId, setTriggerVariantId] = useState<string | null>(null)
  const [triggerDate,      setTriggerDate]      = useState<string | null>(null)

  // Stay search state
  const [searchCheckIn,    setSearchCheckIn]    = useState('')
  const [searchCheckOut,   setSearchCheckOut]   = useState('')
  const [searchGuests,     setSearchGuests]     = useState(2)
  const [searchVariants,   setSearchVariants]   = useState<ListingVariant[] | null>(null)
  const [searching,        startSearch]         = useTransition()

  function handleSearch() {
    if (!searchCheckIn || !searchCheckOut) return
    startSearch(async () => {
      const results = await getAvailableVariants(p.id, searchCheckIn, searchCheckOut, searchGuests)
      setSearchVariants(results)
    })
  }

  function clearSearch() {
    setSearchVariants(null)
    setSearchCheckIn('')
    setSearchCheckOut('')
    setSearchGuests(2)
  }

  function openBooking(opts: { variantId?: string; date?: string }) {
    setTriggerVariantId(opts.variantId ?? null)
    setTriggerDate(opts.date ?? null)
  }

  function displayPriceUnit(unit: string, type: string): string {
    const key = (unit === 'night' && type !== 'stay') ? 'person' : unit
    return t.common[key as keyof typeof t.common] ?? unit
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <div className="absolute top-24 left-4 sm:left-6 z-20">
          <Link
            href="/#destinations"
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-800 font-medium text-sm px-4 py-2 rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.listing.back}
          </Link>
        </div>

        <ListingGallery images={p.images} name={p.name} />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-3 gap-10">

          {/* Left */}
          <div className="lg:col-span-2 space-y-8">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLORS[p.type]}`}>
                  {TYPE_ICONS[p.type]}
                  {t.types[p.type as keyof typeof t.types] ?? p.type}
                </span>
                {p.tag && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{p.tag}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold ml-auto">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {t.listing.newListing}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-jungle-800">{p.name}</h1>

              <p className="flex items-center gap-1.5 text-gray-500 mt-2">
                <MapPin className="w-4 h-4 text-sunset-500 flex-shrink-0" />
                {p.location}, {p.island}
              </p>

              {/* Transfer route */}
              {p.type === 'transfer' && p.transfer_from && p.transfer_to && (
                <div className="flex items-center gap-2 mt-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl w-fit">
                  <span>{p.transfer_from}</span>
                  <ArrowRight className="w-4 h-4 text-sunset-500 flex-shrink-0" />
                  <span>{p.transfer_to}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {p.max_capacity && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    {t.listing.maxGuests} {p.max_capacity} {p.type === 'stay' ? t.listing.guests : t.listing.people}
                  </span>
                )}
                {p.distance_km && (
                  <span className="flex items-center gap-1.5">
                    <Route className="w-4 h-4 text-gray-400" />
                    {p.distance_km} km
                  </span>
                )}
                {p.duration_hours && p.type === 'transfer' && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    ±{p.duration_hours < 1 ? `${p.duration_hours * 60} min` : `${p.duration_hours} h`}
                  </span>
                )}
                {p.duration && p.type !== 'transfer' && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {p.duration}
                  </span>
                )}
                {p.type === 'transfer' && p.english_speaking && (
                  <span className="flex items-center gap-1.5 text-jungle-700 font-medium">
                    <Languages className="w-4 h-4 text-jungle-500" />
                    {t.listing.englishSpeaking}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Description */}
            {p.description && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">
                  {t.listing.aboutThis} {t.types[p.type as keyof typeof t.types]?.toLowerCase() ?? p.type}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
              </div>
            )}

            {/* Amenities */}
            {p.amenities.length > 0 && (() => {
              const groups = groupAmenities(p.amenities, p.type)
              if (groups.length === 0) return null
              return (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-5">
                    {p.type === 'stay' ? t.listing.amenities : t.listing.whatsIncluded}
                  </h2>
                  <div className="space-y-6">
                    {groups.map(group => (
                      <div key={group.category}>
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <span>{group.emoji}</span>{group.category}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map(item => (
                            <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle2 className="w-4 h-4 text-jungle-500 flex-shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Stay availability search */}
            {p.type === 'stay' && variants.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <h2 className="font-semibold text-gray-900 mb-4">Check availability</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Check-in</label>
                        <input
                          type="date"
                          value={searchCheckIn}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => { setSearchCheckIn(e.target.value); setSearchVariants(null) }}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Check-out</label>
                        <input
                          type="date"
                          value={searchCheckOut}
                          min={searchCheckIn || new Date().toISOString().split('T')[0]}
                          onChange={e => { setSearchCheckOut(e.target.value); setSearchVariants(null) }}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Guests</label>
                        <input
                          type="number"
                          min="1"
                          value={searchGuests}
                          onChange={e => { setSearchGuests(parseInt(e.target.value) || 1); setSearchVariants(null) }}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSearch}
                          disabled={!searchCheckIn || !searchCheckOut || searching}
                          className="flex-1 flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                        >
                          {searching
                            ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" /></svg>
                            : <Search className="w-4 h-4" />}
                          Search
                        </button>
                        {searchVariants !== null && (
                          <button
                            type="button"
                            onClick={clearSearch}
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 border border-gray-200 bg-white rounded-xl transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {searchVariants !== null && (
                      <p className={`mt-3 text-sm font-medium ${searchVariants.length === 0 ? 'text-red-600' : 'text-jungle-700'}`}>
                        {searchVariants.length === 0
                          ? 'No rooms available for these dates. Try different dates or guest count.'
                          : `${searchVariants.length} room type${searchVariants.length > 1 ? 's' : ''} available`}
                      </p>
                    )}
                  </div>

                  {/* Show filtered room types inline after search */}
                  {searchVariants !== null && searchVariants.length > 0 && (
                    <div className="mt-4">
                      <ListingVariants variants={searchVariants} propertyType={p.type} onBook={id => openBooking({ variantId: id })} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Variants — shown when no search active */}
            {searchVariants === null && variants.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <ListingVariants variants={variants} propertyType={p.type} onBook={id => openBooking({ variantId: id })} />
              </>
            )}

            <hr className="border-gray-100" />

            {/* Availability */}
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">{t.listing.availability}</h2>
              {isActivity && timeSlots.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-5">{t.listing.selectDate}</p>
                  <ActivityDatePicker
                    blocks={availabilityBlocks}
                    slots={timeSlots}
                    durationHours={p.duration_hours}
                    maxCapacity={p.max_capacity}
                    slotAvailability={slotAvailability}
                    onBook={date => openBooking({ date })}
                  />
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-5">{t.listing.calendarHint}</p>
                  <PublicAvailabilityCalendar
                    blocks={availabilityBlocks}
                    maxCapacity={p.max_capacity}
                  />
                </>
              )}
            </div>
          </div>

          {/* Right: booking card */}
          <div className="lg:col-span-1">
            <PublicBookingForm
              property={p}
              variants={variants}
              triggerVariantId={triggerVariantId}
              triggerDate={triggerDate}
            />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

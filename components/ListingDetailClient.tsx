'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, ArrowLeft, Bed, Compass, Activity, Star, CheckCircle2, ArrowRight, Route, Languages, Car, Phone } from 'lucide-react'
import type { Property, AvailabilityBlock, TimeSlot, ListingVariant, SlotAvailability } from '@/lib/types'
import { groupAmenities } from '@/lib/amenities'
import { useI18n } from '@/lib/i18n'
import { formatPriceRaw } from '@/lib/currency'
import PublicAvailabilityCalendar from '@/components/PublicAvailabilityCalendar'
import ActivityDatePicker from '@/components/ActivityDatePicker'
import ListingVariants from '@/components/ListingVariants'
import ListingGallery from '@/components/ListingGallery'
import PublicBookingForm from '@/components/PublicBookingForm'
import StayBookingSection from '@/components/StayBookingSection'
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

  function openBooking(opts: { variantId?: string; date?: string }) {
    setTriggerVariantId(opts.variantId ?? null)
    setTriggerDate(opts.date ?? null)
  }

  function displayPriceUnit(unit: string, type: string): string {
    const key = (unit === 'night' && type !== 'stay') ? 'person' : unit
    return t.common[key as keyof typeof t.common] ?? unit
  }

  // ── Transfer: driver profile layout ──
  if (p.type === 'transfer') {
    const lowestPrice = variants.filter(v => v.is_active).length > 0
      ? Math.min(...variants.filter(v => v.is_active).map(v => v.price_per_unit))
      : p.price_per_unit

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

            {/* Left: driver profile + routes */}
            <div className="lg:col-span-2 space-y-8">

              {/* Driver profile card */}
              <div className="bg-jungle-800 rounded-2xl p-6 sm:p-8 text-white">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-jungle-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Car className="w-7 h-7 sm:w-8 sm:h-8 text-white/80" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-jungle-300 text-xs font-semibold uppercase tracking-widest">
                      {t.types.transfer}
                    </span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">{p.name}</h1>
                    <p className="flex items-center gap-1.5 text-jungle-200 mt-1.5 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-jungle-400" />
                      {p.location}, {p.island}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                  {p.english_speaking && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-jungle-100 bg-jungle-700/50 px-3 py-1.5 rounded-full">
                      <Languages className="w-3.5 h-3.5" />
                      {t.listing.englishSpeaking}
                    </span>
                  )}
                  {p.max_capacity && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-jungle-100 bg-jungle-700/50 px-3 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      {t.listing.maxGuests} {p.max_capacity} {t.listing.people}
                    </span>
                  )}
                  {p.driver_name && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-jungle-100 bg-jungle-700/50 px-3 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      {p.driver_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {p.description && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">
                    {t.listing.aboutThis} {t.types.transfer.toLowerCase()}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{p.description}</p>
                </div>
              )}

              {/* Amenities / highlights */}
              {p.amenities.length > 0 && (() => {
                const groups = groupAmenities(p.amenities, p.type)
                if (groups.length === 0) return null
                return (
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-5">{t.listing.whatsIncluded}</h2>
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

              {/* Routes / variants */}
              {variants.length > 0 && (
                <>
                  <hr className="border-gray-100" />
                  <ListingVariants variants={variants} propertyType={p.type} onBook={id => openBooking({ variantId: id })} />
                </>
              )}
            </div>

            {/* Right sidebar: booking form */}
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

  // ── Non-transfer layout ──
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

        <div className={`max-w-5xl mx-auto px-4 sm:px-6 py-10 ${p.type === 'stay' ? '' : 'grid lg:grid-cols-3 gap-10'}`}>

          {/* Left / main content */}
          <div className={`${p.type !== 'stay' ? 'lg:col-span-2' : 'max-w-3xl'} space-y-8`}>

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

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                {p.max_capacity && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    {t.listing.maxGuests} {p.max_capacity} {p.type === 'stay' ? t.listing.guests : t.listing.people}
                  </span>
                )}
                {p.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {p.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Stay: booking section directly below header as CTA */}
            {p.type === 'stay' && (
              <>
                <hr className="border-gray-100" />
                <StayBookingSection property={p} />
              </>
            )}

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

            {/* Variants — non-stay only */}
            {p.type !== 'stay' && variants.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <ListingVariants variants={variants} propertyType={p.type} onBook={id => openBooking({ variantId: id })} />
              </>
            )}

            {/* Non-stay: availability calendar at bottom (transfers return early above) */}
            {p.type !== 'stay' && (
              <>
                <hr className="border-gray-100" />
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
              </>
            )}
          </div>

          {/* Right sidebar: only for non-stay properties */}
          {p.type !== 'stay' && (
            <div className="lg:col-span-1">
              <PublicBookingForm
                property={p}
                variants={variants}
                triggerVariantId={triggerVariantId}
                triggerDate={triggerDate}
              />
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}

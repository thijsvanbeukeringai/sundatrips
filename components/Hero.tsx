'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { m } from 'framer-motion'
import { Search, MapPin, Calendar, Users, ChevronDown, BedDouble, Compass, Bike } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const DESTINATIONS = ['Lombok', 'Bali', 'Gili Islands', 'Senggigi', 'Ubud', 'Seminyak', 'Kuta Lombok', 'Rinjani']
type SearchType = 'stays' | 'trips' | 'activities'

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function Hero() {
  const { t }  = useI18n()
  const router = useRouter()

  const [searchType, setSearchType]   = useState<SearchType>('stays')
  const [destination, setDestination] = useState('')
  const [guests, setGuests]           = useState('')
  const [checkIn, setCheckIn]         = useState('')
  const [checkOut, setCheckOut]       = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showDatePicker,  setShowDatePicker]  = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)

  const SEARCH_TYPES = [
    { id: 'stays'      as const, label: t.featured.stays,      icon: BedDouble },
    { id: 'trips'      as const, label: t.featured.trips,      icon: Compass },
    { id: 'activities' as const, label: t.featured.activities, icon: Bike },
  ]

  const quickTags = t.hero.quickTags[searchType]

  const filtered = destination
    ? DESTINATIONS.filter(d => d.toLowerCase().includes(destination.toLowerCase()))
    : DESTINATIONS

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSearch() {
    const params = new URLSearchParams()
    params.set('type', searchType)
    if (destination) params.set('q', destination)
    if (guests)      params.set('guests', guests)
    if (checkIn)     params.set('checkin', checkIn)
    if (checkOut)    params.set('checkout', checkOut)
    router.push(`/listings?${params}`)
  }

  const dateLabel = (() => {
    if (searchType === 'stays') {
      if (checkIn && checkOut) return `${formatDate(checkIn)} – ${formatDate(checkOut)}`
      if (checkIn) return `${formatDate(checkIn)} –`
      return t.hero.addDates
    }
    return checkIn ? formatDate(checkIn) : t.hero.pickDate
  })()

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1800&q=85"
          alt="Authentic Lombok landscape"
          fill priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-jungle-900/70 via-jungle-900/40 to-jungle-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-jungle-900/30 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:32px_32px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex flex-col items-center text-center">

        {/* Badge */}
        <m.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 bg-sunset-500 rounded-full animate-pulse" />
          {t.hero.badge}
        </m.div>

        {/* Headline */}
        <m.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight text-balance max-w-5xl"
        >
          {t.hero.headline1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-400 to-amber-300">
            {t.hero.headline2}
          </span>
        </m.h1>

        {/* Sub */}
        <m.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-6 text-lg sm:text-xl text-white/75 font-light max-w-2xl leading-relaxed"
        >
          {t.hero.sub}
        </m.p>

        {/* Search card */}
        <m.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-12 w-full max-w-4xl">

          {/* Type tabs */}
          <div className="flex gap-1 mb-2 justify-start">
            {SEARCH_TYPES.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setSearchType(id); setShowDatePicker(false) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  searchType === id
                    ? 'bg-white text-jungle-800 shadow-md'
                    : 'bg-white/15 text-white/80 hover:bg-white/25 backdrop-blur-sm'
                }`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl shadow-jungle-900/40 p-2">
            <div className="flex flex-col sm:flex-row gap-2">

              {/* Destination */}
              <div className="relative flex-1">
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <MapPin className="w-5 h-5 text-sunset-500 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                      {t.hero.where}
                    </label>
                    <input
                      type="text"
                      placeholder="Lombok, Bali, Gili..."
                      value={destination}
                      onChange={e => { setDestination(e.target.value); setShowSuggestions(true) }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                    />
                  </div>
                </div>
                {showSuggestions && filtered.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                    {filtered.map(d => (
                      <button key={d} onMouseDown={() => { setDestination(d); setShowSuggestions(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-jungle-50 hover:text-jungle-800 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-sunset-400" />{d}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-px bg-gray-100 my-2" />

              {/* Dates */}
              <div ref={dateRef} className="relative flex-1">
                <button
                  onClick={() => setShowDatePicker(o => !o)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <Calendar className="w-5 h-5 text-sunset-500 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                      {t.hero.when}
                    </p>
                    <p className={`text-sm font-medium ${(checkIn || checkOut) ? 'text-gray-800' : 'text-gray-400'}`}>
                      {dateLabel}
                    </p>
                  </div>
                </button>

                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-30 min-w-[280px]">
                    {searchType === 'stays' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                            {t.hero.checkin}
                          </label>
                          <input
                            type="date"
                            value={checkIn}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setCheckIn(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jungle-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                            {t.hero.checkout}
                          </label>
                          <input
                            type="date"
                            value={checkOut}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                            onChange={e => setCheckOut(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jungle-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                          {t.hero.date}
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setCheckIn(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jungle-500"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="mt-3 w-full bg-jungle-800 text-white text-sm font-semibold py-2 rounded-xl hover:bg-jungle-900 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-px bg-gray-100 my-2" />

              {/* Guests */}
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                <Users className="w-5 h-5 text-sunset-500 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{t.hero.who}</p>
                  <input
                    type="number"
                    min="1"
                    placeholder={searchType === 'activities' ? t.hero.groupSize : t.hero.addGuests}
                    value={guests}
                    onChange={e => setGuests(e.target.value)}
                    className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="flex items-center justify-center gap-2 bg-sunset-500 hover:bg-sunset-600 active:scale-95 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-sunset-500/30 sm:ml-1"
              >
                <Search className="w-4 h-4" />
                <span>{t.hero.search}</span>
              </button>
            </div>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  const label = tag.replace(/^\S+\s/, '')
                  const params = new URLSearchParams({ type: searchType, q: label })
                  router.push(`/listings?${params}`)
                }}
                className="text-xs text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-full transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </m.div>

        {/* Stats */}
        <m.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-12"
        >
          {[
            { value: '240+', label: t.hero.stats.guesthouses },
            { value: '80+',  label: t.hero.stats.trips },
            { value: '4.9★', label: t.hero.stats.rating },
            { value: '0%',   label: t.hero.stats.fees },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </m.div>
      </div>

      {/* Scroll indicator */}
      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50"
      >
        <span className="text-[10px] uppercase tracking-widest">{t.hero.explore}</span>
        <m.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}>
          <ChevronDown className="w-5 h-5" />
        </m.div>
      </m.div>
    </section>
  )
}

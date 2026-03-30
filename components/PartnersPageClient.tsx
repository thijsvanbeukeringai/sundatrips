'use client'

import { m } from 'framer-motion'
import Link from 'next/link'
import {
  Car, Waves, Map, Hotel,
  Check, ArrowRight, Zap, CircleDollarSign,
  Users, LayoutDashboard, CalendarCheck, Globe,
} from 'lucide-react'

const PARTNER_TYPES = [
  {
    icon:  Car,
    color: 'bg-purple-50 text-purple-700 border-purple-100',
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Drivers & Transfers',
    desc:  'Airport pickups, intercity rides, custom routes. Set your own vehicles, prices and availability. Guests book directly — no dispatcher fees.',
    perks: ['Set your own tariffs', 'Multiple vehicle types', 'Route planning'],
  },
  {
    icon:  Waves,
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Activity Organizers',
    desc:  'Surf lessons, snorkeling, cooking classes, yoga — create bookable time slots, set capacity per session and manage everything from one screen.',
    perks: ['Time-slot booking', 'Capacity management', 'Instant confirmation'],
  },
  {
    icon:  Map,
    color: 'bg-jungle-50 text-jungle-700 border-jungle-100',
    iconBg: 'bg-jungle-100 text-jungle-700',
    title: 'Trip Organizers',
    desc:  'Multi-day treks, island hopping, cultural tours. Build detailed packages with itineraries, group sizes and custom pricing per person.',
    perks: ['Multi-day packages', 'Group pricing', 'Itinerary builder'],
  },
  {
    icon:  Hotel,
    color: 'bg-amber-50 text-amber-700 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-700',
    title: 'Hotels & Guesthouses',
    desc:  'List your rooms or villa packages, block availability, and manage the full guest stay — including drinks, tours and extras via the built-in POS.',
    perks: ['Room type management', 'Built-in POS for extras', 'Availability calendar'],
  },
]

const STEPS = [
  {
    num:  '01',
    icon: Users,
    title: 'Apply',
    desc:  'Fill in the form below. We review every application and create your account within 24 hours.',
  },
  {
    num:  '02',
    icon: LayoutDashboard,
    title: 'Set up your profile',
    desc:  'Add your services, set prices, upload photos and configure your availability — all from a simple dashboard.',
  },
  {
    num:  '03',
    icon: CalendarCheck,
    title: 'Receive bookings',
    desc:  'Guests discover your listing, book directly and pay you. No middlemen, no monthly fees — ever.',
  },
]

const BENEFITS = [
  { icon: CircleDollarSign, title: 'Completely free',       desc: 'No monthly subscription. We only cover server costs with a 1% contribution on bookings — nothing more.' },
  { icon: Globe,            title: 'Your own booking page', desc: 'Every partner gets a public listing page with photos, description and a direct Book Now button.' },
  { icon: Zap,              title: 'Real-time dashboard',   desc: 'See your bookings, revenue and payout live. Manage extras with the built-in Point-of-Sale system.' },
  { icon: ArrowRight,       title: 'Direct to you',         desc: 'Payments and bookings go straight to you. No waiting, no cuts from third-party platforms.' },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function PartnersPageClient() {
  return (
    <div className="pt-20">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-jungle-900 text-white overflow-hidden py-24 sm:py-32">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <m.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <span className="inline-block bg-sunset-500/20 text-sunset-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              For Indonesian Service Providers
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight mb-6">
              Offer Your Services.
              <br />
              <span className="text-sunset-400">Completely Free.</span>
            </h1>
            <p className="text-jungle-100/70 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
              Sunda Trips is a non-profit platform built for the people of Indonesia.
              Whether you drive, guide, organise trips or run a guesthouse — list your
              services and start receiving direct bookings with zero cost.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 bg-sunset-500 hover:bg-sunset-600 text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-sunset-500/30 active:scale-95"
              >
                Apply to join
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border-2 border-white/20 hover:border-white/50 text-white font-semibold px-8 py-4 rounded-full transition-all"
              >
                I already have an account
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      {/* ── Who is this for ──────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <m.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-jungle-800 mb-4">
              Who can join?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Sunda Trips is open to every local provider in Lombok, Bali and beyond.
            </p>
          </m.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PARTNER_TYPES.map((p, i) => (
              <m.div
                key={p.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
                className={`bg-white rounded-2xl border p-6 ${p.color}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${p.iconBg}`}>
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm leading-relaxed opacity-80 mb-4">{p.desc}</p>
                <ul className="space-y-1.5">
                  {p.perks.map(perk => (
                    <li key={perk} className="flex items-center gap-2 text-xs font-medium">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <m.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-jungle-800 mb-4">
              How it works
            </h2>
            <p className="text-gray-500 text-lg">From application to your first booking in 24 hours.</p>
          </m.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <m.div
                key={step.num}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="relative inline-flex mb-5">
                  <div className="w-16 h-16 bg-jungle-50 rounded-2xl flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-jungle-700" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-sunset-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl text-jungle-800 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <section className="py-20 bg-jungle-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <m.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Why Sunda Trips?
            </h2>
            <p className="text-jungle-100/60 text-lg max-w-lg mx-auto">
              Built by people who believe local providers deserve better than expensive platforms.
            </p>
          </m.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map((b, i) => (
              <m.div
                key={b.title}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-5"
              >
                <div className="w-11 h-11 bg-sunset-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-sunset-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1.5">{b.title}</h3>
                  <p className="text-jungle-100/60 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apply CTA ────────────────────────────────────────── */}
      <section id="apply" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <m.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            variants={fadeUp}
          >
            <div className="w-16 h-16 bg-jungle-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-7 h-7 text-jungle-700" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-jungle-800 mb-4">
              Ready to join?
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              Send us a message with your name, what you offer and where you're based.
              We'll set up your account and you can start listing your services the same day.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:hello@sundatrips.com?subject=Partner%20application&body=Hi%2C%20I%20would%20like%20to%20join%20Sunda%20Trips%20as%20a%20partner.%0A%0AName%3A%20%0AService%20type%3A%20%0ALocation%3A%20"
                className="inline-flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-jungle-800/25 active:scale-95"
              >
                Apply via email
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/message/sundatrips"
                className="inline-flex items-center gap-2 border-2 border-jungle-800 text-jungle-800 hover:bg-jungle-50 font-semibold px-8 py-4 rounded-full transition-all"
              >
                WhatsApp us
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-jungle-700 font-medium hover:underline">
                Sign in here
              </Link>
            </p>
          </m.div>
        </div>
      </section>

    </div>
  )
}

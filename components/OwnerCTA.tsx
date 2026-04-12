'use client'

import { m } from 'framer-motion'
import { ArrowRight, Zap, Check } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n'

const OWNER_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&q=80',
]

export default function OwnerCTA() {
  const { t } = useI18n()
  const oc = t.ownerCta

  return (
    <section id="owners" className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: content */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sunset-500 text-sm font-bold uppercase tracking-widest mb-3">{oc.eyebrow}</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-jungle-800 leading-tight">
              {oc.headline1}
              <br />
              {oc.headline2}
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">{oc.sub}</p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {oc.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-jungle-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-600 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 text-white font-semibold px-7 py-4 rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-jungle-800/25 active:scale-95"
              >
                {oc.apply}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 border-2 border-jungle-800 text-jungle-800 hover:bg-jungle-50 font-semibold px-7 py-4 rounded-full transition-all duration-200"
              >
                {oc.demo}
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {OWNER_AVATARS.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="Owner"
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-jungle-800">{oc.ownersCount}</span> {oc.joinedMonth}
              </p>
            </div>
          </m.div>

          {/* Right: dashboard mockup */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            {/* Main dashboard card */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-jungle-800/10 border border-gray-100 overflow-hidden">
              {/* Header bar */}
              <div className="bg-jungle-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <span className="text-white/70 text-xs font-mono">dashboard.sundatrips.com</span>
                <div />
              </div>

              <div className="p-6">
                {/* Greeting */}
                <div className="mb-6">
                  <p className="text-gray-400 text-xs uppercase tracking-widest">{oc.mockGreeting}</p>
                  <h3 className="text-xl font-bold text-jungle-800 font-display">Made Suardika</h3>
                </div>

                {/* Revenue cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: oc.mockGross,  value: 'Rp 2,840', color: 'text-jungle-800' },
                    { label: oc.mockFee,    value: 'Rp 28',    color: 'text-gray-400', sub: '1%' },
                    { label: oc.mockPayout, value: 'Rp 2,812', color: 'text-sunset-500', highlight: true },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-3 ${card.highlight ? 'bg-sunset-50 border border-sunset-200' : 'bg-gray-50'}`}
                    >
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                      <p className={`text-lg font-bold font-display ${card.color}`}>{card.value}</p>
                      {card.sub && <p className="text-[10px] text-gray-300">{card.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* POS recent items */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{oc.mockPosTitle}</p>
                    <span className="text-[10px] text-jungle-600 bg-jungle-50 px-2 py-0.5 rounded-full font-medium">
                      {oc.mockLive}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { item: 'Snorkeling Tour × 2', amount: 'Rp 48', time: '09:14' },
                      { item: 'Bintang Beer × 3',   amount: 'Rp 9',  time: '11:32' },
                      { item: 'Airport Transfer',    amount: 'Rp 22', time: '13:05' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-jungle-400 rounded-full" />
                          <span className="text-gray-600">{row.item}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">{row.time}</span>
                          <span className="font-semibold text-jungle-800">{row.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <m.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -top-4 -right-4 bg-sunset-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-sunset-500/30"
            >
              <Zap className="w-3.5 h-3.5 inline mr-1.5" />
              {oc.mobilePOS}
            </m.div>

            {/* Second floating badge */}
            <m.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-white border border-gray-100 shadow-lg text-xs font-semibold text-jungle-800 px-4 py-2 rounded-full"
            >
              <Zap className="w-3.5 h-3.5 inline mr-1 text-sunset-500" />
              {oc.realtimeSync}
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { m } from 'framer-motion'
import { ShieldCheck, Zap, HandCoins, MessageCircle, TrendingUp, Users } from 'lucide-react'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n'

const PILLAR_ICONS = [ShieldCheck, Zap, HandCoins, MessageCircle]
const PILLAR_COLORS = ['bg-jungle-800', 'bg-sunset-500', 'bg-amber-500', 'bg-blue-500']
const STAT_ICONS = [TrendingUp, Users, ShieldCheck]

const AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
]

export default function TrustSection() {
  const { t } = useI18n()
  const tr = t.trust

  return (
    <section className="py-24 bg-jungle-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-jungle-700/50 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sunset-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sunset-400 text-sm font-bold uppercase tracking-widest mb-3">{tr.eyebrow}</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white leading-tight">
            {tr.headline1}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sunset-400 to-amber-300">
              {tr.headline2}
            </span>
          </h2>
          <p className="mt-4 text-jungle-100/70 text-lg max-w-2xl mx-auto">{tr.sub}</p>
        </m.div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {tr.pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i]
            return (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300"
              >
                <div className={`w-11 h-11 ${PILLAR_COLORS[i]} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{pillar.title}</h3>
                <p className="text-jungle-100/60 text-sm leading-relaxed">{pillar.body}</p>
              </m.div>
            )
          })}
        </div>

        {/* Stats bar */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {tr.stats.map((stat, i) => {
              const Icon = STAT_ICONS[i]
              return (
                <div key={i} className={`flex items-center gap-4 ${i < 2 ? 'sm:border-r sm:border-white/10 sm:pr-8' : ''}`}>
                  <div className="w-12 h-12 bg-sunset-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-sunset-400" />
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-jungle-100/60 text-sm mt-0.5">{stat.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </m.div>

        {/* Testimonials strip */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          {tr.testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4"
            >
              <Image
                src={AVATARS[i]}
                alt={testimonial.name}
                width={44}
                height={44}
                className="rounded-full flex-shrink-0 object-cover"
              />
              <div>
                <p className="text-white/80 text-sm italic leading-relaxed">{testimonial.quote}</p>
                <p className="text-white font-semibold text-sm mt-3">{testimonial.name}</p>
                <p className="text-jungle-100/50 text-xs">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  )
}

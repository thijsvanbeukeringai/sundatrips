'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { Send, MapPin, Mail, Phone, MessageCircle, CheckCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface FormState {
  name: string
  email: string
  trip: string
  date: string
  groupSize: string
  message: string
}

export default function ContactSection() {
  const { t } = useI18n()
  const c = t.contact

  const [form, setForm] = useState<FormState>({
    name: '', email: '', trip: '', date: '', groupSize: '', message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  const contactDetails = [
    { icon: Mail,    label: c.emailLabel, value: 'hello@sundatrips.com',    href: 'mailto:hello@sundatrips.com' },
    { icon: Phone,   label: c.phoneLabel, value: '+62 812-3456-7890',       href: 'https://wa.me/6281234567890' },
    { icon: MapPin,  label: c.baseLabel,  value: 'Lombok & Bali, Indonesia', href: undefined },
  ]

  return (
    <section id="contact" className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-jungle-800/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sunset-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-16 items-start">
          {/* Left: info */}
          <m.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <p className="text-sunset-500 text-sm font-bold uppercase tracking-widest mb-3">{c.eyebrow}</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-jungle-800 leading-tight">
              {c.headline1}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-jungle-700 to-sunset-500">
                {c.headline2}
              </span>
            </h2>
            <p className="mt-5 text-gray-500 text-lg leading-relaxed">{c.sub}</p>

            {/* Contact details */}
            <div className="mt-10 space-y-5">
              {contactDetails.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white border border-gray-100 shadow-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 text-jungle-800" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="text-gray-700 font-medium hover:text-sunset-500 transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-gray-700 font-medium">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Response time badge */}
            <div className="mt-10 inline-flex items-center gap-2 bg-jungle-800/5 border border-jungle-800/10 px-4 py-3 rounded-xl">
              <MessageCircle className="w-4 h-4 text-jungle-700" />
              <span className="text-sm text-jungle-800 font-medium">
                {c.replyTime}<strong>{c.replyValue}</strong>
              </span>
            </div>
          </m.div>

          {/* Right: form */}
          <m.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/80 border border-gray-100 p-8 sm:p-10">
              {submitted ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center text-center gap-4"
                >
                  <div className="w-16 h-16 bg-jungle-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-jungle-700" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-jungle-800">
                    {c.successTitle}
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    {c.successSub.replace('{email}', form.email)}
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name:'', email:'', trip:'', date:'', groupSize:'', message:'' }) }}
                    className="mt-4 text-sm text-jungle-700 underline underline-offset-2"
                  >
                    {c.sendAnother}
                  </button>
                </m.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row 1: name + email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        {c.nameLabel}
                      </label>
                      <input
                        required
                        type="text"
                        placeholder={c.namePH}
                        value={form.name}
                        onChange={set('name')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        {c.emailLabel2}
                      </label>
                      <input
                        required
                        type="email"
                        placeholder={c.emailPH}
                        value={form.email}
                        onChange={set('email')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                      />
                    </div>
                  </div>

                  {/* Trip selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      {c.tripLabel}
                    </label>
                    <select
                      required
                      value={form.trip}
                      onChange={set('trip')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white appearance-none"
                    >
                      <option value="" disabled>{c.tripPH}</option>
                      {c.trips.map((trip, i) => (
                        <option key={i} value={trip}>{trip}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3: date + group size */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        {c.dateLabel}
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={set('date')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                        {c.sizeLabel}
                      </label>
                      <select
                        value={form.groupSize}
                        onChange={set('groupSize')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white"
                      >
                        <option value="">{c.sizePH}</option>
                        {c.groupSizes.map((s, i) => (
                          <option key={i} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      {c.messageLabel}
                    </label>
                    <textarea
                      rows={4}
                      placeholder={c.messagePH}
                      value={form.message}
                      onChange={set('message')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                        </svg>
                        {c.sending}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {c.submit}
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400">{c.disclaimer}</p>
                </form>
              )}
            </div>
          </m.div>
        </div>
      </div>
    </section>
  )
}

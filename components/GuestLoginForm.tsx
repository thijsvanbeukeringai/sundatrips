'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

export default function GuestLoginForm() {
  const { t } = useI18n()
  const mb = t.myBookings
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/my-bookings` },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <main className="pt-32 pb-24 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sm:p-10">
        <div className="flex items-center justify-center w-14 h-14 bg-jungle-50 rounded-2xl mb-6">
          <Mail className="w-7 h-7 text-jungle-700" />
        </div>

        {sent ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-jungle-600 mx-auto" />
            <h2 className="font-display text-2xl font-bold text-jungle-800">{mb.linkSent}</h2>
            <p className="text-gray-500 text-sm font-semibold">{email}</p>
            <p className="text-gray-400 text-sm">Click the link in the email to view your bookings.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-jungle-800 mb-2">{mb.loginTitle}</h1>
            <p className="text-gray-500 text-sm mb-8">{mb.loginSub}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {mb.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
                {loading ? mb.sending : mb.sendLink}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}

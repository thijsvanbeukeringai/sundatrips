'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Phone, CheckCircle } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    // 1. Set password + mark as onboarded in user metadata
    const { error: pwError } = await supabase.auth.updateUser({
      password,
      data: { onboarded: true },
    })
    if (pwError) { setError(pwError.message); setLoading(false); return }

    // 2. Update the profiles row
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const meta = user.user_metadata ?? {}
      const isCrew = meta.role === 'crew'

      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          ...(isCrew ? {
            role: 'crew',
            owner_id: meta.owner_id ?? null,
            crew_permissions: meta.crew_permissions ?? [],
          } : {}),
        })
        .eq('id', user.id)

      if (isCrew) {
        router.push('/dashboard')
        router.refresh()
        return
      }
    }

    router.push('/dashboard/properties')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-2xl shadow-jungle-900/30 p-8 sm:p-10">
        <div className="mb-8">
          <div className="w-12 h-12 bg-jungle-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-jungle-700" />
          </div>
          <h1 className="font-display text-3xl font-bold text-jungle-800">Welcome aboard!</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Set your password and complete your profile to access your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Your Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Made Suardika"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              WhatsApp / Phone <span className="text-gray-300 normal-case">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="+62 812-3456-7890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Set Password
            </label>
            <input
              type="password"
              required
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98] mt-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {loading ? 'Saving…' : 'Complete Setup & Go to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

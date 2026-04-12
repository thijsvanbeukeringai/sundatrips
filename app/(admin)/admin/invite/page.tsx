'use client'

import { useState } from 'react'
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface InviteResult {
  success: boolean
  email?: string
  error?: string
}

export default function InvitePage() {
  const [email, setEmail]             = useState('')
  const [fullName, setFullName]       = useState('')
  const [propertyName, setPropertyName] = useState('')
  const [role, setRole]               = useState<'owner' | 'partner'>('owner')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<InviteResult | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res  = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, propertyName, role }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)

    if (data.success) {
      setEmail('')
      setFullName('')
      setPropertyName('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-jungle-900 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-jungle-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display font-bold text-white">Admin — Invite Owner</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 bg-jungle-50 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-jungle-800" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-jungle-800">Invite a New Owner</h2>
                <p className="text-gray-400 text-xs mt-0.5">They'll receive a setup email from Supabase</p>
              </div>
            </div>

            {result && (
              <div className={`mb-5 flex items-start gap-3 text-sm px-4 py-3 rounded-xl ${
                result.success
                  ? 'bg-jungle-50 border border-jungle-200 text-jungle-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {result.success
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                }
                <span>
                  {result.success
                    ? `Invite sent to ${result.email}. They'll receive a setup link valid for 24 hours.`
                    : result.error}
                </span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Account type
                </label>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  {(['owner', 'partner'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-colors capitalize ${
                        role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {r === 'owner' ? 'Owner / Business' : 'Partner (driver / organizer)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {role === 'owner' ? "Owner's" : "Partner's"} Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="made@ombakbiru.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Made Suardika"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {role === 'owner' ? 'Property / Business Name' : 'Service / Company Name'}{' '}
                  <span className="text-gray-300 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ombak Biru Guesthouse"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {role === 'partner'
                    ? 'After signup you can link them to their service in the partner settings.'
                    : 'Pre-fills their property name during onboarding.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98]"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {loading ? 'Sending invite…' : `Invite ${role === 'partner' ? 'Partner' : 'Owner'}`}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-50">
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-gray-600">What happens next:</strong><br />
                The owner receives an email with a secure setup link. They click it, land on
                the onboarding page, set their password and complete their profile. Their
                account is immediately ready — no manual approval needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  getPartnerProfilesWithStatus,
  assignPartnerToProperty,
  resendPartnerInvite,
} from '@/app/actions/partner'
import { createClient } from '@/lib/supabase/client'
import { Users, Link2, CheckCircle, X, Loader2, Send, Clock } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Partner  = Awaited<ReturnType<typeof getPartnerProfilesWithStatus>>[number]
type Property = { id: string; name: string; type: string; partner_id: string | null }

export default function PartnersAdminPage() {
  const [partners,   setPartners]   = useState<Partner[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [saving,     setSaving]     = useState<string | null>(null)
  const [saved,      setSaved]      = useState<string | null>(null)
  const [resending,  setResending]  = useState<string | null>(null)
  const [resentOk,   setResentOk]   = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [partnerData, { data: propData }] = await Promise.all([
        getPartnerProfilesWithStatus(),
        supabase
          .from('properties')
          .select('id, name, type, partner_id')
          .in('type', ['trip', 'activity', 'transfer'])
          .eq('is_active', true)
          .order('name'),
      ])
      setPartners(partnerData)
      setProperties(propData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAssign(propertyId: string, partnerId: string | null) {
    setSaving(propertyId)
    await assignPartnerToProperty(propertyId, partnerId)
    setProperties(prev => prev.map(p =>
      p.id === propertyId ? { ...p, partner_id: partnerId } : p
    ))
    setSaved(propertyId)
    setSaving(null)
    setTimeout(() => setSaved(null), 2000)
  }

  async function handleResend(email: string, fullName: string) {
    setResending(email)
    const result = await resendPartnerInvite(email, fullName)
    setResending(null)
    if (!result.error) {
      setResentOk(email)
      setTimeout(() => setResentOk(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assign drivers and organizers to their services</p>
        </div>
      </div>

      {/* Partners */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-jungle-600" />
            <h2 className="font-semibold text-gray-900">Partners ({partners.length})</h2>
          </div>
          <Link
            href="/admin/invite"
            className="flex items-center gap-1.5 text-xs font-semibold bg-jungle-800 text-white px-3 py-1.5 rounded-lg hover:bg-jungle-900 transition-colors"
          >
            <Send className="w-3 h-3" />
            Invite partner
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No partner accounts yet.{' '}
            <Link href="/admin/invite" className="text-jungle-700 underline">Invite a partner →</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {partners.map(p => {
              const assignedProperties = properties.filter(prop => prop.partner_id === p.id)
              const isResent = resentOk === p.email
              const isSending = resending === p.email

              return (
                <div key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{p.full_name}</p>
                        {p.onboarded ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold bg-jungle-50 text-jungle-700 border border-jungle-200 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending invite
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{p.email}{p.phone ? ` · ${p.phone}` : ''}</p>
                    </div>

                    {/* Resend button — only for pending */}
                    {!p.onboarded && (
                      <button
                        onClick={() => handleResend(p.email, p.full_name)}
                        disabled={isSending || isResent}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-jungle-400 hover:text-jungle-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
                        {isSending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isResent ? (
                          <CheckCircle className="w-3 h-3 text-jungle-500" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        {isResent ? 'Sent!' : isSending ? 'Sending…' : 'Resend link'}
                      </button>
                    )}
                  </div>

                  {assignedProperties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {assignedProperties.map(prop => (
                        <span key={prop.id} className="flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                          {prop.name}
                          <button
                            onClick={() => handleAssign(prop.id, null)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-jungle-600" />
          <h2 className="font-semibold text-gray-900">Assign partners to services</h2>
        </div>

        {properties.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No trips, activities or transfers found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {properties.map(prop => (
              <div key={prop.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{prop.name}</p>
                  <p className="text-[11px] text-gray-400 capitalize mt-0.5">{prop.type}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={prop.partner_id ?? ''}
                    onChange={e => handleAssign(prop.id, e.target.value || null)}
                    disabled={saving === prop.id}
                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-jungle-500 transition bg-white"
                  >
                    <option value="">— No partner —</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>

                  {saving === prop.id && <Loader2 className="w-4 h-4 animate-spin text-gray-300" />}
                  {saved === prop.id && <CheckCircle className="w-4 h-4 text-jungle-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

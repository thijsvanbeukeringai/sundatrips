'use client'

import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { updatePartnerProfile } from '@/app/actions/profile'
import { getPartnerOwnedServices, togglePartnerServiceActive } from '@/app/actions/partner'
import { Camera, Loader2, CheckCircle, Save, Globe, Eye, EyeOff } from 'lucide-react'
import type { Profile, Property } from '@/lib/types'

const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition bg-white'
const labelClass = 'block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5'
const selectClass = inputClass + ' bg-white'

const LANGUAGES = ['English', 'Indonesian', 'Dutch', 'German', 'French', 'Japanese', 'Chinese', 'Korean', 'Spanish']
const ISLANDS = ['Lombok', 'Bali', 'Gili Islands']

export default function PartnerSettingsPage() {
  const { t } = useI18n()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyLocation, setCompanyLocation] = useState('')
  const [companyIsland, setCompanyIsland] = useState('')
  const [languages, setLanguages] = useState<string[]>([])

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (p) {
        setProfile(p)
        setFullName(p.full_name ?? '')
        setPhone(p.phone ?? '')
        setCompanyName(p.company_name ?? '')
        setCompanyDescription(p.company_description ?? '')
        setCompanyLogo(p.company_logo ?? '')
        setCompanyLocation(p.company_location ?? '')
        setCompanyIsland(p.company_island ?? '')
        setLanguages(p.languages ?? [])
      }

      const svc = await getPartnerOwnedServices()
      setServices(svc)
      setLoading(false)
    }
    load()
  }, [])

  async function resizeImage(file: File, targetSize = 800): Promise<Blob> {
    const bitmap = await createImageBitmap(file)
    const scale = Math.max(1, targetSize / Math.min(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * Math.min(scale, targetSize / bitmap.width))
    const h = Math.round(bitmap.height * Math.min(scale, targetSize / bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(w, targetSize)
    canvas.height = Math.max(h, targetSize)

    // Center the image if it's smaller than target
    const ctx = canvas.getContext('2d')!
    const offsetX = (canvas.width - w) / 2
    const offsetY = (canvas.height - h) / 2
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, offsetX, offsetY, w, h)
    bitmap.close()

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.92))
    return blob ?? file
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    // Resize to at least 800x800 while keeping quality
    let uploadBlob: Blob
    try {
      uploadBlob = await resizeImage(file, 800)
    } catch {
      uploadBlob = file
    }

    const path = `${user.id}/company-logo.jpg`

    const { error } = await supabase.storage
      .from('images')
      .upload(path, uploadBlob, { upsert: true, contentType: 'image/jpeg' })

    if (error) {
      console.error('[logo upload]', error.message)
      alert(`Upload failed: ${error.message}`)
    } else {
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
      setCompanyLogo(publicUrl + '?t=' + Date.now())
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePartnerProfile({
        full_name: fullName,
        phone,
        company_name: companyName,
        company_description: companyDescription,
        company_logo: companyLogo,
        company_location: companyLocation,
        company_island: companyIsland,
        languages,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  async function handleToggleService(id: string, currentActive: boolean) {
    await togglePartnerServiceActive(id, !currentActive)
    setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentActive } : s))
  }

  function toggleLanguage(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
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
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and company details</p>
      </div>

      {/* Company logo */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Company photo</p>
        <div className="flex items-center gap-5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 hover:border-jungle-300 transition-colors flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6 text-gray-300" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-jungle-600" />
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <div>
            <p className="text-sm font-semibold text-gray-700">Upload your company photo</p>
            <p className="text-xs text-gray-400 mt-0.5">This will be shown on your public profile and listing cards</p>
          </div>
        </div>
      </div>

      {/* Online / Offline toggle per service */}
      {services.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Services visibility</p>
          <div className="space-y-3">
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.is_active ? 'Online — visible on homepage' : 'Offline — hidden from homepage'}</p>
                </div>
                <button
                  onClick={() => handleToggleService(s.id, s.is_active)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                    s.is_active
                      ? 'bg-jungle-50 text-jungle-700 border border-jungle-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {s.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {s.is_active ? 'Online' : 'Offline'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Personal details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone / WhatsApp</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62 812 345 678" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={profile?.email ?? ''} disabled className={inputClass + ' bg-gray-50 text-gray-400'} />
        </div>
      </div>

      {/* Company details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Company details</p>
        <div>
          <label className={labelClass}>Company / Service name</label>
          <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Made's Transport Service" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={3} value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} placeholder="Tell customers about your service…" className={inputClass + ' resize-none'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Location</label>
            <input type="text" value={companyLocation} onChange={e => setCompanyLocation(e.target.value)} placeholder="Kuta, Lombok" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Island</label>
            <select value={companyIsland} onChange={e => setCompanyIsland(e.target.value)} className={selectClass}>
              <option value="">Select island…</option>
              {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          <Globe className="inline w-3 h-3 mr-1" />
          Languages spoken
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                languages.includes(lang)
                  ? 'bg-jungle-100 text-jungle-800 border border-jungle-200'
                  : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-jungle-800/25 active:scale-[0.98]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

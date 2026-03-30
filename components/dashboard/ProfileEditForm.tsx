'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Check, Save, Pencil, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function ProfileEditForm({
  fullName,
  email,
  phone,
  role,
}: {
  fullName: string
  email:    string
  phone:    string | null
  role:     string
}) {
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(fullName)
  const [phoneVal, setPhoneVal] = useState(phone ?? '')
  const [saved, setSaved]       = useState(false)
  const [pending, startTransition] = useTransition()
  const { t } = useI18n()
  const s = t.settings

  function cancel() {
    setName(fullName)
    setPhoneVal(phone ?? '')
    setEditing(false)
  }

  function save() {
    startTransition(async () => {
      await updateProfile({ full_name: name, phone: phoneVal })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{s.fullName}</p>
          {editing ? (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
            />
          ) : (
            <p className="font-medium text-gray-800 text-sm py-2">{name || '—'}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{s.email}</p>
          <p className="font-medium text-gray-800 text-sm py-2">{email}</p>
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{s.phone}</p>
          {editing ? (
            <input type="tel" value={phoneVal} onChange={e => setPhoneVal(e.target.value)}
              placeholder="+62 812 3456 7890"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jungle-500 focus:border-transparent"
            />
          ) : (
            <p className="font-medium text-gray-800 text-sm py-2">{phoneVal || <span className="text-gray-400 italic">{s.notSet}</span>}</p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{s.role}</p>
          <p className="font-medium text-gray-800 text-sm capitalize py-2">{role}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />{s.editProfile}
          </button>
        ) : (
          <>
            <button onClick={save} disabled={pending || !name.trim()}
              className="flex items-center gap-2 bg-jungle-700 hover:bg-jungle-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {pending ? s.saving : saved ? s.saved : s.save}
            </button>
            <button onClick={cancel} disabled={pending}
              className="flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />{s.cancel}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Users, Plus, Trash2, Mail, X, Check, Loader2 } from 'lucide-react'
import type { CrewPermission } from '@/lib/types'
import { inviteCrewMember, updateCrewPermissions, removeCrewMember } from '@/app/actions/crew'

const PERMISSIONS: { key: CrewPermission; label: string; desc: string }[] = [
  { key: 'view_bookings',   label: 'View bookings',          desc: 'See the booking list and booking details' },
  { key: 'check_in_guests', label: 'Check in / out guests',  desc: 'Change booking status' },
  { key: 'manage_pos',      label: 'Use POS terminal',       desc: 'Open bills, add and remove items' },
  { key: 'view_financials', label: 'View financials',        desc: 'See amounts, payouts, and totals' },
  { key: 'manage_catalog',  label: 'Edit POS catalog',       desc: 'Add and update menu items' },
]

interface CrewMember {
  id: string
  full_name: string
  email: string
  crew_permissions: CrewPermission[]
  created_at: string
}

export default function TeamPanel({ initialCrew }: { initialCrew: CrewMember[] }) {
  const [crew, setCrew]         = useState<CrewMember[]>(initialCrew)
  const [showInvite, setShowInvite] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Invite form state
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [perms, setPerms]     = useState<CrewPermission[]>([])
  const [invPending, startInv] = useTransition()
  const [invError, setInvError] = useState<string | null>(null)
  const [invSuccess, setInvSuccess] = useState(false)

  function togglePerm(p: CrewPermission) {
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function handleInvite() {
    setInvError(null)
    startInv(async () => {
      const res = await inviteCrewMember({ email, fullName: name, permissions: perms })
      if (res?.error) {
        setInvError(res.error)
      } else {
        setInvSuccess(true)
        setTimeout(() => {
          setInvSuccess(false)
          setShowInvite(false)
          setEmail(''); setName(''); setPerms([])
        }, 2000)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-jungle-50 rounded-xl flex items-center justify-center">
            <Users className="w-4 h-4 text-jungle-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Team</h2>
            <p className="text-xs text-gray-400">{crew.length} crew member{crew.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => { setShowInvite(v => !v); setInvError(null) }}
          className="flex items-center gap-1.5 text-sm font-semibold bg-jungle-800 hover:bg-jungle-900 text-white px-4 py-2 rounded-xl transition-colors"
        >
          {showInvite ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showInvite ? 'Cancel' : 'Invite crew member'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700">New crew member</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Made Suardika"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="made@example.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Permissions</p>
            <div className="space-y-2">
              {PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => togglePerm(p.key)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                      perms.includes(p.key)
                        ? 'bg-jungle-800 border-jungle-800'
                        : 'border-gray-300 group-hover:border-jungle-600'
                    }`}
                  >
                    {perms.includes(p.key) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div onClick={() => togglePerm(p.key)}>
                    <p className="text-sm font-medium text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-400">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {invError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{invError}</p>
          )}

          <button
            onClick={handleInvite}
            disabled={invPending || !email || !name || perms.length === 0}
            className="flex items-center gap-2 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {invPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending invite…</>
            ) : invSuccess ? (
              <><Check className="w-4 h-4" /> Invite sent!</>
            ) : (
              <><Mail className="w-4 h-4" /> Send invite</>
            )}
          </button>
        </div>
      )}

      {/* Crew list */}
      {crew.length === 0 && !showInvite && (
        <p className="text-sm text-gray-400 text-center py-4">
          No crew members yet. Invite your first team member above.
        </p>
      )}

      <div className="space-y-3">
        {crew.map(member => (
          <CrewCard
            key={member.id}
            member={member}
            expanded={expandedId === member.id}
            onToggleExpand={() => setExpandedId(expandedId === member.id ? null : member.id)}
            onUpdated={updated => setCrew(prev => prev.map(m => m.id === updated.id ? updated : m))}
            onRemoved={id => setCrew(prev => prev.filter(m => m.id !== id))}
          />
        ))}
      </div>
    </div>
  )
}

function CrewCard({
  member,
  expanded,
  onToggleExpand,
  onUpdated,
  onRemoved,
}: {
  member: CrewMember
  expanded: boolean
  onToggleExpand: () => void
  onUpdated: (m: CrewMember) => void
  onRemoved: (id: string) => void
}) {
  const [perms, setPerms]       = useState<CrewPermission[]>(member.crew_permissions)
  const [pending, startT]       = useTransition()
  const [removePending, startR] = useTransition()
  const [saved, setSaved]       = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  function togglePerm(p: CrewPermission) {
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
    setSaved(false)
  }

  function handleSave() {
    startT(async () => {
      const res = await updateCrewPermissions(member.id, perms)
      if (!res?.error) {
        setSaved(true)
        onUpdated({ ...member, crew_permissions: perms })
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function handleRemove() {
    startR(async () => {
      const res = await removeCrewMember(member.id)
      if (!res?.error) onRemoved(member.id)
    })
  }

  const activePermLabels = PERMISSIONS.filter(p => member.crew_permissions.includes(p.key)).map(p => p.label)

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="w-9 h-9 rounded-full bg-jungle-100 flex items-center justify-center text-jungle-800 font-bold text-sm flex-shrink-0">
          {member.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name}</p>
          <p className="text-xs text-gray-400 truncate">{member.email}</p>
          {!expanded && activePermLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {activePermLabels.slice(0, 3).map(l => (
                <span key={l} className="text-[10px] bg-jungle-50 text-jungle-700 font-semibold px-2 py-0.5 rounded-full">{l}</span>
              ))}
              {activePermLabels.length > 3 && (
                <span className="text-[10px] text-gray-400">+{activePermLabels.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded permissions editor */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Permissions</p>
          <div className="space-y-2">
            {PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => togglePerm(p.key)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    perms.includes(p.key)
                      ? 'bg-jungle-800 border-jungle-800'
                      : 'border-gray-300 group-hover:border-jungle-600'
                  }`}
                >
                  {perms.includes(p.key) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div onClick={() => togglePerm(p.key)}>
                  <p className="text-sm font-medium text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {confirmRemove ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Remove this crew member?</span>
                <button
                  onClick={handleRemove}
                  disabled={removePending}
                  className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {removePending ? 'Removing…' : 'Yes, remove'}
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemove(true)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={pending}
              className="flex items-center gap-1.5 text-sm font-semibold bg-jungle-800 hover:bg-jungle-900 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
            >
              {saved ? (
                <><Check className="w-3.5 h-3.5" /> Saved</>
              ) : pending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                'Save permissions'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

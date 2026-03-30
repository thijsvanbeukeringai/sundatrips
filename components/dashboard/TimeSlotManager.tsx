'use client'

import { useState, useTransition } from 'react'
import { addTimeSlot, removeTimeSlot, toggleTimeSlot, updateTimeSlotDays } from '@/app/actions/timeslots'
import { Clock, Plus, Trash2, X } from 'lucide-react'
import type { TimeSlot } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  propertyId:    string
  slots:         TimeSlot[]
  durationHours: number | null
}

// ISO weekday: 1 = Monday … 7 = Sunday
const DAY_ISOS = [1, 2, 3, 4, 5, 6, 7]

function endTime(start: string, hours: number | null): string {
  if (!hours) return ''
  const [h, m] = start.split(':').map(Number)
  const tot = h * 60 + m + Math.round(hours * 60)
  return ` – ${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

export default function TimeSlotManager({ propertyId, slots, durationHours }: Props) {
  const { t } = useI18n()
  const ts = t.timeslot
  // calendar.days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const DAYS = DAY_ISOS.map((iso, i) => ({ iso, label: t.calendar.days[i] }))

  const [newTime, setNewTime]      = useState('')
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const sorted = [...slots].sort((a, b) => a.sort_order - b.sort_order)

  function handleAdd() {
    if (!newTime) return
    if (slots.some(s => s.start_time === newTime)) {
      setError(ts.alreadyExists)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await addTimeSlot(propertyId, newTime)
      if (res?.error) setError(res.error)
      else setNewTime('')
    })
  }

  function handleToggleDay(slot: TimeSlot, iso: number) {
    const next = slot.days_of_week.includes(iso)
      ? slot.days_of_week.filter(d => d !== iso)
      : [...slot.days_of_week, iso].sort()
    startTransition(() => { void updateTimeSlotDays(slot.id, propertyId, next) })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Clock className="w-4 h-4 text-jungle-600" />
        <h3 className="font-semibold text-gray-800">{ts.weeklySchedule}</h3>
        {durationHours && (
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
            {durationHours}{ts.perSlot}
          </span>
        )}
      </div>

      {!durationHours && (
        <div className="mx-5 mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {ts.setDuration}
        </div>
      )}

      {/* Grid */}
      {sorted.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-400 w-36">
                  {ts.time}
                </th>
                {DAYS.map(d => (
                  <th key={d.iso} className="text-center py-3 text-xs font-bold uppercase tracking-wider text-gray-400 w-12">
                    {d.label}
                  </th>
                ))}
                <th className="px-5 py-3 w-28">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{ts.status}</span>
                </th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(slot => (
                <tr key={slot.id} className={`border-b border-gray-50 last:border-0 ${!slot.is_active ? 'opacity-45' : ''}`}>
                  {/* Time */}
                  <td className="px-5 py-3">
                    <span className="font-semibold text-gray-800">{slot.start_time}</span>
                    {durationHours && (
                      <span className="text-xs text-gray-400 block leading-tight">
                        {endTime(slot.start_time, durationHours).replace(' – ', t.listing.until + ' ')}
                      </span>
                    )}
                  </td>

                  {/* Day toggles */}
                  {DAYS.map(d => {
                    const active = slot.days_of_week.includes(d.iso)
                    return (
                      <td key={d.iso} className="text-center py-3">
                        <button
                          disabled={pending}
                          onClick={() => handleToggleDay(slot, d.iso)}
                          className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center transition-all disabled:opacity-40
                            ${active
                              ? 'bg-jungle-800 text-white hover:bg-jungle-700'
                              : 'bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500'
                            }`}
                        >
                          {active ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.5 3L6 10.5 2.5 7 1 8.5l5 5 9-9z"/>
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">–</span>
                          )}
                        </button>
                      </td>
                    )
                  })}

                  {/* Active toggle */}
                  <td className="px-5 py-3">
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => { void toggleTimeSlot(slot.id, propertyId, !slot.is_active) })}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-40
                        ${slot.is_active
                          ? 'bg-jungle-600 text-white hover:bg-jungle-700'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                    >
                      {slot.is_active ? ts.active : ts.inactive}
                    </button>
                  </td>

                  {/* Remove */}
                  <td className="pr-3 py-3">
                    <button
                      disabled={pending}
                      onClick={() => startTransition(() => { void removeTimeSlot(slot.id, propertyId) })}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-6 text-sm text-gray-400">{ts.noSlots}</p>
      )}

      {/* Add row */}
      <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
        <input
          type="time"
          value={newTime}
          onChange={e => { setNewTime(e.target.value); setError(null) }}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition"
        />
        <button
          disabled={pending || !newTime}
          onClick={handleAdd}
          className="flex items-center gap-1.5 bg-jungle-800 hover:bg-jungle-900 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {ts.addSlot}
        </button>
        {error && (
          <span className="flex items-center gap-1.5 text-xs text-red-600">
            <X className="w-3.5 h-3.5" /> {error}
          </span>
        )}
      </div>

      <p className="px-5 pb-4 text-[11px] text-gray-400">
        {ts.toggleHint}
      </p>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { setAvailability, clearAvailability, setSlotAvailability, clearSlotAvailability } from '@/app/actions/availability'
import type { Property, AvailabilityBlock, TimeSlot, SlotAvailability } from '@/lib/types'
import { ChevronLeft, ChevronRight, X, Lock, Unlock, Users, Clock } from 'lucide-react'

interface BookingSummary {
  id:           string
  check_in:     string
  check_out:    string | null
  guests_count: number
  guest_name:   string
  status:       string
}

interface Props {
  property:         Property
  bookings:         BookingSummary[]
  blocks:           AvailabilityBlock[]
  slots?:           TimeSlot[]
  slotAvailability?: SlotAvailability[]
}

function isoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function dateRange(start: string, end: string | null): string[] {
  if (!end) return [start]
  const dates: string[] = []
  let current = new Date(start)
  const last  = new Date(end)
  while (current < last) {
    dates.push(isoDate(current))
    current = addDays(current, 1)
  }
  return dates
}

function endTime(start: string, hours: number | null): string {
  if (!hours) return ''
  const [h, m] = start.split(':').map(Number)
  const tot = h * 60 + m + Math.round(hours * 60)
  return `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

export default function AvailabilityCalendar({ property, bookings, blocks, slots = [], slotAvailability = [] }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Build lookup maps
  const bookedDates = new Map<string, BookingSummary[]>()
  for (const b of bookings) {
    for (const d of dateRange(b.check_in, b.check_out)) {
      bookedDates.set(d, [...(bookedDates.get(d) ?? []), b])
    }
  }

  const blockMap = new Map<string, AvailabilityBlock>()
  for (const bl of blocks) blockMap.set(bl.date, bl)

  // slotAvailMap: `${slotId}|${date}` → available_spots
  const slotAvailMap = new Map<string, number>()
  for (const sa of slotAvailability) slotAvailMap.set(`${sa.time_slot_id}|${sa.date}`, sa.available_spots)

  const isActivityType = property.type === 'activity' || property.type === 'trip'
  const hasTimeSlots   = isActivityType && slots.length > 0

  // Calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7  // Mon=0
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1
    cells.push(dayNum >= 1 && dayNum <= lastDay.getDate() ? new Date(year, month, dayNum) : null)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectedBookings = selected ? (bookedDates.get(selected) ?? []) : []
  const selectedBlock    = selected ? blockMap.get(selected) : undefined

  function handleBlock() {
    if (!selected) return
    startTransition(async () => {
      if (selectedBlock?.is_blocked) {
        await clearAvailability(property.id, selected)
      } else {
        await setAvailability(property.id, selected, { is_blocked: true })
      }
    })
  }

  function handleSetSpots(spots: number) {
    if (!selected) return
    startTransition(() => setAvailability(property.id, selected, { available_spots: spots }))
  }

  // Available spots for a date
  function availableSpots(dateStr: string): number | null {
    if (!property.max_capacity) return null
    const block = blockMap.get(dateStr)
    if (block?.is_blocked) return 0
    const capacity = block?.available_spots ?? property.max_capacity
    const booked = (bookedDates.get(dateStr) ?? []).reduce((s, b) => s + b.guests_count, 0)
    return Math.max(0, capacity - booked)
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h2 className="font-semibold text-gray-800">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="h-14 border-b border-r border-gray-50 last:border-r-0" />

            const dateStr  = isoDate(date)
            const isPast   = date < today
            const isToday  = isoDate(date) === isoDate(today)
            const isSelected = selected === dateStr
            const block    = blockMap.get(dateStr)
            const bkgs     = bookedDates.get(dateStr) ?? []
            const spots    = availableSpots(dateStr)
            const isBlocked = block?.is_blocked
            const isFullyBooked = spots === 0 && !isBlocked
            const hasBookings   = bkgs.length > 0

            return (
              <button
                key={dateStr}
                onClick={() => setSelected(isSelected ? null : dateStr)}
                className={`relative h-14 border-b border-r border-gray-50 last:border-r-0 flex flex-col items-center justify-start pt-1.5 transition-colors text-left px-1
                  ${isSelected ? 'bg-jungle-800' : isBlocked ? 'bg-red-50' : hasBookings ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  ${isPast ? 'opacity-50' : ''}
                `}
              >
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                  ${isSelected ? 'bg-white text-jungle-800' : isToday ? 'bg-jungle-800 text-white' : 'text-gray-700'}
                `}>
                  {date.getDate()}
                </span>

                {isBlocked && (
                  <span className="text-[9px] font-bold text-red-500 mt-0.5">Blocked</span>
                )}
                {hasBookings && !isBlocked && (
                  <span className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-white/70' : 'text-blue-600'}`}>
                    {bkgs.reduce((s, b) => s + b.guests_count, 0)} guests
                  </span>
                )}
                {spots !== null && !isBlocked && property.max_capacity && (
                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/50' : spots === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {spots}/{property.max_capacity}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 inline-block" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Blocked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-jungle-800 inline-block" /> Today</span>
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:w-72 bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
        {!selected ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">Click a day to manage availability</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800">
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })}
              </p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bookings on this day */}
            {selectedBookings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Bookings</p>
                {selectedBookings.map(b => (
                  <div key={b.id} className="bg-blue-50 rounded-xl px-3 py-2.5">
                    <p className="text-sm font-semibold text-blue-800">{b.guest_name}</p>
                    <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> {b.guests_count} guests
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Available spots — per time slot for activities, per day for stays */}
            {property.max_capacity && hasTimeSlots ? (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Spots per Time Slot</p>
                {slots.map(slot => {
                  const key       = `${slot.id}|${selected}`
                  const current   = slotAvailMap.has(key) ? slotAvailMap.get(key)! : property.max_capacity!
                  const end       = endTime(slot.start_time, property.duration_hours)
                  const isFull    = current === 0

                  return (
                    <div key={slot.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">
                          {slot.start_time}{end ? ` – ${end}` : ''}
                        </span>
                        {isFull && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full ml-auto">
                            Full
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {Array.from({ length: property.max_capacity! + 1 }, (_, i) => i).map(n => (
                          <button
                            key={n}
                            disabled={pending}
                            onClick={() => {
                              const isDefault = n === property.max_capacity && !slotAvailMap.has(key)
                              if (isDefault) return
                              startTransition(() =>
                                n === property.max_capacity && slotAvailMap.has(key)
                                  ? clearSlotAvailability(property.id, slot.id, selected)
                                  : setSlotAvailability(property.id, slot.id, selected, n)
                              )
                            }}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all disabled:opacity-50
                              ${current === n ? 'bg-jungle-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                              ${n === 0 && current !== n ? 'text-red-400' : ''}
                            `}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <p className="text-[11px] text-gray-400">0 = fully booked for that slot</p>
              </div>
            ) : property.max_capacity ? (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Spots</p>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: property.max_capacity + 1 }, (_, i) => i).map(n => {
                    const block = blockMap.get(selected)
                    const current = block?.available_spots ?? property.max_capacity!
                    const isActive = !block?.is_blocked && current === n
                    return (
                      <button
                        key={n}
                        disabled={pending}
                        onClick={() => handleSetSpots(n)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all disabled:opacity-50
                          ${isActive ? 'bg-jungle-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                          ${n === 0 ? 'text-red-500' : ''}
                        `}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-gray-400">0 = fully booked for this date</p>
              </div>
            ) : null}

            {/* Block toggle */}
            <button
              disabled={pending}
              onClick={handleBlock}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50
                ${selectedBlock?.is_blocked
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {selectedBlock?.is_blocked
                ? <><Unlock className="w-4 h-4" /> Unblock this date</>
                : <><Lock className="w-4 h-4" /> Block this date</>
              }
            </button>

            {selectedBlock?.is_blocked && (
              <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600">
                This date is blocked — guests cannot book.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

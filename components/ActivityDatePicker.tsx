'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'
import type { AvailabilityBlock, TimeSlot, SlotAvailability } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  blocks:            AvailabilityBlock[]
  slots:             TimeSlot[]
  durationHours:     number | null
  maxCapacity:       number | null
  slotAvailability?: SlotAvailability[]
  onBook?:           (date: string) => void
}

function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

function endTime(start: string, hours: number | null): string {
  if (!hours) return ''
  const [h, m] = start.split(':').map(Number)
  const tot = h * 60 + m + Math.round(hours * 60)
  return `${String(Math.floor(tot / 60) % 24).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`
}

export default function ActivityDatePicker({ blocks, slots, durationHours, maxCapacity, slotAvailability = [], onBook }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const { t, lang } = useI18n()
  const MONTHS = t.calendar.months
  const DAYS   = t.calendar.days

  const [year,     setYear]     = useState(today.getFullYear())
  const [month,    setMonth]    = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [pickedSlot, setPickedSlot] = useState<string | null>(null)

  const blockMap = new Map<string, AvailabilityBlock>()
  for (const b of blocks) blockMap.set(b.date, b)

  // slotAvailMap: `${slotId}|${date}` → available_spots
  const slotAvailMap = new Map<string, number>()
  for (const sa of slotAvailability) slotAvailMap.set(`${sa.time_slot_id}|${sa.date}`, sa.available_spots)

  function isSlotFullyBooked(slotId: string, date: string): boolean {
    const key = `${slotId}|${date}`
    if (!slotAvailMap.has(key)) return false
    return slotAvailMap.get(key)! === 0
  }

  function slotSpotsLeft(slotId: string, date: string): number {
    const key = `${slotId}|${date}`
    if (!slotAvailMap.has(key)) return maxCapacity ?? 99
    return slotAvailMap.get(key)!
  }

  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startDow   = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = i - startDow + 1
    cells.push(d >= 1 && d <= lastDay.getDate() ? new Date(year, month, d) : null)
  }

  function prevMonth() { month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1) }
  function nextMonth() { month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1) }

  function isDateBlocked(dateStr: string) {
    const b = blockMap.get(dateStr)
    if (!b) return false
    if (b.is_blocked) return true
    if (maxCapacity && b.available_spots === 0) return true
    return false
  }

  function handleDateClick(dateStr: string) {
    if (selected === dateStr) { setSelected(null); setPickedSlot(null) }
    else { setSelected(dateStr); setPickedSlot(null) }
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={prevMonth}
            disabled={year === today.getFullYear() && month === today.getMonth()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h3 className="font-semibold text-gray-800">{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="h-12 border-b border-r border-gray-50 last:border-r-0" />
            const dateStr   = isoDate(date)
            const isPast    = date < today
            const isToday   = dateStr === isoDate(today)
            const isBlocked  = isDateBlocked(dateStr)
            const isSel      = selected === dateStr
            const dow        = ((date.getDay() + 6) % 7) + 1  // 1=Mon…7=Sun
            const hasSlots   = slots.some(s => s.days_of_week?.includes(dow) !== false)
            const unavailable = isBlocked || (!hasSlots && slots.length > 0)

            return (
              <button
                key={dateStr}
                disabled={isPast || unavailable}
                onClick={() => handleDateClick(dateStr)}
                className={`relative h-12 border-b border-r border-gray-50 last:border-r-0 flex flex-col items-center justify-center gap-0.5 transition-colors
                  ${isPast || unavailable ? 'opacity-30 cursor-not-allowed' : 'hover:bg-jungle-50 cursor-pointer'}
                  ${isSel ? 'bg-jungle-800' : ''}
                `}
              >
                <span className={`text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full
                  ${isSel ? 'text-white' : isToday ? 'bg-jungle-800 text-white' : 'text-gray-700'}
                `}>
                  {date.getDate()}
                </span>
                {!isPast && !unavailable && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white/60' : 'bg-emerald-400'}`} />
                )}
                {!isPast && unavailable && (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slot picker — appears when a date is selected */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <div>
            <p className="font-semibold text-gray-800">
              {new Date(selected + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{t.listing.chooseSlot}</p>
          </div>

          {(() => {
            // ISO weekday for the selected date (1=Mon … 7=Sun)
            const dow = ((new Date(selected + 'T12:00:00').getDay() + 6) % 7) + 1
            const slotsForDay = slots.filter(s => s.days_of_week?.includes(dow) !== false)
            if (slotsForDay.length === 0) {
              return <p className="text-sm text-gray-400 py-2">{t.listing.noSlotsDay}</p>
            }
            return null
          })()}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.filter(s => {
              const dow = ((new Date(selected + 'T12:00:00').getDay() + 6) % 7) + 1
              return s.days_of_week?.includes(dow) !== false
            }).map(slot => {
              const end      = endTime(slot.start_time, durationHours)
              const isPicked = pickedSlot === slot.id
              const isFull   = isSlotFullyBooked(slot.id, selected)
              const spots    = slotSpotsLeft(slot.id, selected)
              return (
                <button
                  key={slot.id}
                  disabled={isFull}
                  onClick={() => setPickedSlot(isPicked ? null : slot.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                    ${isFull
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : isPicked
                        ? 'border-jungle-800 bg-jungle-800 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-jungle-400 hover:bg-jungle-50'
                    }
                  `}
                >
                  <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isFull ? 'text-gray-300' : isPicked ? 'text-white/70' : 'text-gray-400'}`} />
                  <span className="flex-1">
                    {slot.start_time}
                    {end && <span className={`block text-xs font-normal ${isFull ? 'text-gray-300' : isPicked ? 'text-white/70' : 'text-gray-400'}`}>{t.listing.until} {end}</span>}
                    {isFull && <span className="block text-[10px] font-bold text-red-400">{t.listing.fullyBooked}</span>}
                    {!isFull && spots < (maxCapacity ?? 99) && spots > 0 && (
                      <span className={`block text-[10px] font-normal ${isPicked ? 'text-white/60' : 'text-amber-500'}`}>{spots} {t.listing.spotsLeft}</span>
                    )}
                  </span>
                  {isPicked && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {pickedSlot && (
            <button
              type="button"
              onClick={() => onBook?.(selected!)}
              className="block w-full bg-jungle-800 hover:bg-jungle-900 text-white font-semibold py-3.5 rounded-xl text-center transition-colors"
            >
              {t.listing.requestSlot}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-5 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> {t.calendar.available}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> {t.calendar.fullyBooked}</span>
      </div>
    </div>
  )
}

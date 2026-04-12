'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AvailabilityBlock } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  blocks:      AvailabilityBlock[]
  maxCapacity: number | null
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function PublicAvailabilityCalendar({ blocks, maxCapacity }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { t } = useI18n()
  const MONTHS = t.calendar.months
  const DAYS   = t.calendar.days

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const blockMap = new Map<string, AvailabilityBlock>()
  for (const bl of blocks) blockMap.set(bl.date, bl)

  const firstDay   = new Date(year, month, 1)
  const lastDay    = new Date(year, month + 1, 0)
  const startDow   = (firstDay.getDay() + 6) % 7  // Mon=0
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

  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="font-semibold text-gray-800">{MONTHS[month]} {year}</h3>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
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
          if (!date) return <div key={i} className="h-12 border-b border-r border-gray-50 last:border-r-0" />

          const dateStr   = isoDate(date)
          const isPast    = date < today
          const isToday   = dateStr === isoDate(today)
          const block     = blockMap.get(dateStr)
          const isBlocked = block?.is_blocked

          // Compute availability indicator
          let status: 'available' | 'limited' | 'full' | 'past' | 'unknown' = 'unknown'
          if (isPast) {
            status = 'past'
          } else if (isBlocked) {
            status = 'full'
          } else if (maxCapacity) {
            const spots = block?.available_spots ?? maxCapacity
            if (spots === 0) status = 'full'
            else if (spots <= Math.ceil(maxCapacity * 0.3)) status = 'limited'
            else status = 'available'
          } else {
            // No capacity tracking: blocked = unavailable, otherwise available
            status = 'available'
          }

          return (
            <div
              key={dateStr}
              className={`relative h-12 border-b border-r border-gray-50 last:border-r-0 flex flex-col items-center justify-center gap-0.5
                ${isPast ? 'opacity-35' : ''}
              `}
            >
              <span className={`text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? 'bg-jungle-800 text-white' : 'text-gray-700'}
              `}>
                {date.getDate()}
              </span>

              {!isPast && (
                <span className={`w-1.5 h-1.5 rounded-full
                  ${status === 'available' ? 'bg-emerald-400' :
                    status === 'limited'   ? 'bg-amber-400'   :
                    status === 'full'      ? 'bg-red-400'     : 'bg-gray-200'}
                `} />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-5 px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          {t.calendar.available}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          {t.calendar.limited}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          {t.calendar.fullyBooked}
        </span>
      </div>
    </div>
  )
}

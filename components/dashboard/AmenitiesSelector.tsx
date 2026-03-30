'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { amenitiesForType } from '@/lib/amenities'
import type { AmenityCategory } from '@/lib/amenities'

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  type:     'stay' | 'trip' | 'activity' | 'transfer'
  initial?: string[]
  onChange: (selected: string[]) => void
}

function CategorySection({
  cat,
  selected,
  onToggle,
}: {
  cat:      AmenityCategory
  selected: Set<string>
  onToggle: (item: string) => void
}) {
  const [open, setOpen] = useState(true)
  const checkedCount = cat.items.filter(i => selected.has(i)).length

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-base">{cat.emoji}</span>
        <span className="font-semibold text-sm text-gray-700 flex-1">{cat.category}</span>
        {checkedCount > 0 && (
          <span className="text-xs font-bold text-jungle-600 bg-jungle-50 px-2 py-0.5 rounded-full">
            {checkedCount} selected
          </span>
        )}
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>

      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-3">
          {cat.items.map(item => {
            const checked = selected.has(item)
            return (
              <label
                key={item}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm select-none
                  ${checked
                    ? 'bg-jungle-50 text-jungle-800 border border-jungle-200'
                    : 'hover:bg-gray-50 text-gray-600 border border-transparent'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-jungle-600 focus:ring-jungle-600 flex-shrink-0"
                />
                <span className="leading-snug">{item}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AmenitiesSelector({ type, initial = [], onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initial))

  function toggle(item: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      onChange([...next])
      return next
    })
  }

  const categories = amenitiesForType(type)

  return (
    <div className="space-y-2">
      {categories.map(cat => (
        <CategorySection key={cat.category} cat={cat} selected={selected} onToggle={toggle} />
      ))}
      {selected.size > 0 && (
        <p className="text-[11px] text-gray-400 pt-1">
          {selected.size} item{selected.size !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'

interface Props {
  name:          string
  defaultValue?: number | string | null
  placeholder?:  string
  required?:     boolean
  min?:          number
  className?:    string
}

function formatDisplay(val: string): string {
  const num = parseInt(val.replace(/\D/g, ''), 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('id-ID')
}

function parseRaw(val: string): string {
  return val.replace(/\D/g, '')
}

export default function CurrencyInput({ name, defaultValue, placeholder, required, min, className }: Props) {
  const initial = defaultValue != null && defaultValue !== '' ? String(Math.round(Number(defaultValue))) : ''
  const [display, setDisplay] = useState(initial ? formatDisplay(initial) : '')
  const [raw, setRaw]         = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = parseRaw(e.target.value)
    setRaw(cleaned)
    setDisplay(cleaned ? formatDisplay(cleaned) : '')
  }

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">Rp</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder ? `Rp ${formatDisplay(placeholder)}` : ''}
        required={required}
        className={className ?? 'w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-jungle-600 focus:ring-2 focus:ring-jungle-600/10 transition'}
      />
      <input type="hidden" name={name} value={raw} />
      {min != null && raw && parseInt(raw) < min && (
        <p className="text-[11px] text-red-500 mt-1">Minimum: Rp {min.toLocaleString('id-ID')}</p>
      )}
    </div>
  )
}

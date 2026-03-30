'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface Suggestion {
  place_id:     number
  display_name: string
  type:         string
  lat:          string
  lon:          string
}

interface Props {
  name: string
  defaultValue?: string
  placeholder?: string
  className?: string
  onSelect?: (value: string, lat: number, lon: number) => void
}

export default function LocationAutocomplete({ name, defaultValue = '', placeholder, className, onSelect }: Props) {
  const [value,       setValue]       = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [open,        setOpen]        = useState(false)
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef  = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function handleSelect(s: Suggestion) {
    setValue(s.display_name)
    setSuggestions([])
    setOpen(false)
    onSelect?.(s.display_name, parseFloat(s.lat), parseFloat(s.lon))
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
        <input
          type="text"
          name={name}
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`${className} pl-9 pr-9`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <li
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-sunset-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="line-clamp-2 leading-snug">{s.display_name}</span>
                {s.type && (
                  <span className="text-[10px] text-gray-400 capitalize">{s.type}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

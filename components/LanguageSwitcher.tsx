'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Globe, Check } from 'lucide-react'
import { useI18n, type Lang } from '@/lib/i18n'

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
]

const DROPDOWN_W = 160
const DROPDOWN_H = 96  // approximate

interface Coords {
  top?:   number
  bottom?: number
  left?:  number
  right?: number
}

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useI18n()
  const [open, setOpen]   = useState(false)
  const [coords, setCoords] = useState<Coords>({})
  const btnRef      = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (!btnRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function toggle() {
    if (!open && btnRef.current) {
      const rect  = btnRef.current.getBoundingClientRect()
      const midX  = rect.left + rect.width / 2
      const onLeft = midX < window.innerWidth / 2

      // Flip up if not enough space below
      const spaceBelow = window.innerHeight - rect.bottom
      const goUp = spaceBelow < DROPDOWN_H + 16

      setCoords({
        ...(goUp
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
        ...(onLeft
          ? { left: rect.left }
          : { right: window.innerWidth - rect.right }),
      })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 px-2 py-1 rounded-lg ${
          dark
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-jungle-800 hover:bg-gray-100'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span>{lang.toUpperCase()}</span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', zIndex: 9999, minWidth: DROPDOWN_W, ...coords }}
          className="bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
        >
          {LANGS.map(l => (
            <button
              key={l.code}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              <span className="text-base">{l.flag}</span>
              <span className={`flex-1 text-left font-medium ${lang === l.code ? 'text-jungle-800' : 'text-gray-700'}`}>
                {l.label}
              </span>
              {lang === l.code && <Check className="w-3.5 h-3.5 text-jungle-600" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

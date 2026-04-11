'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { en } from './en'
import { id } from './id'
import { setExchangeRate } from '@/lib/currency'
import type { Translations } from './en'

export type Lang = 'en' | 'id'

const TRANSLATIONS: Record<Lang, Translations> = { en, id }
const STORAGE_KEY     = 'sunda_lang'
const RATE_CACHE_KEY  = 'sunda_eur_idr'
const RATE_TTL_MS     = 60 * 60 * 1000 // 1 hour

async function fetchLiveRate(): Promise<number | null> {
  try {
    const res  = await fetch('https://api.frankfurter.app/latest?from=EUR&to=IDR')
    const data = await res.json()
    const rate = data?.rates?.IDR
    return typeof rate === 'number' && rate > 0 ? rate : null
  } catch {
    return null
  }
}

function loadCachedRate(): number | null {
  try {
    const raw = localStorage.getItem(RATE_CACHE_KEY)
    if (!raw) return null
    const { rate, ts } = JSON.parse(raw)
    if (Date.now() - ts < RATE_TTL_MS) return rate
  } catch {}
  return null
}

function saveRateToCache(rate: number) {
  try {
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
  } catch {}
}

interface I18nContext {
  lang:   Lang
  setLang:(l: Lang) => void
  t:      Translations
}

const Ctx = createContext<I18nContext>({
  lang:   'en',
  setLang: () => {},
  t:      en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    // Restore language preference
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored === 'en' || stored === 'id') setLangState(stored)

    // Load exchange rate — use cache if fresh, otherwise fetch live
    const cached = loadCachedRate()
    if (cached) {
      setExchangeRate(cached)
    } else {
      fetchLiveRate().then(rate => {
        if (rate) {
          setExchangeRate(rate)
          saveRateToCache(rate)
        }
      })
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  return (
    <Ctx.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </Ctx.Provider>
  )
}

export function useI18n() {
  return useContext(Ctx)
}

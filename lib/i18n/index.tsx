'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { en } from './en'
import { id } from './id'
import type { Translations } from './en'

export type Lang = 'en' | 'id'

const TRANSLATIONS: Record<Lang, Translations> = { en, id }
const STORAGE_KEY = 'sunda_lang'

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
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored === 'en' || stored === 'id') setLangState(stored)
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

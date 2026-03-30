'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import NextLink from 'next/link'
import Image from 'next/image'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function Navbar({ solid }: { solid?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { t } = useI18n()
  const isSolid = solid || scrolled

  const navLinks = [
    { label: t.nav.stays,        href: '#destinations' },
    { label: t.nav.trips,        href: '#destinations' },
    { label: t.nav.activities,   href: '#destinations' },
    { label: t.nav.forPartners,  href: '/partners' },
    { label: t.nav.contact,      href: '#contact' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <m.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isSolid
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <NextLink href="/" className="flex items-center gap-2 group">
              <Image
                src="/logo.avif"
                alt="Sunda Trips"
                width={120}
                height={40}
                className={`h-10 w-auto transition-all duration-300 ${isSolid ? 'brightness-0' : 'brightness-0 invert'}`}
                priority
              />
            </NextLink>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const cls = `text-sm font-medium tracking-wide transition-colors duration-200 hover:text-sunset-500 ${isSolid ? 'text-gray-700' : 'text-white/90'}`
                return link.href.startsWith('/') ? (
                  <NextLink key={link.label} href={link.href} className={cls}>
                    {link.label}
                  </NextLink>
                ) : (
                  <a key={link.label} href={link.href} className={cls}>
                    {link.label}
                  </a>
                )
              })}
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher dark={!isSolid} />
              <NextLink
                href="/partners"
                className="bg-sunset-500 hover:bg-sunset-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-sunset-500/25 active:scale-95"
              >
                {t.nav.listProperty}
              </NextLink>
            </div>

            {/* Mobile menu button */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isSolid ? 'text-gray-700' : 'text-white'
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </m.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 bg-white border-b border-gray-100 shadow-xl md:hidden"
          >
            <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => {
                const cls = 'text-gray-700 font-medium py-2 border-b border-gray-50 hover:text-sunset-500 transition-colors'
                return link.href.startsWith('/') ? (
                  <NextLink key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className={cls}>
                    {link.label}
                  </NextLink>
                ) : (
                  <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className={cls}>
                    {link.label}
                  </a>
                )
              })}
              <LanguageSwitcher />
              <NextLink
                href="/partners"
                className="mt-2 bg-sunset-500 text-white text-center font-semibold py-3 rounded-full"
              >
                {t.nav.listProperty}
              </NextLink>
            </nav>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}

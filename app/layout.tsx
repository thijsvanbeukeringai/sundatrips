import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import MotionProvider from '@/components/MotionProvider'
import { LanguageProvider } from '@/lib/i18n'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Sunda Trips – Authentic Lombok & Bali Experiences',
  description:
    'Book handpicked guesthouses, guided treks, surf lessons and local activities directly with owners across Lombok and Bali. Zero middlemen, zero hidden fees.',
  keywords: 'Lombok, Bali, guesthouse, Indonesia, travel, surf, Rinjani, Gili Islands, boutique, authentic',
  openGraph: {
    title: 'Sunda Trips – Authentic Lombok & Bali Experiences',
    description: 'Stays, trips & activities — booked directly with local owners.',
    type: 'website',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#064e3b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect to image CDN — avoids a full round-trip per image on first load */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans">
        <LanguageProvider>
          <MotionProvider>{children}</MotionProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react'

interface Props {
  images: string[]
  name:   string
}

export default function ListingGallery({ images, name }: Props) {
  const [active,    setActive]    = useState(0)
  const [lightbox,  setLightbox]  = useState(false)

  if (images.length === 0) {
    return (
      <div className="relative h-[50vh] sm:h-[60vh] bg-gradient-to-br from-jungle-100 to-jungle-200" />
    )
  }

  function prev() { setActive(i => (i - 1 + images.length) % images.length) }
  function next() { setActive(i => (i + 1) % images.length) }

  return (
    <>
      {/* ── Main hero ──────────────────────────────────────────────── */}
      <div className="relative h-[50vh] sm:h-[60vh] bg-gray-100 overflow-hidden">
        <Image
          key={active}
          src={images[active]}
          alt={name}
          fill
          priority
          className="object-cover transition-opacity duration-300"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Expand to lightbox */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-full transition-colors"
        >
          <Expand className="w-3.5 h-3.5" />
          View full
        </button>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all ${
                  i === active ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-14 relative z-10 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-20 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                i === active
                  ? 'border-white shadow-lg scale-105'
                  : 'border-white/50 opacity-70 hover:opacity-100 hover:border-white'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {active + 1} / {images.length}
          </span>

          {/* Image */}
          <div
            className="relative w-full max-w-5xl mx-4 aspect-[4/3]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              key={active}
              src={images[active]}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-lg px-4">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActive(i) }}
                  className={`relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === active ? 'border-white' : 'border-white/30 opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Props {
  images: string[]
  name:   string
}

export default function ActivityGallery({ images, name }: Props) {
  const { t } = useI18n()
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) return null

  function prev() { setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null) }
  function next() { setLightbox(i => i !== null ? (i + 1) % images.length : null) }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">{t.listing.photos ?? 'Photos'}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 group"
          >
            <Image
              src={url}
              alt={`${name} ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </span>

          <div
            className="relative w-full max-w-4xl mx-4 aspect-[4/3]"
            onClick={e => e.stopPropagation()}
          >
            <Image
              key={lightbox}
              src={images[lightbox]}
              alt={`${name} ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

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

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-lg px-4">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(i) }}
                  className={`relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightbox ? 'border-white' : 'border-white/30 opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

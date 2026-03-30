/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gzip all responses at the Node layer (also handled by Vercel CDN, but good
  // to have as a fallback for self-hosted or regional edge nodes)
  compress: true,

  // Remove "X-Powered-By: Next.js" — minor security hygiene + saves bytes
  poweredByHeader: false,

  images: {
    // Serve AVIF first (30-50% smaller than WebP), fall back to WebP, then
    // original. Next.js negotiates via the Accept header automatically.
    formats: ['image/avif', 'image/webp'],

    // Cache optimised images for 1 year. Unsplash originals are immutable,
    // so this is safe and reduces origin hits from edge nodes.
    minimumCacheTTL: 60 * 60 * 24 * 365,

    // Define all remote image origins
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      // Newer Supabase projects use supabasestorage.app for storage CDN
      { protocol: 'https', hostname: '*.supabasestorage.app' },
    ],

    // Granular responsive breakpoints matching Tailwind's screen sizes.
    // Next.js will pre-generate only these widths, keeping the image cache lean.
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes:  [16, 32, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      // ── Static assets: immutable 1-year cache ────────────────────────────
      // Next.js hashes filenames on build, so these are safe to cache forever.
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Optimised images from Next.js ────────────────────────────────────
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
          // Hint the CDN that this URL varies by Accept header (AVIF vs WebP)
          { key: 'Vary', value: 'Accept' },
        ],
      },
      // ── HTML pages: revalidate, never stale ──────────────────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          // Allows Unsplash images and Google Fonts; tightened as needed
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

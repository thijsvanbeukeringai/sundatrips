import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Forward cookies to both the request and the response so the session
          // token is refreshed transparently on every request.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this extends the cookie TTL silently.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Protect /dashboard/* ──────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── Protect /admin/* ──────────────────────────────────────
  // Auth check only — role check is handled by (admin)/layout.tsx to avoid
  // an extra sequential DB query on every admin request.
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // ── Redirect authenticated users away from /login ─────────
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Expose pathname to server components via header (used for crew access control)
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/login',
    '/onboarding',
  ],
}

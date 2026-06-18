# Sunda Trips — Mobile App

Native iOS/Android app for the Sunda Trips platform, built with **Expo (React
Native)**. It talks to the **same Supabase backend** as the web app, so there is
no separate API to maintain — the database, auth, and row-level security (RLS)
are shared.

## Why Expo / React Native

- Reuses the existing Supabase backend, auth, and RLS — no backend rewrite.
- One codebase for iOS **and** Android.
- Real native app (push notifications, App Store presence) — unlike a webview wrapper.
- Domain types are shared with the web app via `src/lib/types.ts` (kept in sync
  with the web `lib/types.ts`).

## Project structure

```
mobile/
├── app/                      # expo-router (file-based routing)
│   ├── _layout.tsx           # providers + auth route guard
│   ├── index.tsx             # splash → redirects by audience
│   ├── (auth)/login.tsx      # partner password login + guest magic link
│   ├── (customer)/           # customer side (tabs): Explore, My Trips, Account
│   └── (partner)/            # partner side (tabs): Dashboard, Bookings, Account
└── src/
    ├── contexts/AuthContext.tsx  # session + profile, derives audience (customer | partner)
    ├── lib/supabase.ts           # Supabase client (AsyncStorage session persistence)
    ├── lib/types.ts              # shared domain types (mirror of web lib/types.ts)
    ├── lib/format.ts             # IDR currency formatting (Hermes-safe)
    ├── lib/env.ts                # EXPO_PUBLIC_* env access
    └── theme/colors.ts           # brand palette (mirrors tailwind.config.ts)
```

### How audiences work

`AuthContext` reads the signed-in user's `profile.role`:

- `owner` · `admin` · `crew` · `partner` → **partner** side (`/(partner)`)
- everyone else, including logged-out users → **customer** side (`/(customer)`)

The route guard in `app/_layout.tsx` keeps each user in the right area. Customers
can browse anonymously; the partner area requires a session with a partner role.

## Getting started

> Requires Node 18+. Building/running on iOS requires macOS + Xcode, **or** use
> the Expo Go app / a development build to run on a physical device without a Mac.

```bash
cd mobile
npm install --legacy-peer-deps        # peer-dep flag needed for the current Expo SDK
cp .env.example .env                  # then fill in your Supabase credentials
npm run ios                           # or: npm run android / npm run start
```

### Environment variables

Only variables prefixed with `EXPO_PUBLIC_` are exposed to the app bundle. Use
the **same Supabase project** as the web app:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

The anon key is safe to ship — RLS protects the data.

## What is built so far (foundation)

- ✅ Expo SDK 56 + expo-router + TypeScript scaffold
- ✅ Supabase client with persisted sessions (AsyncStorage)
- ✅ Auth: partner password login + guest magic-link
- ✅ Role-based routing (customer vs partner)
- ✅ Customer: live listings feed from Supabase, filters, my bookings
- ✅ Partner: dashboard KPIs + bookings list
- ✅ Shared brand theme and domain types

## Roadmap (next steps)

1. **Listing detail + booking flow** (customer) — availability calendar, variant
   selector, create booking. Mirror the web `/listings/[id]` logic.
2. **Stripe payments** — `@stripe/stripe-react-native` for online bookings.
3. **Magic-link deep linking** — handle the `sundatrips://` callback so guest
   login opens straight back into the app.
4. **Partner booking detail + status actions** (confirm / check-in / complete).
5. **POS terminal** (partner) — the web POS already uses optimistic UI + Supabase
   realtime; a strong candidate for a native on-site screen.
6. **Push notifications** — `expo-notifications` for new bookings (partner) and
   booking updates (guest).
7. **App Store / Play Store** — set up EAS Build & Submit, icons, screenshots.

## Notes

- `src/lib/types.ts` must stay in sync with the web app's `lib/types.ts` after any
  schema change (`supabase gen types typescript`).
- Native folders (`ios/`, `android/`) are generated and git-ignored; this is a
  managed Expo workflow (use EAS Build, no committed native projects).

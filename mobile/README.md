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
│   ├── (partner)/            # partner side (tabs): Dashboard, Bookings, Account
│   ├── listing/[id].tsx      # listing detail (gallery, variants, amenities)
│   └── book/[id].tsx         # booking request form (no payment)
└── src/
    ├── components/DatePicker.tsx # horizontal date strip (no native dep)
    ├── contexts/AuthContext.tsx  # session + profile, derives audience (customer | partner)
    ├── lib/supabase.ts           # Supabase client (AsyncStorage session persistence)
    ├── lib/bookings.ts           # calls the create-booking edge function
    ├── lib/types.ts              # shared domain types (mirror of web lib/types.ts)
    ├── lib/format.ts             # IDR currency formatting (Hermes-safe)
    ├── lib/dates.ts              # date helpers (Hermes-safe)
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
- ✅ Customer: **listing detail** (gallery, variants, amenities) + **booking
  request flow** (date picker, guests, no payment)
- ✅ Partner: dashboard KPIs + bookings list
- ✅ Shared brand theme and domain types
- ✅ `create-booking` Supabase edge function (booking request + emails)

## Payments

**No customer payments happen inside the app.** The app lets a guest create a
booking request, but the actual payment is handled outside the app (cash on
arrival, or online via another channel). There is **no Stripe / in-app payment
integration** on the customer side — booking flows submit the booking only and
never collect card details.

## Backend: the `create-booking` edge function

RLS does not allow anonymous guests to insert into `bookings` directly. So,
exactly like the web app's `createPublicBooking` (which uses the service-role
key server-side), booking creation goes through a Supabase **edge function**
that runs with the service-role key. The mobile app calls it via
`supabase.functions.invoke('create-booking', …)` — see `src/lib/bookings.ts`.

Source: `supabase/functions/create-booking/index.ts` (in the repo root).

```bash
# Deploy (run from the repo root, not mobile/)
supabase functions deploy create-booking --no-verify-jwt

# Secrets it needs (Mailgun is optional — emails are best-effort):
supabase secrets set \
  MAILGUN_API_KEY=... \
  MAILGUN_DOMAIN=sundatrips.com \
  MAILGUN_FROM="Sunda Trips <noreply@sundatrips.com>" \
  SITE_URL=https://sundatrips.com
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
```

It creates a `pending` booking (`payment_method: cash`), finds/invites the guest
auth user, and emails the guest + partner using the same Mailgun templates as
the web app. Booking still succeeds if email sending fails.

> Not yet ported from the web flow: automatic room assignment for stays
> (`autoAssignRoom`). For now the partner assigns a room in the dashboard.

## Roadmap (next steps)

1. **Availability checking** — validate the requested dates against existing
   bookings/room availability before submitting (mirror `getAvailableVariants`),
   ideally inside the edge function so it stays authoritative.
2. **Time slots** for activities/trips (the web booking form supports picking a
   time slot + private-tour option; the app currently sends date only).
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

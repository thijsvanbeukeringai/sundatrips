# Sunda Trips — Platform Overview

Booking platform & POS system for guesthouses, trips, activities and transfers in Lombok/Bali/Gili Islands. Non-profit: 1% platform fee for server costs only.

**Tech stack:** Next.js 14 App Router · Supabase (Postgres + Auth + Realtime) · Stripe Connect · Tailwind CSS · Framer Motion

---

## User Roles

| Role | Description |
|------|-------------|
| **Public** | Anyone — can browse listings, view detail pages, submit bookings |
| **Owner** | Registered guesthouse/activity owner — manages properties, bookings, POS, financials |
| **Admin** | Platform admin — manages all users, venues, companies, can impersonate owners |
| **Guest** | Can view own bookings via `/my-bookings` (magic link login) |

---

## Public Pages

### `/` — Homepage
- Hero section with tagline "Where the Jungle Meets the Sea"
- Featured properties from the database
- Trust section (stats, reviews)
- Owner CTA section (non-profit pitch, feature list)
- Partners/contact section
- **Cache:** ISR 60 seconds

### `/listings` — Browse Listings
- Filter by: type (stay / trip / activity / transfer), island (Lombok / Bali / Gili), guest count, text search
- Shows all active listings matching filters
- **Cache:** ISR 60 seconds

### `/listings/[id]` — Listing Detail
- Property images, description, amenities, pricing
- Availability calendar (checks booked dates + manual blocks)
- Variant/room type selector (price per option)
- Date search → returns available variants only
- Booking form: guest name, email, phone, nationality, guest count, dates, notes
- Submits booking → creates record, sends confirmation

### `/partners` — Partners Landing Page
- Marketing page for drivers, activity organizers, trip organizers, hotel owners
- Explains the free/non-profit model
- CTA to register or contact via WhatsApp/email

### `/my-bookings` — Guest Booking Overview
- Unauthenticated: magic link login form (enter email)
- Authenticated: shows all bookings linked to that email
- Per booking: property name, dates, variant, status badge

---

## Auth Flow

### `/login`
- Email + password login
- Redirects authenticated users to `/dashboard`

### `/onboarding`
- For newly invited owners (arriving via invite email link)
- Set full name, phone, create password
- On completion: redirects to `/dashboard/properties`

### `/auth/callback`
- Handles Supabase implicit auth flow (reads hash fragment from URL)
- Detects: invited user → `/onboarding`, impersonation → `/dashboard`, regular login → `/dashboard`
- Shows loading spinner during token exchange

---

## Dashboard — Owner Pages

All pages require login. Owners only see their own data.

### `/dashboard` — Overview
**Owner view:**
- KPI cards: check-ins today, revenue today, active bookings, POS revenue today, revenue this month, net payout this month
- Recent bookings list (last 6)

**Admin view (own account, not impersonating):**
- KPI cards: company users, total bookings, active now, platform fees
- Users grouped: Company Users (owners) / Admin Users
- All bookings table with filters: venue dropdown + date from/to

---

### `/dashboard/bookings` — Bookings List
- Filter tabs: All / Pending / Confirmed / Checked In / Completed / Cancelled
- Search by guest name or email (DB-side)
- Shows count per status in tabs
- Each booking: guest name, property, check-in date, total, status badge
- Links to booking detail

### `/dashboard/bookings/new` — Create Booking (manual)
- Select property → variants auto-populate
- Guest details: name, email, phone, nationality
- Check-in/check-out dates, guest count
- Base amount, payment method, initial status, notes
- Saves to database, revalidates bookings list

### `/dashboard/bookings/[id]` — Booking Detail
- Full booking info: guest, property, variant, dates, status, amounts
- Status actions: Confirm → Check In → Complete / Cancel
- Cancelling zeroes out `base_amount` (cascades to generated `platform_fee` + `net_payout`)
- **POS panel:** add extras from catalog or enter custom item
- Live total: base amount + all extras
- Mark extras as paid → snapshots to `bill_payments`, clears items

---

### `/dashboard/properties` — Properties List
- All properties for this owner
- Active/Hidden badge per property
- Links to Edit, Availability, Variants pages
- Toggle active/hidden inline
- Delete button (with FK cascade: also deletes bookings)

### `/dashboard/properties/new` — Create Property
Fields:
- Type: Stay / Trip / Activity / Transfer
- Name, island, location, description, tag
- Price per unit + unit (night / person / session / day / trip / vehicle)
- Max capacity, duration (for activities), duration in hours
- Images (array of URLs), amenities (array of strings)
- Transfer-specific: from/to location, distance, driver info
- is_active toggle
- Allowed types per owner (`profile.allowed_listing_types`)

### `/dashboard/properties/[id]/edit` — Edit Property
- Same form as create, pre-filled
- Cannot change type after creation

### `/dashboard/properties/[id]/variants` — Room/Package Types
- Dynamic label per type: Room/Unit Types (stay) · Tour Packages (trip) · Ticket Options (activity) · Routes & Pricing (transfer)
- Add/edit/delete variants
- Per variant: name, description, price, capacity, images, amenities
- Drag to reorder (updates `sort_order`)
- Toggle active/inactive per variant

### `/dashboard/properties/[id]/availability` — Availability Management
**For stays:**
- Calendar showing booked dates + manual blocks
- Set availability: available spots, notes, or mark as blocked
- Clear availability per date

**For activities/trips (with time slots):**
- Time slot manager: add time slots (e.g. 09:00, 14:00)
- Set available spots per slot per date
- Calendar shows booked + available

---

### `/dashboard/pos` — POS Terminal
- Select a booking from the active list (confirmed/checked_in)
- Quick-add catalog items by tapping
- Live running total
- Optimistic UI: item appears instantly (fire-and-forget to server)
- Real-time sync via Supabase postgres_changes (INSERT/DELETE)
- Remove items with one tap

### `/dashboard/pos/catalog` — POS Catalog Management
- Items grouped by category: Food / Drinks / Tours / Transport / Wellness / Other
- Add item: name, emoji, default price, category
- Inline edit: change name/price/emoji
- Toggle active/inactive (hidden from POS terminal if inactive)
- Delete item

---

### `/dashboard/venues` — Companies
- Lists all venues (companies/guesthouses) for this owner
- Per venue: name, location, island, status, property counts by type
- Admin sees all venues

### `/dashboard/venues/[id]` — Company Detail
- Venue info: name, location, description, allowed listing types, status
- Listings in this company: name, type, status, edit/remove
- Add existing listings (unlinked properties) → assign to venue
- Create new listing pre-linked to this venue

---

### `/dashboard/settings` — Settings
- Edit profile: full name, phone (email read-only)
- **Stripe Connect:**
  - Connect account (initiates Stripe OAuth)
  - Status: not connected / connected pending verification / fully connected
  - Shows payout rate info (1% platform fee, owner keeps 99%)
  - Link to Stripe Express Dashboard
  - Refresh onboarding link if expired

---

## Admin Pages

All admin pages check `profile.role === 'admin'`.

### `/admin` — Admin Overview
- KPI cards: Total Users, Companies, Active Listings, Total Bookings, Platform Fees
- Booking status breakdown (counts per status)
- Revenue summary: Gross / Platform Fees (1%) / Owner Payouts (99%)
- All users list with listing counts
- All listings list
- Recent bookings table (last 10): Guest, Check-in, Total, Fee, Status
- Pending invites list

### `/admin/users` — User Management
- All users sorted (current admin first)
- Per user: avatar, name, email, phone, role badge, listing count
- "Login as" button → starts impersonation session
- Edit: change name or role
- Send password reset email
- Delete user (cascades to all data)

### `/admin/companies` — All Venues
- All venues across all owners
- Per venue: name, owner, location, island, listing counts, status
- Edit / Delete per venue

### `/admin/companies/new` — Create Company
- Owner selector (dropdown of all users)
- Fields: name, description, location, island, images, amenities, allowed types, is_active
- Creates venue linked to selected owner

### `/admin/companies/[id]` — Edit Company
- Edit all venue fields
- Manage listings: view linked, unlink, add unlinked listings

### `/admin/invite` — Invite Owner
- Enter: email, full name, optional property name
- Sends Supabase invite email with magic link
- Link valid 24 hours → lands on `/onboarding`

---

## Impersonation Flow

1. Admin visits `/admin/users`
2. Clicks "Login as" on a user card
3. System generates magic link for that user, stores admin session in httpOnly cookie (`admin_restore`)
4. Admin is taken directly to user's `/dashboard`
5. Amber banner at top: "Viewing as [name]" + "Back to admin" button
6. Clicking back → restores admin session, redirects to `/admin/users`
7. Sidebar shows owner nav while impersonating (Bookings, POS, Listings, etc.)
8. Sidebar shows admin nav when in own admin account (Overview, Users, Companies, Invite)

---

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles — role, name, email, phone, Stripe fields |
| `venues` | Companies/guesthouses — groups properties under an owner |
| `properties` | Individual listings — stays, trips, activities, transfers |
| `listing_variants` | Room types / packages / ticket options per property |
| `bookings` | Guest bookings — links to property + variant |
| `availability` | Manual availability blocks per property per date |
| `time_slots` | Time slot definitions per property (e.g. 09:00, 14:00) |
| `slot_availability` | Available spots per time slot per date |
| `pos_items` | POS line items added to a booking |
| `pos_catalog` | Owner's reusable POS items (food, drinks, tours, etc.) |
| `bill_payments` | Snapshot of paid extras (from `pos_items` after marking paid) |
| `invites` | Pending owner invitations (email, property_name, expires_at) |

### Generated Columns (auto-calculated)
- `bookings.platform_fee` = `base_amount * 0.01`
- `bookings.net_payout` = `base_amount * 0.99`
- `bookings.total_amount` = `base_amount + SUM(pos_items.total_price)`

---

## Server Actions (Mutations)

### Bookings
- `createBooking(formData)` — create new booking
- `updateBookingStatus(id, status)` — change status; cancellation zeroes `base_amount`
- `deleteBooking(id)` — hard delete

### Properties
- `createProperty(formData)` — create new listing
- `updateProperty(formData)` — update listing
- `deleteProperty(id)` — hard delete (CASCADE: deletes bookings)
- `togglePropertyActive(id, isActive)` — show/hide listing

### Variants
- `addVariant(propertyId, data)` — add room/package type
- `updateVariant(id, propertyId, data)` — edit variant
- `deleteVariant(id, propertyId)` — remove variant
- `toggleVariantActive(id, propertyId, isActive)` — show/hide
- `reorderVariants(ids, propertyId)` — bulk update sort_order

### Availability
- `setAvailability(propertyId, date, opts)` — block/set availability per date
- `clearAvailability(propertyId, date)` — remove block
- `setSlotAvailability(propertyId, slotId, date, spots)` — set spots per time slot
- `clearSlotAvailability(propertyId, slotId, date)` — remove slot availability
- `getAvailableVariants(propertyId, checkIn, checkOut, guests)` — check availability → returns available variants

### POS
- `addPOSItem(bookingId, item)` — add item to booking
- `removePOSItem(itemId, bookingId)` — remove item
- `createCatalogItem(formData)` / `createCatalogItemDirect(data)` — add to catalog
- `updateCatalogItem(id, data)` — edit catalog item
- `toggleCatalogItem(id, isActive)` — show/hide in POS
- `deleteCatalogItem(id)` — remove from catalog
- `markExtrasPaid(bookingId)` — snapshot extras to `bill_payments`, clear `pos_items`

### Venues
- `createVenue(formData)` — create company/venue
- `updateVenue(formData)` — update venue
- `deleteVenue(id)` — delete venue
- `assignPropertyToVenue(propertyId, venueId)` — link or unlink property

### Admin
- `startImpersonation(targetUserId)` — generates magic link, stores admin session cookie
- `stopImpersonation()` — restores admin session, clears cookie
- `setOwnerAllowedTypes(ownerId, types)` — control which listing types owner can create
- `setOwnerPaymentMethods(ownerId, methods)` — cash_only / online_only / all
- `updateUserProfile(userId, data)` — change name or role
- `sendPasswordReset(userId)` — trigger password reset email
- `deleteOwner(ownerId)` — delete user + all their data

---

## Performance Architecture

- **`getCachedUser()`** — React `cache()` deduplicates Supabase auth call across layout + page (1 network request per render tree)
- **`getCachedProfile()`** — same pattern for profile DB fetch
- **Parallel queries** — all independent DB fetches wrapped in `Promise.all`
- **ISR** — homepage and listings cached for 60 seconds (`revalidate = 60`)
- **Optimistic UI** — POS terminal adds items instantly, syncs in background
- **Real-time** — POS uses Supabase `postgres_changes` to sync INSERT/DELETE across tabs
- **Region matching** — Supabase (Seoul ap-northeast-2) + Vercel (Seoul ap-northeast-2) co-located for minimal DB latency

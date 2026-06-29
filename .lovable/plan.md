
# Fox Rides — Production Upgrade Plan

This is a large scope. I'll keep your existing stack (Lovable Cloud / Supabase + TanStack Start + Google Maps connector) — **not** Firebase, because switching backends would wipe your current users, rides, drivers, and admin lock. Everything below works on what you already have.

I'll ship this in **4 phases** so you can test as we go. Tell me to start at Phase 1 (or jump to a specific phase).

---

## Phase 1 — Real maps, real routes, real fares (foundation)

The visible "Uber feel". No new accounts required.

**Map & routing**
- Replace the straight polyline with the **Google Routes API** (via the existing Maps connector gateway) — real roads, curved polyline, turn list.
- Auto-fit zoom to full route, custom Fox pickup/destination markers.
- Live ETA, distance, duration shown on the booking card and updated when pickup/destination change.
- Traffic-aware routing (`TRAFFIC_AWARE` preference).
- Driver-side: same route preview before accepting; once accepted, driver's live GPS streamed to the customer via Supabase Realtime, with a moving car marker.

**Fare model (your Botswana pricing)**
- Base P10 · per-km P2.50 · per-min P0.40 · minimum P15 · cancellation after arrival P10.
- Recalculated from real Routes API distance + duration, not haversine.
- Shown live as Estimated Fare / Distance / Travel Time.

**Schema additions** (one migration):
- `rides`: `route_polyline`, `duration_min`, `eta_at`, `driver_lat`, `driver_lng`, `driver_loc_updated_at`, `cancelled_by`, `cancellation_fee`.
- `driver_locations` table (driver_id, lat, lng, heading, updated_at) for live tracking, with RLS.
- Enable Realtime on `rides` and `driver_locations`.

---

## Phase 2 — Passenger & driver core features

**Passenger**
- Save **Home** and **Work**, favourite places, recent destinations (new `saved_places` table).
- Cancel ride (with P10 fee if driver already arrived).
- Driver card on active ride: photo, rating, vehicle + plate, **Call** + **WhatsApp** buttons (uses driver's phone).
- **Share trip** (web-share link with live status), **SOS** button (WhatsApp + tel: to your 75389897 with live coords).
- Rate driver 1–5 + comment after completion (already partly there — polish).

**Driver**
- Document uploads: **Omang**, driver's licence, vehicle registration, **insurance**, profile photo (Supabase Storage, private bucket with signed URLs; admin-only read).
- Approval status surfaced clearly; can't go online until approved + fees paid (already enforced).
- Accept/Decline trip requests with countdown.
- Live earnings dashboard: today / week / month / lifetime, withdrawal request (creates a row admins action).

**Schema additions**
- `drivers`: `omang_url`, `license_url`, `vehicle_reg_url`, `insurance_url`, `approval_status` enum (pending/approved/rejected/suspended), `rejection_reason`.
- `withdrawals` table.
- `saved_places` table.
- Private `driver-docs` storage bucket + RLS.

---

## Phase 3 — Admin panel (Uber-grade)

Expand the existing Admin tab into a real operations console:
- KPI cards: total users, active (24h), total drivers, online drivers, pending approvals, trips today, completed, cancelled, revenue today/week/month.
- **Live map** of online drivers (uses `driver_locations`).
- Search users/drivers, suspend/unsuspend (already partly there).
- Driver approvals queue with document viewer (signed URLs).
- **Fare editor** — settings row in DB, no redeploy needed.
- **Promo codes** — create/disable, percent or flat, expiry, usage cap.
- Ride history with filters; analytics charts (Recharts) for revenue & trip volume.

**Schema additions**
- `app_settings` (singleton row: fare params).
- `promo_codes` + `promo_redemptions`.

Only your phone (75389897) can access — the existing admin lock stays.

---

## Phase 4 — Polish & extras

- Ride scheduling (`scheduled_at` on rides + a "Scheduled" tab).
- Multiple stops (array of waypoints, Routes API supports it natively).
- Referral rewards (`referrals` table, code on signup).
- Setswana language toggle (i18n with English + Setswana JSON dictionaries).
- Promo code entry on booking screen.
- Loading skeletons, friendly offline banner, retry on poor network.
- Final UI pass: rounded cards, shadows, smooth animations, Uber/Yango feel — keeps your **black + orange + white** branding.

---

## Things I'm intentionally NOT doing (and why)

- **Firebase swap** — would delete all current data and your admin account. Lovable Cloud (Supabase) already gives you Auth, Firestore-equivalent DB, Functions, Storage, and Realtime. I'll use those.
- **Phone OTP login** — Supabase phone OTP requires a paid SMS provider (Twilio/MessageBird) and a monthly cost. Your current "name + phone" login is already frictionless. I'll add OTP only if you connect Twilio and ask for it.
- **Orange Money / MyZaka / Visa payments** — no public APIs in Botswana yet. Cash + your existing WhatsApp proof flow stays. I'll wire Stripe/Paddle the day you want card payments internationally.
- **Native Android/iPhone apps** — the web app is already mobile-responsive and installable (PWA). A true native build is a separate project.

---

## How long & how to start

Each phase is one focused build session. **Reply "Start Phase 1"** and I'll ship maps + routes + new fare model first, then we test, then move to Phase 2.

Want any feature moved between phases, dropped, or added?

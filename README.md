# Adda - Hangouts Wrapped!
> Drop your friends' locations → find the fair meeting café → get a monthly Wrapped of your group's outings.
**Live:** [adda-outing.netlify.app](https://adda-outing.netlify.app)
A group hangout planner for Bangalore friend circles. Instead of a 40-message WhatsApp thread about where to meet, everyone drops their location — the app computes a fair geometric midpoint and suggests three nearby cafés ranked by max and average travel distance. At month-end, the group gets a shareable Wrapped-style recap of everywhere you went together.
Built in a 4-hour buildathon.
## What it does
### Plan a hangout
- Add up to 4 friends, enter each one's location via address autocomplete (OpenStreetMap Nominatim) or by clicking the map directly.
- Algorithm finds the geometric midpoint of everyone's locations.
- Suggests top 3 cafés from a curated Bangalore list, ranked by distance from midpoint, with max and average travel km per friend and a vibe blurb for each.
- Pick a café, set a date and time, and generate a shareable invite URL.
### Share & RSVP
- Invite link encodes all plan state in URL params — no backend required for sharing.
- Recipients land on a standalone invite card with photo, venue, time, and a "Count me in" RSVP button (localStorage-backed).
### Monthly Wrapped
- Static dashboard at `/dashboard` rendering a bento-grid recap of the month: map of Bangalore with every outing pinned, photo collage, stat tiles (outings, friends, km traveled together), top neighborhood, and an auto-generated vibe summary.
### Fake auth + persistence
- Sign in with just your name (localStorage). Plans are saved per-user and displayed as a "Your plans" strip on the plan page across sessions.
## Stack
- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **MapLibre GL JS** — pan/zoom map with OSM raster tiles
- **Nominatim** — keyless geocoding for address search (Bangalore-biased)
- **PostHog** — product analytics (pageviews, sign-ins, plan creation, invite generation)
- **Netlify** — hosted
## Key shortcuts for the buildathon
This was shipped in 4 hours. Honest accounting of what's real vs faked:
- **Auth:** `localStorage` only, no passwords. Users type a name; it identifies them in PostHog and keys their saved plans. Clearly "fake" — a v2 would be Supabase/Clerk.
- **Café list:** 20 hardcoded Bangalore cafés with lat/lng, photo URL, and vibe blurb (`data/cafes.json`).
- **Monthly outings on the dashboard:** 8 hardcoded entries in `data/outings.json` with Unsplash photos.
- **Midpoint algorithm:** geometric mean of lat/lngs. Not travel-time. Good enough for a city of this size.
- **Vibe summary:** hardcoded string today. Ready to be swapped for a single LLM call.
- **RSVP:** localStorage per invite URL, device-local. No backend.
## Running locally
```bash
npm install
npm run dev
Open localhost:3000 (http://localhost:3000).
Routes
- / — Landing page
- /plan — Planning flow (map, friends, suggestions, invite)
- /invite?... — Invite recipient view (decoded from URL params)
- /dashboard — Monthly Wrapped recap
Analytics events
Emitted to PostHog:
- $pageview — on every route change
- user_signed_in / user_signed_out
- plan_created — when meeting spot is computed (includes pin count, top café)
- invite_generated — when a shareable invite URL is created
What's not in v1
- Multi-device sync (plans are localStorage)
- Real auth with OAuth
- Real-time async rooms (the original idea — one person plans and shares, rather than many people joining a live room)
- Photo upload (dashboard photos are hardcoded Unsplash URLs)
- Actual travel-time computation (currently geometric midpoint only)
- Mobile-first responsive layout (desktop only)
---

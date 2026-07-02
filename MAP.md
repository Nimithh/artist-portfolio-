# Project map

Quick index of where things live, so the right file can be found without
scanning the whole project. Keep this updated when files are added or moved.

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4) + Supabase (auth, Postgres
with RLS) + Cloudinary (image hosting). Fonts: Fraunces (headings), Inter
(body). Icons: lucide-react, plus simple-icons for brand logos.

## Database

- `supabase/migrations/20260701000001_create_tbl_artists.sql` -- artist
  profiles, 1:1 with auth.users. Slug rules incl. reserved-word list.
- `supabase/migrations/20260701000002_create_tbl_artworks.sql` -- artworks,
  20-per-artist cap enforced by trigger (with row lock).
- `supabase/migrations/20260701000003_create_tbl_reports.sql` -- anonymous
  reports, 50-per-artwork flood cap trigger.
- `supabase/migrations/20260701000004_enable_rls_policies.sql` -- RLS:
  public read on artists/artworks, owner-only writes, insert-only reports.

## Shared code (src/lib/)

- `types.ts` -- row types (Artist, Artwork).
- `validation.ts` -- input validation, reserved slugs, slugify, image
  sniffing. Reserved slug list must stay in sync with migration 1.
- `rate-limit.ts` -- in-memory per-IP rate limiter (per-instance).
- `cloudinary.ts` -- server-only upload/delete helpers.
- `supabase/client.ts` -- browser Supabase client (anon key).
- `supabase/server.ts` -- server clients: session-aware + anonymous.

## App (src/app/)

- `layout.tsx` -- fonts, header (login-aware), footer.
- `page.tsx` -- homepage: browse artists + search by name/skill.
- `[slug]/page.tsx` -- public artist page with gallery.
- `[slug]/report-button.tsx` -- anonymous report dialog.
- `[slug]/social-icons.tsx` -- brand SVG icons (simple-icons).
- `login/page.tsx`, `signup/page.tsx` -- auth forms (Supabase Auth).
- `dashboard/page.tsx` -- artist dashboard (server, auth-gated).
- `dashboard/profile-form.tsx` -- create/edit profile, photo upload.
- `dashboard/artwork-manager.tsx` -- upload/edit/reorder/delete artworks.
- `dashboard/sign-out-button.tsx` -- sign out.

## API routes (src/app/api/)

- `artworks/route.ts` -- POST upload (auth, file validation, Cloudinary,
  cap pre-check; DB trigger is the hard cap).
- `artworks/[id]/route.ts` -- DELETE (auth + ownership, cleans Cloudinary).
- `profile/photo/route.ts` -- POST profile photo (auth, replaces old file).
- `reports/route.ts` -- POST anonymous report (rate-limited per IP).

## Other

- `src/proxy.ts` -- session refresh on every request (Next 16 proxy,
  formerly middleware).
- `.env.example` -- required env var names. Copy to `.env.local`.
- `PROGRESS.txt` / `BUGLOG.txt` -- work log and bug log (append-only).

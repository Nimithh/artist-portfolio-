-- Adds a Telegram contact link to artist profiles. A new migration file
-- (not an edit to 20260701000001) because that earlier migration has
-- already been run against the live Supabase project.

alter table public.tbl_artists
  add column telegram_url text;

alter table public.tbl_artists
  add constraint telegram_url_length check (telegram_url is null or char_length(telegram_url) <= 2048);

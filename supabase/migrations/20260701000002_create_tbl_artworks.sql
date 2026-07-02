-- tbl_artworks: one row per artwork, owned by an artist.
-- The 20-artwork cap is enforced here at the database level (not just in
-- application code) so it holds even if an API route has a bug.

create table public.tbl_artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.tbl_artists (id) on delete cascade,
  image_url text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint sort_order_range check (sort_order between 0 and 999),
  constraint image_url_length check (char_length(image_url) <= 2048),
  constraint title_length check (char_length(title) between 1 and 120),
  constraint description_length check (description is null or char_length(description) <= 500)
);

create index tbl_artworks_artist_id_idx on public.tbl_artworks (artist_id);

-- security definer: runs as the table owner so the row lock below works
-- regardless of the caller's RLS policies. search_path pinned to '' and all
-- names schema-qualified, which is required for a safe security definer.
create or replace function public.enforce_artwork_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  artwork_count integer;
begin
  -- Lock the artist row first so two inserts for the same artist run this
  -- check one at a time. Without the lock, two concurrent inserts can both
  -- count 19 and both succeed, ending past the cap.
  perform 1 from public.tbl_artists where id = new.artist_id for update;

  select count(*) into artwork_count
  from public.tbl_artworks
  where artist_id = new.artist_id;

  if artwork_count >= 20 then
    raise exception 'Artist already has the maximum of 20 artworks';
  end if;

  return new;
end;
$$;

create trigger tbl_artworks_enforce_limit
before insert on public.tbl_artworks
for each row execute function public.enforce_artwork_limit();

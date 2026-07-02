-- tbl_artworks: one row per artwork, owned by an artist.
-- The 20-artwork cap is enforced here at the database level (not just in
-- application code) so it holds even if an API route has a bug.

create table public.tbl_artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.tbl_artists (id) on delete cascade,
  image_url text not null,
  -- Cloudinary asset id, needed to delete the file from Cloudinary when the
  -- artwork (or the whole artist) is deleted. The URL alone is not enough.
  image_public_id text not null,
  -- Stored at upload time so the gallery can reserve the right space for
  -- each image before it loads (no layout shift).
  image_width integer not null,
  image_height integer not null,
  title text not null,
  description text,
  medium text,
  year_created integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sort_order_range check (sort_order between 0 and 999),
  constraint image_url_length check (char_length(image_url) <= 2048),
  constraint image_public_id_length check (char_length(image_public_id) <= 255),
  constraint image_dimensions_range check (
    image_width between 1 and 10000 and image_height between 1 and 10000
  ),
  constraint title_length check (char_length(title) between 1 and 120),
  constraint description_length check (description is null or char_length(description) <= 500),
  constraint medium_length check (medium is null or char_length(medium) <= 80),
  constraint year_created_range check (year_created is null or year_created between 1900 and 2100)
);

create index tbl_artworks_artist_id_idx on public.tbl_artworks (artist_id);

create trigger tbl_artworks_set_updated_at
before update on public.tbl_artworks
for each row execute function public.set_updated_at();

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

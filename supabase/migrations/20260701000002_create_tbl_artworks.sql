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
  constraint image_url_length check (char_length(image_url) <= 2048),
  constraint title_length check (char_length(title) between 1 and 120),
  constraint description_length check (description is null or char_length(description) <= 500)
);

create index tbl_artworks_artist_id_idx on public.tbl_artworks (artist_id);

create or replace function public.enforce_artwork_limit()
returns trigger as $$
declare
  artwork_count integer;
begin
  select count(*) into artwork_count
  from public.tbl_artworks
  where artist_id = new.artist_id;

  if artwork_count >= 20 then
    raise exception 'Artist already has the maximum of 20 artworks';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger tbl_artworks_enforce_limit
before insert on public.tbl_artworks
for each row execute function public.enforce_artwork_limit();

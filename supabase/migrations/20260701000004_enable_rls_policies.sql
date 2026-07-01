-- Row Level Security. Public visitors can read artist/artwork data with no
-- login. Writes are restricted to the owning artist, checked via
-- auth.uid() on the server side -- never via a client-supplied id.
-- tbl_reports allows anonymous insert only; no public read/update/delete,
-- so reports can only be read via the dashboard with the service_role key.

alter table public.tbl_artists enable row level security;
alter table public.tbl_artworks enable row level security;
alter table public.tbl_reports enable row level security;

-- tbl_artists
create policy "artists_public_read"
  on public.tbl_artists
  for select
  using (true);

create policy "artists_owner_insert"
  on public.tbl_artists
  for insert
  with check (auth.uid() = id);

create policy "artists_owner_update"
  on public.tbl_artists
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "artists_owner_delete"
  on public.tbl_artists
  for delete
  using (auth.uid() = id);

-- tbl_artworks (tbl_artists.id is the same value as auth.uid() for the
-- owning artist, so artist_id can be compared to auth.uid() directly)
create policy "artworks_public_read"
  on public.tbl_artworks
  for select
  using (true);

create policy "artworks_owner_insert"
  on public.tbl_artworks
  for insert
  with check (artist_id = auth.uid());

create policy "artworks_owner_update"
  on public.tbl_artworks
  for update
  using (artist_id = auth.uid())
  with check (artist_id = auth.uid());

create policy "artworks_owner_delete"
  on public.tbl_artworks
  for delete
  using (artist_id = auth.uid());

-- tbl_reports: public insert only, no select/update/delete policy at all
create policy "reports_public_insert"
  on public.tbl_reports
  for insert
  with check (true);

-- tbl_reports: anonymous reports against an artwork. No reporter identity
-- is stored. Only the project owner reads these, via the Supabase
-- dashboard with the service_role key -- never client-side.

create table public.tbl_reports (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.tbl_artworks (id) on delete cascade,
  reason text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint reason_allowed check (reason in ('stolen_art', 'inappropriate', 'other')),
  constraint note_length check (note is null or char_length(note) <= 500)
);

create index tbl_reports_artwork_id_idx on public.tbl_reports (artwork_id);

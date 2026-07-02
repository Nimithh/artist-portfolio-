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

-- Reports can be inserted anonymously with just the anon key, so without a
-- cap someone could flood the table with junk rows and bloat the database.
-- Capping reports per artwork bounds total table size (artworks are already
-- capped at 20 per artist). 50 reports is far more than the owner needs to
-- notice a problem artwork. Real per-visitor rate limiting still belongs in
-- the API route once it exists; this is the database-level backstop.
create or replace function public.enforce_report_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  report_count integer;
begin
  -- Lock the artwork row so concurrent reports for the same artwork run
  -- this check one at a time (same pattern as enforce_artwork_limit).
  perform 1 from public.tbl_artworks where id = new.artwork_id for update;

  select count(*) into report_count
  from public.tbl_reports
  where artwork_id = new.artwork_id;

  if report_count >= 50 then
    raise exception 'This artwork already has the maximum number of reports';
  end if;

  return new;
end;
$$;

create trigger tbl_reports_enforce_limit
before insert on public.tbl_reports
for each row execute function public.enforce_report_limit();

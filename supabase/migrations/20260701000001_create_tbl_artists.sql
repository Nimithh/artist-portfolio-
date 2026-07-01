-- tbl_artists: one row per artist, 1:1 with a Supabase Auth user.
-- id is the same value as auth.users.id, so ownership checks in RLS
-- can compare tbl_artists.id directly to auth.uid() with no join needed.

create extension if not exists pgcrypto;

create table public.tbl_artists (
  id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  bio text,
  photo_url text,
  skills text[] not null default '{}',
  contact_email text,
  instagram_url text,
  facebook_url text,
  x_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  constraint display_name_length check (char_length(display_name) between 1 and 80),
  constraint bio_length check (bio is null or char_length(bio) <= 1000),
  constraint skills_count check (cardinality(skills) <= 15),
  constraint contact_email_length check (contact_email is null or char_length(contact_email) <= 255),
  constraint instagram_url_length check (instagram_url is null or char_length(instagram_url) <= 2048),
  constraint facebook_url_length check (facebook_url is null or char_length(facebook_url) <= 2048),
  constraint x_url_length check (x_url is null or char_length(x_url) <= 2048),
  constraint website_url_length check (website_url is null or char_length(website_url) <= 2048)
);

create index tbl_artists_slug_idx on public.tbl_artists (slug);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tbl_artists_set_updated_at
before update on public.tbl_artists
for each row execute function public.set_updated_at();

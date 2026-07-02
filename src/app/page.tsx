// Homepage: browse all artists, with a simple search by name or skill.

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Artist } from "@/lib/types";

export const dynamic = "force-dynamic";

type ArtistCard = Pick<Artist, "slug" | "display_name" | "photo_url" | "skills" | "bio">;

async function fetchArtists(query: string): Promise<ArtistCard[] | null> {
  try {
    const supabase = await createClient();
    let request = supabase
      .from("tbl_artists")
      .select("slug, display_name, photo_url, skills, bio")
      .order("created_at", { ascending: false })
      .limit(60);

    if (query) {
      // Restrict the search text to safe characters before it goes into the
      // filter string (PostgREST or() filters are string-based).
      const safe = query.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim();
      if (safe) {
        request = request.or(
          `display_name.ilike.%${safe}%,skills.cs.{${safe}}`
        );
      }
    }

    const { data, error } = await request;
    if (error) {
      console.error("Artist list failed:", error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Artist list failed:", error);
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").slice(0, 60);
  const artists = await fetchArtists(query);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Find an <span className="text-accent">artist</span>.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse portfolios from artists and get in touch directly.
        </p>
        <form method="get" action="/" className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name or skill"
              maxLength={60}
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-foreground shadow-sm outline-none transition-shadow focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-10">
        {artists === null ? (
          <p className="text-muted-foreground">
            Could not load artists right now. Please try again in a moment.
          </p>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground">
            {query
              ? `No artists found for "${query}".`
              : "No artists have joined yet. Be the first!"}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist, index) => (
              <li
                key={artist.slug}
                style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
                className="animate-fade-in-up opacity-0"
              >
                <Link
                  href={`/${artist.slug}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {artist.photo_url ? (
                      <Image
                        src={artist.photo_url}
                        alt={artist.display_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-heading text-5xl text-muted-foreground/50">
                          {artist.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground group-hover:text-accent">
                      {artist.display_name}
                    </h2>
                    {artist.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {artist.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground/80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {artist.bio && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{artist.bio}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

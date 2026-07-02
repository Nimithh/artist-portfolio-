// Public artist page: profile header plus artwork gallery. Anyone can view
// this without logging in; each artwork has an anonymous report button.

import Image from "next/image";
import { notFound } from "next/navigation";
import { Globe, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SLUG_REGEX } from "@/lib/validation";
import type { Artist, Artwork } from "@/lib/types";
import ReportButton from "./report-button";
import { FacebookIcon, InstagramIcon, TelegramIcon, XIcon } from "./social-icons";

export const dynamic = "force-dynamic";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!SLUG_REGEX.test(slug) || slug.length > 60) notFound();

  const supabase = await createClient();

  const { data: artist, error: artistError } = await supabase
    .from("tbl_artists")
    .select(
      "id, slug, display_name, bio, photo_url, skills, contact_email, instagram_url, facebook_url, x_url, telegram_url, website_url"
    )
    .eq("slug", slug)
    .maybeSingle<Artist>();

  if (artistError) {
    console.error("Artist page load failed:", artistError.message);
    throw new Error("Failed to load the page");
  }
  if (!artist) notFound();

  const { data: artworks, error: artworksError } = await supabase
    .from("tbl_artworks")
    .select(
      "id, image_url, image_width, image_height, title, description, medium, year_created"
    )
    .eq("artist_id", artist.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Artwork[]>();

  if (artworksError) {
    console.error("Artworks load failed:", artworksError.message);
    throw new Error("Failed to load the page");
  }

  const contactLinks = [
    { href: artist.contact_email ? `mailto:${artist.contact_email}` : null, icon: Mail, label: "Email" },
    { href: artist.instagram_url, icon: InstagramIcon, label: "Instagram" },
    { href: artist.facebook_url, icon: FacebookIcon, label: "Facebook" },
    { href: artist.x_url, icon: XIcon, label: "X" },
    { href: artist.telegram_url, icon: TelegramIcon, label: "Telegram" },
    { href: artist.website_url, icon: Globe, label: "Website" },
  ].filter((link): link is { href: string; icon: typeof Mail; label: string } =>
    Boolean(link.href)
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <section className="animate-fade-in-up flex flex-col items-start gap-6 rounded-2xl border border-border bg-surface p-8 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
          {artist.photo_url ? (
            <Image
              src={artist.photo_url}
              alt={artist.display_name}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-heading text-4xl text-muted-foreground/50">
                {artist.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {artist.display_name}
          </h1>
          {artist.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {artist.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {artist.bio && <p className="mt-3 max-w-2xl text-muted-foreground">{artist.bio}</p>}
          {contactLinks.length > 0 && (
            <div className="mt-4 flex gap-3">
              {contactLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        {!artworks || artworks.length === 0 ? (
          <p className="text-muted-foreground">No artworks here yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {artworks.map((artwork) => (
              <li key={artwork.id} className="group">
                <div className="overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={artwork.image_url}
                    alt={artwork.title}
                    width={artwork.image_width}
                    height={artwork.image_height}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">{artwork.title}</h2>
                    {(artwork.medium || artwork.year_created) && (
                      <p className="text-sm text-muted-foreground">
                        {[artwork.medium, artwork.year_created]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {artwork.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{artwork.description}</p>
                    )}
                  </div>
                  <ReportButton artworkId={artwork.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

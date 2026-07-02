// Artist dashboard: create/edit the profile and manage artworks.
// Server component that checks the session and loads data; the interactive
// parts are in the client components below it.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Artist, Artwork } from "@/lib/types";
import ProfileForm from "./profile-form";
import ArtworkManager from "./artwork-manager";
import SignOutButton from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("tbl_artists")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Artist>();

  if (profileError) {
    console.error("Dashboard profile load failed:", profileError.message);
    throw new Error("Failed to load the dashboard");
  }

  let artworks: Artwork[] = [];
  if (profile) {
    const { data, error } = await supabase
      .from("tbl_artworks")
      .select("*")
      .eq("artist_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Artwork[]>();
    if (error) {
      console.error("Dashboard artworks load failed:", error.message);
      throw new Error("Failed to load the dashboard");
    }
    artworks = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {profile ? "Your dashboard" : "Set up your artist page"}
        </h1>
        <SignOutButton />
      </div>

      {profile && (
        <p className="mt-2 text-sm text-zinc-600">
          Your public page:{" "}
          <Link
            href={`/${profile.slug}`}
            className="inline-flex items-center gap-1 font-medium text-zinc-900 underline"
          >
            /{profile.slug}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-heading text-xl font-semibold">Profile</h2>
        <div className="mt-4 rounded-xl border border-zinc-200 p-5">
          <ProfileForm profile={profile} />
        </div>
      </section>

      {profile ? (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold">Artworks</h2>
          <div className="mt-4">
            <ArtworkManager artworks={artworks} />
          </div>
        </section>
      ) : (
        <p className="mt-8 text-sm text-zinc-600">
          Save your profile first, then you can start adding artworks.
        </p>
      )}
    </main>
  );
}

"use client";

// Create or edit the artist profile. Writes go straight to Supabase with
// the user's session; RLS guarantees they can only touch their own row.
// The profile photo goes through /api/profile/photo (Cloudinary upload).

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  slugify,
  validateDisplayName,
  validateSlug,
} from "@/lib/validation";
import type { Artist } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Artist | null }) {
  const router = useRouter();
  const isNew = profile === null;

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [slug, setSlug] = useState(profile?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [contactEmail, setContactEmail] = useState(profile?.contact_email ?? "");
  const [instagram, setInstagram] = useState(profile?.instagram_url ?? "");
  const [facebook, setFacebook] = useState(profile?.facebook_url ?? "");
  const [xUrl, setXUrl] = useState(profile?.x_url ?? "");
  const [telegram, setTelegram] = useState(profile?.telegram_url ?? "");
  const [website, setWebsite] = useState(profile?.website_url ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function onNameChange(value: string) {
    setDisplayName(value);
    if (isNew && !slugTouched) setSlug(slugify(value));
  }

  function parseSkills(): string[] | string {
    const list = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (list.length > 15) return "You can list up to 15 skills.";
    return list;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const name = displayName.trim();
    const cleanSlug = slug.trim();
    const nameError = validateDisplayName(name);
    if (nameError) return setError(nameError);
    const slugError = validateSlug(cleanSlug);
    if (slugError) return setError(slugError);
    const skillList = parseSkills();
    if (typeof skillList === "string") return setError(skillList);
    if (bio.length > 1000) return setError("Bio must be 1000 characters or fewer.");

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session expired. Please log in again.");
      setSaving(false);
      return;
    }

    const values = {
      slug: cleanSlug,
      display_name: name,
      bio: bio.trim() || null,
      skills: skillList,
      contact_email: contactEmail.trim() || null,
      instagram_url: instagram.trim() || null,
      facebook_url: facebook.trim() || null,
      x_url: xUrl.trim() || null,
      telegram_url: telegram.trim() || null,
      website_url: website.trim() || null,
    };

    const { error: writeError } = isNew
      ? await supabase.from("tbl_artists").insert({ id: user.id, ...values })
      : await supabase.from("tbl_artists").update(values).eq("id", user.id);

    if (writeError) {
      console.error("Profile save failed:", writeError.message);
      if (writeError.code === "23505") {
        setError("That URL name is already taken. Please pick another one.");
      } else {
        setError("Could not save the profile. Please check the fields and try again.");
      }
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body: form,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error ?? "Could not upload the photo.");
      } else {
        setPhotoUrl(body.photoUrl);
        router.refresh();
      }
    } catch {
      setError("Could not upload the photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent";

  return (
    <form onSubmit={save} className="space-y-4">
      {!isNew && (
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
            {photoUrl ? (
              <Image src={photoUrl} alt="Profile photo" fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-heading text-2xl text-muted-foreground/50">
                  {displayName.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadPhoto(file);
              }}
            />
            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() => fileInput.current?.click()}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Change photo
            </button>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP, up to 5 MB.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="display_name" className="text-sm font-medium text-foreground">
            Display name
          </label>
          <input
            id="display_name"
            type="text"
            required
            maxLength={80}
            value={displayName}
            onChange={(event) => onNameChange(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="slug" className="text-sm font-medium text-foreground">
            Page URL name
          </label>
          <input
            id="slug"
            type="text"
            required
            maxLength={60}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value.toLowerCase());
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Your page will be at /{slug || "your-name"}. Lowercase letters, numbers, dashes.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={1000}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="skills" className="text-sm font-medium text-foreground">
          Skills (separated by commas, up to 15)
        </label>
        <input
          id="skills"
          type="text"
          placeholder="watercolor, portraits, digital art"
          value={skills}
          onChange={(event) => setSkills(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact_email" className="text-sm font-medium text-foreground">
            Contact email
          </label>
          <input
            id="contact_email"
            type="email"
            maxLength={255}
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="instagram" className="text-sm font-medium text-foreground">
            Instagram URL (optional)
          </label>
          <input
            id="instagram"
            type="text"
            placeholder="https://instagram.com/yourname"
            maxLength={2048}
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="facebook" className="text-sm font-medium text-foreground">
            Facebook URL (optional)
          </label>
          <input
            id="facebook"
            type="text"
            placeholder="https://facebook.com/yourname"
            maxLength={2048}
            value={facebook}
            onChange={(event) => setFacebook(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="x_url" className="text-sm font-medium text-foreground">
            X URL (optional)
          </label>
          <input
            id="x_url"
            type="text"
            placeholder="https://x.com/yourname"
            maxLength={2048}
            value={xUrl}
            onChange={(event) => setXUrl(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="telegram" className="text-sm font-medium text-foreground">
            Telegram URL (optional)
          </label>
          <input
            id="telegram"
            type="text"
            placeholder="https://t.me/yourname"
            maxLength={2048}
            value={telegram}
            onChange={(event) => setTelegram(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="website" className="text-sm font-medium text-foreground">
            Website URL (optional)
          </label>
          <input
            id="website"
            type="text"
            placeholder="https://yoursite.com"
            maxLength={2048}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Profile saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {isNew ? "Create my page" : "Save profile"}
      </button>
    </form>
  );
}

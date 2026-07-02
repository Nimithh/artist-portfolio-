"use client";

// Upload, edit, reorder, and delete artworks. Uploads and deletes go
// through the API routes (they touch Cloudinary); text edits and
// reordering write to Supabase directly under RLS.

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ARTWORK_LIMIT, validateArtworkFields } from "@/lib/validation";
import type { Artwork } from "@/lib/types";

export default function ArtworkManager({ artworks }: { artworks: Artwork[] }) {
  const router = useRouter();
  const atLimit = artworks.length >= ARTWORK_LIMIT;

  // upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [medium, setMedium] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // per-item state
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    setUploadError(null);

    if (!file) return setUploadError("Please choose an image file.");
    const fieldError = validateArtworkFields({
      title: title.trim(),
      description: description.trim(),
      medium: medium.trim(),
      year: year.trim(),
    });
    if (fieldError) return setUploadError(fieldError);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("medium", medium.trim());
      form.append("year", year.trim());

      const response = await fetch("/api/artworks", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setUploadError(body.error ?? "Could not upload the artwork. Please try again.");
      } else {
        setTitle("");
        setDescription("");
        setMedium("");
        setYear("");
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        router.refresh();
      }
    } catch {
      setUploadError("Could not upload the artwork. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(artwork: Artwork) {
    if (!window.confirm(`Delete "${artwork.title}"? This cannot be undone.`)) return;
    setBusyId(artwork.id);
    setListError(null);
    try {
      const response = await fetch(`/api/artworks/${artwork.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setListError(body.error ?? "Could not delete the artwork.");
      } else {
        router.refresh();
      }
    } catch {
      setListError("Could not delete the artwork. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= artworks.length) return;
    const a = artworks[index];
    const b = artworks[other];
    setBusyId(a.id);
    setListError(null);

    const supabase = createClient();
    const [first, second] = await Promise.all([
      supabase.from("tbl_artworks").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("tbl_artworks").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (first.error || second.error) {
      console.error("Reorder failed:", first.error?.message, second.error?.message);
      setListError("Could not reorder. Please try again.");
    }
    setBusyId(null);
    router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 p-2.5 text-sm outline-none focus:border-zinc-500";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Add artwork</h3>
          <span className="text-sm text-zinc-500">
            {artworks.length} of {ARTWORK_LIMIT}
          </span>
        </div>

        {atLimit ? (
          <p className="mt-3 text-sm text-zinc-600">
            You have reached the limit of {ARTWORK_LIMIT} artworks. Delete one to
            add another.
          </p>
        ) : (
          <form onSubmit={upload} className="mt-4 space-y-4">
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:text-zinc-700 hover:file:bg-zinc-200"
              />
              <p className="mt-1 text-xs text-zinc-500">JPEG, PNG, or WebP, up to 10 MB.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="art_title" className="text-sm font-medium text-zinc-700">
                  Title
                </label>
                <input
                  id="art_title"
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="art_medium" className="text-sm font-medium text-zinc-700">
                  Medium (optional)
                </label>
                <input
                  id="art_medium"
                  type="text"
                  maxLength={80}
                  placeholder="oil on canvas, digital, ..."
                  value={medium}
                  onChange={(event) => setMedium(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="art_year" className="text-sm font-medium text-zinc-700">
                  Year (optional)
                </label>
                <input
                  id="art_year"
                  type="number"
                  min={1900}
                  max={2100}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="art_description" className="text-sm font-medium text-zinc-700">
                Description (optional)
              </label>
              <textarea
                id="art_description"
                rows={2}
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={inputClass}
              />
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload artwork
            </button>
          </form>
        )}
      </div>

      {listError && <p className="text-sm text-red-600">{listError}</p>}

      {artworks.length === 0 ? (
        <p className="text-sm text-zinc-600">No artworks yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-3">
          {artworks.map((artwork, index) => (
            <li
              key={artwork.id}
              className="flex items-start gap-4 rounded-xl border border-zinc-200 p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <Image
                  src={artwork.image_url}
                  alt={artwork.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              {editingId === artwork.id ? (
                <EditForm
                  artwork={artwork}
                  onClose={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{artwork.title}</h4>
                    {(artwork.medium || artwork.year_created) && (
                      <p className="text-sm text-zinc-500">
                        {[artwork.medium, artwork.year_created].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {artwork.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                        {artwork.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busyId !== null || index === 0}
                      aria-label="Move up"
                      title="Move up"
                      className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busyId !== null || index === artworks.length - 1}
                      aria-label="Move down"
                      title="Move down"
                      className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(artwork.id)}
                      disabled={busyId !== null}
                      aria-label="Edit"
                      title="Edit"
                      className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(artwork)}
                      disabled={busyId !== null}
                      aria-label="Delete"
                      title="Delete"
                      className="rounded-full p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    >
                      {busyId === artwork.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditForm({
  artwork,
  onClose,
  onSaved,
}: {
  artwork: Artwork;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(artwork.title);
  const [description, setDescription] = useState(artwork.description ?? "");
  const [medium, setMedium] = useState(artwork.medium ?? "");
  const [year, setYear] = useState(
    artwork.year_created === null ? "" : String(artwork.year_created)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const fieldError = validateArtworkFields({
      title: title.trim(),
      description: description.trim(),
      medium: medium.trim(),
      year: year.trim(),
    });
    if (fieldError) return setError(fieldError);

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("tbl_artworks")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        medium: medium.trim() || null,
        year_created: year.trim() === "" ? null : Number(year),
      })
      .eq("id", artwork.id);

    if (updateError) {
      console.error("Artwork update failed:", updateError.message);
      setError("Could not save the changes. Please try again.");
      setSaving(false);
      return;
    }
    onSaved();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 p-2 text-sm outline-none focus:border-zinc-500";

  return (
    <form onSubmit={save} className="flex-1 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700">Edit artwork</h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        type="text"
        required
        maxLength={120}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className={inputClass}
        placeholder="Title"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          maxLength={80}
          value={medium}
          onChange={(event) => setMedium(event.target.value)}
          className={inputClass}
          placeholder="Medium"
        />
        <input
          type="number"
          min={1900}
          max={2100}
          value={year}
          onChange={(event) => setYear(event.target.value)}
          className={inputClass}
          placeholder="Year"
        />
      </div>
      <textarea
        rows={2}
        maxLength={500}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className={inputClass}
        placeholder="Description"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </button>
    </form>
  );
}

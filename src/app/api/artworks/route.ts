// Artwork upload. Requires a logged-in session; the file is validated
// server-side (size and real content type), stored in Cloudinary, and the
// row is inserted with the caller's own session so RLS and the database
// cap both apply.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import {
  ARTWORK_LIMIT,
  MAX_IMAGE_BYTES,
  sniffImageType,
  validateArtworkFields,
} from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You need to log in first." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const medium = String(form.get("medium") ?? "").trim();
  const year = String(form.get("year") ?? "").trim();

  const fieldError = validateArtworkFields({ title, description, medium, year });
  if (fieldError) {
    return NextResponse.json({ error: fieldError }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Maximum size is 10 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!sniffImageType(new Uint8Array(buffer))) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are supported." },
      { status: 400 }
    );
  }

  // Friendly pre-check for the cap. The database trigger is the real
  // enforcement; this just avoids uploading a file we would throw away.
  const { count, error: countError } = await supabase
    .from("tbl_artworks")
    .select("id", { count: "exact", head: true })
    .eq("artist_id", user.id);
  if (countError) {
    console.error("Artwork count failed:", countError.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if ((count ?? 0) >= ARTWORK_LIMIT) {
    return NextResponse.json(
      { error: `You have reached the limit of ${ARTWORK_LIMIT} artworks.` },
      { status: 400 }
    );
  }

  let uploaded;
  try {
    uploaded = await uploadImage(buffer, "artworks");
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: "Could not upload the image. Please try again." },
      { status: 500 }
    );
  }

  const { data: artwork, error: insertError } = await supabase
    .from("tbl_artworks")
    .insert({
      artist_id: user.id,
      image_url: uploaded.url,
      image_public_id: uploaded.publicId,
      image_width: uploaded.width,
      image_height: uploaded.height,
      title,
      description: description || null,
      medium: medium || null,
      year_created: year === "" ? null : Number(year),
      sort_order: count ?? 0,
    })
    .select()
    .single();

  if (insertError) {
    // Don't leave an orphaned file in Cloudinary if the row was rejected
    // (e.g. two uploads raced and the cap trigger stopped this one).
    await deleteImage(uploaded.publicId);
    console.error("Artwork insert failed:", insertError.message);
    return NextResponse.json(
      { error: "Could not save the artwork. Please try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ artwork });
}

// Profile photo upload. Same validation as artwork images, smaller size
// cap. Replaces the old photo in Cloudinary once the new one is saved.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { sniffImageType } from "@/lib/validation";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

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
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "Photo is too large. Maximum size is 5 MB." },
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

  const { data: profile, error: profileError } = await supabase
    .from("tbl_artists")
    .select("photo_public_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Profile lookup failed:", profileError.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json(
      { error: "Create your profile before adding a photo." },
      { status: 400 }
    );
  }

  let uploaded;
  try {
    uploaded = await uploadImage(buffer, "profile-photos");
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: "Could not upload the photo. Please try again." },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("tbl_artists")
    .update({ photo_url: uploaded.url, photo_public_id: uploaded.publicId })
    .eq("id", user.id);

  if (updateError) {
    await deleteImage(uploaded.publicId);
    console.error("Profile photo update failed:", updateError.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }

  if (profile.photo_public_id) {
    await deleteImage(profile.photo_public_id);
  }

  return NextResponse.json({ photoUrl: uploaded.url });
}

// Artwork deletion. The delete runs with the caller's session and is
// filtered by both the id and the caller's own artist id, with RLS on top,
// so nobody can delete someone else's artwork. The Cloudinary file is
// removed after the row is gone.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteImage } from "@/lib/cloudinary";
import { UUID_REGEX } from "@/lib/validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You need to log in first." }, { status: 401 });
  }

  const { data: deleted, error } = await supabase
    .from("tbl_artworks")
    .delete()
    .eq("id", id)
    .eq("artist_id", user.id)
    .select("image_public_id");

  if (error) {
    console.error("Artwork delete failed:", error.message);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  }

  await deleteImage(deleted[0].image_public_id);
  return NextResponse.json({ ok: true });
}

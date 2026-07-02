// Anonymous artwork reports. Rate-limited per IP, validated server-side,
// inserted with the anon client (RLS allows insert only -- reports can
// never be read back through the API).

import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { REPORT_REASONS, UUID_REGEX } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`report:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many reports from your connection. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { artworkId, reason, note } = (body ?? {}) as {
    artworkId?: unknown;
    reason?: unknown;
    note?: unknown;
  };

  if (typeof artworkId !== "string" || !UUID_REGEX.test(artworkId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    typeof reason !== "string" ||
    !REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const cleanNote =
    typeof note === "string" && note.trim() !== "" ? note.trim().slice(0, 500) : null;

  const supabase = createAnonClient();
  const { error } = await supabase.from("tbl_reports").insert({
    artwork_id: artworkId,
    reason,
    note: cleanNote,
  });

  if (error) {
    // Covers both a bad artwork id (foreign key) and the per-artwork report
    // cap. Details stay in the server log; the visitor gets a generic reply.
    console.error("Report insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not submit the report. Please try again later." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

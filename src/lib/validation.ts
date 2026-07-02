// Shared input validation. The database enforces all of this again through
// constraints, so these checks exist to give users friendly error messages
// before a request ever reaches Postgres. Server routes must always call
// these -- never trust what the browser sends.

export const ARTWORK_LIMIT = 20;

// Must stay in sync with the slug_not_reserved constraint in
// supabase/migrations/20260701000001_create_tbl_artists.sql.
export const RESERVED_SLUGS = [
  "admin", "api", "auth", "login", "logout", "signup", "signin", "register",
  "settings", "account", "dashboard", "profile", "artist", "artists",
  "artwork", "artworks", "report", "reports", "about", "contact", "help",
  "terms", "privacy", "search", "new", "edit", "home", "static", "assets",
  "public",
];

export const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const REPORT_REASONS = ["stolen_art", "inappropriate", "other"] as const;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function validateSlug(slug: string): string | null {
  if (!SLUG_REGEX.test(slug) || slug.length > 60) {
    return "URL name can only use lowercase letters, numbers, and dashes.";
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return "That URL name is reserved. Please pick another one.";
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (name.length < 1 || name.length > 80) {
    return "Display name must be between 1 and 80 characters.";
  }
  return null;
}

export function validateArtworkFields(fields: {
  title: string;
  description: string;
  medium: string;
  year: string;
}): string | null {
  if (fields.title.length < 1 || fields.title.length > 120) {
    return "Title must be between 1 and 120 characters.";
  }
  if (fields.description.length > 500) {
    return "Description must be 500 characters or fewer.";
  }
  if (fields.medium.length > 80) {
    return "Medium must be 80 characters or fewer.";
  }
  if (fields.year !== "") {
    const y = Number(fields.year);
    if (!Number.isInteger(y) || y < 1900 || y > 2100) {
      return "Year must be a number between 1900 and 2100.";
    }
  }
  return null;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Checks the file's real starting bytes, not just the mime type the browser
// claims, so a renamed non-image file is rejected server-side.
export function sniffImageType(bytes: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

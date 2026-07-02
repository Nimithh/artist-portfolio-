// Row shapes matching the tables in supabase/migrations/.

export type Artist = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  photo_public_id: string | null;
  skills: string[];
  contact_email: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Artwork = {
  id: string;
  artist_id: string;
  image_url: string;
  image_public_id: string;
  image_width: number;
  image_height: number;
  title: string;
  description: string | null;
  medium: string | null;
  year_created: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ReportReason = "stolen_art" | "inappropriate" | "other";

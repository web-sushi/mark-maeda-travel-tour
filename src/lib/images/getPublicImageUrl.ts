// Helper to convert Supabase Storage path to public URL
import { supabase } from "@/lib/supabase/client";

/**
 * Get public URL for a Supabase Storage path
 * @param bucket - Storage bucket name (e.g., "public-images")
 * @param path - Storage path (e.g., "tours/123/cover.jpg")
 * @returns Public URL or null if no path provided
 */
export function getPublicImageUrl(
  bucket: string,
  path?: string | null
): string | null {
  if (!path) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

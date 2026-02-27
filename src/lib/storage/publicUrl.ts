/**
 * Convert a Supabase Storage path to a public URL
 * @param path - Storage path (e.g., "tours/123/cover-1234.jpg")
 * @returns Public URL or null if no path provided
 */
export function getPublicImageUrl(path?: string | null): string | null {
  if (!path) return null;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL not configured");
    return null;
  }
  
  // Build the public URL directly
  // Format: https://<project-ref>.supabase.co/storage/v1/object/public/public-images/<path>
  return `${supabaseUrl}/storage/v1/object/public/public-images/${path}`;
}

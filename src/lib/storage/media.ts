// Supabase Storage helper for media uploads
// Uses single bucket: public-images
// Path structure: tours/{id}/cover-{timestamp}.ext or tours/{id}/gallery-{timestamp}.ext

import { STORAGE_BUCKET } from "./constants";

export { STORAGE_BUCKET };

type MediaKind = "tours" | "transfers" | "packages";
type MediaFolder = "cover" | "gallery";

/**
 * Build organized media path for storage
 * @param kind - Resource type (tours/transfers/packages)
 * @param id - Resource ID
 * @param fileName - Original file name
 * @param folder - Folder type (cover/gallery)
 * @returns Storage path like "tours/{id}/cover-{timestamp}.ext"
 */
export function buildMediaPath(
  kind: MediaKind,
  id: string,
  fileName: string,
  folder: MediaFolder
): string {
  // Extract extension from filename
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now();
  
  // Build path: tours/{id}/cover-{timestamp}.ext
  return `${kind}/${id}/${folder}-${timestamp}.${ext}`;
}

/**
 * Get public URL for a media path
 * @param path - Storage path (e.g., "tours/123/cover-123456.jpg")
 * @returns Public URL
 */
export function getPublicMediaUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Cannot build media URL."
    );
  }

  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/**
 * Extract path from public URL (inverse of getPublicMediaUrl)
 * @param url - Public URL
 * @returns Storage path or null if invalid
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/public-images\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

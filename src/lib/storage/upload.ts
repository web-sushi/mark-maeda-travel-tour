// Shared Supabase Storage upload helpers
import { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "./constants";

interface UploadFileOptions {
  supabase: SupabaseClient;
  path: string;
  file: File;
  upsert?: boolean;
}

interface UploadFileResult {
  path: string;
}

/**
 * Upload a file to Supabase Storage
 * @param options - Upload options
 * @returns Object with path
 * @throws Error with detailed message if upload fails
 */
export async function uploadFile({
  supabase,
  path,
  file,
  upsert = false,
}: UploadFileOptions): Promise<UploadFileResult> {
  console.log(`[storage upload] bucket: ${STORAGE_BUCKET}, path: ${path}, size: ${file.size}`);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert,
    });

  if (error) {
    console.error("[storage upload error]", {
      bucket: STORAGE_BUCKET,
      path,
      error: error.message,
      code: error.statusCode,
    });
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log(`[storage upload success] path: ${data.path}`);
  return { path: data.path };
}

interface GetPublicUrlOptions {
  supabase: SupabaseClient;
  path: string;
}

/**
 * Get public URL for a file in Supabase Storage
 * @param options - Options with supabase client and path
 * @returns Public URL string
 */
export function getPublicUrl({
  supabase,
  path,
}: GetPublicUrlOptions): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param supabase - Supabase client
 * @param path - Storage path to delete
 * @returns True if successful, false otherwise
 */
export async function deleteFile(
  supabase: SupabaseClient,
  path: string
): Promise<boolean> {
  console.log(`[storage delete] bucket: ${STORAGE_BUCKET}, path: ${path}`);

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error("[storage delete error]", {
      bucket: STORAGE_BUCKET,
      path,
      error: error.message,
    });
    return false;
  }

  console.log(`[storage delete success] path: ${path}`);
  return true;
}

// Supabase Storage helper for uploading public images
// Uses single bucket: public-images

import { supabase } from "./client";
import { STORAGE_BUCKET } from "../storage/constants";

type ImageFolder = "tours" | "transfers" | "packages";

/**
 * Upload an image file to Supabase Storage public bucket
 * @param file - Image file to upload
 * @param folder - Folder within bucket (tours/transfers/packages)
 * @returns Public URL of uploaded image
 * @throws Error if upload fails
 */
export async function uploadPublicImage(
  file: File,
  folder: ImageFolder
): Promise<string> {
  // Validate file is an image
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("Image must be less than 5MB");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Upload to storage bucket
  console.log(`[storage] Uploading to bucket: ${STORAGE_BUCKET}, path: ${filePath}`);
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error("[storage upload error]", {
      bucket: STORAGE_BUCKET,
      path: filePath,
      error: error.message,
      code: error.statusCode,
    });
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

  console.log(`[storage] Upload success: ${data.path}`);
  return publicUrl;
}

/**
 * Upload an image and return the storage path (not full URL)
 * Use this for storing in database columns like cover_image_path
 * @param file - Image file to upload
 * @param folder - Folder within bucket (tours/transfers/packages)
 * @returns Storage path (e.g., "transfers/123-abc.jpg")
 * @throws Error if upload fails
 */
export async function uploadPublicImagePath(
  file: File,
  folder: ImageFolder
): Promise<string> {
  // Validate file is an image
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("Image must be less than 5MB");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Upload to storage bucket
  console.log(`[storage] Uploading to bucket: ${STORAGE_BUCKET}, path: ${filePath}`);
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error("[storage upload error]", {
      bucket: STORAGE_BUCKET,
      path: filePath,
      error: error.message,
      code: error.statusCode,
    });
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log(`[storage] Upload success, path: ${data.path}`);
  // Return the storage path, NOT the full URL
  return data.path;
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image to delete
 * @returns true if deleted, false if failed
 */
export async function deletePublicImage(url: string): Promise<boolean> {
  try {
    // Extract path from public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/{STORAGE_BUCKET}/<path>
    const urlParts = url.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length !== 2) {
      console.warn("[storage] Invalid storage URL format:", url);
      return false;
    }

    const filePath = urlParts[1];
    
    console.log(`[storage] Deleting from bucket: ${STORAGE_BUCKET}, path: ${filePath}`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("[storage delete error]", {
        bucket: STORAGE_BUCKET,
        path: filePath,
        error: error.message,
      });
      return false;
    }

    console.log(`[storage] Delete success: ${filePath}`);
    return true;
  } catch (err) {
    console.error("[storage] Delete failed:", err);
    return false;
  }
}

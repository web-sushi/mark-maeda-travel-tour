"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { buildMediaPath, getPublicMediaUrl } from "@/lib/storage/media";
import { uploadFile, deleteFile } from "@/lib/storage/upload";
import Button from "@/components/ui/Button";

type MediaKind = "tours" | "transfers" | "packages";
type MediaMode = "cover" | "gallery";

interface ImageUploaderProps {
  kind: MediaKind;
  itemId: string;
  label: string;
  valuePath: string | null;
  onChangePath: (nextPath: string | null) => void;
  mode: MediaMode;
}

export default function ImageUploader({
  kind,
  itemId,
  label,
  valuePath,
  onChangePath,
  mode,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Build storage path
      const storagePath = buildMediaPath(kind, itemId, file.name, mode);

      // Upload to Supabase Storage using shared helper
      const { path } = await uploadFile({
        supabase,
        path: storagePath,
        file,
        upsert: false,
      });

      // Update parent with new path
      onChangePath(path);

      // Clear file input
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!valuePath) return;

    setError(null);

    try {
      // Delete from storage using shared helper
      await deleteFile(supabase, valuePath);

      // Clear path
      onChangePath(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Preview */}
      {valuePath && (
        <div className="relative w-full max-w-md">
          <img
            src={getPublicMediaUrl(valuePath)}
            alt={label}
            className="w-full h-48 object-cover rounded border border-gray-300"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.alt = "Failed to load image";
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            className="mt-2"
          >
            Remove Image
          </Button>
        </div>
      )}

      {/* File Input */}
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          Upload to Supabase Storage (max 5MB, replaces existing)
        </p>
      </div>

      {/* Status */}
      {uploading && (
        <p className="text-sm text-blue-600">Uploading...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

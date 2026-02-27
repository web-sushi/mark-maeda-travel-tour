"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { buildMediaPath, getPublicMediaUrl } from "@/lib/storage/media";
import { uploadFile, deleteFile } from "@/lib/storage/upload";
import Button from "@/components/ui/Button";

type MediaKind = "tours" | "transfers" | "packages";

interface GalleryUploaderProps {
  kind: MediaKind;
  itemId: string;
  label: string;
  valuePaths: string[];
  onChangePaths: (paths: string[]) => void;
}

export default function GalleryUploader({
  kind,
  itemId,
  label,
  valuePaths,
  onChangePaths,
}: GalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`${file.name} is larger than 5MB`);
        }

        // Build storage path
        const storagePath = buildMediaPath(kind, itemId, file.name, "gallery");

        // Upload to Supabase Storage using shared helper
        const { path } = await uploadFile({
          supabase,
          path: storagePath,
          file,
          upsert: false,
        });

        return path;
      });

      const newPaths = await Promise.all(uploadPromises);
      
      // Add new paths to existing ones
      onChangePaths([...valuePaths, ...newPaths]);

      // Clear file input
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (pathToRemove: string, index: number) => {
    setError(null);

    try {
      // Delete from storage using shared helper
      await deleteFile(supabase, pathToRemove);

      // Remove from array
      onChangePaths(valuePaths.filter((_, i) => i !== index));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Gallery Grid */}
      {valuePaths.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {valuePaths.map((path, index) => (
            <div key={index} className="relative group">
              <img
                src={getPublicMediaUrl(path)}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-32 object-cover rounded border border-gray-300"
                onError={(e) => {
                  e.currentTarget.src = "";
                  e.currentTarget.alt = "Failed to load";
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(path, index)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          Upload multiple images to gallery (max 5MB each)
        </p>
      </div>

      {/* Status */}
      {uploading && (
        <p className="text-sm text-blue-600">Uploading images...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

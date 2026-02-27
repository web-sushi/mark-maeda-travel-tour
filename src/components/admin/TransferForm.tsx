"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { uploadPublicImage, uploadPublicImagePath } from "@/lib/supabase/storage";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Transfer } from "@/types/transfer";
import { sanitizeSlug } from "@/utils/slug";
import VehicleRatesEditor from "./VehicleRatesEditor";
import { VehicleRates } from "@/types/vehicle";

interface TransferFormData {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  pricing_model: string;
  from_area: string;
  to_area: string;
  base_price_jpy: number;
  vehicle_rates: VehicleRates | null;
  notes: string;
  status: "active" | "off_season" | "archived";
  cover_image_path: string | null;
  images: string;
  display_order: number;
}

interface TransferFormProps {
  mode: "new" | "edit";
  transferId?: string;
  initialData?: Transfer | null;
}

export default function TransferForm({
  mode,
  transferId,
  initialData,
}: TransferFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TransferFormData>(
    initialData
      ? {
          title: initialData.title || "",
          slug: initialData.slug || "",
          short_description: initialData.short_description || "",
          description: initialData.description || "",
          category: initialData.category || "",
          pricing_model: (initialData as any).pricing_model || "fixed",
          from_area: initialData.from_area || "",
          to_area: initialData.to_area || "",
          base_price_jpy: initialData.base_price_jpy || 0,
          vehicle_rates: initialData.vehicle_rates || { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          notes: initialData.notes || "",
          status: initialData.status || "active",
          cover_image_path: (initialData as any).cover_image_path || null,
          images: Array.isArray(initialData.images)
            ? initialData.images.join(", ")
            : "",
          display_order: initialData.display_order || 0,
        }
      : {
          title: "",
          slug: "",
          short_description: "",
          description: "",
          category: "",
          pricing_model: "fixed",
          from_area: "",
          to_area: "",
          base_price_jpy: 0,
          vehicle_rates: { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          notes: "",
          status: "active",
          cover_image_path: null,
          images: "",
          display_order: 0,
        }
  );

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Upload and get storage path (not full URL)
      const storagePath = await uploadPublicImagePath(file, "transfers");
      
      console.log('[Admin Transfer] Cover image uploaded, path:', storagePath);
      
      setFormData({ ...formData, cover_image_path: storagePath });
      e.target.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Cover image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadPublicImage(file, "transfers");
      
      const existingImages = formData.images.trim();
      const newImages = existingImages
        ? `${existingImages}, ${publicUrl}`
        : publicUrl;
      
      setFormData({ ...formData, images: newImages });
      e.target.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Slug is required");
      return;
    }

    if (!formData.category.trim()) {
      setError("Category is required");
      return;
    }

    if (formData.base_price_jpy < 0) {
      setError("Price must be >= 0");
      return;
    }

    // Ensure vehicle_rates exists with all 5 keys
    const vehicleRates: VehicleRates = {
      v8: formData.vehicle_rates?.v8 ?? 0,
      v10: formData.vehicle_rates?.v10 ?? 0,
      v14: formData.vehicle_rates?.v14 ?? 0,
      coaster: formData.vehicle_rates?.coaster ?? 0,
      bigbus: formData.vehicle_rates?.bigbus ?? 0,
    };

    setSaving(true);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: sanitizeSlug(formData.slug),
        short_description: formData.short_description.trim() || null,
        description: formData.description.trim() || null,
        category: formData.category.trim(),
        pricing_model: formData.pricing_model,
        from_area: formData.from_area.trim() || null,
        to_area: formData.to_area.trim() || null,
        base_price_jpy: formData.base_price_jpy, // Legacy reference price (not used in checkout)
        vehicle_rates: vehicleRates,
        notes: formData.notes.trim() || null,
        status: formData.status,
        cover_image_path: formData.cover_image_path, // NEW: Storage path for cover image
        images: formData.images
          ? formData.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        display_order: formData.display_order,
      };

      // Debug log to verify payload includes description fields
      console.log("[Admin Transfer Form] Save payload:", {
        mode,
        transferId,
        title: payload.title,
        short_description: payload.short_description,
        description: payload.description,
        cover_image_path: payload.cover_image_path,
        hasShortDesc: !!payload.short_description,
        hasDescription: !!payload.description,
        hasCoverImage: !!payload.cover_image_path,
      });

      if (mode === "new") {
        const { data, error } = await supabase
          .from("transfers")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data?.id) {
          setSuccess(true);
          setTimeout(() => {
            router.replace(`/admin/transfers/${data.id}`);
          }, 1500);
        }
      } else {
        if (!transferId) {
          throw new Error("Transfer ID is required for edit mode");
        }
        const { error } = await supabase
          .from("transfers")
          .update(payload)
          .eq("id", transferId);
        if (error) throw error;
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transfer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Transfer {mode === "new" ? "created" : "updated"} successfully!
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Input
            label="Slug *"
            value={formData.slug}
            onChange={(e) => {
              const sanitized = sanitizeSlug(e.target.value);
              setFormData({ ...formData, slug: sanitized });
            }}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Auto-formatted to a URL-safe slug.
          </p>
        </div>

        <div>
          <Input
            label="Short Description"
            value={formData.short_description}
            onChange={(e) =>
              setFormData({ ...formData, short_description: e.target.value })
            }
            placeholder="Brief one-line description for cards/previews"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={6}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Full description with details, route information, etc."
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a category</option>
            <option value="airport_transfer">Airport Transfer</option>
            <option value="city_to_city_transfer">City to City Transfer</option>
            <option value="theme_park_transfer">Theme Park Transfer</option>
            <option value="cruise_port_transfer">Cruise Port Transfer</option>
            <option value="station_transfer">Station Transfer</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Pricing Model *
          </label>
          <select
            value={formData.pricing_model}
            onChange={(e) =>
              setFormData({ ...formData, pricing_model: e.target.value })
            }
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="fixed">Fixed - Show vehicle pricing selector</option>
            <option value="quote">Quote - Show request quote form</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Fixed pricing shows vehicle selector. Quote pricing shows contact form.
          </p>
        </div>

        <div>
          <Input
            label="From Area"
            value={formData.from_area}
            onChange={(e) =>
              setFormData({ ...formData, from_area: e.target.value })
            }
          />
        </div>

        <div>
          <Input
            label="To Area"
            value={formData.to_area}
            onChange={(e) =>
              setFormData({ ...formData, to_area: e.target.value })
            }
          />
        </div>

        <div>
          <Input
            label="Base Price (JPY)"
            type="number"
            min="0"
            value={formData.base_price_jpy}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_price_jpy: e.target.value ? parseFloat(e.target.value) : 0,
              })
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Legacy reference price (not used in checkout)
          </p>
        </div>

        <div className="pt-4 border-t">
          <VehicleRatesEditor
            value={formData.vehicle_rates}
            onChange={(rates) => setFormData({ ...formData, vehicle_rates: rates })}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "off_season" | "archived",
              })
            }
            className="w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="off_season">Off Season</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Cover Image *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Main image shown on transfer cards and detail page
          </p>

          {/* Cover Image Preview */}
          {formData.cover_image_path && (
            <div className="mb-3">
              <div className="relative w-full max-w-md aspect-video bg-gray-100 rounded overflow-hidden">
                <img
                  src={getPublicImageUrl(formData.cover_image_path) || ''}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.alt = "Failed to load";
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cover_image_path: null })}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove cover image
              </button>
            </div>
          )}

          {/* Cover Image Upload */}
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </label>
            {uploading && (
              <p className="mt-1 text-sm text-blue-600">Uploading...</p>
            )}
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Gallery Images (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Additional images for the transfer detail page gallery
          </p>

          {/* File Upload */}
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </label>
            {uploading && (
              <p className="mt-1 text-sm text-blue-600">Uploading...</p>
            )}
            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Upload to Supabase Storage (max 5MB)
            </p>
          </div>

          {/* Manual URL Input (Fallback) */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Or paste URLs manually:</p>
            <Input
              value={formData.images}
              onChange={(e) =>
                setFormData({ ...formData, images: e.target.value })
              }
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
            />
          </div>

          {/* Image Preview */}
          {formData.images && (
            <div className="grid grid-cols-3 gap-2">
              {formData.images
                .split(",")
                .map((url) => url.trim())
                .filter(Boolean)
                .map((url, idx) => (
                  <div key={idx} className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load";
                      }}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <Input
            label="Display Order"
            type="number"
            value={formData.display_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: e.target.value ? parseInt(e.target.value) : 0,
              })
            }
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Link href="/admin/transfers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

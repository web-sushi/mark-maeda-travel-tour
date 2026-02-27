"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeSlug } from "@/utils/slug";
import VehicleRatesEditor from "./VehicleRatesEditor";
import ImageUploader from "./ImageUploader";
import GalleryUploader from "./GalleryUploader";
import { VehicleRates } from "@/types/vehicle";

interface TourFormData {
  title: string;
  slug: string;
  description: string;
  region: string;
  duration_hours: number | null;
  base_price_jpy: number | null;
  vehicle_rates: VehicleRates | null;
  status: "active" | "off_season" | "archived";
  is_seasonal: boolean;
  season_tags: string;
  highlights: string;
  cover_image_path: string | null;
  gallery_image_paths: string[];
  is_featured: boolean;
  featured_rank: number;
}

interface TourFormProps {
  mode: "new" | "edit";
  tourId?: string;
  initialData?: TourFormData;
}

export default function TourForm({ mode, tourId, initialData }: TourFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | undefined>(tourId);
  const [formData, setFormData] = useState<TourFormData>(
    initialData || {
      title: "",
      slug: "",
      description: "",
      region: "",
      duration_hours: null,
      base_price_jpy: null,
      vehicle_rates: { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
      status: "active",
      is_seasonal: false,
      season_tags: "",
      highlights: "",
      cover_image_path: null,
      gallery_image_paths: [],
      is_featured: false,
      featured_rank: 0,
    }
  );

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

    if (formData.base_price_jpy !== null && formData.base_price_jpy < 0) {
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
        description: formData.description.trim() || null,
        region: formData.region.trim() || null,
        duration_hours: formData.duration_hours || null,
        base_price_jpy: formData.base_price_jpy || null,
        vehicle_rates: vehicleRates,
        status: formData.status,
        is_seasonal: formData.is_seasonal,
        season_tags: formData.season_tags
          ? formData.season_tags.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        highlights: formData.highlights
          ? formData.highlights.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        cover_image_path: formData.cover_image_path,
        gallery_image_paths: formData.gallery_image_paths,
      };

      if (mode === "new" && !currentId) {
        // Step 1: Insert minimal record to get ID
        const { data, error } = await supabase
          .from("tours")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data?.id) {
          setCurrentId(data.id);
          setSuccess(true);
          setTimeout(() => {
            // Navigate to edit mode with new ID
            router.replace(`/admin/tours/${data.id}`);
          }, 1500);
        }
      } else if (currentId) {
        // Step 2: Update with images and all data
        const { error } = await supabase
          .from("tours")
          .update(payload)
          .eq("id", currentId);
        if (error) throw error;
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        throw new Error("Tour ID is required");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Tour {mode === "new" ? "created" : "updated"} successfully!
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
            placeholder="Full description with details, itinerary, highlights, etc."
          />
        </div>

        <div>
          <Input
            label="Region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          />
        </div>

        <div>
          <Input
            label="Duration (hours)"
            type="number"
            value={formData.duration_hours ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration_hours: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>

        <div>
          <Input
            label="Base Price (JPY)"
            type="number"
            min="0"
            value={formData.base_price_jpy ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_price_jpy: e.target.value ? parseFloat(e.target.value) : null,
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

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_seasonal}
              onChange={(e) =>
                setFormData({ ...formData, is_seasonal: e.target.checked })
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Is Seasonal</span>
          </label>
        </div>

        <div>
          <Input
            label="Season Tags (comma-separated)"
            value={formData.season_tags}
            onChange={(e) =>
              setFormData({ ...formData, season_tags: e.target.value })
            }
            placeholder="spring, summer, autumn, winter"
          />
        </div>

        <div>
          <Input
            label="Highlights (comma-separated)"
            value={formData.highlights}
            onChange={(e) =>
              setFormData({ ...formData, highlights: e.target.value })
            }
            placeholder="scenic views, cultural sites, local cuisine"
          />
        </div>

        {/* Featured / Hot Tour Section */}
        <div className="pt-4 border-t space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Featured / Hot Tour</h3>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) =>
                  setFormData({ ...formData, is_featured: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Featured / Hot (Show on Homepage)
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Featured tours appear in the "Hot Tours" section on the homepage
            </p>
          </div>

          <div>
            <Input
              label="Featured Rank"
              type="number"
              min="0"
              value={formData.featured_rank}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  featured_rank: e.target.value ? parseInt(e.target.value) : 0,
                })
              }
            />
            <p className="mt-1 text-xs text-gray-500">
              Lower numbers appear first (0 = highest priority)
            </p>
          </div>
        </div>

        {/* Images - Only enable after tour is created */}
        {currentId ? (
          <div className="space-y-6 pt-4 border-t">
            <ImageUploader
              kind="tours"
              itemId={currentId}
              label="Cover Image"
              valuePath={formData.cover_image_path}
              onChangePath={(path) =>
                setFormData({ ...formData, cover_image_path: path })
              }
              mode="cover"
            />

            <GalleryUploader
              kind="tours"
              itemId={currentId}
              label="Gallery Images"
              valuePaths={formData.gallery_image_paths}
              onChangePaths={(paths) =>
                setFormData({ ...formData, gallery_image_paths: paths })
              }
            />
          </div>
        ) : (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Save the tour first to enable image uploads
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Link href="/admin/tours">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

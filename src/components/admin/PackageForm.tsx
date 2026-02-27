"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Package, PackageItem } from "@/types/package";
import { sanitizeSlug } from "@/utils/slug";
import VehicleRatesEditor from "./VehicleRatesEditor";
import { VehicleRates } from "@/types/vehicle";

interface PackageFormData {
  title: string;
  slug: string;
  short_description: string;
  region: string;
  description: string;
  base_price_jpy: number;
  vehicle_rates: VehicleRates | null;
  status: "active" | "off_season" | "archived";
  images: string;
  display_order: number;
}

interface Tour {
  id: string;
  title: string;
  status: string | null;
}

interface Transfer {
  id: string;
  title: string;
  from_area: string | null;
  to_area: string | null;
  status: string | null;
}

interface PackageFormProps {
  mode: "new" | "edit";
  packageId?: string;
  initialData?: Package | null;
}

export default function PackageForm({
  mode,
  packageId,
  initialData,
}: PackageFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [tours, setTours] = useState<Tour[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedItems, setSelectedItems] = useState<PackageItem[]>([]);
  const [formData, setFormData] = useState<PackageFormData>(
    initialData
      ? {
          title: initialData.title || "",
          slug: initialData.slug || "",
          short_description: initialData.short_description || "",
          region: initialData.region || "",
          description: initialData.description || "",
          base_price_jpy: initialData.base_price_jpy || 0,
          vehicle_rates: initialData.vehicle_rates || { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          status: initialData.status || "active",
          images: Array.isArray(initialData.images)
            ? initialData.images.join(", ")
            : "",
          display_order: initialData.display_order || 0,
        }
      : {
          title: "",
          slug: "",
          short_description: "",
          region: "",
          description: "",
          base_price_jpy: 0,
          vehicle_rates: { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          status: "active",
          images: "",
          display_order: 0,
        }
  );

  // Fetch tours and transfers on mount
  useEffect(() => {
    async function fetchItems() {
      try {
        const [toursResult, transfersResult] = await Promise.all([
          supabase
            .from("tours")
            .select("id, title, status")
            .neq("status", "archived")
            .order("title", { ascending: true }),
          supabase
            .from("transfers")
            .select("id, title, from_area, to_area, status")
            .neq("status", "archived")
            .order("title", { ascending: true }),
        ]);

        if (toursResult.data) setTours(toursResult.data as Tour[]);
        if (transfersResult.data) setTransfers(transfersResult.data as Transfer[]);
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoadingItems(false);
      }
    }

    fetchItems();

    // Load initial selected items
    if (initialData?.items) {
      setSelectedItems(initialData.items);
    }
  }, [initialData]);

  const handleAddItem = (type: "tour" | "transfer", id: string) => {
    // Check for duplicates
    const exists = selectedItems.some(
      (item) => item.type === type && item.id === id
    );
    if (exists) {
      return;
    }
    setSelectedItems([...selectedItems, { type, id }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const getItemTitle = (item: PackageItem): string => {
    if (item.type === "tour") {
      const tour = tours.find((t) => t.id === item.id);
      return tour ? tour.title : "Unavailable";
    } else if (item.type === "transfer") {
      const transfer = transfers.find((t) => t.id === item.id);
      return transfer ? transfer.title : "Unavailable";
    }
    return "Unknown";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadPublicImage(file, "packages");
      
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
        region: formData.region.trim() || null,
        description: formData.description.trim() || null,
        base_price_jpy: formData.base_price_jpy, // Legacy reference price (not used in checkout)
        vehicle_rates: vehicleRates,
        status: formData.status,
        images: formData.images
          ? formData.images.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        display_order: formData.display_order,
        items: selectedItems,
      };

      if (mode === "new") {
        const { data, error } = await supabase
          .from("packages")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data?.id) {
          setSuccess(true);
          setTimeout(() => {
            router.replace(`/admin/packages/${data.id}`);
          }, 1500);
        }
      } else {
        if (!packageId) {
          throw new Error("Package ID is required for edit mode");
        }
        const { error } = await supabase
          .from("packages")
          .update(payload)
          .eq("id", packageId);
        if (error) throw error;
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Package {mode === "new" ? "created" : "updated"} successfully!
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
          <Input
            label="Region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
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
            placeholder="Full description with package details, itinerary, etc."
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
            Images
          </label>

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

        {/* Add items to package */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add items to package</h3>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Items</h4>
              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                  >
                    <div>
                      <span className="text-xs font-medium px-2 py-1 rounded mr-2 bg-blue-100 text-blue-800">
                        {item.type}
                      </span>
                      <span className="text-sm text-gray-900">{getItemTitle(item)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingItems ? (
            <p className="text-sm text-gray-600">Loading items...</p>
          ) : (
            <div className="space-y-6">
              {/* Tours Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tours</h4>
                {tours.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                    {tours.map((tour) => {
                      const isSelected = selectedItems.some(
                        (item) => item.type === "tour" && item.id === tour.id
                      );
                      return (
                        <div
                          key={tour.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">{tour.title}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                tour.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {tour.status || "N/A"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddItem("tour", tour.id)}
                            disabled={isSelected}
                          >
                            {isSelected ? "Added" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tours available</p>
                )}
              </div>

              {/* Transfers Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Transfers</h4>
                {transfers.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                    {transfers.map((transfer) => {
                      const isSelected = selectedItems.some(
                        (item) => item.type === "transfer" && item.id === transfer.id
                      );
                      const route =
                        transfer.from_area && transfer.to_area
                          ? `${transfer.from_area} → ${transfer.to_area}`
                          : transfer.from_area || transfer.to_area || "";
                      return (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{transfer.title}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  transfer.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {transfer.status || "N/A"}
                              </span>
                            </div>
                            {route && (
                              <p className="text-xs text-gray-500 mt-1">{route}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddItem("transfer", transfer.id)}
                            disabled={isSelected}
                          >
                            {isSelected ? "Added" : "Add"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No transfers available</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Link href="/admin/packages">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

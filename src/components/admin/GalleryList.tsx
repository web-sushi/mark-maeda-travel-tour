"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { supabase } from "@/lib/supabase/client";

interface GalleryItem {
  id: string;
  image_url: string;
  customer_name: string | null;
  tour_type: string | null;
  testimonial: string | null;
  rating: number | null;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

interface GalleryListProps {
  initialItems: GalleryItem[];
}

export default function GalleryList({ initialItems }: GalleryListProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    customer_name: "",
    tour_type: "",
    testimonial: "",
    rating: 5,
    is_featured: false,
    is_visible: true,
    display_order: 0,
  });

  // Helper function to check if user is admin via API
  const checkIsAdmin = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/is-admin");
      const data = await response.json();
      console.log("[Gallery] Admin check:", data);
      
      if (!data.isAdmin) {
        alert("Admin access only");
        return false;
      }
      return true;
    } catch (error) {
      console.error("[Gallery] Admin check failed:", error);
      alert("Failed to verify admin access");
      return false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("[Gallery Upload] Authentication error:", authError);
        alert("Please log in");
        setUploading(false);
        return;
      }

      console.log("[Gallery Upload] User authenticated:", user.email);

      // Check if user is admin via API
      const isAdmin = await checkIsAdmin();
      if (!isAdmin) {
        setUploading(false);
        return;
      }

      console.log("[Gallery Upload] Admin verified, uploading file:", file.name);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("customer-photos")
        .upload(filePath, file);

      if (uploadError) {
        console.error("[Gallery Upload] Storage upload failed:", {
          message: uploadError.message,
          status: uploadError.name,
          statusCode: (uploadError as any).statusCode,
          details: uploadError,
        });
        throw uploadError;
      }

      console.log("[Gallery Upload] Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("customer-photos")
        .getPublicUrl(filePath);

      console.log("[Gallery Upload] Public URL generated:", urlData.publicUrl);

      setFormData({ ...formData, image_url: urlData.publicUrl });
    } catch (error: any) {
      console.error("[Gallery Upload] Upload error:", {
        message: error.message,
        name: error.name,
        statusCode: error.statusCode,
        error: error,
      });
      alert(`Failed to upload image: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      alert("Please upload an image");
      return;
    }

    // Check admin access before saving
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from("customer_gallery")
          .update({
            image_url: formData.image_url,
            customer_name: formData.customer_name || null,
            tour_type: formData.tour_type || null,
            testimonial: formData.testimonial || null,
            rating: formData.rating || null,
            is_featured: formData.is_featured,
            is_visible: formData.is_visible,
            display_order: formData.display_order,
          })
          .eq("id", editingId);

        if (error) throw error;

        setItems(
          items.map((item) =>
            item.id === editingId ? { ...item, ...formData } : item
          )
        );
      } else {
        // Create new
        const { data, error } = await supabase
          .from("customer_gallery")
          .insert({
            image_url: formData.image_url,
            customer_name: formData.customer_name || null,
            tour_type: formData.tour_type || null,
            testimonial: formData.testimonial || null,
            rating: formData.rating || null,
            is_featured: formData.is_featured,
            is_visible: formData.is_visible,
            display_order: formData.display_order,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setItems([data, ...items]);
      }

      // Reset form
      setShowForm(false);
      setEditingId(null);
      setFormData({
        image_url: "",
        customer_name: "",
        tour_type: "",
        testimonial: "",
        rating: 5,
        is_featured: false,
        is_visible: true,
        display_order: 0,
      });
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save item");
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setFormData({
      image_url: item.image_url,
      customer_name: item.customer_name || "",
      tour_type: item.tour_type || "",
      testimonial: item.testimonial || "",
      rating: item.rating || 5,
      is_featured: item.is_featured,
      is_visible: item.is_visible,
      display_order: item.display_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    // Check admin access before deleting
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("customer_gallery")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete item");
    }
  };

  const toggleVisible = async (id: string, currentValue: boolean) => {
    // Check admin access before toggling
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("customer_gallery")
        .update({ is_visible: !currentValue })
        .eq("id", id);

      if (error) throw error;
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, is_visible: !currentValue } : item
        )
      );
    } catch (error) {
      console.error("Toggle error:", error);
      alert("Failed to update visibility");
    }
  };

  const toggleFeatured = async (id: string, currentValue: boolean) => {
    // Check admin access before toggling
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("customer_gallery")
        .update({ is_featured: !currentValue })
        .eq("id", id);

      if (error) throw error;
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, is_featured: !currentValue } : item
        )
      );
    } catch (error) {
      console.error("Toggle error:", error);
      alert("Failed to update featured status");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              image_url: "",
              customer_name: "",
              tour_type: "",
              testimonial: "",
              rating: 5,
              is_featured: false,
              is_visible: true,
              display_order: 0,
            });
          }}
        >
          {showForm ? "Cancel" : "+ Add New Photo"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Photo" : "Add New Photo"}
          </h3>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E4005A] file:text-white hover:file:bg-[#C4004A]"
              />
              {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
              {formData.image_url && (
                <div className="mt-4">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-40 h-40 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Customer Name */}
            <Input
              label="Customer Name (Optional)"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              placeholder="e.g., John Smith"
            />

            {/* Tour Type */}
            <Input
              label="Tour Type (Optional)"
              value={formData.tour_type}
              onChange={(e) =>
                setFormData({ ...formData, tour_type: e.target.value })
              }
              placeholder="e.g., Mt. Fuji Tour"
            />

            {/* Testimonial */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Testimonial (Optional)
              </label>
              <textarea
                value={formData.testimonial}
                onChange={(e) =>
                  setFormData({ ...formData, testimonial: e.target.value })
                }
                rows={4}
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="Customer's review or comment..."
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Rating (Optional)
              </label>
              <select
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Number(e.target.value) })
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                <option value={0}>No rating</option>
                <option value={1}>⭐ 1 Star</option>
                <option value={2}>⭐⭐ 2 Stars</option>
                <option value={3}>⭐⭐⭐ 3 Stars</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
              </select>
            </div>

            {/* Display Order */}
            <Input
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({ ...formData, display_order: Number(e.target.value) })
              }
            />

            {/* Checkboxes */}
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) =>
                    setFormData({ ...formData, is_featured: e.target.checked })
                  }
                  className="mr-2"
                />
                Featured
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) =>
                    setFormData({ ...formData, is_visible: e.target.checked })
                  }
                  className="mr-2"
                />
                Visible
              </label>
            </div>

            <Button type="submit" disabled={uploading || !formData.image_url}>
              {editingId ? "Update Photo" : "Add Photo"}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Image</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tour Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Rating</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Order</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Featured</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Visible</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <img
                    src={item.image_url}
                    alt={item.customer_name || "Gallery"}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.customer_name || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.tour_type || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.rating ? `⭐ ${item.rating}` : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-sm">{item.display_order}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleFeatured(item.id, item.is_featured)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      item.is_featured
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.is_featured ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleVisible(item.id, item.is_visible)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      item.is_visible
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.is_visible ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No photos yet. Click "Add New Photo" to get started.
          </div>
        )}
      </div>
    </div>
  );
}

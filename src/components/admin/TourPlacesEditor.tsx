"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { uploadFile, deleteFile } from "@/lib/storage/upload";
import { getPublicMediaUrl } from "@/lib/storage/media";
import { TourPlace } from "@/types/tour";
import Button from "@/components/ui/Button";

interface TourPlacesEditorProps {
  tourId: string;
}

interface PlaceDraft {
  name: string;
  description: string;
  image_path: string | null;
  uploading: boolean;
  error: string | null;
}

const EMPTY_DRAFT: PlaceDraft = {
  name: "",
  description: "",
  image_path: null,
  uploading: false,
  error: null,
};

export default function TourPlacesEditor({ tourId }: TourPlacesEditorProps) {
  const [places, setPlaces] = useState<TourPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // place id being saved
  const [draft, setDraft] = useState<PlaceDraft>(EMPTY_DRAFT);
  const [addOpen, setAddOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPlaces = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tour_places")
      .select("*")
      .eq("tour_id", tourId)
      .order("display_order", { ascending: true });
    if (!error && data) setPlaces(data as TourPlace[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  // ── Image upload for draft ─────────────────────────────────────────────────

  const handleDraftImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setDraft((d) => ({ ...d, error: "Please select an image file" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDraft((d) => ({ ...d, error: "Image must be under 5 MB" }));
      return;
    }

    setDraft((d) => ({ ...d, uploading: true, error: null }));
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `tour-places/${tourId}/${Date.now()}.${ext}`;
      const { path: uploaded } = await uploadFile({ supabase, path, file, upsert: false });
      setDraft((d) => ({ ...d, image_path: uploaded, uploading: false }));
    } catch (err) {
      setDraft((d) => ({
        ...d,
        uploading: false,
        error: err instanceof Error ? err.message : "Upload failed",
      }));
    }
    e.target.value = "";
  };

  // ── Add place ──────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!draft.name.trim()) {
      setDraft((d) => ({ ...d, error: "Name is required" }));
      return;
    }

    setSaving("new");
    setGlobalError(null);
    try {
      const nextOrder = places.length > 0 ? Math.max(...places.map((p) => p.display_order)) + 1 : 0;
      const { data, error } = await supabase
        .from("tour_places")
        .insert({
          tour_id: tourId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          image_path: draft.image_path,
          display_order: nextOrder,
        })
        .select("*")
        .single();

      if (error) throw error;
      setPlaces((prev) => [...prev, data as TourPlace]);
      setDraft(EMPTY_DRAFT);
      setAddOpen(false);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to add place");
    } finally {
      setSaving(null);
    }
  };

  // ── Remove place ───────────────────────────────────────────────────────────

  const handleRemove = async (place: TourPlace) => {
    if (!confirm(`Remove "${place.name}"?`)) return;
    setSaving(place.id);
    setGlobalError(null);
    try {
      if (place.image_path) {
        await deleteFile(supabase, place.image_path);
      }
      const { error } = await supabase.from("tour_places").delete().eq("id", place.id);
      if (error) throw error;
      setPlaces((prev) => prev.filter((p) => p.id !== place.id));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to remove place");
    } finally {
      setSaving(null);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────

  const reorder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= places.length) return;

    const updated = [...places];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];

    // Reassign display_order values
    const reordered = updated.map((p, i) => ({ ...p, display_order: i }));
    setPlaces(reordered);

    // Persist in DB (upsert)
    setGlobalError(null);
    try {
      const upserts = reordered.map(({ id, display_order }) => ({
        id,
        tour_id: tourId,
        name: updated.find((p) => p.id === id)!.name,
        display_order,
      }));
      const { error } = await supabase.from("tour_places").upsert(upserts, { onConflict: "id" });
      if (error) throw error;
    } catch (err) {
      setGlobalError("Failed to save new order");
      fetchPlaces(); // revert
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Selectable Places</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() => { setAddOpen((o) => !o); setDraft(EMPTY_DRAFT); }}
        >
          {addOpen ? "Cancel" : "+ Add Place"}
        </Button>
      </div>

      {globalError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {globalError}
        </p>
      )}

      {/* Add form */}
      {addOpen && (
        <div className="border border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-medium text-blue-800">New Place</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Mount Fuji"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              placeholder="Brief description shown to customers"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
            {draft.image_path && (
              <div className="mb-2">
                <img
                  src={getPublicMediaUrl(draft.image_path)}
                  alt="Preview"
                  className="w-32 h-20 object-cover rounded border"
                />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDraftImageChange}
              disabled={draft.uploading}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-white file:text-blue-700 hover:file:bg-blue-50 disabled:opacity-50"
            />
            {draft.uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
            {draft.error && <p className="text-xs text-red-600 mt-1">{draft.error}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={saving === "new" || draft.uploading}
            >
              {saving === "new" ? "Saving..." : "Add Place"}
            </Button>
          </div>
        </div>
      )}

      {/* Places list */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading places...</p>
      ) : places.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No places added yet.</p>
      ) : (
        <div className="space-y-2">
          {places.map((place, idx) => (
            <div
              key={place.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded overflow-hidden">
                {place.image_path ? (
                  <img
                    src={getPublicMediaUrl(place.image_path)}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">
                    🖼
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{place.name}</p>
                {place.description && (
                  <p className="text-xs text-gray-500 truncate">{place.description}</p>
                )}
              </div>

              {/* Order buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => reorder(idx, "up")}
                  disabled={idx === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-0.5 leading-none"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => reorder(idx, "down")}
                  disabled={idx === places.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20 p-0.5 leading-none"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(place)}
                disabled={saving === place.id}
                className="text-red-400 hover:text-red-600 text-sm font-medium disabled:opacity-40 ml-1"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Places appear as selectable image cards on the tour booking page.
      </p>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TourForm from "@/components/admin/TourForm";
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

export default async function AdminTourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";

  let initialData: TourFormData | undefined;
  let loading = false;

  if (!isNew) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        initialData = {
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          region: data.region || "",
          duration_hours: data.duration_hours,
          base_price_jpy: data.base_price_jpy,
          vehicle_rates: data.vehicle_rates || { v8: 0, v10: 0, v14: 0, coaster: 0, bigbus: 0 },
          status: (data.status as "active" | "off_season" | "archived") || "active",
          is_seasonal: data.is_seasonal || false,
          season_tags: Array.isArray(data.season_tags)
            ? data.season_tags.join(", ")
            : data.season_tags || "",
          highlights: Array.isArray(data.highlights)
            ? data.highlights.join(", ")
            : data.highlights || "",
          cover_image_path: data.cover_image_path || null,
          gallery_image_paths: Array.isArray(data.gallery_image_paths)
            ? data.gallery_image_paths
            : [],
          is_featured: data.is_featured || false,
          featured_rank: data.featured_rank ?? 0,
        };
      }
    } catch (error) {
      // Error will be handled by the form component
      console.error("Failed to fetch tour:", error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/tours"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Tours
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          {isNew ? "New Tour" : "Edit Tour"}
        </h1>
      </div>

      <TourForm
        mode={isNew ? "new" : "edit"}
        tourId={isNew ? undefined : id}
        initialData={initialData}
      />
    </div>
  );
}

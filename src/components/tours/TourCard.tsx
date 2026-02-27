import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

interface TourCardProps {
  tour: {
    id: string;
    title: string;
    slug: string;
    region?: string | null;
    duration_hours?: number | null;
    base_price_jpy?: number | null;
    vehicle_rates?: any;
    highlights?: string[];
    images?: string[];
    cover_image_path?: string | null;
  };
}

export default function TourCard({ tour }: TourCardProps) {
  // Use cover_image_path first, then fall back to images array
  const coverUrl = getPublicImageUrl(tour.cover_image_path);
  const firstImage = coverUrl || (tour.images && tour.images.length > 0 ? tour.images[0] : null);
  
  const highlightsPreview = tour.highlights
    ? tour.highlights.slice(0, 3).join(", ")
    : "";
  const lowestRate = getLowestVehicleRate(tour.vehicle_rates);

  return (
    <div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {firstImage ? (
        <div className="w-full h-48 relative bg-gray-200">
          <img
            src={firstImage}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tour.title}</h3>
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          {tour.region && <p>📍 {tour.region}</p>}
          {tour.duration_hours && <p>⏱️ {tour.duration_hours} hours</p>}
        </div>
        {highlightsPreview && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{highlightsPreview}</p>
        )}
        {lowestRate !== null ? (
          <p className="text-2xl font-bold text-gray-900 mb-4">
            From ¥{lowestRate.toLocaleString()}
          </p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mb-4">Contact for pricing</p>
        )}
        <Link href={`/tours/${tour.slug}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </div>
    </div>
  );
}

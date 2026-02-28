import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

interface TransferCardProps {
  transfer: {
    id: string;
    title: string;
    slug: string;
    category?: string | null;
    from_area?: string | null;
    to_area?: string | null;
    base_price_jpy?: number | null;
    vehicle_rates?: any;
    cover_image_path?: string | null;
  };
}

export default function TransferCard({ transfer }: TransferCardProps) {
  const route =
    transfer.from_area && transfer.to_area
      ? `${transfer.from_area} → ${transfer.to_area}`
      : transfer.from_area || transfer.to_area || "";
  const lowestRate = getLowestVehicleRate(transfer.vehicle_rates);
  const coverUrl = getPublicImageUrl(transfer.cover_image_path);

  return (
    <div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {coverUrl ? (
        <div className="w-full aspect-[16/9] relative bg-gray-200">
          <img
            src={coverUrl}
            alt={transfer.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{transfer.title}</h3>
        <div className="space-y-1 mb-3 text-sm text-gray-600">
          {route && <p>📍 {route}</p>}
          {transfer.category && <p>🏷️ {transfer.category}</p>}
        </div>
        {lowestRate !== null ? (
          <p className="text-2xl font-bold text-gray-900 mb-4">
            From ¥{lowestRate.toLocaleString()}
          </p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mb-4">Contact for pricing</p>
        )}
        <Link href={`/transfers/${transfer.slug}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { TourPlace } from "@/types/tour";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";

interface TourPlacesSelectorProps {
  places: TourPlace[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export default function TourPlacesSelector({
  places,
  selectedIds,
  onChange,
}: TourPlacesSelectorProps) {
  if (places.length === 0) return null;

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">
          Select Places to Visit
        </p>
        {selectedIds.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {places.map((place) => {
          const selected = selectedIds.includes(place.id);
          const imageUrl = getPublicImageUrl(place.image_path);

          return (
            <button
              key={place.id}
              type="button"
              onClick={() => toggle(place.id)}
              className={[
                "relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                selected
                  ? "border-blue-500 shadow-md shadow-blue-100 scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
              ].join(" ")}
              aria-pressed={selected}
            >
              {/* Image */}
              <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-200 select-none">
                    🏞
                  </div>
                )}
              </div>

              {/* Name */}
              <div
                className={[
                  "px-2 py-1.5 text-xs font-medium leading-snug",
                  selected ? "bg-blue-50 text-blue-800" : "bg-white text-gray-700",
                ].join(" ")}
              >
                {place.name}
              </div>

              {/* Selected tick */}
              {selected && (
                <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedIds.length === 0 && (
        <p className="text-xs text-gray-400">
          Tap a place to include it in your booking (optional).
        </p>
      )}
    </div>
  );
}

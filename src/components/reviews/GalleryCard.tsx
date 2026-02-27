"use client";

import { useState } from "react";

interface GalleryItem {
  id: string;
  image_url: string;
  customer_name: string | null;
  tour_type: string | null;
  testimonial: string | null;
  rating: number | null;
  is_featured: boolean;
}

interface GalleryCardProps {
  item: GalleryItem;
  featured: boolean;
}

export default function GalleryCard({ item, featured }: GalleryCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showFullTestimonial, setShowFullTestimonial] = useState(false);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const hasContent = item.customer_name || item.rating || item.testimonial;

  if (featured) {
    // Featured cards - larger, more detailed
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#E4005A] hover:shadow-xl transition-all duration-300 group">
        {/* Image */}
        <div className="relative w-full h-64 bg-gray-200 overflow-hidden">
          {!imgError && item.image_url ? (
            <img
              src={item.image_url}
              alt={item.customer_name || "Guest photo"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        {hasContent && (
          <div className="p-6">
            {/* Rating */}
            {item.rating && item.rating > 0 && (
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < item.rating! ? "text-yellow-400" : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}

            {/* Testimonial */}
            {item.testimonial && (
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {showFullTestimonial
                    ? item.testimonial
                    : truncateText(item.testimonial, 150)}
                </p>
                {item.testimonial.length > 150 && (
                  <button
                    onClick={() => setShowFullTestimonial(!showFullTestimonial)}
                    className="text-sm text-[#E4005A] hover:text-[#C4004A] font-medium mt-2"
                  >
                    {showFullTestimonial ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* Customer Name & Tour Type */}
            <div className="flex items-center justify-between text-sm">
              {item.customer_name && (
                <p className="font-semibold text-gray-900">{item.customer_name}</p>
              )}
              {item.tour_type && (
                <p className="text-gray-600 capitalize">{item.tour_type}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Gallery grid cards - compact, photo-focused
  return (
    <div className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-[#E4005A] hover:shadow-lg transition-all duration-300 aspect-square">
      {/* Image */}
      {!imgError && item.image_url ? (
        <img
          src={item.image_url}
          alt={item.customer_name || "Guest photo"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Overlay on hover (if there's content) */}
      {hasContent && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          {item.rating && item.rating > 0 && (
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < item.rating! ? "text-yellow-400" : "text-white/40"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          )}
          {item.customer_name && (
            <p className="text-white font-semibold text-sm">{item.customer_name}</p>
          )}
          {item.testimonial && (
            <p className="text-white/90 text-xs mt-1 line-clamp-2">
              {item.testimonial}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { formatJPY } from "@/lib/transferUtils";

interface TransferCardProps {
  transfer: {
    id: string;
    title: string;
    slug: string;
    from_area: string | null;
    to_area: string | null;
    pricing_model: string;
    price: number | null;
    imageUrl: string | null;
  };
}

export default function TransferCard({ transfer }: TransferCardProps) {
  const [imgError, setImgError] = useState(false);

  const route =
    transfer.from_area && transfer.to_area
      ? `${transfer.from_area} → ${transfer.to_area}`
      : transfer.from_area || transfer.to_area || "";

  const showImage = transfer.imageUrl && !imgError;

  return (
    <Link
      href={`/transfers/${transfer.slug}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow h-full"
    >
      {/* Image */}
      {showImage ? (
        <div className="w-full h-48 bg-gray-200 relative overflow-hidden">
          <img
            src={transfer.imageUrl!}
            alt={transfer.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {transfer.title}
        </h3>

        {route && (
          <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
            {route}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600">
            {transfer.pricing_model === "quote"
              ? "Request Quote"
              : "Starting from"}
          </span>
          {transfer.pricing_model === "quote" ? (
            <span className="text-lg font-bold text-blue-600">
              Get Quote
            </span>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatJPY(transfer.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

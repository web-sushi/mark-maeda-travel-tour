"use client";

import { useState } from "react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  display_name: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  booking_items: {
    title: string;
    item_type: string;
    item_id: string;
    slug: string;
    booking_id: string;
  };
  bookings: {
    reference_code: string;
  };
}

interface ReviewsTableClientProps {
  initialReviews: Review[];
}

export default function ReviewsTableClient({
  initialReviews,
}: ReviewsTableClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "featured">(
    "all"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filteredReviews = reviews.filter((review) => {
    if (filter === "pending") return !review.is_approved;
    if (filter === "approved") return review.is_approved && !review.is_featured;
    if (filter === "featured") return review.is_featured;
    return true;
  });

  const handleToggleApprove = async (reviewId: string, currentApproved: boolean) => {
    setError(null);
    setLoading(reviewId);

    try {
      const newApproved = !currentApproved;

      const response = await fetch("/api/admin/reviews/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          isApproved: newApproved,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update review");
      }

      // Update local state optimistically
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                is_approved: newApproved,
                is_featured: newApproved ? r.is_featured : false,
              }
            : r
        )
      );

      console.log("[ReviewsTable] Review approval updated:", reviewId);
    } catch (err) {
      console.error("[ReviewsTable] Failed to toggle approve:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update review";
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleToggleFeatured = async (
    reviewId: string,
    currentFeatured: boolean,
    isApproved: boolean
  ) => {
    if (!isApproved) {
      setError("Review must be approved before it can be featured");
      return;
    }

    setError(null);
    setLoading(reviewId);

    try {
      const newFeatured = !currentFeatured;

      const response = await fetch("/api/admin/reviews/feature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          isFeatured: newFeatured,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to update review");
      }

      // Update local state optimistically
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_featured: newFeatured } : r))
      );

      console.log("[ReviewsTable] Review featured status updated:", reviewId);
    } catch (err) {
      console.error("[ReviewsTable] Failed to toggle featured:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update review";
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "all"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({reviews.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Pending ({reviews.filter((r) => !r.is_approved).length})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "approved"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Approved ({reviews.filter((r) => r.is_approved && !r.is_featured).length})
        </button>
        <button
          onClick={() => setFilter("featured")}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === "featured"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Featured ({reviews.filter((r) => r.is_featured).length})
        </button>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Item
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Comment
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                By
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Booking
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No reviews found
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {review.booking_items.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b capitalize">
                    {review.booking_items.item_type}
                  </td>
                  <td className="px-4 py-3 border-b">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b max-w-xs">
                    {review.comment ? (
                      <p className="line-clamp-2">{review.comment}</p>
                    ) : (
                      <span className="text-gray-400 italic">No comment</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {review.display_name || (
                      <span className="text-gray-400 italic">Anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {review.bookings.reference_code}
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex flex-col gap-1">
                      {review.is_featured ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Featured
                        </span>
                      ) : review.is_approved ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          handleToggleApprove(review.id, review.is_approved)
                        }
                        disabled={loading === review.id}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          loading === review.id
                            ? "bg-gray-300 text-gray-500 cursor-wait"
                            : review.is_approved
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {loading === review.id
                          ? "..."
                          : review.is_approved
                          ? "Unapprove"
                          : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          handleToggleFeatured(
                            review.id,
                            review.is_featured,
                            review.is_approved
                          )
                        }
                        disabled={!review.is_approved || loading === review.id}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          !review.is_approved || loading === review.id
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : review.is_featured
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                      >
                        {loading === review.id
                          ? "..."
                          : review.is_featured
                          ? "Unfeature"
                          : "Feature"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

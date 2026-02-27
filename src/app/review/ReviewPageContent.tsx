"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";

interface BookingItem {
  id: string;
  title: string;
  item_type: string;
}

interface BookingInfo {
  id: string;
  reference_code: string;
  customer_name: string;
  travel_date: string;
}

interface ItemReview {
  bookingItemId: string;
  rating: number;
  comment: string;
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [overallComment, setOverallComment] = useState("");
  const [itemReviews, setItemReviews] = useState<Record<string, ItemReview>>({});

  useEffect(() => {
    if (!token) {
      setError("No review token provided");
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch("/api/review/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "Invalid or expired review link");
        setLoading(false);
        return;
      }

      setBooking(data.booking);
      setItems(data.items);

      // Initialize review state for each item
      const initialReviews: Record<string, ItemReview> = {};
      data.items.forEach((item: BookingItem) => {
        initialReviews[item.id] = {
          bookingItemId: item.id,
          rating: 0,
          comment: "",
        };
      });
      setItemReviews(initialReviews);

      setLoading(false);
    } catch (err) {
      setError("Failed to load review form");
      setLoading(false);
    }
  };

  const handleRatingChange = (itemId: string, rating: number) => {
    setItemReviews((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rating,
      },
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setItemReviews((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate that all items have ratings
    const reviewsArray = Object.values(itemReviews);
    const missingRatings = reviewsArray.filter((r) => r.rating === 0);

    if (missingRatings.length > 0) {
      setError("Please rate all items before submitting");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          displayName: displayName.trim() || undefined,
          overallComment: overallComment.trim() || undefined,
          itemReviews: reviewsArray,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "Failed to submit reviews");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Failed to submit reviews");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-16">
        <div className="text-center">
          <p className="text-gray-600">Loading review form...</p>
        </div>
      </Container>
    );
  }

  if (error && !booking) {
    return (
      <Container className="py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Review Link
            </h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted successfully. We appreciate your time!
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-[#1B0C3F] text-white rounded-lg hover:bg-[#2D1A5F] transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Experience
          </h1>
          <p className="text-gray-600">
            Booking: <span className="font-semibold">{booking?.reference_code}</span>
            {" • "}
            {booking?.travel_date &&
              new Date(booking.travel_date).toLocaleDateString()}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Items Reviews */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Rate Each Item
            </h2>
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-6"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">{item.item_type}</p>
                </div>

                {/* Star Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(item.id, star)}
                        className={`w-10 h-10 transition-colors ${
                          star <= itemReviews[item.id]?.rating
                            ? "text-yellow-400"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      >
                        <svg
                          className="w-full h-full"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {itemReviews[item.id]?.rating === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Please select a rating
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={itemReviews[item.id]?.comment || ""}
                    onChange={(e) => handleCommentChange(item.id, e.target.value)}
                    rows={3}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    placeholder="Share your thoughts about this item..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Overall Feedback */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Overall Feedback
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="How should we display your name?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Comment (optional)
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  This comment will be used for all items if you don't provide individual comments above.
                </p>
                <textarea
                  value={overallComment}
                  onChange={(e) => setOverallComment(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Any feedback about your overall experience?"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="px-8">
              {submitting ? "Submitting..." : "Submit Reviews"}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}

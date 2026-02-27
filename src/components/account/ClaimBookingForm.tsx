"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ClaimBookingForm() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    referenceCode: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/bookings/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceCode: formData.referenceCode,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        // Use friendly error messages based on error code
        const errorMessages: Record<string, string> = {
          not_found: "Booking not found. Please check your reference code.",
          email_mismatch: "The email you entered doesn't match our records for this booking.",
          already_claimed: "This booking has already been claimed by an account.",
          server_error: "Something went wrong. Please try again.",
        };

        const friendlyError = errorMessages[data.error] || data.message || "Failed to claim booking";
        throw new Error(friendlyError);
      }

      setSuccess(true);
      setFormData({ referenceCode: "", email: "" });

      // Refresh page after short delay
      setTimeout(() => {
        router.refresh();
        setShowForm(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Claim a Guest Booking
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Link a booking made without an account to your profile
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            Claim Booking
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg"
        >
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              ✓ Booking claimed successfully! Refreshing...
            </div>
          )}

          <Input
            label="Reference Code"
            type="text"
            required
            placeholder="e.g., ABC12345"
            value={formData.referenceCode}
            onChange={(e) =>
              setFormData({ ...formData, referenceCode: e.target.value })
            }
          />

          <Input
            label="Email Used for Booking"
            type="email"
            required
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Claiming..." : "Claim Booking"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setError(null);
                setFormData({ referenceCode: "", email: "" });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

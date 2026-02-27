"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface RequestQuoteFormProps {
  transferId: string;
  transferTitle: string;
}

export default function RequestQuoteForm({
  transferId,
  transferTitle,
}: RequestQuoteFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    pickup_location: "",
    dropoff_location: "",
    date: "",
    time: "",
    passengers: "",
    luggage: "",
    notes: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch("/api/transfer-quotes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transfer_id: transferId,
          ...formData,
          passengers: parseInt(formData.passengers) || 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quote request");
      }

      setSuccess(true);
      setFormData({
        pickup_location: "",
        dropoff_location: "",
        date: "",
        time: "",
        passengers: "",
        luggage: "",
        notes: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Quote Request Submitted!
        </h3>
        <p className="text-gray-700 mb-6">
          Thank you for your interest in {transferTitle}. We'll review your
          request and get back to you within 24 hours with a detailed quote.
        </p>
        <Button onClick={() => setSuccess(false)}>Submit Another Request</Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Request a Quote
        </h3>
        <p className="text-gray-600">
          Fill out the form below and we'll send you a custom quote for this
          transfer.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Information */}
        <div className="pb-4 border-b">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h4>
          <div className="space-y-4">
            <Input
              label="Full Name *"
              value={formData.contact_name}
              onChange={(e) =>
                setFormData({ ...formData, contact_name: e.target.value })
              }
              required
            />
            <Input
              label="Email *"
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              required
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) =>
                setFormData({ ...formData, contact_phone: e.target.value })
              }
            />
          </div>
        </div>

        {/* Transfer Details */}
        <div className="pb-4 border-b">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Transfer Details
          </h4>
          <div className="space-y-4">
            <Input
              label="Pick-up Location *"
              value={formData.pickup_location}
              onChange={(e) =>
                setFormData({ ...formData, pickup_location: e.target.value })
              }
              placeholder="e.g., Narita Airport Terminal 1"
              required
            />
            <Input
              label="Drop-off Location *"
              value={formData.dropoff_location}
              onChange={(e) =>
                setFormData({ ...formData, dropoff_location: e.target.value })
              }
              placeholder="e.g., Tokyo Station"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
              <Input
                label="Time *"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
            </div>
            <Input
              label="Number of Passengers *"
              type="number"
              min="1"
              value={formData.passengers}
              onChange={(e) =>
                setFormData({ ...formData, passengers: e.target.value })
              }
              required
            />
            <Input
              label="Luggage Details (optional)"
              value={formData.luggage}
              onChange={(e) =>
                setFormData({ ...formData, luggage: e.target.value })
              }
              placeholder="e.g., 2 large suitcases, 1 carry-on"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Additional Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={4}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Any special requests or additional information..."
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Submit Quote Request"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By submitting this form, you agree to be contacted regarding your
          quote request.
        </p>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface DepositPaymentFormProps {
  bookingId: string;
  totalAmount: number; // JPY has no minor unit; amounts stored/sent as yen.
  depositChoice: number; // current deposit choice (25, 50, or 100)
}

export default function DepositPaymentForm({
  bookingId,
  totalAmount,
  depositChoice: initialDepositChoice,
}: DepositPaymentFormProps) {
  const [depositChoice, setDepositChoice] = useState(initialDepositChoice);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // JPY has no minor unit; amounts stored/sent as yen.
  const depositAmount = Math.round((totalAmount * depositChoice) / 100);

  const handlePayNow = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          depositChoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Deposit Amount
        </label>
        <div className="space-y-2">
          {[25, 50, 100].map((percent) => (
            <label
              key={percent}
              className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="depositChoice"
                value={percent}
                checked={depositChoice === percent}
                onChange={(e) => setDepositChoice(parseInt(e.target.value))}
                className="rounded border-gray-300"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{percent}% Deposit</span>
                <span className="ml-2 text-sm text-gray-600">
                  ({new Intl.NumberFormat("ja-JP", {
                    style: "currency",
                    currency: "JPY",
                  }).format(Math.round((totalAmount * percent) / 100))})
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Deposit Amount:</span>
          <span className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("ja-JP", {
              style: "currency",
              currency: "JPY",
            }).format(depositAmount)}
          </span>
        </div>
        <Button onClick={handlePayNow} disabled={loading} className="w-full">
          {loading ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </div>
  );
}

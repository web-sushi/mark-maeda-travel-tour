"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface BookingFormProps {
  itemType: "tour" | "transfer" | "package";
  itemId: string;
  itemTitle: string;
  basePriceJpy: number; // Price in JPY (not cents)
}

export default function BookingForm({
  itemType,
  itemId,
  itemTitle,
  basePriceJpy,
}: BookingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    travel_date: "",
    vehicles_count: 1,
  });

  // Generate a simple reference code
  // TODO: Improve this to use a more robust reference code generation system
  const generateReferenceCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.customer_name.trim()) {
        throw new Error("Customer name is required");
      }
      if (!formData.customer_email.trim()) {
        throw new Error("Customer email is required");
      }
      if (!formData.travel_date) {
        throw new Error("Travel date is required");
      }
      if (formData.vehicles_count < 1) {
        throw new Error("Vehicles count must be at least 1");
      }

      // Calculate total amount
      // JPY has no minor unit; amounts stored/sent as yen.
      // For tours/transfers: base_price_jpy * vehicles_count
      // For packages: base_price_jpy (packages are fixed price)
      const totalAmount =
        itemType === "package"
          ? basePriceJpy // Amount in yen
          : basePriceJpy * formData.vehicles_count; // Amount in yen

      // Prepare items array
      const items = [
        {
          type: itemType,
          id: itemId,
          title: itemTitle,
          base_price_jpy: basePriceJpy,
        },
      ];

      // Prepare booking data
      const bookingData = {
        reference_code: generateReferenceCode(),
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim() || null,
        travel_date: formData.travel_date,
        vehicles_count: formData.vehicles_count,
        items: items,
        total_amount: totalAmount,
        deposit_choice: 100, // Default to 100%
        amount_paid: 0,
        remaining_amount: totalAmount,
        booking_status: "pending",
        payment_status: "unpaid",
      };

      // Insert booking
      const { data: insertedBooking, error: insertError } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select("id")
        .single();

      if (insertError) throw insertError;

      // Send booking confirmation emails (non-blocking)
      try {
        await fetch("/api/notify/booking-created", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: insertedBooking.id,
          }),
        });
      } catch (emailError) {
        // Log error but don't block redirect
        console.error("Failed to send booking confirmation emails:", emailError);
      }

      // Redirect to success page with bookingId
      router.push(`/booking/success?bookingId=${insertedBooking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="customer_name"
          type="text"
          required
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Email <span className="text-red-500">*</span>
        </label>
        <Input
          id="customer_email"
          type="email"
          required
          value={formData.customer_email}
          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">
          Customer Phone
        </label>
        <Input
          id="customer_phone"
          type="tel"
          value={formData.customer_phone}
          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="travel_date" className="block text-sm font-medium text-gray-700 mb-1">
          Travel Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="travel_date"
          type="date"
          required
          value={formData.travel_date}
          onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
        />
      </div>

      {itemType !== "package" && (
        <div>
          <label htmlFor="vehicles_count" className="block text-sm font-medium text-gray-700 mb-1">
            Vehicles Count <span className="text-red-500">*</span>
          </label>
          <Input
            id="vehicles_count"
            type="number"
            min="1"
            required
            value={formData.vehicles_count}
            onChange={(e) =>
              setFormData({ ...formData, vehicles_count: parseInt(e.target.value) || 1 })
            }
          />
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">Total Amount:</span>
          <span className="text-2xl font-bold text-gray-900">
            ¥
            {(
              itemType === "package"
                ? basePriceJpy
                : basePriceJpy * formData.vehicles_count
            ).toLocaleString()}
          </span>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit Booking"}
        </Button>
      </div>
    </form>
  );
}

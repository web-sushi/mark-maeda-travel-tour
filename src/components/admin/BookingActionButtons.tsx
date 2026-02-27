"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { BookingStatus, PaymentStatus } from "@/types/booking";

interface BookingActionButtonsProps {
  bookingId: string;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  onActionComplete?: () => void;
}

export default function BookingActionButtons({
  bookingId,
  bookingStatus,
  paymentStatus,
  totalAmount,
  amountPaid,
  remainingAmount,
  onActionComplete,
}: BookingActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  const isCancelled = bookingStatus === "cancelled";
  const isCompleted = bookingStatus === "completed";
  const isPaid = paymentStatus === "paid";
  const isPending = bookingStatus === "pending";
  const isConfirmed = bookingStatus === "confirmed";

  // Validation rules
  const canComplete = !isCancelled && isPaid && !isCompleted;
  const canCancel = !isCancelled && !isCompleted;
  const canConfirm = isPending && !isCancelled;
  const canMarkPaid = !isCancelled && !isCompleted && paymentStatus !== "paid";

  const createEvent = async (eventType: string, payload: Record<string, any>) => {
    const { error } = await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: eventType,
      event_payload: payload,
    });
    if (error) console.error("Failed to create event:", error);
  };

  const sendEmailNotification = async (eventType: string) => {
    // Map action event types to email notification event types
    const emailEventMap: Record<string, string> = {
      booking_confirmed: "booking_confirmed",
      payment_marked_paid: "payment_marked_paid",
      booking_cancelled: "booking_cancelled",
    };

    const emailEventType = emailEventMap[eventType];
    if (!emailEventType) return;

    try {
      const response = await fetch("/api/notify/booking-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          eventType: emailEventType,
        }),
      });

      if (!response.ok) {
        console.error("Email notification failed:", await response.text());
        setEmailWarning("Email notification may have failed. Check logs.");
      }
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      setEmailWarning("Email notification failed. Please check manually.");
    }
  };

  const handleAction = async (
    action: string,
    updates: {
      booking_status?: BookingStatus;
      payment_status?: PaymentStatus;
      remaining_amount?: number;
    }
  ) => {
    setLoading(action);
    setError(null);
    setSuccess(null);
    setEmailWarning(null);

    try {
      const updateData = {
        ...updates,
        last_action_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (updateError) throw updateError;

      // Create event
      await createEvent(action, {
        booking_status: updates.booking_status || bookingStatus,
        payment_status: updates.payment_status || paymentStatus,
        ...updates,
      });

      // Send email notification (non-blocking)
      sendEmailNotification(action);

      setSuccess(action);
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
        onActionComplete?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = () => {
    handleAction("booking_confirmed", {
      booking_status: "confirmed",
    });
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    handleAction("booking_cancelled", {
      booking_status: "cancelled",
    });
  };

  const handleComplete = async () => {
    if (!confirm("Mark this booking as completed?")) return;
    
    setLoading("booking_completed");
    setError(null);
    setSuccess(null);
    setEmailWarning(null);

    try {
      const updateData = {
        booking_status: "completed" as BookingStatus,
        last_action_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (updateError) throw updateError;

      // Create event
      await createEvent("booking_completed", {
        booking_status: "completed",
        payment_status: paymentStatus,
      });

      // Send review request email (non-blocking)
      try {
        const response = await fetch("/api/review/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });

        if (!response.ok) {
          console.error("Review request failed:", await response.text());
          setEmailWarning("Review request email may have failed.");
        }
      } catch (emailError) {
        console.error("Failed to send review request:", emailError);
        setEmailWarning("Review request email failed.");
      }

      setSuccess("booking_completed");
      setTimeout(() => {
        setSuccess(null);
        router.refresh();
        onActionComplete?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as completed");
    } finally {
      setLoading(null);
    }
  };

  const handleMarkPaid = () => {
    if (!confirm("Mark payment as fully paid? This will set remaining_amount to 0.")) return;
    handleAction("payment_marked_paid", {
      payment_status: "paid",
      remaining_amount: 0,
    });
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Action completed successfully!
        </div>
      )}

      {emailWarning && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          {emailWarning}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative group">
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading !== null}
            variant={canConfirm ? "primary" : "outline"}
            className="w-full"
            title={
              !canConfirm
                ? isCancelled
                  ? "Cannot confirm cancelled booking"
                  : isConfirmed
                  ? "Booking already confirmed"
                  : "Only pending bookings can be confirmed"
                : undefined
            }
          >
            {loading === "booking_confirmed" ? "Confirming..." : "Confirm Booking"}
          </Button>
        </div>

        <div className="relative group">
          <Button
            onClick={handleCancel}
            disabled={!canCancel || loading !== null}
            variant={canCancel ? "primary" : "outline"}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            title={
              !canCancel
                ? isCancelled
                  ? "Booking already cancelled"
                  : "Cannot cancel completed booking"
                : undefined
            }
          >
            {loading === "booking_cancelled" ? "Cancelling..." : "Cancel Booking"}
          </Button>
        </div>

        <div className="relative group">
          <Button
            onClick={handleComplete}
            disabled={!canComplete || loading !== null}
            variant={canComplete ? "primary" : "outline"}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            title={
              !canComplete
                ? isCancelled
                  ? "Cannot complete cancelled booking"
                  : !isPaid
                  ? "Payment must be paid before completing"
                  : "Booking already completed"
                : undefined
            }
          >
            {loading === "booking_completed" ? "Completing..." : "Mark as Completed"}
          </Button>
        </div>

        <div className="relative group">
          <Button
            onClick={handleMarkPaid}
            disabled={!canMarkPaid || loading !== null}
            variant={canMarkPaid ? "primary" : "outline"}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            title={
              !canMarkPaid
                ? isCancelled
                  ? "Cannot mark payment for cancelled booking"
                  : isCompleted
                  ? "Cannot change payment for completed booking"
                  : "Payment already marked as paid"
                : undefined
            }
          >
            {loading === "payment_marked_paid" ? "Updating..." : "Mark Payment as Paid"}
          </Button>
        </div>
      </div>
    </div>
  );
}

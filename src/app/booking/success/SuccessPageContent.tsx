"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import Link from "next/link";
import Button from "@/components/ui/Button";
import CopyReferenceCode from "@/components/booking/CopyReferenceCode";

interface BookingData {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_email: string;
  travel_date: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  payment_status: string;
  booking_status: string;
  created_at: string;
  items: Array<{
    item_type: string;
    title: string;
    subtotal_amount: number;
  }>;
}

export default function SuccessPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get("bookingId");
  const token = searchParams?.get("t");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("No booking ID provided");
      setLoading(false);
      return;
    }

    // Allow fetch even without token if we might be authenticated
    // The API will check if user is owner or admin
    fetchBooking();
  }, [bookingId, token]);

  const fetchBooking = async () => {
    if (!bookingId) return;

    try {
      // Build URL with token if available
      const url = token
        ? `/api/bookings/public?bookingId=${bookingId}&t=${token}`
        : `/api/bookings/public?bookingId=${bookingId}&t=fallback`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // Show more helpful error message
          if (!token) {
            setError("No access token provided. Please use the link from your email or log in to view your booking.");
          } else {
            setError("Booking not found or invalid access token");
          }
        } else {
          setError("Failed to load booking details");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (!data.booking) {
        setError("Booking not found");
        setLoading(false);
        return;
      }

      setBooking(data.booking);
      setLoading(false);

      // If payment is still "unpaid" and we haven't polled too much, retry
      // This handles the case where webhook hasn't processed yet
      if (data.booking.payment_status === "unpaid" && pollCount < 3) {
        setTimeout(() => {
          setPollCount((prev) => prev + 1);
          fetchBooking();
        }, 2000); // Poll every 2 seconds, max 3 times
      } else if (data.booking.payment_status === "unpaid" && pollCount >= 3) {
        // After 3 polls, show refresh button
        setShowRefresh(true);
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Failed to load booking details");
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setPollCount(0);
    setShowRefresh(false);
    setLoading(true);
    fetchBooking();
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <Container className="py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </Container>
    );
  }

  if (error || !booking) {
    return (
      <Container className="py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            {error || "We couldn't find that booking. If you just completed a booking, please check your email for the confirmation link with access token."}
          </p>
          <div className="space-y-4">
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
            <p className="text-sm text-gray-500">
              If you're having trouble accessing your booking, please contact support with your reference code from the confirmation email.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  const isPaymentPending = booking.payment_status === "unpaid";
  const isPartialPayment = booking.payment_status === "partial";
  const isFullyPaid = booking.payment_status === "paid";

  return (
    <Container className="py-12">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            We've sent a confirmation email to{" "}
            <span className="font-medium text-gray-900">
              {booking.customer_email}
            </span>
          </p>
        </div>

        {/* Payment Status Alert */}
        {isPaymentPending && (
          <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">Payment Processing</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Your payment is being processed. This usually takes a few seconds.
                </p>
                {showRefresh && (
                  <button
                    onClick={handleRefresh}
                    className="mt-2 text-sm text-yellow-900 underline hover:text-yellow-700"
                  >
                    Click to refresh payment status
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isPartialPayment && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Deposit Received</p>
                <p className="text-sm text-blue-800 mt-1">
                  Your deposit has been received. The remaining balance is due before your travel date.
                </p>
              </div>
            </div>
          </div>
        )}

        {isFullyPaid && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-green-900">Fully Paid</p>
                <p className="text-sm text-green-800 mt-1">
                  Your booking is fully paid. No further payment required.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reference Code Card */}
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your Reference Code
            </h2>
            <p className="text-sm text-gray-600">
              Save this code to track your booking
            </p>
          </div>
          <CopyReferenceCode referenceCode={booking.reference_code} />
          
          {/* Payment Summary */}
          <div className="mt-6 pt-6 border-t space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(booking.total_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(booking.amount_paid)}
              </span>
            </div>
            {booking.remaining_amount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Remaining Balance:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(booking.remaining_amount)}
                </span>
              </div>
            )}
          </div>

          {booking.travel_date && (
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">Travel Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(booking.travel_date)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href={`/booking/track?ref=${booking.reference_code}&t=${token}`}
            className="flex-1"
          >
            <Button className="w-full">Track Your Booking</Button>
          </Link>
          <Link href="/tours" className="flex-1">
            <Button variant="outline" className="w-full">
              Browse More Tours
            </Button>
          </Link>
        </div>

        {/* Booking Items Summary */}
        {booking.items && booking.items.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Items
            </h3>
            <div className="space-y-3">
              {booking.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center pb-3 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {item.item_type}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ¥{item.subtotal_amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Info - Minimal, no app_settings dependency */}
        <div className="bg-gray-50 rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your booking, please contact us with your reference code:
          </p>
          <p className="text-sm text-gray-500">
            Reference: <span className="font-mono font-semibold">{booking.reference_code}</span>
          </p>
        </div>
      </div>
    </Container>
  );
}

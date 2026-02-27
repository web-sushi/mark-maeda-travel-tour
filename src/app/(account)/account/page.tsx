import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ClaimBookingForm from "@/components/account/ClaimBookingForm";
import BookingsList from "@/components/account/BookingsList";
import CustomerLogoutButton from "@/components/auth/CustomerLogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If not logged in, show sign-in CTA instead of redirecting
  if (authError || !user) {
    return (
      <Container className="py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Account</h1>
            <p className="text-lg text-gray-600">
              Sign in to view your bookings and manage your account
            </p>
          </div>

          {/* Sign In CTA */}
          <div className="bg-white rounded-lg border shadow-sm p-8 text-center mb-8">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-600 mb-6">
              View your booking history, pay remaining balances, and manage your reservations
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login?redirect=/account">
                <Button className="w-full sm:w-auto">Sign In</Button>
              </Link>
              <Link href="/signup?redirect=/account">
                <Button variant="outline" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Track Booking Alternative */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Don't have an account?
            </h3>
            <p className="text-gray-600 mb-4">
              You can still track your booking using your reference code and email
            </p>
            <Link href="/booking/track">
              <Button variant="outline">Track Booking</Button>
            </Link>
          </div>

          {/* Optional Accounts Explanation */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Why create an account?
            </h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>View all your bookings in one place</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Quick access to pay remaining balances</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Claim and link your past bookings</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Faster checkout for future bookings</span>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    );
  }

  // Fetch user's bookings (RLS will filter by user_id automatically)
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (bookingsError) {
    console.error("Failed to fetch bookings:", bookingsError);
  }

  return (
    <Container className="py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-lg text-gray-600">
              {user.email || "Welcome"}
            </p>
          </div>
          
          <CustomerLogoutButton variant="button" />
        </div>

        {/* Claim Booking Section */}
        <ClaimBookingForm />

        {/* Bookings List with Filters */}
        <div className="mt-8">
          <BookingsList bookings={bookings || []} userEmail={user.email || ""} />
        </div>
      </div>
    </Container>
  );
}

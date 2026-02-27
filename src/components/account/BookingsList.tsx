"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Button from "../ui/Button";
import BookingCard from "./BookingCard";

interface Booking {
  id: string;
  reference_code: string;
  customer_name: string;
  travel_date: string;
  total_amount: number;
  amount_paid: number;
  remaining_amount: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
}

interface BookingsListProps {
  bookings: Booking[];
  userEmail: string;
}

type FilterType = "all" | "upcoming" | "past" | "unpaid";

export default function BookingsList({ bookings, userEmail }: BookingsListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const { upcoming, past, unpaid, sortedBookings } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingList: Booking[] = [];
    const pastList: Booking[] = [];
    const unpaidList: Booking[] = [];

    bookings.forEach((booking) => {
      const travelDate = new Date(booking.travel_date);
      travelDate.setHours(0, 0, 0, 0);

      if (travelDate >= now) {
        upcomingList.push(booking);
      } else {
        pastList.push(booking);
      }

      if (booking.remaining_amount > 0 && booking.payment_status !== "paid") {
        unpaidList.push(booking);
      }
    });

    // Sort upcoming by travel_date ASC (soonest first)
    upcomingList.sort((a, b) => new Date(a.travel_date).getTime() - new Date(b.travel_date).getTime());

    // Sort past by travel_date DESC (most recent first)
    pastList.sort((a, b) => new Date(b.travel_date).getTime() - new Date(a.travel_date).getTime());

    // Combine: upcoming first, then past
    const sorted = [...upcomingList, ...pastList];

    return {
      upcoming: upcomingList,
      past: pastList,
      unpaid: unpaidList,
      sortedBookings: sorted,
    };
  }, [bookings]);

  const getFilteredBookings = () => {
    switch (filter) {
      case "upcoming":
        return upcoming;
      case "past":
        return past;
      case "unpaid":
        return unpaid;
      default:
        return sortedBookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          My Bookings
        </h2>
        <p className="text-sm text-gray-600">{userEmail}</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium transition-colors text-sm ${
            filter === "all"
              ? "border-b-2 border-[#E4005A] text-[#E4005A]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-4 py-2 font-medium transition-colors text-sm ${
            filter === "upcoming"
              ? "border-b-2 border-[#E4005A] text-[#E4005A]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`px-4 py-2 font-medium transition-colors text-sm ${
            filter === "past"
              ? "border-b-2 border-[#E4005A] text-[#E4005A]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Past ({past.length})
        </button>
        <button
          onClick={() => setFilter("unpaid")}
          className={`px-4 py-2 font-medium transition-colors text-sm ${
            filter === "unpaid"
              ? "border-b-2 border-[#E4005A] text-[#E4005A]"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Unpaid ({unpaid.length})
        </button>
      </div>

      {/* Bookings List or Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" && "No bookings yet"}
            {filter === "upcoming" && "No upcoming bookings"}
            {filter === "past" && "No past bookings"}
            {filter === "unpaid" && "No unpaid bookings"}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all" && "Your bookings will appear here once you complete a checkout"}
            {filter === "upcoming" && "You don't have any upcoming trips"}
            {filter === "past" && "You haven't completed any bookings yet"}
            {filter === "unpaid" && "All your bookings are paid in full"}
          </p>
          {filter === "all" && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/tours">
                <Button>Browse Tours</Button>
              </Link>
              <Link href="/booking/track">
                <Button variant="outline">Track Booking by Reference</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
import TrackPageContent from "@/components/booking/TrackPageContent";

export default function BookingTrackPage() {
  return (
    <Suspense fallback={<TrackPageLoading />}>
      <TrackPageContent />
    </Suspense>
  );
}

function TrackPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Track Your Booking
          </h1>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

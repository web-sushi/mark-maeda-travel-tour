import { Suspense } from "react";
import SuccessPageContent from "./SuccessPageContent";

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}

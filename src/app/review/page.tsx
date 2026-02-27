import { Suspense } from "react";
import ReviewPageContent from "./ReviewPageContent";

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Loading review form...</p>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}

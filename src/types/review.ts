// Types for the reviews system

export interface BookingItem {
  id: string;
  booking_id: string;
  item_type: "tour" | "transfer" | "package";
  item_id: string;
  title: string;
  slug: string;
  vehicle_selection: any;
  vehicle_rates: any;
  subtotal_amount: number;
  created_at: string;
}

export interface ReviewRequest {
  id: string;
  booking_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_item_id: string;
  booking_id: string;
  rating: number; // 1-5
  comment: string | null;
  display_name: string | null;
  approved: boolean;
  featured: boolean;
  created_at: string;
}

export interface ItemReviewInput {
  bookingItemId: string;
  rating: number;
  comment?: string;
}

export interface ReviewSubmission {
  token: string;
  displayName?: string;
  overallComment?: string;
  itemReviews: ItemReviewInput[];
}

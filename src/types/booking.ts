import { VehicleSelection } from "./vehicle";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded" | "payment_failed";

export interface BookingItem {
  type: "tour" | "transfer" | "package";
  id: string;
  slug?: string;
  title?: string;
  vehicleSelection?: VehicleSelection;
  vehicleRates?: any;
  [key: string]: any;
}

// New: Booking item from database with trip details
export interface BookingItemRow {
  id: string;
  booking_id: string;
  item_type: "tour" | "transfer" | "package";
  item_id: string;
  title?: string | null;
  slug?: string | null;
  vehicle_selection?: any;
  vehicle_rates?: any;
  subtotal_amount?: number | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  travel_date?: string | null; // ISO date for tours/transfers
  start_date?: string | null; // ISO date for packages
  end_date?: string | null; // ISO date for packages
  pickup_time?: string | null; // time string
  passengers_count?: number | null;
  large_suitcases?: number | null;
  meta?: Record<string, any> | null; // contains flight_number, special_requests, etc.
  created_at: string;
}

// Enhanced item with fetched names
export interface EnhancedBookingItem extends BookingItemRow {
  fetched_name?: string | null;
}

export interface Booking {
  id: string;
  reference_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  travel_date: string; // ISO date string
  passengers_count: number;
  large_suitcases: number;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  special_requests?: string | null;
  vehicles_count: number;
  items: BookingItem[];
  total_amount: number; // in JPY (yen), no minor unit
  deposit_choice: number; // 25, 50, or 100
  amount_paid: number; // in JPY (yen)
  remaining_amount: number; // in JPY (yen)
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  admin_notes?: string | null;
  last_action_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: string;
  event_payload: Record<string, any>;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  // Additional joined data can be added here if needed
}

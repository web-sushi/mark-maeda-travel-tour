/**
 * Safe event type for public booking tracking
 * Does not include raw event_payload
 */
export interface SafeBookingEvent {
  event_type: string;
  created_at: string;
  summary: string;
}

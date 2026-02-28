/**
 * Client-safe date formatting utilities for admin pages
 * These functions don't import server-side code
 */

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string | null | undefined, endDate: string | null | undefined): string {
  if (!startDate && !endDate) return "—";
  
  const start = startDate ? new Date(startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : null;
  
  const end = endDate ? new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : null;
  
  if (start && end && start !== end) {
    return `${start} – ${end}`;
  }
  
  return start || end || "—";
}

/**
 * Format single date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

/**
 * Format time for display
 */
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return "—";
  
  try {
    // timeString is in format HH:MM:SS or HH:MM
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const min = minutes || '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${min} ${ampm}`;
  } catch {
    return timeString;
  }
}

/**
 * Format booking item date for display in admin list
 * Falls back from start_date/end_date to travel_date
 * Never renders epoch date (1/1/1970)
 */
export function formatBookingItemDate(item: {
  travel_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}): string {
  // Use start_date OR travel_date as the primary date
  const startDate = item.start_date ?? item.travel_date;
  // Use end_date OR travel_date as the end date
  const endDate = item.end_date ?? item.travel_date;
  
  // If we have no valid dates at all, return placeholder
  if (!startDate && !endDate) return "—";
  
  // If start and end are the same (or one is null), show single date
  if (startDate === endDate || !endDate) {
    return formatDate(startDate);
  }
  
  // Show date range
  return formatDateRange(startDate, endDate);
}

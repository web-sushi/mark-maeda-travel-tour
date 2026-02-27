import { createClient } from "@/lib/supabase/server";
import { BookingItemRow, EnhancedBookingItem } from "@/types/booking";

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
 * Get the effective date for an item (for sorting/display)
 */
export function getItemDate(item: BookingItemRow): Date | null {
  const dateStr = item.travel_date || item.start_date;
  if (!dateStr) return null;
  
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
}

/**
 * Compute trip summary from booking items
 */
export function computeTripSummary(items: BookingItemRow[]) {
  const dates: Date[] = [];
  let totalPassengers = 0;
  let totalSuitcases = 0;
  const pickupLocations = new Set<string>();
  const dropoffLocations = new Set<string>();
  
  items.forEach(item => {
    // Collect dates
    if (item.travel_date) dates.push(new Date(item.travel_date));
    if (item.start_date) dates.push(new Date(item.start_date));
    if (item.end_date) dates.push(new Date(item.end_date));
    
    // Sum passengers and suitcases
    if (item.passengers_count) totalPassengers += item.passengers_count;
    if (item.large_suitcases) totalSuitcases += item.large_suitcases;
    
    // Collect locations
    if (item.pickup_location) pickupLocations.add(item.pickup_location);
    if (item.dropoff_location) dropoffLocations.add(item.dropoff_location);
  });
  
  const earliestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
  
  return {
    dateRange: formatDateRange(
      earliestDate?.toISOString() || null,
      latestDate?.toISOString() || null
    ),
    totalItems: items.length,
    totalPassengers,
    totalSuitcases,
    pickupLocation: pickupLocations.size === 1 ? Array.from(pickupLocations)[0] : "Varies per item",
    dropoffLocation: dropoffLocations.size === 1 ? Array.from(dropoffLocations)[0] : "Varies per item",
    hasMultipleLocations: pickupLocations.size > 1 || dropoffLocations.size > 1,
  };
}

/**
 * Fetch item names from their respective tables
 */
export async function fetchItemNames(items: BookingItemRow[]): Promise<EnhancedBookingItem[]> {
  const supabase = await createClient();
  
  // Group items by type
  const tourIds = items.filter(i => i.item_type === 'tour').map(i => i.item_id);
  const transferIds = items.filter(i => i.item_type === 'transfer').map(i => i.item_id);
  const packageIds = items.filter(i => i.item_type === 'package').map(i => i.item_id);
  
  // Fetch names in parallel
  const [tours, transfers, packages] = await Promise.all([
    tourIds.length > 0
      ? supabase.from('tours').select('id, title').in('id', tourIds)
      : { data: [] },
    transferIds.length > 0
      ? supabase.from('transfers').select('id, title').in('id', transferIds)
      : { data: [] },
    packageIds.length > 0
      ? supabase.from('packages').select('id, title').in('id', packageIds)
      : { data: [] },
  ]);
  
  // Create lookup maps
  const tourMap = new Map((tours.data || []).map(t => [t.id, t.title]));
  const transferMap = new Map((transfers.data || []).map(t => [t.id, t.title]));
  const packageMap = new Map((packages.data || []).map(p => [p.id, p.title]));
  
  // Enhance items with fetched names
  return items.map(item => {
    let fetched_name: string | null = null;
    
    if (item.item_type === 'tour') {
      fetched_name = tourMap.get(item.item_id) || null;
    } else if (item.item_type === 'transfer') {
      fetched_name = transferMap.get(item.item_id) || null;
    } else if (item.item_type === 'package') {
      fetched_name = packageMap.get(item.item_id) || null;
    }
    
    return {
      ...item,
      fetched_name,
    };
  });
}

/**
 * Get admin edit URL for an item
 */
export function getItemAdminUrl(itemType: string, itemId: string): string {
  if (itemType === 'tour') return `/admin/tours/${itemId}`;
  if (itemType === 'transfer') return `/admin/transfers/${itemId}`;
  if (itemType === 'package') return `/admin/packages/${itemId}`;
  return '#';
}

/**
 * Sort items by date and time for schedule view
 */
export function sortItemsBySchedule(items: EnhancedBookingItem[]): EnhancedBookingItem[] {
  return [...items].sort((a, b) => {
    const dateA = getItemDate(a);
    const dateB = getItemDate(b);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    const dateDiff = dateA.getTime() - dateB.getTime();
    if (dateDiff !== 0) return dateDiff;
    
    // If same date, sort by pickup_time
    const timeA = a.pickup_time || '';
    const timeB = b.pickup_time || '';
    return timeA.localeCompare(timeB);
  });
}

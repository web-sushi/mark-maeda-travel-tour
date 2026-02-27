import { VehicleRates } from "@/types/vehicle";

/**
 * Get the starting (minimum) price from vehicle rates
 */
export function getStartingPrice(vehicleRates: VehicleRates | null | undefined): number | null {
  if (!vehicleRates || typeof vehicleRates !== "object") {
    return null;
  }

  const rates = Object.values(vehicleRates).filter(
    (rate) => typeof rate === "number" && rate > 0
  );

  if (rates.length === 0) {
    return null;
  }

  return Math.min(...rates);
}

/**
 * Format price in Japanese Yen with commas
 */
export function formatJPY(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Contact for price";
  }

  return `¥${amount.toLocaleString()}`;
}

/**
 * Get human-readable category label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    airport_transfer: "Airport Transfers",
    city_to_city_transfer: "City to City Transfers",
    theme_park_transfer: "Theme Park Transfers",
    cruise_port_transfer: "Cruise Port Transfers",
    station_transfer: "Station Transfers",
  };

  return labels[category] || category;
}

/**
 * Get category order for display
 */
export function getCategoryOrder(category: string): number {
  const order: Record<string, number> = {
    airport_transfer: 1,
    city_to_city_transfer: 2,
    theme_park_transfer: 3,
    cruise_port_transfer: 4,
    station_transfer: 5,
  };

  return order[category] || 999;
}

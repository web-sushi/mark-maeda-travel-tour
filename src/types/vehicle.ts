export type VehicleKey = "v8" | "v10" | "v14" | "coaster" | "bigbus";

export const VEHICLE_LABELS: Record<VehicleKey, string> = {
  v8: "8-seater",
  v10: "10-seater",
  v14: "14-seater",
  coaster: "Coaster",
  bigbus: "Big Bus",
};

export interface VehicleRates {
  v8?: number; // yen
  v10?: number; // yen
  v14?: number; // yen
  coaster?: number; // yen
  bigbus?: number; // yen
}

export interface VehicleSelection {
  v8: number;
  v10: number;
  v14: number;
  coaster: number;
  bigbus: number;
}

export function getLowestVehicleRate(rates: VehicleRates | null | undefined): number | null {
  if (!rates) return null;
  const values = Object.values(rates).filter((v) => v != null && v > 0) as number[];
  if (values.length === 0) return null;
  return Math.min(...values);
}

export function calculateItemSubtotal(
  vehicleSelection: VehicleSelection,
  vehicleRates: VehicleRates
): number {
  let total = 0;
  Object.entries(vehicleSelection).forEach(([key, qty]) => {
    const rate = vehicleRates[key as VehicleKey];
    if (rate && qty > 0) {
      total += rate * qty;
    }
  });
  return total;
}

export function getTotalVehicles(vehicleSelection: VehicleSelection): number {
  return Object.values(vehicleSelection).reduce((sum, qty) => sum + qty, 0);
}

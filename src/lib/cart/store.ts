import { VehicleSelection, VehicleRates } from "@/types/vehicle";

export interface TripDetails {
  pickupLocation?: string;
  dropoffLocation?: string;
  travelDate?: string; // For tours and transfers
  startDate?: string; // For packages
  endDate?: string; // For packages
  pickupTime?: string; // Optional, mainly for transfers
  flightNumber?: string; // Optional, mainly for transfers
  specialRequests?: string;
  passengersCount?: string | number; // Required for all items
  largeSuitcases?: string | number; // Optional
}

export interface CartItem {
  type: "tour" | "transfer" | "package";
  id: string;
  slug: string;
  title: string;
  vehicleSelection: VehicleSelection;
  vehicleRates: VehicleRates;
  tripDetails?: TripDetails;
}

const CART_STORAGE_KEY = "tour_webapp_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    // Dispatch custom event for cart updates
    window.dispatchEvent(new Event("cartUpdated"));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
}

/**
 * Get total quantity of all items in cart (sum of all vehicle counts)
 */
export function getCartTotalQuantity(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const vehicleCount = Object.values(item.vehicleSelection || {}).reduce(
      (acc, qty) => acc + qty,
      0
    );
    return sum + vehicleCount;
  }, 0);
}

export function addItem(item: CartItem): void {
  const cart = getCart();
  // Check if item already exists (same type + id)
  const existingIndex = cart.findIndex(
    (i) => i.type === item.type && i.id === item.id
  );
  if (existingIndex >= 0) {
    // Update existing item's vehicle selection
    cart[existingIndex] = item;
  } else {
    cart.push(item);
  }
  setCart(cart);
}

export function removeItem(type: "tour" | "transfer" | "package", id: string): void {
  const cart = getCart();
  const filtered = cart.filter((item) => !(item.type === type && item.id === id));
  setCart(filtered);
}

export function updateItemVehicles(
  type: "tour" | "transfer" | "package",
  id: string,
  vehicleSelection: VehicleSelection
): void {
  const cart = getCart();
  const item = cart.find((i) => i.type === type && i.id === id);
  if (item) {
    item.vehicleSelection = vehicleSelection;
    setCart(cart);
  }
}

export function updateItemTripDetails(
  type: "tour" | "transfer" | "package",
  id: string,
  tripDetails: TripDetails
): void {
  const cart = getCart();
  const item = cart.find((i) => i.type === type && i.id === id);
  if (item) {
    item.tripDetails = { ...item.tripDetails, ...tripDetails };
    setCart(cart);
  }
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cartUpdated"));
}

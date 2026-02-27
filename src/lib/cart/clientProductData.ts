import { CartItem } from "./store";

export interface ProductImageData {
  id: string;
  title: string;
  imageUrl: string | null;
  slug: string;
}

export interface EnrichedCartItem extends CartItem {
  productData?: ProductImageData;
}

/**
 * Fetch product data for cart items on the client side
 * Uses the API route to get latest product information
 */
export async function fetchCartProductDataClient(
  cartItems: CartItem[]
): Promise<Record<string, ProductImageData>> {
  if (cartItems.length === 0) {
    return {};
  }

  // Group IDs by type
  const tourIds = cartItems
    .filter((item) => item.type === "tour")
    .map((item) => item.id);
  const transferIds = cartItems
    .filter((item) => item.type === "transfer")
    .map((item) => item.id);
  const packageIds = cartItems
    .filter((item) => item.type === "package")
    .map((item) => item.id);

  try {
    const response = await fetch("/api/cart/product-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tourIds,
        transferIds,
        packageIds,
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch product data");
      return {};
    }

    const data = await response.json();
    
    // Convert to flat map keyed by `${type}:${id}`
    const productMap: Record<string, ProductImageData> = {};
    
    Object.entries(data.tours || {}).forEach(([id, product]) => {
      productMap[`tour:${id}`] = product as ProductImageData;
    });
    
    Object.entries(data.transfers || {}).forEach(([id, product]) => {
      productMap[`transfer:${id}`] = product as ProductImageData;
    });
    
    Object.entries(data.packages || {}).forEach(([id, product]) => {
      productMap[`package:${id}`] = product as ProductImageData;
    });

    return productMap;
  } catch (error) {
    console.error("Error fetching cart product data:", error);
    return {};
  }
}

/**
 * Enrich cart items with latest product data
 */
export function enrichCartItems(
  cartItems: CartItem[],
  productMap: Record<string, ProductImageData>
): EnrichedCartItem[] {
  return cartItems.map((item) => {
    const key = `${item.type}:${item.id}`;
    return {
      ...item,
      productData: productMap[key],
    };
  });
}

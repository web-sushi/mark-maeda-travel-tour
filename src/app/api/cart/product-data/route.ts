import { NextRequest, NextResponse } from "next/server";
import { fetchCartProductData } from "@/lib/cart/productData";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourIds = [], transferIds = [], packageIds = [] } = body;

    // Validate input
    if (
      !Array.isArray(tourIds) ||
      !Array.isArray(transferIds) ||
      !Array.isArray(packageIds)
    ) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Fetch product data
    const productData = await fetchCartProductData(
      tourIds,
      transferIds,
      packageIds
    );

    return NextResponse.json(productData);
  } catch (error) {
    console.error("Error fetching cart product data:", error);
    return NextResponse.json(
      { error: "Failed to fetch product data" },
      { status: 500 }
    );
  }
}

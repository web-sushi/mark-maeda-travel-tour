import Container from "@/components/layout/Container";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "@/components/checkout/BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;
  const supabase = await createClient();

  // Validate type
  if (type !== "tour" && type !== "transfer" && type !== "package") {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Invalid Booking Type</h1>
          <p className="text-gray-600">The booking type must be tour, transfer, or package.</p>
        </div>
      </Container>
    );
  }

  // Fetch the item based on type
  let item: any = null;
  let error: any = null;

  if (type === "tour") {
    const result = await supabase
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    item = result.data;
    error = result.error;
  } else if (type === "transfer") {
    const result = await supabase
      .from("transfers")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    item = result.data;
    error = result.error;
  } else if (type === "package") {
    const result = await supabase
      .from("packages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();
    item = result.data;
    error = result.error;
  }

  if (error || !item) {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Not Found</h1>
          <p className="text-gray-600">
            The {type} you're looking for is not available or has been removed.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Book: {item.title}</h1>
        <p className="text-lg text-gray-600 mb-8">
          Please fill out the form below to complete your booking.
        </p>

        <BookingForm
          itemType={type as "tour" | "transfer" | "package"}
          itemId={item.id}
          itemTitle={item.title}
          basePriceJpy={item.base_price_jpy || 0}
        />
      </div>
    </Container>
  );
}

import { createClient } from "@/lib/supabase/server";
import Container from "@/components/layout/Container";
import Link from "next/link";
import Button from "@/components/ui/Button";
import PhotoCarousel from "@/components/reviews/PhotoCarousel";

export const dynamic = "force-dynamic";

interface GalleryItem {
  id: string;
  image_url: string;
  customer_name: string | null;
  tour_type: string | null;
  testimonial: string | null;
  rating: number | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export default async function ReviewsPage() {
  const supabase = await createClient();

  const { data: galleryItems } = await supabase
    .from("customer_gallery")
    .select("*")
    .eq("is_visible", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  const featured = (galleryItems || []).filter((item) => item.is_featured);
  const morePhotos = (galleryItems || []).filter((item) => !item.is_featured);

  return (
    <div className="bg-[#F8F9FC] min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] text-white py-16 sm:py-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Guest Moments & Reviews
            </h1>
            <p className="text-lg sm:text-xl text-gray-300">
              See what our guests are saying about their experiences exploring Japan with us
            </p>
          </div>
        </Container>
      </section>

      {/* Featured Carousel */}
      {featured.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <Container>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Stories</h2>
              <p className="text-gray-600">
                Highlighted experiences from our happy travelers
              </p>
            </div>
            <PhotoCarousel items={featured} variant="featured" />
          </Container>
        </section>
      )}

      {/* More Guest Photos Carousel */}
      {morePhotos.length > 0 && (
        <section className="py-12 sm:py-16">
          <Container>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">More Guest Photos</h2>
              <p className="text-gray-600">
                Memories captured during our tours and travels
              </p>
            </div>
            <PhotoCarousel items={morePhotos} variant="compact" />
          </Container>
        </section>
      )}

      {/* Empty State */}
      {(!galleryItems || galleryItems.length === 0) && (
        <section className="py-20">
          <Container>
            <div className="text-center max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No photos yet
              </h3>
              <p className="text-gray-600">
                Check back soon for guest photos and reviews!
              </p>
            </div>
          </Container>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white border-t">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Create Your Own Memories?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Book a tour today and join our community of happy travelers
            </p>
            <Link href="/tours">
              <Button size="lg">Browse All Tours</Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

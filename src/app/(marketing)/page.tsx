import { createClient } from "@/lib/supabase/server";
import { getLowestVehicleRate } from "@/types/vehicle";
import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import Link from "next/link";
import ListingCard from "@/components/listing/ListingCard";
import PhotoCarousel from "@/components/reviews/PhotoCarousel";
import HeroSearchAutocomplete from "@/components/search/HeroSearchAutocomplete";

export const dynamic = "force-dynamic";

// Brand Colors
// Primary Navy: #1B0C3F
// Accent Pink/Red: #E4005A
// Background: #F8F9FC
// Text: #111827

export default async function HomePage() {
  const supabase = await createClient();
  
  // Fetch featured/hot tours (up to 6)
  const { data: featuredTours } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(6);

  // If no featured tours, fetch latest 6 active tours
  let hotTours = featuredTours;
  if (!hotTours || hotTours.length === 0) {
    const { data: latestTours } = await supabase
      .from("tours")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6);
    hotTours = latestTours;
  }

  // Fetch first 4 tours for "Popular Right Now" section
  const { data: tours } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch featured reviews for testimonials
  const { data: featuredReviews } = await supabase
    .from("v_reviews_expanded")
    .select("*")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch customer gallery for Guest Moments section
  const { data: guestPhotos } = await supabase
    .from("customer_gallery")
    .select("*")
    .eq("is_visible", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(9);

  return (
    <div className="bg-[#F8F9FC]">
      {/* Hero Section with Search */}
      <div
        className="relative w-full min-h-[500px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(/images/home-hero.jpg)` }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Discover Japan with Confidence
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Private tours, transfers, and curated travel experiences.
            </p>
            
            {/* Hero Search Bar with Autocomplete */}
            <HeroSearchAutocomplete />
          </div>
        </div>
      </div>

      {/* Hot Tours Section */}
      {hotTours && hotTours.length > 0 && (
        <section className="py-12 mt-12 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#E4005A]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                    Hot Tours
                  </h2>
                </div>
                <span className="px-3 py-1 bg-[#E4005A] text-white text-xs font-bold rounded-full uppercase">
                  Popular
                </span>
              </div>
              <Link 
                href="/tours"
                className="hidden sm:inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors text-sm"
              >
                View All Tours
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Horizontal scrolling cards */}
            <div className="relative">
              <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                <div className="flex gap-4 sm:gap-6" style={{ minWidth: 'min-content' }}>
                  {hotTours.map((tour) => {
                    const lowestRate = getLowestVehicleRate(tour.vehicle_rates);
                    const price = lowestRate || tour.base_price_jpy;
                    const imageUrl = getPublicImageUrl(tour.cover_image_path);

                    return (
                      <Link 
                        key={tour.id} 
                        href={`/tours/${tour.slug}`}
                        className="flex-shrink-0 w-64 sm:w-72 group"
                      >
                        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#E4005A] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                          {/* Image */}
                          <div className="relative w-full h-40 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={tour.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-gray-300"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            {/* Hot badge */}
                            <div className="absolute top-2 right-2 px-2 py-1 bg-[#E4005A] text-white text-xs font-bold rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                              HOT
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-[#111827] mb-2 line-clamp-2 group-hover:text-[#E4005A] transition-colors">
                              {tour.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                              {tour.region && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {tour.region}
                                </span>
                              )}
                              {tour.duration_hours && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {tour.duration_hours}h
                                </span>
                              )}
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-lg font-bold text-[#111827]">
                                {price !== null ? `From ¥${price.toLocaleString()}` : 'Contact for pricing'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile "View All" button */}
            <div className="text-center mt-6 sm:hidden">
              <Link 
                href="/tours"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors text-sm"
              >
                View All Tours
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Services Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional travel services tailored to your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tours Card */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#E4005A] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E4005A] to-[#C4004A] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Private Tours</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Explore Japan's hidden gems with our customizable private tours. Licensed guides and comfortable vehicles.
              </p>
              <Link 
                href="/tours"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors group"
              >
                Browse Tours
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Transfers Card */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#E4005A] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Transfers</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Reliable airport and city transfers. Door-to-door service with professional multilingual drivers.
              </p>
              <Link 
                href="/transfers"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors group"
              >
                View Transfers
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            {/* Packages Card */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-[#E4005A] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#111827] mb-3">Tour Packages</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Complete travel packages combining tours and transfers. Perfect for hassle-free travel planning.
              </p>
              <Link 
                href="/packages"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors group"
              >
                View Packages
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Right Now Section */}
      {tours && tours.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2">
                  Popular Right Now
                </h2>
                <p className="text-lg text-gray-600">
                  Discover our most-loved tours
                </p>
              </div>
              <Link 
                href="/tours"
                className="hidden sm:inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors"
              >
                View All
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tours.map((tour) => {
                const lowestRate = getLowestVehicleRate(tour.vehicle_rates);
                const price = lowestRate || tour.base_price_jpy;
                const imageUrl = getPublicImageUrl(tour.cover_image_path);

                return (
                  <ListingCard
                    key={tour.id}
                    title={tour.title}
                    imageUrl={imageUrl}
                    price={price}
                    region={tour.region}
                    duration_hours={tour.duration_hours}
                    href={`/tours/${tour.slug}`}
                  />
                );
              })}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link 
                href="/tours"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors"
              >
                View All Tours
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Vehicle Fleet Preview Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
              Our Vehicle Fleet
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our range of comfortable, licensed vehicles
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* 8-Seater */}
            <div className="bg-[#F8F9FC] rounded-xl p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#E4005A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#111827] mb-2">8-Seater</h3>
              <p className="text-sm text-gray-600 mb-1">Van</p>
              <p className="text-xs text-gray-500">Comfortable private ride</p>
            </div>

            {/* 10-Seater */}
            <div className="bg-[#F8F9FC] rounded-xl p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#E4005A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#111827] mb-2">10-Seater</h3>
              <p className="text-sm text-gray-600 mb-1">Van</p>
              <p className="text-xs text-gray-500">Comfortable private ride</p>
            </div>

            {/* 14-Seater */}
            <div className="bg-[#F8F9FC] rounded-xl p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#E4005A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#111827] mb-2">14-Seater</h3>
              <p className="text-sm text-gray-600 mb-1">Minibus</p>
              <p className="text-xs text-gray-500">Comfortable private ride</p>
            </div>

            {/* Coaster */}
            <div className="bg-[#F8F9FC] rounded-xl p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#E4005A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E4005A] to-[#C4004A] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#111827] mb-2">Coaster</h3>
              <p className="text-sm text-gray-600 mb-1">Small Bus</p>
              <p className="text-xs text-gray-500">Comfortable private ride</p>
            </div>

            {/* Big Bus */}
            <div className="bg-[#F8F9FC] rounded-xl p-6 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#E4005A]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E4005A] to-[#C4004A] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
              </div>
              <h3 className="font-bold text-[#111827] mb-2">Big Bus</h3>
              <p className="text-sm text-gray-600 mb-1">Large Bus</p>
              <p className="text-xs text-gray-500">Comfortable private ride</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Trusted by Travelers Across Japan
            </h2>
            <p className="text-lg text-gray-300">
              See what our customers have to say
            </p>
          </div>

          {featuredReviews && featuredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredReviews.slice(0, 3).map((review) => {
                const displayName = review.display_name || "Anonymous";
                const initial = displayName.charAt(0).toUpperCase();
                const colors = [
                  "from-[#E4005A] to-[#C4004A]",
                  "from-blue-500 to-blue-600",
                  "from-green-500 to-green-600",
                  "from-purple-500 to-purple-600",
                  "from-orange-500 to-orange-600",
                ];
                const colorIndex = review.review_id.charCodeAt(0) % colors.length;

                // Build item link based on type
                const itemLink =
                  review.item_type === "tour"
                    ? `/tours/${review.slug}`
                    : review.item_type === "transfer"
                    ? `/transfers/${review.slug}`
                    : `/packages/${review.slug}`;

                return (
                  <div
                    key={review.review_id}
                    className="bg-white/90 rounded-xl p-8 border border-white/30 hover:bg-white/95 transition-all"
                  >
                    {/* Star Rating */}
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating ? "text-yellow-400" : "text-gray-400"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-gray-200 mb-6 leading-relaxed line-clamp-4">
                      "{review.comment || "Great experience!"}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold`}
                        >
                          {initial}
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold">{displayName}</p>
                          <a
                            href={itemLink}
                            className="text-sm text-gray-300 hover:text-white transition-colors capitalize"
                          >
                            {review.title}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Fallback placeholder testimonials */}
              <div className="bg-white/90 rounded-xl p-8 border border-white/30">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-200 mb-6 leading-relaxed">
                  "Excellent service! Professional drivers and comfortable vehicles. Highly recommended!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E4005A] to-[#C4004A] flex items-center justify-center text-white font-bold">
                    T
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Traveler</p>
                    <p className="text-sm text-gray-300">Japan Tour</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Guest Moments Section */}
      {guestPhotos && guestPhotos.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-2">
                  Guest Moments
                </h2>
                <p className="text-lg text-gray-600">
                  Capturing memories from our tours
                </p>
              </div>
              <Link 
                href="/reviews"
                className="hidden sm:inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors"
              >
                View All Photos
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <PhotoCarousel items={guestPhotos} variant="compact" />

            <div className="text-center mt-8">
              <Link 
                href="/reviews"
                className="inline-flex items-center text-[#E4005A] font-semibold hover:text-[#C4004A] transition-colors"
              >
                View All Guest Photos
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-6">
            Ready to Explore Japan?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Book your private tour or transfer today and experience Japan with comfort and confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/tours"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg bg-[#E4005A] text-white hover:bg-[#C4004A] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Browse All Tours
            </Link>
            <Link 
              href="/packages"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg bg-[#1B0C3F] text-white hover:bg-[#2D1A5F] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              View Packages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

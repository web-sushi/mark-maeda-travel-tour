import { getPublicImageUrl } from "@/lib/storage/publicUrl";
import { getLowestVehicleRate } from "@/types/vehicle";
import { runSearch, SearchResult } from "@/lib/search";
import Container from "@/components/layout/Container";
import Link from "next/link";
import SearchFilters from "@/components/search/SearchFilters";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: {
    q?: string;
    type?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchParams) {
  const query = searchParams.q || "";
  const type = (searchParams.type || "all") as "all" | "tours" | "transfers" | "packages";
  
  // Run search
  const results = await runSearch(query, type);
  
  // Group results by type
  const tourResults = results.filter((r) => r.type === "tour");
  const transferResults = results.filter((r) => r.type === "transfer");
  const packageResults = results.filter((r) => r.type === "package");

  return (
    <div className="bg-[#F8F9FC] min-h-[100svh]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1B0C3F] to-[#2D1A5F] text-white py-12 sm:py-16">
        <Container>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Search Results</h1>
          {query && (
            <p className="text-lg text-gray-300">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </p>
          )}
        </Container>
      </section>

      {/* Search Filters */}
      <section className="py-6 bg-white border-b sticky top-16 z-40">
        <Container>
          <SearchFilters initialQuery={query} initialType={type} />
        </Container>
      </section>

      {/* Results */}
      <section className="py-12">
        <Container>
          {!query ? (
            <div className="text-center py-20">
              <svg
                className="w-20 h-20 mx-auto mb-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Searching</h2>
              <p className="text-gray-600">Enter a search term to find tours, transfers, or packages</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <svg
                className="w-20 h-20 mx-auto mb-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find anything matching "{query}"
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-[#E4005A] text-white font-semibold rounded-lg hover:bg-[#C4004A] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Tours Results */}
              {tourResults.length > 0 && (
                <ResultsSection
                  title="Tours"
                  count={tourResults.length}
                  results={tourResults}
                  typeColor="bg-blue-600"
                  typePath="tours"
                />
              )}

              {/* Transfers Results */}
              {transferResults.length > 0 && (
                <ResultsSection
                  title="Transfers"
                  count={transferResults.length}
                  results={transferResults}
                  typeColor="bg-purple-600"
                  typePath="transfers"
                />
              )}

              {/* Packages Results */}
              {packageResults.length > 0 && (
                <ResultsSection
                  title="Packages"
                  count={packageResults.length}
                  results={packageResults}
                  typeColor="bg-amber-600"
                  typePath="packages"
                />
              )}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

interface ResultsSectionProps {
  title: string;
  count: number;
  results: SearchResult[];
  typeColor: string;
  typePath: string;
}

function ResultsSection({ title, count, results, typeColor, typePath }: ResultsSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <span className={`px-3 py-1 ${typeColor} text-white text-sm font-semibold rounded-full`}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} typeColor={typeColor} typePath={typePath} />
        ))}
      </div>
    </div>
  );
}

interface ResultCardProps {
  result: SearchResult;
  typeColor: string;
  typePath: string;
}

function ResultCard({ result, typeColor, typePath }: ResultCardProps) {
  const imageUrl = getPublicImageUrl(result.cover_image_path);
  const price = result.vehicle_rates 
    ? getLowestVehicleRate(result.vehicle_rates) || result.base_price_jpy
    : result.total_price_jpy || result.base_price_jpy;

  return (
    <Link
      href={`/${typePath}/${result.slug}`}
      className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#E4005A] hover:shadow-xl transition-all group"
    >
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              {result.type === "tour" && (
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              )}
              {result.type === "transfer" && (
                <>
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                </>
              )}
              {result.type === "package" && (
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
              )}
            </svg>
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 ${typeColor} text-white text-xs font-semibold rounded capitalize`}>
          {result.type}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{result.title}</h3>
        
        {/* Meta info */}
        <div className="text-sm text-gray-600 mb-2">
          {result.region && <span>{result.region}</span>}
          {result.category && <span className="capitalize">{result.category}</span>}
          {result.from_area && result.to_area && (
            <span>{result.from_area} → {result.to_area}</span>
          )}
          {result.duration_days && <span>{result.duration_days} Days</span>}
          {result.duration_hours && <span>{result.duration_hours}h</span>}
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-[#E4005A]">
          {price ? `${result.type === "tour" ? "From " : ""}¥${price.toLocaleString()}` : 
           result.type === "transfer" ? "Request Quote" : "Contact for pricing"}
        </p>
      </div>
    </Link>
  );
}

import Link from "next/link";

interface ListingCardProps {
  title: string;
  imageUrl?: string | null;
  price: number | null;
  region?: string | null;
  duration_hours?: number | null;
  tags?: string[];
  href: string;
  variant?: "experience" | "transfer" | "package" | "default";
}

export default function ListingCard({
  title,
  imageUrl,
  price,
  region,
  duration_hours,
  tags = [],
  href,
  variant = "default",
}: ListingCardProps) {
  const formatPrice = (amount: number | null) => {
    if (amount === null) return "Contact for pricing";
    return `From ¥${amount.toLocaleString()}`;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "experience":
        return "hover:shadow-md hover:-translate-y-0.5";
      case "transfer":
        return "hover:shadow-md hover:-translate-y-0.5";
      case "package":
        return "hover:shadow-md hover:-translate-y-0.5 border-purple-100";
      default:
        return "hover:shadow-md hover:-translate-y-0.5";
    }
  };

  const getButtonText = () => {
    switch (variant) {
      case "experience":
        return "View Details";
      case "transfer":
        return "Book Transfer";
      case "package":
        return "View Package";
      default:
        return "View Details";
    }
  };

  return (
    <Link href={href}>
      <div
        className={`rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 overflow-hidden h-full flex flex-col group cursor-pointer ${getVariantStyles()}`}
      >
        {/* Image Section - Fixed Height */}
        <div className="w-full h-48 relative bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-300"
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
          
          {/* Badge for packages */}
          {variant === "package" && (
            <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
              Bundle
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#E4005A] transition-colors">
            {title}
          </h3>

          {/* Tags/Metadata */}
          <div className="flex flex-wrap gap-2 mb-3 text-sm text-gray-600">
            {region && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="line-clamp-1">{region}</span>
              </span>
            )}
            {duration_hours && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {duration_hours}h
              </span>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price & CTA - Pushed to bottom */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {variant === "transfer" ? "Fixed Price" : "Starting from"}
                </p>
                <p className="text-xl font-bold text-gray-900">{formatPrice(price)}</p>
              </div>
              <button className="px-4 py-2 bg-[#E4005A] text-white text-sm font-medium rounded-lg group-hover:bg-[#C4004A] transition-colors">
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

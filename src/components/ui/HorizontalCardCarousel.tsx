import { ReactNode } from "react";

interface HorizontalCardCarouselProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function HorizontalCardCarousel({
  title,
  subtitle,
  children,
  className = "",
}: HorizontalCardCarouselProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Title Section */}
      {(title || subtitle) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          {title && (
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base sm:text-lg text-gray-600">{subtitle}</p>
          )}
        </div>
      )}

      {/* Horizontal Scroll Container - Simple structure matching Home page */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-4 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

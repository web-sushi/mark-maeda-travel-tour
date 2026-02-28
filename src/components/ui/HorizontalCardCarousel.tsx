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

      {/* Carousel Container with Fade Gradient */}
      {/* iOS Safari Fix: Use isolation to create proper stacking context */}
      <div className="relative isolation-isolate">
        {/* Left Fade Gradient - iOS Safari: explicit z-index with pointer-events-none */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent pointer-events-none"
          style={{ zIndex: 10 }}
        />
        
        {/* Right Fade Gradient - iOS Safari: explicit z-index with pointer-events-none */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent pointer-events-none"
          style={{ zIndex: 10 }}
        />

        {/* Horizontal Scroll Container - iOS Safari: positioned and below gradients */}
        <div 
          className="overflow-x-auto scrollbar-hide pb-4 relative"
          style={{ zIndex: 1 }}
        >
          <div className="flex gap-4 px-4 sm:px-6 lg:px-8 snap-x snap-mandatory">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

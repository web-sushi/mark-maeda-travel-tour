"use client";

import { useState } from "react";

interface SafeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Client component for safely rendering images with fallback
 * Handles onError without breaking Server Component rules
 */
export default function SafeImage({
  src,
  alt,
  className = "",
  fallbackSrc = "/images/transfers-hero.jpg",
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}

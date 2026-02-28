"use client";

import { Children, ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface HorizontalCarouselProps {
  children: ReactNode;
}

export default function HorizontalCarousel({ children }: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    const threshold = 2;

    setCanScrollLeft(node.scrollLeft > threshold);
    setCanScrollRight(node.scrollLeft < maxScrollLeft - threshold);
  }, []);

  const scrollByPage = useCallback((direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;

    const page = node.clientWidth * 0.9;
    node.scrollBy({
      left: direction === "left" ? -page : page,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });

    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(node);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByPage("left")}
        disabled={!canScrollLeft}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span aria-hidden>‹</span>
      </button>

      <div ref={scrollRef} className="carousel scrollbar-hide" role="region" aria-label="Horizontal card list">
        {Children.toArray(children).map((child, idx) => (
          <div key={idx} className="carouselItem">
            {child}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByPage("right")}
        disabled={!canScrollRight}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span aria-hidden>›</span>
      </button>
    </div>
  );
}

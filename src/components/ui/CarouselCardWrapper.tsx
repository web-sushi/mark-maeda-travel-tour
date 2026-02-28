import { ReactNode } from "react";

interface CarouselCardWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function CarouselCardWrapper({
  children,
  className = "",
}: CarouselCardWrapperProps) {
  return (
    <div
      className={`snap-start flex-shrink-0 w-[85vw] max-w-[360px] sm:w-[360px] sm:max-w-[360px] md:w-[400px] md:max-w-[400px] ${className}`}
    >
      {children}
    </div>
  );
}

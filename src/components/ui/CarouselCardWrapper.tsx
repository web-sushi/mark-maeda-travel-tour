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
    <div className={`flex-shrink-0 min-w-[260px] sm:min-w-[320px] snap-start ${className}`}>
      {children}
    </div>
  );
}

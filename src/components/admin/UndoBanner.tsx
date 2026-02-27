"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface UndoBannerProps {
  message: string;
  onUndo: () => void;
  onTimeout: () => void;
  timeoutSeconds?: number;
}

export default function UndoBanner({
  message,
  onUndo,
  onTimeout,
  timeoutSeconds = 10,
}: UndoBannerProps) {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onTimeout]);

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
      <span className="text-blue-800">{message} Undo ({timeLeft}s)</span>
      <Button onClick={onUndo} variant="outline" size="sm">
        Undo
      </Button>
    </div>
  );
}

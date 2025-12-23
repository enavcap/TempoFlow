
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface PrecountBarIndicatorProps {
  bars: number; // 1 or 2
  visible: boolean;
}

const PrecountBarIndicator: React.FC<PrecountBarIndicatorProps> = ({ bars, visible }) => {
  return (
    <div
      className={cn(
        "absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col items-center",
        "px-3 py-2 rounded-lg bg-muted shadow-lg backdrop-blur-sm border border-border/50",
        "transition-all duration-300 ease-out",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-90 translate-y-2 pointer-events-none"
      )}
      aria-hidden={!visible}
    >
      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
        {bars} Bar{bars > 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default PrecountBarIndicator;

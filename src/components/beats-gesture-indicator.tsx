
"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface BeatsGestureIndicatorProps {
  value: number; // Current number of beats (1-12)
}

const MIN_BEATS_DISPLAY = 1;
const MAX_BEATS_DISPLAY = 12;

const BeatsGestureIndicator: React.FC<BeatsGestureIndicatorProps> = ({ value }) => {
  const calculateThumbPosition = () => {
    const clampedValue = Math.max(MIN_BEATS_DISPLAY, Math.min(MAX_BEATS_DISPLAY, value));
    // Invert progress because slider is visually top (max) to bottom (min)
    const progress = (MAX_BEATS_DISPLAY - clampedValue) / (MAX_BEATS_DISPLAY - MIN_BEATS_DISPLAY);
    return `${Math.max(0, Math.min(100, progress * 100))}%`;
  };

  const midPoint1 = Math.round(MIN_BEATS_DISPLAY + (MAX_BEATS_DISPLAY - MIN_BEATS_DISPLAY) / 3);
  const midPoint2 = Math.round(MIN_BEATS_DISPLAY + 2 * (MAX_BEATS_DISPLAY - MIN_BEATS_DISPLAY) / 3);


  return (
    <div className={cn("flex flex-col items-center space-y-1 p-2 rounded-md bg-primary/10")}>
      <span className={cn("text-xs font-medium text-primary")}>Beats</span>
      <div className="flex items-stretch h-[150px] w-[60px] sm:h-[180px] sm:w-[70px]">
        <div className="h-full flex flex-col justify-between text-xs text-muted-foreground items-end pr-2 py-0.5 w-[25px] sm:w-[30px]">
          <span>{MAX_BEATS_DISPLAY}</span>
          <span>{midPoint2}</span>
          <span>{midPoint1}</span>
          <span>{MIN_BEATS_DISPLAY}</span>
        </div>
        <div className="relative h-full w-4 sm:w-5 bg-muted rounded-full">
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md ring-1 sm:ring-2 ring-background transition-all bg-primary"
            )}
            style={{ top: `calc(${calculateThumbPosition()} - 8px)` }} // 8px is half of thumb height approx
          />
        </div>
      </div>
       <span className={cn("text-sm font-semibold tabular-nums text-primary")}>{value}</span>
    </div>
  );
};

export default BeatsGestureIndicator;

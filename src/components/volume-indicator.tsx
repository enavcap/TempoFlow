
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface VolumeIndicatorProps {
  volume: number; // 0 to 1
  visible: boolean;
}

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ volume, visible }) => {
  const clampedVolume = Math.max(0, Math.min(1, volume));

  return (
    <div
      className={cn(
        "absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col items-center",
        "w-8 h-28 p-2 rounded-xl bg-muted shadow-xl backdrop-blur-sm border border-border/50", // Enhanced container
        "transition-all duration-300 ease-out", // Transition for opacity, transform, and other properties
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-90 translate-y-2 pointer-events-none"
      )}
      aria-hidden={!visible}
    >
      <div className="relative h-full w-full flex-grow rounded-md bg-background/50 overflow-hidden">
        {/* Fancy fill with gradient */}
        <div
          className="absolute bottom-0 w-full rounded-md bg-gradient-to-t from-primary via-primary to-accent transition-all duration-150 ease-linear"
          style={{ height: `${clampedVolume * 100}%` }}
        />
      </div>
       <span className="mt-2 text-[11px] font-semibold text-foreground tabular-nums">
        {Math.round(clampedVolume * 100)}%
      </span>
    </div>
  );
};

export default VolumeIndicator;


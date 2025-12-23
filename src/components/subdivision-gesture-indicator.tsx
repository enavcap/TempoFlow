
"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { SUBDIVISIONS } from '@/lib/constants';
import type { Subdivision } from '@/lib/types';

interface SubdivisionGestureIndicatorProps {
  currentSubdivision: Subdivision;
  onSelect: (subdivision: Subdivision) => void;
}

const SubdivisionGestureIndicator: React.FC<SubdivisionGestureIndicatorProps> = ({ 
  currentSubdivision,
  onSelect 
}) => {
  return (
    <div className={cn("flex flex-col items-center space-y-2 p-3 rounded-md bg-primary/5")}>
       <span className={cn("text-xs font-medium text-primary mb-1")}>Subdivision</span>
      <div className="flex flex-col items-center space-y-1.5 w-[120px]">
        {SUBDIVISIONS.map((sub) => (
          <button
            key={sub}
            onClick={() => onSelect(sub)}
            className={cn(
              "w-full text-center py-1.5 px-3 rounded-md text-sm transition-all duration-150 ease-in-out",
              "border",
              currentSubdivision === sub
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                : "bg-background/70 hover:bg-muted/90 text-foreground border-border"
            )}
          >
            {sub}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SubdivisionGestureIndicator;


"use client";
import React from 'react';
import { cn } from '@/lib/utils';

interface TempoGestureIndicatorProps {
  label: string;
  value: number;
  isActive: boolean;
}

const MIN_TEMPO_DISPLAY = 40;
const MAX_TEMPO_DISPLAY = 200; // Changed from 400 to 200

const TempoGestureIndicator: React.FC<TempoGestureIndicatorProps> = ({ label, value, isActive }) => {
  const calculateThumbPosition = () => {
    const clampedValue = Math.max(MIN_TEMPO_DISPLAY, Math.min(MAX_TEMPO_DISPLAY, value));
    const progress = (MAX_TEMPO_DISPLAY - clampedValue) / (MAX_TEMPO_DISPLAY - MIN_TEMPO_DISPLAY); 
    return `${Math.max(0, Math.min(100, progress * 100))}%`;
  };

  return (
    <div className={cn("flex flex-col items-center space-y-1 p-2 rounded-md", isActive ? "bg-primary/10" : "")}>
      <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{label}</span>
      <div className="flex items-stretch h-[150px] w-[60px] sm:h-[180px] sm:w-[70px]">
        <div className="h-full flex flex-col justify-between text-xs text-muted-foreground items-end pr-2 py-0.5 w-[25px] sm:w-[30px]">
          <span>{MAX_TEMPO_DISPLAY}</span> 
          <span>{Math.round((MAX_TEMPO_DISPLAY + MIN_TEMPO_DISPLAY) / 2)}</span>
          <span>{MIN_TEMPO_DISPLAY}</span>
        </div>
        <div className="relative h-full w-4 sm:w-5 bg-muted rounded-full">
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full shadow-md ring-1 sm:ring-2 ring-background transition-all",
              isActive ? "bg-primary" : "bg-foreground/50"
            )}
            style={{ top: `calc(${calculateThumbPosition()} - ${isActive ? '10px' : '8px'})` }} 
          />
        </div>
      </div>
       <span className={cn("text-sm font-semibold tabular-nums", isActive ? "text-primary" : "text-foreground")}>{value}</span>
    </div>
  );
};

export default TempoGestureIndicator;

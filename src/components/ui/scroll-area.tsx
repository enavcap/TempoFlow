
"use client"

import * as React from "react"
import *as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    viewportRef?: React.RefObject<HTMLDivElement>
  }
>(({ className, children, viewportRef, ...props }, ref) => {
  const shouldHideVisualScrollbar = className?.includes('no-scrollbar');

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)} // The 'no-scrollbar' class on Root itself might apply some global CSS if defined
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={cn(
          "h-full w-full rounded-[inherit]",
          // Apply 'no-scrollbar' class here to target native scrollbar hiding CSS
          shouldHideVisualScrollbar && "no-scrollbar"
        )}
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar
        className={cn(
          // Make Radix scrollbar invisible and non-interactive instead of display:none
          shouldHideVisualScrollbar && "opacity-0 pointer-events-none"
        )}
      />
      <ScrollAreaPrimitive.Corner
        className={cn(
          shouldHideVisualScrollbar && "opacity-0 pointer-events-none"
        )}
      />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className // This will merge 'opacity-0 pointer-events-none' if passed from ScrollArea
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={cn(
        "relative flex-1 rounded-full bg-border",
        // If the parent scrollbar is opacity-0, the thumb will also be invisible.
        // If specific styling for the thumb is needed when hidden, it can be added here.
        // For example, if className passed down included 'opacity-0', this would also be opacity-0.
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }

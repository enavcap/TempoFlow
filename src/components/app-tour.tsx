
"use client";

import React, { useEffect, useRef } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { DialogPortal, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  title: string;
  description: React.ReactNode;
  targetElementSelector?: string;
  /** If true, dialog will be centered even if there's a targetElementSelector. Useful for explaining modals/popovers. */
  shouldCenterDialog?: boolean;
}

interface AppTourProps {
  isOpen: boolean;
  onClose: () => void; // Handles both X and finish/skip
  currentStep: number;
  tourSteps: TourStep[];
  onNextStep: () => void;
  onPrevStep: () => void;
}

const HIGHLIGHT_CLASS = 'tour-highlight';

const AppTour: React.FC<AppTourProps> = ({
  isOpen,
  onClose,
  currentStep,
  tourSteps,
  onNextStep,
  onPrevStep,
}) => {
  const highlightedElementRef = useRef<HTMLElement | null>(null);
  const [dialogPosition, setDialogPosition] = React.useState<'top' | 'bottom' | 'center'>('center');
  let animationFrameId: number;

  useEffect(() => {
    const removeCurrentHighlight = () => {
      if (highlightedElementRef.current) {
        highlightedElementRef.current.classList.remove(HIGHLIGHT_CLASS);
        highlightedElementRef.current.style.pointerEvents = '';
        highlightedElementRef.current = null;
      }
    };

    if (isOpen && currentStep >= 0 && currentStep < tourSteps.length) {
      const step = tourSteps[currentStep];
      removeCurrentHighlight();

      if (step.targetElementSelector) {
        animationFrameId = requestAnimationFrame(() => {
          const targetElement = document.querySelector(step.targetElementSelector) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add(HIGHLIGHT_CLASS);
            targetElement.style.pointerEvents = 'auto'; 
            highlightedElementRef.current = targetElement;
            
            // Start scroll animation
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            
            // Wait for scroll to complete, then update position for smooth transition
            setTimeout(() => {
              const rect = targetElement.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const elementCenter = rect.top + rect.height / 2;
              
              const newPosition = elementCenter < viewportHeight / 2 ? 'bottom' : 'top';
              setDialogPosition(newPosition);
            }, 600);
          }
        });
      } else {
        setDialogPosition('center');
      }
    } else {
      removeCurrentHighlight();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      removeCurrentHighlight();
    };
  }, [isOpen, currentStep, tourSteps]);


  if (!isOpen || currentStep < 0 || currentStep >= tourSteps.length) {
    if (highlightedElementRef.current) {
        highlightedElementRef.current.classList.remove(HIGHLIGHT_CLASS);
        highlightedElementRef.current.style.pointerEvents = '';
        highlightedElementRef.current = null;
    }
    return null;
  }

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;
  
  const shouldBeCentered = (!step.targetElementSelector || step.shouldCenterDialog) || dialogPosition === 'center';
  const shouldBeAtBottom = !shouldBeCentered && dialogPosition === 'bottom';

  // Calculate inline styles for smooth transitions
  const getPositionStyles = () => {
    if (shouldBeCentered) {
      return { top: '50%', bottom: 'auto', transform: 'translate(-50%, -50%)' };
    } else if (shouldBeAtBottom) {
      return { top: 'auto', bottom: '5vh', transform: 'translateX(-50%)' };
    } else {
      return { top: '5vh', bottom: 'auto', transform: 'translateX(-50%)' };
    }
  };


  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        {isFirstStep && <DialogOverlay className="z-[55]" />}
        <DialogPrimitive.Content
          onInteractOutside={(event) => {
            event.preventDefault(); 
          }}
          style={getPositionStyles()}
          className={cn(
            "fixed left-[50%] z-[60] grid w-[90vw] max-w-sm",
            "sm:max-w-md", 
            "gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            shouldBeCentered
              ? "data-[state=open]:slide-in-from-top-[-100%] data-[state=closed]:slide-out-to-top-[-100%]"
              : shouldBeAtBottom
                ? "data-[state=open]:slide-in-from-bottom-[-100%] data-[state=closed]:slide-out-to-bottom-[-100%]"
                : "data-[state=open]:slide-in-from-top-[-100%] data-[state=closed]:slide-out-to-top-[-100%]",
            "transition-[top,bottom,transform] duration-1000 ease-in-out"
          )}
        >
          <DialogHeader>
            <DialogTitle>{step.title} (Step {currentStep + 1} of {tourSteps.length})</DialogTitle>
            <DialogDescription className="mt-2 text-sm">
              {step.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-row justify-between items-center gap-2">
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={onPrevStep}>
                  Previous
                </Button>
              )}
              {isFirstStep && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Skip Tour
                </Button>
              )}
            </div>
            <div>
              {isLastStep ? (
                <Button variant="default" size="sm" onClick={onClose}>
                  Finish Tour
                </Button>
              ) : (
                <Button size="sm" onClick={onNextStep}>
                  Next
                </Button>
              )}
            </div>
          </DialogFooter>
           <DialogPrimitive.Close
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};

export default AppTour;

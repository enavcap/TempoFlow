
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TempoFlowProvider, useTempoFlow } from '@/contexts/tempo-flow-context';
import BeatVisualization from '@/components/beat-visualization';
import PlaybackControls from '@/components/playback-controls';
import TempoSectionList from '@/components/tempo-section-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Library, Info, Loader2, Eraser, Save, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { SOUND_SETS, DEFAULT_SOUND_SET_ID, PRECOUNT_SOUND_SETS, DEFAULT_PRECOUNT_SOUND_SET_ID, DEFAULT_TEMPO, SECTION_COLORS, DEFAULT_TIME_SIGNATURE, DEFAULT_SUBDIVISION, DEFAULT_MEASURES } from '@/lib/constants';
import type { DefaultPlaybackSettings, TempoSection, TimeSignature } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
import PresetLibraryDialog from '@/components/preset-library-dialog';
import AppTour from '@/components/app-tour';
import type { TourStep } from '@/components/app-tour';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

const TOUR_STORAGE_KEY = 'tempoFlowTourCompleted_v2';

const tourStepsData: TourStep[] = [
  {
    title: "Welcome to Tempo Flow!",
    description: "Let's explore the main features. Use 'Next' to continue, 'Skip Tour' to omit, or 'X' to close.",
  },
  {
    title: "Beat Visualization & Parameter Control",
    description: "The area above shows tempo, beats, and subdivision. Long-press numbers, 'X Beats', or subdivision text, then swipe up/down to change them (or click subdivision text for a list). This works even while playing! Click beats in the visualizer to toggle accents.",
    targetElementSelector: "#beat-visualization-container",
  },
  {
    title: "Double-Tap Tempo Control",
    description: "Double-tap any tempo value to keep it open with precise control buttons. Use the triangular buttons (▲/▼) on the left to adjust tempo in 1 BPM increments. Click elsewhere to close the indicator.",
    targetElementSelector: "#beat-visualization-container",
  },
  {
    title: "Playback Controls",
    description: "Play/pause, stop, loop sequence, toggle precount (click-hold & swipe button for bars), and adjust volume (click button to mute, click-hold & swipe for volume).",
    targetElementSelector: "#playback-controls-container",
    shouldCenterDialog: false,
  },
  {
    title: "Tempo Sections",
    description: "Manage your song sections here. You can drag them to reorder their sequence or swipe right on a section to delete it. Tap a section to activate it.",
    targetElementSelector: "#tempo-section-list-container",
  },
  {
    title: "Add Section",
    description: "This button opens the editor to create a new tempo section.",
    targetElementSelector: "#add-section-button",
    shouldCenterDialog: false,
  },
   {
    title: "App Actions Menu",
    description: "This button opens a menu with: New Flow, Save Flow, Library, and Options.",
    targetElementSelector: "#app-actions-fab",
    shouldCenterDialog: true,
  },
  {
    title: "Options Dialog",
    description: "Inside the App Actions Menu, 'Options' lets you change theme, sounds (now defaults to Digital Beeps), haptics, and repeat this tour.",
    targetElementSelector: "#options-button",
    shouldCenterDialog: true,
  },
  {
    title: "Preset Library & Saving",
    description: "'Library' (in App Actions Menu) is where you load and manage your sequences. 'Save Flow' (also in App Actions Menu) opens the save dialog directly.",
    targetElementSelector: "#library-button",
    shouldCenterDialog: true,
  },
  {
    title: "New Flow",
    description: "'New Flow' (in App Actions Menu) resets the app to a default 'Section 1'. It confirms if unsaved changes exist.",
    targetElementSelector: "#new-flow-button",
    shouldCenterDialog: true,
  },
  {
    title: "All Set!",
    description: "You're ready to use Tempo Flow. Enjoy creating your perfect metronome sequences!",
    shouldCenterDialog: true,
  }
];


const Logo = ({className}: {className?: string}) => (
  <svg width="24" height="24" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={cn("h-6 w-6", className)}>
    <path d="M20 80V20L50 35V95L20 80Z" />
    <path d="M50 35L80 20V80L50 95V35Z" />
    <path d="M50 5L20 20L50 35L80 20L50 5Z" fillOpacity="0.7" />
  </svg>
);

interface OptionsDialogContentProps {
  onRequestTourStart: () => void;
}

const OptionsDialogContent: React.FC<OptionsDialogContentProps> = ({ onRequestTourStart }) => {
  const {
    selectedSoundSetId, setSelectedSoundSetId,
    selectedPrecountSoundSetId, setSelectedPrecountSoundSetId,
    isVibrationEnabled, setIsVibrationEnabled,
    isDebugVisible, setIsDebugVisible,
  } = useTempoFlow();
  const isMobile = useIsMobile();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleResetToDefaults = () => {
    setTheme('dark');
    setSelectedSoundSetId(DEFAULT_SOUND_SET_ID);
    setSelectedPrecountSoundSetId(DEFAULT_PRECOUNT_SOUND_SET_ID);
    setIsVibrationEnabled(false);
    setIsDebugVisible(false);
    toast({
      title: "Options Reset",
      description: "Display and sound settings have been reset to defaults.",
    });
  };

  const handleSaveCurrentOptions = () => {
    toast({
      title: "Options Saved",
      description: "Your settings are automatically saved as you change them.",
    });
  };

  const handleRepeatTour = () => {
    onRequestTourStart();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Options</DialogTitle>
        <DialogDescription>
          Manage application theme, sound, haptics, and tour.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Theme</h3>
          <div className="flex justify-start">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <Label htmlFor="sound-set-select" className="text-sm font-medium text-muted-foreground">Metronome Sound Set</Label>
          <Select
            value={selectedSoundSetId}
            onValueChange={(value) => setSelectedSoundSetId(value)}
          >
            <SelectTrigger id="sound-set-select">
              <SelectValue placeholder="Select sound set" />
            </SelectTrigger>
            <SelectContent>
              {SOUND_SETS.map(set => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label htmlFor="precount-sound-set-select" className="text-sm font-medium text-muted-foreground">Precount Sound Set</Label>
          <Select
            value={selectedPrecountSoundSetId}
            onValueChange={(value) => setSelectedPrecountSoundSetId(value)}
          >
            <SelectTrigger id="precount-sound-set-select">
              <SelectValue placeholder="Select precount sound set" />
            </SelectTrigger>
            <SelectContent>
              {PRECOUNT_SOUND_SETS.map(set => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasMounted && isMobile && (
          <div className="flex flex-col space-y-2">
             <h3 className="text-sm font-medium text-muted-foreground">Haptics</h3>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <Label htmlFor="vibration-mode" className="text-sm">
                Vibration Mode
              </Label>
              <Switch
                id="vibration-mode"
                checked={isVibrationEnabled}
                onCheckedChange={setIsVibrationEnabled}
                aria-label="Toggle vibration mode"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Developer</h3>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label htmlFor="debug-mode" className="text-sm">
              Show Debug Overlay
            </Label>
            <Switch
              id="debug-mode"
              checked={isDebugVisible}
              onCheckedChange={setIsDebugVisible}
              aria-label="Toggle debug overlay"
            />
          </div>
        </div>
         <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Application Tour</h3>
          <Button variant="outline" onClick={handleRepeatTour} className="w-full sm:w-auto">
            <Info className="mr-2 h-4 w-4" /> Repeat App Tour
          </Button>
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div className="mt-2 sm:mt-0 sm:mr-2">
           <Button variant="outline" onClick={handleResetToDefaults} className="mr-2">Reset to Defaults</Button>
           <Button variant="outline" onClick={handleSaveCurrentOptions}>Save Current</Button>
        </div>
        <DialogClose asChild>
          <Button type="button">Close</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
};

const LoadingBeatAnimation = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const numDots = 4;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % numDots);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex space-x-2">
      {Array.from({ length: numDots }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-3 w-3 rounded-sm transition-colors duration-150",
            index === activeIndex ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
};


export default function HomePageWrapper() {
  return (
    <TempoFlowProvider>
      <HomePage />
    </TempoFlowProvider>
  );
}

function HomePage() {
  const [appIsLoading, setAppIsLoading] = useState(true);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isPresetLibraryOpen, setIsPresetLibraryOpen] = useState(false);
  const [presetLibraryMode, setPresetLibraryMode] = useState<'manage' | 'save'>('manage');
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const fabMenuRef = useRef<HTMLDivElement>(null);
  const [isConfirmNewFlowOpen, setIsConfirmNewFlowOpen] = useState(false);


  const context = useTempoFlow();
  const {
    sections,
    resetToFlowDefaults: contextResetToFlowDefaults,
    activePresetId,
    presets,
    updatePresetMetadata,
    savePreset: contextSavePreset,
    defaultPlaybackSettings,
  } = context;
  const { toast } = useToast();

  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const tourStepInteractionCleanupRef = useRef<(() => void) | null>(null);


  const [isEditingPresetName, setIsEditingPresetName] = useState(false);
  const [editingPresetNameValue, setEditingPresetNameValue] = useState('');
  const presetNameInputRef = React.useRef<HTMLInputElement>(null);


  const activePreset = React.useMemo(() => {
    return presets.find(p => p.id === activePresetId);
  }, [presets, activePresetId]);

 const handleFinishTour = useCallback(() => {
    setIsTourActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    if (tourStepInteractionCleanupRef.current) {
        tourStepInteractionCleanupRef.current();
        tourStepInteractionCleanupRef.current = null;
    }
  }, []);

  const handleNextTourStep = useCallback(() => {
    if (currentTourStep < tourStepsData.length - 1) {
      setCurrentTourStep(prev => prev + 1);
    } else {
      handleFinishTour();
    }
  }, [currentTourStep, handleFinishTour]);

  const handlePrevTourStep = useCallback(() => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1);
    }
  }, [currentTourStep]);

  // Open/close FAB menu based on tour step
  useEffect(() => {
    if (isTourActive) {
      // Steps 7-10 are the FAB menu steps (App Actions Menu, Options, Library, New Flow)
      if (currentTourStep >= 6 && currentTourStep <= 9) {
        setIsFabMenuOpen(true);
      } else {
        setIsFabMenuOpen(false);
      }
    }
  }, [isTourActive, currentTourStep]);


  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    const loadingTimer = setTimeout(() => {
      setAppIsLoading(false);
      if (tourCompleted !== 'true') {
        setIsTourActive(true);
        setCurrentTourStep(0);
      }
    }, 1200);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (isEditingPresetName && presetNameInputRef.current) {
      presetNameInputRef.current.focus();
      presetNameInputRef.current.select();
    }
  }, [isEditingPresetName]);


  const handleRequestTourStart = () => {
    setIsOptionsOpen(false);
    setIsFabMenuOpen(false);
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTimeout(() => {
      setCurrentTourStep(0);
      setIsTourActive(true);
    }, 100);
  };

  const handleNewFlowRequest = () => {
    setIsFabMenuOpen(false);
    const currentActivePreset = presets.find(p => p.id === activePresetId);

    if (!currentActivePreset) {
      const defaultSettings = defaultPlaybackSettings as DefaultPlaybackSettings;
      const isDefaultStateModified =
          sections.length > 1 ||
          (sections.length === 1 && (
              sections[0].tempo !== DEFAULT_TEMPO ||
              (sections[0].endTempo !== undefined && sections[0].endTempo !== sections[0].tempo) ||
              sections[0].timeSignature !== DEFAULT_TIME_SIGNATURE ||
              sections[0].subdivision !== DEFAULT_SUBDIVISION ||
              sections[0].measures !== DEFAULT_MEASURES ||
              (sections[0].accentedBeats && (sections[0].accentedBeats.length !==1 || sections[0].accentedBeats[0] !== 0))
          )) ||
          (sections.length === 0 && (
              defaultSettings.tempo !== DEFAULT_TEMPO ||
              (defaultSettings.endTempo !== undefined && defaultSettings.endTempo !== defaultSettings.tempo) ||
              defaultSettings.timeSignature !== DEFAULT_TIME_SIGNATURE ||
              defaultSettings.subdivision !== DEFAULT_SUBDIVISION ||
              (defaultSettings.accentedBeats && (defaultSettings.accentedBeats.length !==1 || defaultSettings.accentedBeats[0] !== 0))
          ));

      if (isDefaultStateModified) {
        setIsConfirmNewFlowOpen(true);
      } else {
        contextResetToFlowDefaults();
      }
    } else {
      contextResetToFlowDefaults();
    }
  };

  const handleConfirmCreateNewFlow = () => {
    contextResetToFlowDefaults();
    setIsConfirmNewFlowOpen(false);
  };


  const handlePresetNameEditStart = () => {
    if (activePreset) {
      setEditingPresetNameValue(activePreset.name);
    } else {
      setEditingPresetNameValue('');
    }
    setIsEditingPresetName(true);
  };

  const handlePresetNameSave = () => {
    const trimmedName = editingPresetNameValue.trim();
    if (activePreset) {
      if (trimmedName !== '' && trimmedName !== activePreset.name) {
        updatePresetMetadata(activePreset.id, { name: trimmedName });
        toast({ title: "Preset Renamed", description: `Preset renamed to "${trimmedName}".` });
      }
    } else {
      if (trimmedName !== '') {
        const newPresetId = contextSavePreset(trimmedName, undefined, "");
        if (newPresetId) {
          toast({ title: "Preset Created", description: `Preset "${trimmedName}" created and loaded.` });
        } else {
           toast({ title: "Save Failed", description: "Could not save preset. Ensure sections exist or defaults are set.", variant: "destructive" });
        }
      }
    }
    setIsEditingPresetName(false);
  };


  const handlePresetNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handlePresetNameSave();
    } else if (event.key === 'Escape') {
      setIsEditingPresetName(false);
      if (activePreset) setEditingPresetNameValue(activePreset.name);
      else setEditingPresetNameValue('');
    }
  };

   useEffect(() => {
    if (tourStepInteractionCleanupRef.current) {
        tourStepInteractionCleanupRef.current();
        tourStepInteractionCleanupRef.current = null;
    }

    if (isTourActive && currentTourStep > 0 && currentTourStep < tourStepsData.length -1) {
        const step = tourStepsData[currentTourStep];
        if (step.targetElementSelector && !step.shouldCenterDialog) {
            const targetElement = document.querySelector(step.targetElementSelector) as HTMLElement;
            if (targetElement) {
                const handleClickToAdvance = (e: MouseEvent) => {

                    const openDialog = document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]');
                    const isClickInsideOpenDialog = openDialog && openDialog.contains(e.target as Node);

                    if (openDialog && !isClickInsideOpenDialog && !targetElement.contains(e.target as Node)) {
                        return;
                    }

                    if (openDialog && isClickInsideOpenDialog && targetElement.contains(e.target as Node) && step.targetElementSelector === '#app-actions-fab') {
                       if (e.target === targetElement || (e.target as HTMLElement).closest('button') === targetElement) return;
                    }

                    handleNextTourStep();
                };
                targetElement.addEventListener('click', handleClickToAdvance, { capture: true });
                tourStepInteractionCleanupRef.current = () => {
                    targetElement.removeEventListener('click', handleClickToAdvance, { capture: true });
                };
            }
        }
    }
    return () => {
        if (tourStepInteractionCleanupRef.current) {
            tourStepInteractionCleanupRef.current();
            tourStepInteractionCleanupRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTourActive, currentTourStep, handleNextTourStep]);


  useEffect(() => {
    if (!isFabMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      // Don't close FAB menu during tour steps 7-10
      if (isTourActive && currentTourStep >= 6 && currentTourStep <= 9) {
        return;
      }
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFabMenuOpen, isTourActive, currentTourStep]);


  if (appIsLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Tempo Flow</h1>
        </div>
        <LoadingBeatAnimation />
      </div>
    );
  }


  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Tempo Flow</h1>
             {!isEditingPresetName && (
              <span
                className="text-xl md:text-2xl font-semibold tracking-tight text-muted-foreground hover:text-foreground cursor-pointer ml-1 p-1 rounded hover:bg-muted transition-colors"
                onClick={handlePresetNameEditStart}
                title={activePreset ? "Edit preset name" : "Save current as new preset"}
              >
                / {activePreset ? activePreset.name : "Unsaved"}
              </span>
            )}
            {isEditingPresetName && (
              <Input
                ref={presetNameInputRef}
                value={editingPresetNameValue}
                onChange={(e) => setEditingPresetNameValue(e.target.value)}
                onBlur={handlePresetNameSave}
                onKeyDown={handlePresetNameKeyDown}
                className="h-8 ml-1 px-2 py-1 text-xl md:text-2xl font-semibold tracking-tight bg-transparent border border-input focus:border-primary focus:ring-1 focus:ring-primary"
                style={{ minWidth: '100px', maxWidth: '250px' }}
                placeholder={!activePreset ? "New Preset Name..." : ""}
              />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-md h-full flex flex-col space-y-1 sm:space-y-3 pt-2 sm:pt-4 pb-20">
          <div className="flex-shrink-0">
            <BeatVisualization />
          </div>
          <div className="flex-shrink-0">
            <PlaybackControls />
          </div>
          <div className="flex-1 min-h-0 max-h-[50vh]">
            <TempoSectionList />
          </div>
        </div>
      </main>

      {/* Add Section Button - Bottom Center */}
      <Button
        id="add-section-button"
        onClick={() => {
          // Trigger add section from TempoSectionList
          const addSectionEvent = new CustomEvent('addSection');
          window.dispatchEvent(addSectionEvent);
        }}
        variant="default"
        size="icon"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg transition-shadow"
        aria-label="Add new section"
      >
        <PlusCircle className="h-8 w-8 sm:h-10 sm:w-10" />
      </Button>

      {/* FAB Menu Group */}
      <div ref={fabMenuRef} className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end">
         {/* Main FAB Button */}
        <Button
          id="app-actions-fab"
          variant="default"
          size="icon"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Open App Actions Menu"
          onClick={() => setIsFabMenuOpen(prev => !prev)}
        >
          <Logo className="h-6 w-6" />
        </Button>

        {/* Container for Secondary Action Buttons */}
        <div
          className={cn(
            "flex flex-col items-end space-y-2 mb-2",
            "transition-all duration-700 ease-out",
            isFabMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
           {/* New Flow Button Group (Visually Top) */}
           <div className={cn(
             "flex items-center space-x-2",
            "transition-opacity ease-out",
            isFabMenuOpen ? "opacity-100 duration-300 delay-[500ms]" : "opacity-0 duration-150"
          )}>
            <span className="text-sm font-medium text-foreground bg-background px-3 py-1.5 rounded-md shadow">New Flow</span>
            <Button
              id="new-flow-button"
              variant="secondary"
              size="icon"
              className="rounded-full w-14 h-14 shadow-md hover:shadow-lg bg-background text-foreground hover:bg-background/80 border"
              onClick={handleNewFlowRequest}
              aria-label="New Flow"
            >
              <Eraser className="h-5 w-5" />
            </Button>
          </div>

          {/* Save Flow Button Group */}
           <div className={cn(
             "flex items-center space-x-2",
            "transition-opacity ease-out",
            isFabMenuOpen ? "opacity-100 duration-300 delay-[400ms]" : "opacity-0 duration-150"
          )}>
            <span className="text-sm font-medium text-foreground bg-background px-3 py-1.5 rounded-md shadow">Save Flow</span>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full w-14 h-14 shadow-md hover:shadow-lg bg-background text-foreground hover:bg-background/80 border"
              onClick={() => {
                setPresetLibraryMode('save');
                setIsPresetLibraryOpen(true);
                setIsFabMenuOpen(false);
              }}
              aria-label="Save Flow"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>

          {/* Library Button Group */}
          <div className={cn(
             "flex items-center space-x-2",
            "transition-opacity ease-out",
            isFabMenuOpen ? "opacity-100 duration-300 delay-[300ms]" : "opacity-0 duration-150"
          )}>
             <span className="text-sm font-medium text-foreground bg-background px-3 py-1.5 rounded-md shadow">Library</span>
            <Button
              id="library-button"
              variant="secondary"
              size="icon"
              className="rounded-full w-14 h-14 shadow-md hover:shadow-lg bg-background text-foreground hover:bg-background/80 border"
              onClick={() => {
                setPresetLibraryMode('manage');
                setIsPresetLibraryOpen(true);
                setIsFabMenuOpen(false);
              }}
              aria-label="Library"
            >
              <Library className="h-5 w-5" />
            </Button>
          </div>

          {/* Options Button Group (Visually Bottom of this stack) */}
          <div className={cn(
            "flex items-center space-x-2",
            "transition-opacity ease-out",
            isFabMenuOpen ? "opacity-100 duration-300 delay-[200ms]" : "opacity-0 duration-150"
          )}>
            <span className="text-sm font-medium text-foreground bg-background px-3 py-1.5 rounded-md shadow">Options</span>
            <Button
              id="options-button"
              variant="secondary"
              size="icon"
              className="rounded-full w-14 h-14 shadow-md hover:shadow-lg bg-background text-foreground hover:bg-background/80 border"
              onClick={() => { setIsOptionsOpen(true); setIsFabMenuOpen(false); }}
              aria-label="Options"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>


      <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DialogContent className="p-4 sm:p-6">
          <OptionsDialogContent onRequestTourStart={handleRequestTourStart} />
        </DialogContent>
      </Dialog>

      {isPresetLibraryOpen && (
         <PresetLibraryDialog
            isOpen={isPresetLibraryOpen}
            onClose={() => setIsPresetLibraryOpen(false)}
            mode={presetLibraryMode}
          />
      )}

      {isConfirmNewFlowOpen && (
        <AlertDialog open={isConfirmNewFlowOpen} onOpenChange={setIsConfirmNewFlowOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Flow?</AlertDialogTitle>
              <AlertDialogDescription>
                Your current flow is unsaved. Creating a new flow will discard changes to the current workspace. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsConfirmNewFlowOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCreateNewFlow}>Create New</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isTourActive && (
        <AppTour
          isOpen={isTourActive}
          onClose={handleFinishTour}
          currentStep={currentTourStep}
          tourSteps={tourStepsData}
          onNextStep={handleNextTourStep}
          onPrevStep={handlePrevTourStep}
        />
      )}
    </div>
  );
}



"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback }  from 'react';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import { SUBDIVISION_MULTIPLIERS, DEFAULT_TIME_SIGNATURE, DEFAULT_SUBDIVISION, DEFAULT_TEMPO, getTempoMarking, TIME_SIGNATURES, SUBDIVISIONS, SECTION_COLORS, DEFAULT_MEASURES } from '@/lib/constants';
import type { Subdivision, TempoSection, TimeSignature, DefaultPlaybackSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import TempoGestureIndicator from './tempo-gesture-indicator';
import BeatsGestureIndicator from './beats-gesture-indicator';
import SubdivisionGestureIndicator from './subdivision-gesture-indicator';

const TEMPO_SWIPE_SENSITIVITY = 3.0;
const BEATS_SWIPE_SENSITIVITY = 20.0;
// const LONG_PRESS_DURATION = 400; // ms - Removed

const BeatVisualization: React.FC = () => {
  const {
    sections, activeSectionId, isPlaying,
    currentBeat, currentMeasure, currentSubdivisionTick,
    updateSection, setDefaultPlaybackSettings, defaultPlaybackSettings,
    isCurrentlyPrecounting, precountProgress, precountTargetSectionId, firstSection: contextFirstSection
  } = useTempoFlow();

  // Tempo Gesture State
  const [isTempoGestureActive, setIsTempoGestureActive] = useState(false);
  const [editingTempoTargetState, setEditingTempoTargetState] = useState<'start' | 'end' | null>(null);
  const [isTempoIndicatorPersistent, setIsTempoIndicatorPersistent] = useState(false);
  // const tempoLongPressTimerRef = useRef<NodeJS.Timeout | null>(null); // Removed
  // const didTempoLongPressInitiateSwipeRef = useRef(false); // Removed
  const tempoInteractionStateRef = useRef<'idle' | 'pressing' | 'swipingTempo'>('idle');
  const tempoStartYRef = useRef(0);
  const tempoInitialTempoRef = useRef(DEFAULT_TEMPO);
  const activeEditingTargetRef = useRef<'start' | 'end' | null>(null);
  const lastTempoTapTimeRef = useRef<number>(0);
  const isTouchInteractionRef = useRef<boolean>(false);

  // Beats Gesture State
  const [isBeatsGestureActive, setIsBeatsGestureActive] = useState(false);
  // const beatsLongPressTimerRef = useRef<NodeJS.Timeout | null>(null); // Removed
  // const didBeatsLongPressInitiateSwipeRef = useRef(false); // Removed
  const beatsInteractionStateRef = useRef<'idle' | 'pressing' | 'swipingBeats'>('idle');
  const beatsStartYRef = useRef(0);
  const beatsInitialValueRef = useRef(Number(DEFAULT_TIME_SIGNATURE));

  // Subdivision Click State
  const [isSubdivisionGestureActive, setIsSubdivisionGestureActive] = useState(false);
  // const subdivisionLongPressTimerRef = useRef<NodeJS.Timeout | null>(null); // Removed
  // const isPressingSubdivisionRef = useRef(false); // Removed

  const sectionToUseForDisplay = useMemo((): TempoSection | (DefaultPlaybackSettings & { id: string; name: string; measures: number; color: string; isLoopable: boolean; accentedBeats: number[] }) | undefined => {
    if (isCurrentlyPrecounting) {
      let targetSectionForPrecountDisplay: TempoSection | undefined;
      if (precountTargetSectionId) {
        targetSectionForPrecountDisplay = sections.find(s => s.id === precountTargetSectionId);
      }

      if (targetSectionForPrecountDisplay) {
        return targetSectionForPrecountDisplay;
      } else if (!precountTargetSectionId && sections.length === 0) {
         return {
          ...defaultPlaybackSettings,
          id: 'default-playback-section-precount-target',
          name: 'Precount',
          measures: 1,
          color: `hsl(var(--accent))`,
          isLoopable: true,
          accentedBeats: defaultPlaybackSettings.accentedBeats || [0],
        };
      }
      const precountBase = contextFirstSection || defaultPlaybackSettings;
      return {
        id: 'precount-default-display', name: 'Precount',
        tempo: precountBase.tempo, timeSignature: precountBase.timeSignature,
        subdivision: precountBase.subdivision, measures: 1, color: `hsl(var(--accent))`,
        accentedBeats: precountBase.accentedBeats || [0], isLoopable: false,
        endTempo: precountBase.endTempo,
      } as TempoSection;
    }

    if (activeSectionId && sections.length > 0) {
      const foundSection = sections.find(s => s.id === activeSectionId);
      if (foundSection) return foundSection;
    }

    if (sections.length === 0 && activeSectionId === null) {
      return {
        ...defaultPlaybackSettings,
        id: 'default-playback-section',
        name: 'Default',
        measures: 1,
        color: `hsl(var(--destructive))`,
        isLoopable: true,
        accentedBeats: defaultPlaybackSettings.accentedBeats || [0],
      };
    }

    if (sections.length > 0 && !sections.find(s => s.id === activeSectionId)) {
        return sections[0];
    }
    return undefined;
  }, [activeSectionId, sections, isCurrentlyPrecounting, precountTargetSectionId, defaultPlaybackSettings, contextFirstSection]);

  const isDefaultPlaybackMode = useMemo(() => sectionToUseForDisplay?.id === 'default-playback-section', [sectionToUseForDisplay]);

  const currentDisplayColorForText = useMemo(() => {
    if (isCurrentlyPrecounting) return `hsl(var(--accent))`;
    if (isDefaultPlaybackMode && !isCurrentlyPrecounting) return `hsl(var(--destructive))`;
    if (sectionToUseForDisplay) return sectionToUseForDisplay.color;
    return `hsl(var(--primary))`;
  }, [isCurrentlyPrecounting, isDefaultPlaybackMode, sectionToUseForDisplay]);


  const beatsPerMeasure = useMemo(() => {
    const section = sectionToUseForDisplay;
    return section ? Number(section.timeSignature) : Number(DEFAULT_TIME_SIGNATURE);
  }, [sectionToUseForDisplay]);

  const displaySubdivision = useMemo(() => {
    const section = sectionToUseForDisplay;
    return section?.subdivision ?? DEFAULT_SUBDIVISION;
  }, [sectionToUseForDisplay]);

  const tempoDisabled = isBeatsGestureActive || isSubdivisionGestureActive;
  const beatsDisabled = isTempoGestureActive || isSubdivisionGestureActive;
  const subdivisionDisabled = isTempoGestureActive || isBeatsGestureActive;
  const beatClickDisabled = isCurrentlyPrecounting || !sectionToUseForDisplay || isTempoGestureActive || isBeatsGestureActive || isSubdivisionGestureActive;

  // Click outside handler for persistent tempo indicator
  useEffect(() => {
    if (!isTempoIndicatorPersistent || !isTempoGestureActive) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside tempo spans and tempo indicator
      const isTempoSpan = target.closest('.cursor-ns-resize');
      const isTempoIndicator = target.closest('.absolute.top-full');
      
      if (!isTempoSpan && !isTempoIndicator) {
        setIsTempoIndicatorPersistent(false);
        setIsTempoGestureActive(false);
        activeEditingTargetRef.current = null;
      }
    };

    // Add slight delay to avoid immediate closing from the double-tap event
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTempoIndicatorPersistent, isTempoGestureActive]);


  const handleBeatClick = (beatIndex: number) => {
    if (beatClickDisabled) return;

    if (isDefaultPlaybackMode) {
      const currentAccents = defaultPlaybackSettings.accentedBeats ? [...defaultPlaybackSettings.accentedBeats] : [0];
      const indexInAccents = currentAccents.indexOf(beatIndex);
      
      if (indexInAccents > -1) {
        currentAccents.splice(indexInAccents, 1);
      } else {
        currentAccents.push(beatIndex);
        currentAccents.sort((a,b) => a - b);
      }
      setDefaultPlaybackSettings(prev => ({ ...prev, accentedBeats: currentAccents }));
    } else if (sectionToUseForDisplay && sectionToUseForDisplay.id !== 'default-playback-section-precount-target' && sectionToUseForDisplay.id !== 'precount-default-display') {
      const currentAccentedBeats = sectionToUseForDisplay.accentedBeats ? [...sectionToUseForDisplay.accentedBeats] : [0];
      const indexInAccents = currentAccentedBeats.indexOf(beatIndex);

      if (indexInAccents > -1) {
        currentAccentedBeats.splice(indexInAccents, 1);
      } else {
        currentAccentedBeats.push(beatIndex);
        currentAccentedBeats.sort((a,b) => a-b);
      }
      updateSection(sectionToUseForDisplay.id, { accentedBeats: currentAccentedBeats });
    }
  };

  // --- Tempo Gesture Handlers ---
  const handleTempoGestureMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (tempoInteractionStateRef.current === 'idle' || !sectionToUseForDisplay || !activeEditingTargetRef.current) {
      return;
    }
    if ('preventDefault' in event && event.cancelable) event.preventDefault();

    if (tempoInteractionStateRef.current === 'pressing') {
      tempoInteractionStateRef.current = 'swipingTempo';
    }
    if (tempoInteractionStateRef.current !== 'swipingTempo') return;

    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const deltaY = tempoStartYRef.current - clientY;
    const tempoChange = deltaY / TEMPO_SWIPE_SENSITIVITY;

    let newTempoValue = Math.round(tempoInitialTempoRef.current + tempoChange);
    newTempoValue = Math.max(20, Math.min(200, newTempoValue));

    if (isDefaultPlaybackMode) {
      if (activeEditingTargetRef.current === 'start') {
        setDefaultPlaybackSettings(prev => ({ ...prev, tempo: newTempoValue }));
      } else if (activeEditingTargetRef.current === 'end') {
        setDefaultPlaybackSettings(prev => ({ ...prev, endTempo: newTempoValue }));
      }
    } else if (sectionToUseForDisplay && sectionToUseForDisplay.id !== 'default-playback-section-precount-target' && sectionToUseForDisplay.id !== 'precount-default-display') {
      if (activeEditingTargetRef.current === 'start') {
        updateSection(sectionToUseForDisplay.id, { tempo: newTempoValue });
      } else if (activeEditingTargetRef.current === 'end') {
        updateSection(sectionToUseForDisplay.id, { endTempo: newTempoValue });
      }
    }
  }, [sectionToUseForDisplay, updateSection, setDefaultPlaybackSettings, isDefaultPlaybackMode]);

  const handleTempoGestureEnd = useCallback(() => {
    if (tempoInteractionStateRef.current !== 'idle') {
        document.body.style.overflow = '';
    }
    
    // Don't close the indicator if it's in persistent mode
    if (!isTempoIndicatorPersistent) {
      setIsTempoGestureActive(false);
      activeEditingTargetRef.current = null;
    }
    
    tempoInteractionStateRef.current = 'idle';

    window.removeEventListener('mousemove', handleTempoGestureMove, { passive: false });
    window.removeEventListener('mouseup', handleTempoGestureEnd);
    window.removeEventListener('touchmove', handleTempoGestureMove, { passive: false });
    window.removeEventListener('touchend', handleTempoGestureEnd);
  }, [handleTempoGestureMove, isTempoIndicatorPersistent]);

  const handleTempoIncrement = useCallback((amount: number) => {
    if (!sectionToUseForDisplay || !activeEditingTargetRef.current) return;
    
    const target = activeEditingTargetRef.current;
    const currentTempo = target === 'start' 
      ? sectionToUseForDisplay.tempo 
      : sectionToUseForDisplay.endTempo ?? sectionToUseForDisplay.tempo;
    
    let newTempo = Math.round(currentTempo + amount);
    newTempo = Math.max(20, Math.min(200, newTempo));

    if (isDefaultPlaybackMode) {
      if (target === 'start') {
        setDefaultPlaybackSettings(prev => ({ ...prev, tempo: newTempo }));
      } else {
        setDefaultPlaybackSettings(prev => ({ ...prev, endTempo: newTempo }));
      }
    } else if (sectionToUseForDisplay.id !== 'default-playback-section-precount-target' && sectionToUseForDisplay.id !== 'precount-default-display') {
      if (target === 'start') {
        updateSection(sectionToUseForDisplay.id, { tempo: newTempo });
      } else {
        updateSection(sectionToUseForDisplay.id, { endTempo: newTempo });
      }
    }
  }, [sectionToUseForDisplay, updateSection, setDefaultPlaybackSettings, isDefaultPlaybackMode]);

  const handleTempoGestureStart = useCallback((
    event: React.MouseEvent<HTMLSpanElement> | React.TouchEvent<HTMLSpanElement>,
    target: 'start' | 'end'
  ) => {
    if (tempoDisabled || !sectionToUseForDisplay) return;
    
    // Track if this is a touch event
    const isTouch = 'touches' in event;
    
    // If this is a mouse event but we just had a touch event, ignore it
    if (!isTouch && isTouchInteractionRef.current) {
      isTouchInteractionRef.current = false;
      return;
    }
    
    // Mark that we're in a touch interaction
    if (isTouch) {
      isTouchInteractionRef.current = true;
    }
    
    if (event.type === 'mousedown' && event.cancelable) event.preventDefault();

    // Check for double-tap (within 300ms)
    const now = Date.now();
    const timeSinceLastTap = now - lastTempoTapTimeRef.current;
    const isDoubleTap = timeSinceLastTap < 300;
    lastTempoTapTimeRef.current = now;

    if (isDoubleTap) {
      // Double-tap detected - enter persistent mode
      setIsTempoIndicatorPersistent(true);
      setIsTempoGestureActive(true);
      setEditingTempoTargetState(target);
      activeEditingTargetRef.current = target;
      return;
    }

    setIsTempoGestureActive(true);
    setEditingTempoTargetState(target);
    document.body.style.overflow = 'hidden';
    
    tempoInteractionStateRef.current = 'pressing';
    activeEditingTargetRef.current = target;

    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    tempoStartYRef.current = clientY;
    tempoInitialTempoRef.current = target === 'start'
      ? sectionToUseForDisplay.tempo
      : sectionToUseForDisplay.endTempo ?? sectionToUseForDisplay.tempo;
    
    window.addEventListener('mousemove', handleTempoGestureMove, { passive: false });
    window.addEventListener('mouseup', handleTempoGestureEnd);
    window.addEventListener('touchmove', handleTempoGestureMove, { passive: false });
    window.addEventListener('touchend', handleTempoGestureEnd);
  }, [sectionToUseForDisplay, tempoDisabled, handleTempoGestureMove, handleTempoGestureEnd, setEditingTempoTargetState]);


  // --- Beats Gesture Handlers ---
  const handleBeatsGestureMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (beatsInteractionStateRef.current === 'idle' || !sectionToUseForDisplay) return;
    if ('preventDefault' in event && event.cancelable) event.preventDefault();

    if (beatsInteractionStateRef.current === 'pressing') {
        beatsInteractionStateRef.current = 'swipingBeats';
    }
    if (beatsInteractionStateRef.current !== 'swipingBeats') return;

    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const deltaY = beatsStartYRef.current - clientY;
    const beatsChange = deltaY / BEATS_SWIPE_SENSITIVITY;

    let newBeatsValue = Math.round(beatsInitialValueRef.current + beatsChange);
    newBeatsValue = Math.max(1, Math.min(Number(TIME_SIGNATURES[TIME_SIGNATURES.length -1]), newBeatsValue));

    const newTimeSignature = String(newBeatsValue) as TimeSignature;

    if (isDefaultPlaybackMode) {
      setDefaultPlaybackSettings(prev => ({ ...prev, timeSignature: newTimeSignature, accentedBeats: prev.accentedBeats?.filter(b => b < newBeatsValue) || [0] }));
    } else if (sectionToUseForDisplay && sectionToUseForDisplay.id !== 'default-playback-section-precount-target' && sectionToUseForDisplay.id !== 'precount-default-display') {
      updateSection(sectionToUseForDisplay.id, { timeSignature: newTimeSignature, accentedBeats: sectionToUseForDisplay.accentedBeats?.filter(b => b < newBeatsValue) || [0] });
    }
  }, [sectionToUseForDisplay, updateSection, setDefaultPlaybackSettings, isDefaultPlaybackMode]);

  const handleBeatsGestureEnd = useCallback(() => {
    if (beatsInteractionStateRef.current !== 'idle') {
        document.body.style.overflow = '';
    }
    setIsBeatsGestureActive(false);
    beatsInteractionStateRef.current = 'idle';

    window.removeEventListener('mousemove', handleBeatsGestureMove, { passive: false });
    window.removeEventListener('mouseup', handleBeatsGestureEnd);
    window.removeEventListener('touchmove', handleBeatsGestureMove, { passive: false });
    window.removeEventListener('touchend', handleBeatsGestureEnd);
  }, [handleBeatsGestureMove]);

  const handleBeatsGestureStart = useCallback((
    event: React.MouseEvent<HTMLSpanElement> | React.TouchEvent<HTMLSpanElement>
  ) => {
    if (beatsDisabled || !sectionToUseForDisplay) return;
    if (event.type === 'mousedown' && event.cancelable) event.preventDefault();

    setIsBeatsGestureActive(true);
    document.body.style.overflow = 'hidden';

    beatsInteractionStateRef.current = 'pressing';
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    beatsStartYRef.current = clientY;
    beatsInitialValueRef.current = Number(sectionToUseForDisplay.timeSignature);

    window.addEventListener('mousemove', handleBeatsGestureMove, { passive: false });
    window.addEventListener('mouseup', handleBeatsGestureEnd);
    window.addEventListener('touchmove', handleBeatsGestureMove, { passive: false });
    window.addEventListener('touchend', handleBeatsGestureEnd);
  }, [sectionToUseForDisplay, beatsDisabled, handleBeatsGestureMove, handleBeatsGestureEnd]);


  // --- Subdivision Click Handler ---
  const handleSubdivisionSelect = useCallback((selectedSub: Subdivision) => {
    if (sectionToUseForDisplay) {
      if (isDefaultPlaybackMode) {
        setDefaultPlaybackSettings(prev => ({ ...prev, subdivision: selectedSub }));
      } else if (sectionToUseForDisplay.id !== 'default-playback-section-precount-target' && sectionToUseForDisplay.id !== 'precount-default-display') {
        updateSection(sectionToUseForDisplay.id, { subdivision: selectedSub });
      }
    }
    setIsSubdivisionGestureActive(false);
    document.body.style.overflow = '';
  }, [sectionToUseForDisplay, updateSection, setDefaultPlaybackSettings, isDefaultPlaybackMode]);


  const handleSubdivisionClick = useCallback(() => {
    if (subdivisionDisabled || !sectionToUseForDisplay ) return;
    
    setIsSubdivisionGestureActive(true);
    document.body.style.overflow = 'hidden';
  }, [sectionToUseForDisplay, subdivisionDisabled]);


  if (!sectionToUseForDisplay && sections.length === 0 && activeSectionId === null && !isCurrentlyPrecounting) {
     return (
      <div id="beat-visualization-container" className="w-full h-40 flex flex-col items-center justify-center rounded-lg bg-muted/50 py-4">
        <p className="text-muted-foreground">Initializing Tempo Flow...</p>
      </div>
    );
  }

  if (!sectionToUseForDisplay && (sections.length > 0 || (isCurrentlyPrecounting && !contextFirstSection))) {
     return (
        <div id="beat-visualization-container" className="w-full h-40 flex flex-col items-center justify-center rounded-lg bg-muted/50 py-4">
            <p className="text-muted-foreground">Loading section data...</p>
        </div>
        );
  }
  if (!sectionToUseForDisplay) {
    return (
      <div id="beat-visualization-container" className="w-full h-40 flex flex-col items-center justify-center rounded-lg bg-muted/50 py-4">
          <p className="text-muted-foreground">Loading data...</p>
      </div>
    );
  }


  const displayBeatsText = `${beatsPerMeasure} Beat${beatsPerMeasure === 1 ? '' : 's'}`;
  const isRampSection = sectionToUseForDisplay && sectionToUseForDisplay.endTempo !== undefined && sectionToUseForDisplay.endTempo !== sectionToUseForDisplay.tempo;

  let tempoDisplayTextElement: React.ReactNode;

  if (sectionToUseForDisplay) {
    if (isPlaying && isRampSection && (sectionToUseForDisplay?.id === activeSectionId || (isDefaultPlaybackMode && sectionToUseForDisplay.id === 'default-playback-section')) && !isCurrentlyPrecounting) {
      const { tempo, endTempo, timeSignature, subdivision } = sectionToUseForDisplay;
      const measures = sectionToUseForDisplay.measures || DEFAULT_MEASURES;

      const currentBeatsPerMeasureNum = Number(timeSignature);
      const numSubdivisions = SUBDIVISION_MULTIPLIERS[subdivision];
      const totalSubdivisionsInSection = measures * currentBeatsPerMeasureNum * numSubdivisions;

      let overallTickProgress = (currentMeasure * currentBeatsPerMeasureNum * numSubdivisions) +
                                (currentBeat * numSubdivisions) +
                                currentSubdivisionTick;

      overallTickProgress = Math.min(overallTickProgress, totalSubdivisionsInSection -1);


      let progress = 0;
      if (totalSubdivisionsInSection > 1) {
        progress = Math.max(0, overallTickProgress) / (totalSubdivisionsInSection -1) ;
      } else if (totalSubdivisionsInSection === 1) {
        progress = 0;
      }

      const clampedProgress = Math.max(0, Math.min(1, progress));
      const interpolatedTempo = tempo + (endTempo! - tempo) * clampedProgress;
      const currentMarking = getTempoMarking(Math.round(interpolatedTempo));
      tempoDisplayTextElement = (
        <p className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: currentDisplayColorForText }}>
          {Math.round(interpolatedTempo)}{' '}
          <span className="text-lg sm:text-xl font-medium text-foreground">BPM</span>
          {currentMarking && (
            <span className="text-lg sm:text-xl font-normal text-muted-foreground ml-1 italic">
              {currentMarking}
            </span>
          )}
        </p>
      );
    } else if (isRampSection) {
      const startMarking = getTempoMarking(sectionToUseForDisplay.tempo);
      const endMarking = getTempoMarking(sectionToUseForDisplay.endTempo!);
      tempoDisplayTextElement = (
        <p className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums flex flex-wrap items-center justify-center gap-x-1">
          <span className="inline-flex items-center">
            <span
              className={cn(!tempoDisabled && "cursor-ns-resize", "px-1 py-0.5 rounded hover:bg-muted/50 transition-colors")}
              style={{ color: currentDisplayColorForText }}
              onMouseDown={(e) => handleTempoGestureStart(e, 'start')}
              onTouchStart={(e) => handleTempoGestureStart(e, 'start')}
              onContextMenu={(e) => e.preventDefault()}
            >
              {sectionToUseForDisplay.tempo}
            </span>
            <span className="text-base sm:text-lg md:text-xl font-medium text-foreground ml-1">BPM</span>
            {startMarking && (
              <span className="text-base sm:text-lg md:text-xl font-normal text-muted-foreground ml-1 italic">
                {startMarking}
              </span>
            )}
          </span>
          <span className="text-base sm:text-lg md:text-xl font-medium text-foreground/70 opacity-70">→</span>
          <span className="inline-flex items-center">
            <span
               className={cn(!tempoDisabled && "cursor-ns-resize", "px-1 py-0.5 rounded hover:bg-muted/50 transition-colors")}
               style={{ color: currentDisplayColorForText }}
              onMouseDown={(e) => handleTempoGestureStart(e, 'end')}
              onTouchStart={(e) => handleTempoGestureStart(e, 'end')}
              onContextMenu={(e) => e.preventDefault()}
            >
            {sectionToUseForDisplay.endTempo}
          </span>
          <span className="text-base sm:text-lg md:text-xl font-medium text-foreground ml-1">BPM</span>
          {endMarking && (
            <span className="text-base sm:text-lg md:text-xl font-normal text-muted-foreground ml-1 italic">
              {endMarking}
            </span>
          )}
          </span>
        </p>
      );
    } else {
      const currentMarking = getTempoMarking(sectionToUseForDisplay.tempo);
      tempoDisplayTextElement = (
        <p
          className={cn("text-3xl font-bold tabular-nums")}

        >
          <span
            className={cn(!tempoDisabled && "cursor-ns-resize", "px-1 py-0.5 rounded hover:bg-muted/50 transition-colors")}
            style={{ color: currentDisplayColorForText }}
            onMouseDown={(e) => handleTempoGestureStart(e, 'start')}
            onTouchStart={(e) => handleTempoGestureStart(e, 'start')}
            onContextMenu={(e) => e.preventDefault()}
          >
             {sectionToUseForDisplay.tempo}
          </span>
          <span className="text-xl font-medium text-foreground ml-1">BPM</span>
          {currentMarking && (
            <span className="text-xl font-normal text-muted-foreground ml-1 italic">
              {currentMarking}
            </span>
          )}
        </p>
      );
    }
  } else {
     const defaultMarking = getTempoMarking(DEFAULT_TEMPO);
     tempoDisplayTextElement = (
        <p className={cn("text-3xl font-bold tabular-nums", "px-1 py-0.5 rounded")} style={{color: `hsl(var(--primary))` }}>
            {DEFAULT_TEMPO}{' '}
            <span className="text-xl font-medium text-foreground">BPM</span>
            {defaultMarking && (
                <span className="text-xl font-normal text-muted-foreground ml-1 italic">
                {defaultMarking}
                </span>
            )}
        </p>
     );
  }

  const getBeatSegmentProps = (index: number, isBeatActive: boolean, isUserAccented: boolean) => {
    let dynamicStyles: React.CSSProperties = {};
    const classParts: string[] = [
      'h-6 w-full rounded transition-all duration-100 ease-in-out',
      beatClickDisabled ? 'cursor-default' : 'cursor-pointer',
    ];

    const currentSectionColor = sectionToUseForDisplay?.color;

    if (isBeatActive) {
      classParts.push('scale-110 opacity-100');
      if (isCurrentlyPrecounting) {
        dynamicStyles.backgroundColor = `hsl(var(--accent))`;
      } else if (isDefaultPlaybackMode) {
        dynamicStyles.backgroundColor = `hsl(var(--destructive))`;
      } else if (currentSectionColor) {
        dynamicStyles.backgroundColor = currentSectionColor;
      } else {
        dynamicStyles.backgroundColor = `hsl(var(--primary))`;
      }
    } else { // Inactive beat
      if (isUserAccented && !isCurrentlyPrecounting) {
        classParts.push('opacity-100 shadow-md border-2');
        if (isDefaultPlaybackMode) {
          dynamicStyles.backgroundColor = `hsl(var(--destructive))`;
          classParts.push('border-destructive/50');
        } else if (currentSectionColor) {
          dynamicStyles.backgroundColor = currentSectionColor; // Fill with section color
          dynamicStyles.borderColor = currentSectionColor;   // Border with section color
        } else { // Fallback for inactive accented if no section color
          dynamicStyles.backgroundColor = `hsl(var(--primary))`;
          classParts.push('border-primary/50');
        }
      } else { // Inactive and NOT user-accented
        classParts.push('opacity-60 hover:opacity-100 border-2 border-transparent');
        if (isCurrentlyPrecounting) {
           dynamicStyles.backgroundColor = `hsl(var(--accent) / 0.5)`;
        } else if (isDefaultPlaybackMode) {
           dynamicStyles.backgroundColor = `hsl(var(--destructive) / 0.3)`;
        } else {
          dynamicStyles.backgroundColor = `hsl(var(--muted-foreground))`;
        }
      }
    }
    return {
      className: cn(classParts),
      style: dynamicStyles,
    };
  };

  return (
    <div id="beat-visualization-container" className="flex flex-col items-center space-y-2 p-4 rounded-lg w-full relative select-none">
      <div className="w-full h-12 flex items-center justify-center gap-3 px-6 py-3 bg-muted/30 rounded-md" aria-label={`Beat visualization: ${beatsPerMeasure} beats per measure`}>
        {Array.from({ length: beatsPerMeasure }).map((_, index) => {
          const userAccentedBeats = isDefaultPlaybackMode
            ? (defaultPlaybackSettings.accentedBeats || [0])
            : (sectionToUseForDisplay?.accentedBeats || [0]);

          const isUserAccented = !isCurrentlyPrecounting && userAccentedBeats.includes(index);

          let isBeatActive: boolean;
          if (isCurrentlyPrecounting) {
            if (precountProgress.bar === 0 && precountProgress.beat === 0 && index === 0) {
              isBeatActive = true;
            } else {
              isBeatActive = precountProgress.beat === index;
            }
          } else {
             isBeatActive = isPlaying && currentBeat === index &&
             ( (sectionToUseForDisplay?.id === activeSectionId) || (isDefaultPlaybackMode && sectionToUseForDisplay.id === 'default-playback-section') );
          }

          const segmentProps = getBeatSegmentProps(index, isBeatActive, isUserAccented);

          return (
            <div 
              key={index} 
              className="flex-1 flex items-center justify-center p-1"
              onClick={() => handleBeatClick(index)}
            >
              <div
                className={segmentProps.className}
                style={segmentProps.style}
                aria-pressed={!isCurrentlyPrecounting && isUserAccented}
                aria-label={isCurrentlyPrecounting ? `Precount beat ${index + 1}` :`Beat ${index + 1}, ${isUserAccented ? 'accented' : 'not accented'}. Click to toggle accent.`}
              ></div>
            </div>
          );
        })}
      </div>

      <div className="text-center select-none tabular-nums" onContextMenu={(e) => e.preventDefault()}>
        {tempoDisplayTextElement}
        <p className="text-sm text-muted-foreground">
          <span
            className={cn(!beatsDisabled && "cursor-ns-resize", "px-1 py-0.5 rounded hover:bg-muted/50 transition-colors")}
            onMouseDown={handleBeatsGestureStart}
            onTouchStart={handleBeatsGestureStart}
          >
            {displayBeatsText}
          </span>
          <span className="mx-1">&bull;</span>
          <span
            className={cn(!subdivisionDisabled && "cursor-pointer", "px-1 py-0.5 rounded hover:bg-muted/50 transition-colors")}
            onMouseDown={(e) => { if (e.button === 0) handleSubdivisionClick(); }} // Check for left click for mouse
            onTouchStart={handleSubdivisionClick} // No button check needed for touch
          >
            {displaySubdivision}
          </span>
        </p>
      </div>

      {isTempoGestureActive && sectionToUseForDisplay && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 p-3 mx-2 sm:mx-0 bg-background/90 backdrop-blur-md shadow-2xl rounded-xl border select-none w-auto flex flex-wrap justify-center gap-3 sm:gap-4 items-center">
            {/* Control buttons - only show in persistent mode */}
            {isTempoIndicatorPersistent && (
              <div className="flex flex-col gap-2">
                {/* Increase tempo button - triangle pointing up */}
                <button
                  onClick={() => handleTempoIncrement(1)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-10 h-10 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
                  aria-label="Increase tempo"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-primary"></div>
                </button>
                
                {/* Decrease tempo button - triangle pointing down */}
                <button
                  onClick={() => handleTempoIncrement(-1)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-10 h-10 flex items-center justify-center rounded-md bg-primary/10 hover:bg-primary/20 active:bg-primary/30 transition-colors"
                  aria-label="Decrease tempo"
                >
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-primary"></div>
                </button>
              </div>
            )}
            
            {activeEditingTargetRef.current === 'start' && (
            <TempoGestureIndicator
                label={sectionToUseForDisplay.endTempo === undefined || sectionToUseForDisplay.endTempo === sectionToUseForDisplay.tempo ? "Tempo" : "Start"}
                value={sectionToUseForDisplay.tempo}
                isActive={true}
            />
            )}
            {activeEditingTargetRef.current === 'end' && sectionToUseForDisplay.endTempo !== undefined && sectionToUseForDisplay.endTempo !== sectionToUseForDisplay.tempo && (
            <TempoGestureIndicator
                label="End"
                value={sectionToUseForDisplay.endTempo}
                isActive={true}
            />
            )}
        </div>
      )}


      {isBeatsGestureActive && sectionToUseForDisplay && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 p-3 mx-2 sm:mx-0 bg-background/90 backdrop-blur-md shadow-2xl rounded-xl border select-none w-auto flex flex-wrap justify-center gap-3 sm:gap-4">
           <BeatsGestureIndicator value={Number(sectionToUseForDisplay.timeSignature)} />
        </div>
      )}

      {isSubdivisionGestureActive && sectionToUseForDisplay && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 p-3 mx-2 sm:mx-0 bg-background/90 backdrop-blur-md shadow-2xl rounded-xl border select-none w-auto flex flex-col items-center gap-2 sm:gap-3">
           <SubdivisionGestureIndicator
             currentSubdivision={sectionToUseForDisplay.subdivision}
             onSelect={handleSubdivisionSelect}
           />
        </div>
      )}
    </div>
  );
};

export default BeatVisualization;

    

"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo, startTransition } from 'react';
import { Play, Pause, Repeat, Square, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTempoFlow } from '@/contexts/tempo-flow-context';
import { SUBDIVISION_MULTIPLIERS, DEFAULT_TEMPO, DEFAULT_TIME_SIGNATURE, DEFAULT_SUBDIVISION, DEFAULT_MEASURES } from '@/lib/constants';
import type { TempoSection, DefaultPlaybackSettings } from '@/lib/types';
import { useMetronomeAudio } from '@/hooks/useMetronomeAudio';
import VolumeIndicator from './volume-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const VOLUME_SWIPE_SENSITIVITY = 100;
const DRAG_THRESHOLD = 10; // Pixels to consider a swipe (for volume)
const VOLUME_CLICK_VS_SWIPE_TIMEOUT = 200; // ms

const PrecountIcon = ({ bars, enabled }: { bars: number; enabled: boolean }) => {
  return (
    <svg
      className="h-[62px] w-[62px]"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <text
        x="10"
        y="18"
        fontSize="17"
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
        stroke="none"
      >
        {enabled ? bars : 0}
      </text>
      <line 
        x1="19" 
        y1="4" 
        x2="19" 
        y2="20" 
        strokeDasharray="2,2" 
        strokeWidth="3"
        opacity={enabled ? 1 : 0.5}
      />
    </svg>
  );
};

const PlaybackControls: React.FC = () => {
  const context = useTempoFlow();
  const {
    sections, activeSectionId, setActiveSectionId,
    isPlaying, setIsPlaying,
    userPreferredLooping, isLooping, setUserPreferredLooping,
    currentBeat, setCurrentBeat,
    currentMeasure, setCurrentMeasure,
    currentSubdivisionTick, setCurrentSubdivisionTick,
    resetPlaybackPosition,
    isPrecountEnabled, setIsPrecountEnabled,
    precountBars, setPrecountBars,
    isCurrentlyPrecounting, setIsCurrentlyPrecounting,
    precountProgress, setPrecountProgress,
    precountTargetSectionId, setPrecountTargetSectionId,
    defaultPlaybackSettings,
    firstSection: contextFirstSection
  } = context;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextTickTimeRef = useRef<number>(0); // Track when next tick should occur (absolute timestamp)
  const startTimeRef = useRef<number>(0); // Track playback start time
  const lastTempoRef = useRef<number>(0); // Track last calculated tempo to detect changes
  const isMobile = useIsMobile();

  // Add refs for current playback position
  const currentBeatRef = useRef(currentBeat);
  const currentMeasureRef = useRef(currentMeasure);
  const currentSubdivisionTickRef = useRef(currentSubdivisionTick);
  useEffect(() => { currentBeatRef.current = currentBeat; }, [currentBeat]);
  useEffect(() => { currentMeasureRef.current = currentMeasure; }, [currentMeasure]);
  useEffect(() => { currentSubdivisionTickRef.current = currentSubdivisionTick; }, [currentSubdivisionTick]);

  // Store tick functions in refs to avoid recreating the timing loop
  const performTickTransitionRef = useRef<(() => void) | null>(null);
  const performPrecountTickTransitionRef = useRef<(() => void) | null>(null);

  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  const defaultPlaybackSettingsRef = useRef(defaultPlaybackSettings);
  useEffect(() => { defaultPlaybackSettingsRef.current = defaultPlaybackSettings; }, [defaultPlaybackSettings]);

  const firstSectionRef = useRef(contextFirstSection);
  useEffect(() => {
    firstSectionRef.current = sectionsRef.current.length > 0 ? sectionsRef.current[0] : undefined;
  }, [sections]); // Re-evaluate firstSectionRef when sections array changes

  const activeSectionIdRef = useRef(activeSectionId);
  useEffect(() => { activeSectionIdRef.current = activeSectionId; }, [activeSectionId]);

  // When user requests to start a precount while playing, defer activation
  // until the next scheduled tick to avoid mid-tick rescheduling/pause.
  const pendingPrecountStartRef = useRef<{ targetId: string | null; bars: number } | null>(null);
  const isCurrentlyPrecountingRef = useRef(isCurrentlyPrecounting);
  useEffect(() => { isCurrentlyPrecountingRef.current = isCurrentlyPrecounting; }, [isCurrentlyPrecounting]);
  const precountBarsRef = useRef(precountBars);
  useEffect(() => { precountBarsRef.current = precountBars; }, [precountBars]);
  const precountTargetSectionIdRef = useRef(precountTargetSectionId);
  useEffect(() => { precountTargetSectionIdRef.current = precountTargetSectionId; }, [precountTargetSectionId]);
  const precountProgressRef = useRef(precountProgress);
  useEffect(() => { precountProgressRef.current = precountProgress; }, [precountProgress]);
  const currentSectionDataForAudio = useMemo((): TempoSection | (DefaultPlaybackSettings & { id: string; name: string; measures: number; color: string; accentedBeats: number[]; isLoopable: boolean; }) | undefined => {
    // Use live sections state, not ref, so memo recalculates on updates
    const currentSections = sections;
    const currentDefaultSettings = defaultPlaybackSettings;
    const currentFirstSection = sections.length > 0 ? sections[0] : undefined;
    const currentActiveSectionIdVal = activeSectionId;
    const currentIsCurrentlyPrecounting = isCurrentlyPrecounting;
    const currentPrecountTargetSectionId = precountTargetSectionId;


    if (currentIsCurrentlyPrecounting) {
      let targetSectionForAudio;
      if (currentPrecountTargetSectionId) {
        targetSectionForAudio = currentSections.find(s => s.id === currentPrecountTargetSectionId);
      } else if (currentSections.length === 0) { // Precounting for default mode
        return {
          ...currentDefaultSettings,
          id: 'default-playback-section-precount-target',
          name: 'Default Precount',
          measures: 1, // Precount is always 1 measure visually for the audio hook
          color: `hsl(var(--accent))`, // Use accent color for precount
          accentedBeats: currentDefaultSettings.accentedBeats || [0],
          isLoopable: true, // Not relevant for audio hook's precount processing
        };
      }

      if (targetSectionForAudio) {
        return {
          ...targetSectionForAudio,
          name: 'Precount - Target Section',
          measures: 1,
          color: `hsl(var(--accent))`,
          isLoopable: false,
          accentedBeats: targetSectionForAudio.accentedBeats || [0],
        };
      }

      const precountBase = currentFirstSection || currentDefaultSettings;
      return {
        id: currentPrecountTargetSectionId || 'precount-default-display', name: 'Precount',
        tempo: precountBase.tempo, timeSignature: precountBase.timeSignature,
        subdivision: precountBase.subdivision, measures: 1,
        color: `hsl(var(--accent))`,
        accentedBeats: precountBase.accentedBeats || [0],
        isLoopable: false,
        endTempo: precountBase.endTempo,
      } as TempoSection;
    }

    if (currentActiveSectionIdVal && currentSections.length > 0) {
      const foundSection = currentSections.find(s => s.id === currentActiveSectionIdVal);
      if (foundSection) return foundSection;
    }

    if (currentSections.length === 0 && currentActiveSectionIdVal === null) {
      return {
        ...currentDefaultSettings,
        id: 'default-playback-section',
        name: 'Default',
        measures: 1,
        color: `hsl(var(--destructive))`,
        accentedBeats: currentDefaultSettings.accentedBeats || [0],
        isLoopable: true,
      };
    }

    if (currentSections.length > 0 && !currentSections.find(s => s.id === currentActiveSectionIdVal)) {
      return currentSections[0];
    }
    return currentSections.length > 0 ? currentSections[0] : undefined;
  }, [
    isCurrentlyPrecounting,
    precountTargetSectionId,
    sections,
    activeSectionId,
    defaultPlaybackSettings,
  ]);


  const {
    resumeAudioContext,
    volume,
    isMuted,
    setVolume,
    toggleMute
  } = useMetronomeAudio({
    isPlaying,
    activeSection: currentSectionDataForAudio,
    currentBeatInMeasure: isCurrentlyPrecounting ? precountProgress.beat : currentBeat,
    currentSubdivision: isCurrentlyPrecounting ? precountProgress.tick : currentSubdivisionTick,
    currentMeasure: isCurrentlyPrecounting ? precountProgress.bar : currentMeasure,
    isPrecounting: isCurrentlyPrecounting,
  });

  const [speakerIcon, setSpeakerIcon] = useState(<Volume2 size={28} />);

  const isPressingVolumeRef = useRef(false);
  const volumeInteractionStateRef = useRef<'idle' | 'pressing' | 'swiping'>('idle');
  const volumeStartYRef = useRef(0);
  const volumeInitialVolumeRef = useRef(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  const volumeIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeClickMuteToggleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const volumeButtonRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    if (isMuted) {
      setSpeakerIcon(<VolumeX size={28} className="text-muted-foreground sm:h-8 sm:w-8" />);
    } else if (volume === 0) {
      setSpeakerIcon(<VolumeX size={28} className="text-muted-foreground sm:h-8 sm:w-8" />);
    } else if (volume < 0.33) {
      setSpeakerIcon(<Volume size={28} className="text-primary sm:h-8 sm:w-8" />);
    } else if (volume < 0.66) {
      setSpeakerIcon(<Volume1 size={28} className="text-primary sm:h-8 sm:w-8" />);
    } else {
      setSpeakerIcon(<Volume2 size={28} className="text-primary sm:h-8 sm:w-8" />);
    }
  }, [volume, isMuted]);



  // Centralized precount state machine
  const precountStateMachine = useCallback((action: 'start' | 'advance' | 'complete' | 'reset' | 'cancel', payload?: any) => {
    switch (action) {
      case 'start': {
        const { bars, targetId } = payload || {};
        setPrecountBars(bars);
        precountBarsRef.current = bars;
        setPrecountTargetSectionId(targetId);
        precountTargetSectionIdRef.current = targetId;
        setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
        precountProgressRef.current = { bar: 0, beat: 0, tick: 0 };
        setIsCurrentlyPrecounting(true);
        isCurrentlyPrecountingRef.current = true;
        break;
      }
      case 'advance': {
        const { nextBar, nextBeat, nextTick } = payload || {};
        const newProgress = { bar: nextBar, beat: nextBeat, tick: nextTick };
        setPrecountProgress(newProgress);
        precountProgressRef.current = newProgress;
        break;
      }
      case 'complete': {
        setIsCurrentlyPrecounting(false);
        isCurrentlyPrecountingRef.current = false;
        setPrecountTargetSectionId(null);
        precountTargetSectionIdRef.current = null;
        setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
        precountProgressRef.current = { bar: 0, beat: 0, tick: 0 };
        setIsPlaying(true); // Ensure playback resumes after precount
        break;
      }
      case 'reset': {
        setIsCurrentlyPrecounting(false);
        isCurrentlyPrecountingRef.current = false;
        setPrecountTargetSectionId(null);
        precountTargetSectionIdRef.current = null;
        setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
        precountProgressRef.current = { bar: 0, beat: 0, tick: 0 };
        break;
      }
      case 'cancel': {
        setIsCurrentlyPrecounting(false);
        isCurrentlyPrecountingRef.current = false;
        setPrecountTargetSectionId(null);
        precountTargetSectionIdRef.current = null;
        setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
        precountProgressRef.current = { bar: 0, beat: 0, tick: 0 };
        break;
      }
      default:
        break;
    }
  }, []);

  // Replace performPrecountTickTransition with state machine
  const performPrecountTickTransition = useCallback(() => {
    const currentSections = sectionsRef.current;
    const currentDefaultSettings = defaultPlaybackSettingsRef.current;
    const currentFirstSection = firstSectionRef.current;
    const currentPrecountTargetId = precountTargetSectionIdRef.current;

    let sectionForPrecountTiming: Pick<TempoSection, 'timeSignature' | 'subdivision' | 'tempo' | 'endTempo'> | Pick<DefaultPlaybackSettings, 'timeSignature' | 'subdivision' | 'tempo' | 'endTempo'>;

    if (currentPrecountTargetId) {
      const targetSection = currentSections.find(s => s.id === currentPrecountTargetId);
      sectionForPrecountTiming = targetSection || (currentFirstSection || currentDefaultSettings);
    } else if (currentSections.length === 0) {
      sectionForPrecountTiming = currentDefaultSettings;
    } else {
      sectionForPrecountTiming = currentFirstSection || currentDefaultSettings;
    }

    const progressNow = precountProgressRef.current;
    let nextTick = progressNow.tick + 1;
    let nextBeat = progressNow.beat;
    let nextBar = progressNow.bar;
    
    const beatsPerMeasureNum = parseInt(String(sectionForPrecountTiming.timeSignature));
    const numSubdivisions = SUBDIVISION_MULTIPLIERS[sectionForPrecountTiming.subdivision];

    // Wrap subdivisions and beats
    if (nextTick >= numSubdivisions) {
      nextTick = 0;
      nextBeat += 1;
      if (nextBeat >= beatsPerMeasureNum) {
        nextBeat = 0;
        nextBar += 1;
      }
    }

    // Check if we've completed the precount
    // Complete when we reach the first tick of the bar AFTER the precount bars
    if (nextBar >= (precountBarsRef.current || 0) && nextBeat === 0 && nextTick === 0) {
      precountStateMachine('complete');
      // Only reset playback position if not already at the target section
      if (activeSectionIdRef.current !== currentPrecountTargetId) {
        resetPlaybackPosition(currentPrecountTargetId);
      }
      nextTickTimeRef.current = 0;
      startTimeRef.current = 0;
    } else {
      precountStateMachine('advance', { nextBar, nextBeat, nextTick });
    }
  }, [resetPlaybackPosition, precountStateMachine]);

  // Update the ref whenever the function is recreated
  useEffect(() => {
    performPrecountTickTransitionRef.current = performPrecountTickTransition;
  }, [performPrecountTickTransition]);


  const performTickTransition = useCallback(() => {
    const currentSections = sectionsRef.current;
    const currentDefaultSettings = defaultPlaybackSettingsRef.current;
    const currentActiveId = activeSectionIdRef.current;

    let sectionDataForLogic: TempoSection | (DefaultPlaybackSettings & { id: string, name: string, measures: number, color: string, isLoopable: boolean });
    const isCurrentlyInDefaultMode = currentSections.length === 0 && currentActiveId === null;

    if (isCurrentlyInDefaultMode) {
      sectionDataForLogic = {
        id: 'default-playback-section', name: 'Default', color: `hsl(var(--destructive))`,
        ...currentDefaultSettings,
        measures: 1, isLoopable: true, // Looping is forced for default mode
      };
    } else if (currentActiveId) {
      const currentActualSection = currentSections.find(s => s.id === currentActiveId);
      if (!currentActualSection) { setIsPlaying(false); return; }
      sectionDataForLogic = currentActualSection;
    } else { setIsPlaying(false); return; }

    const beatsPerMeasureNum = parseInt(String(sectionDataForLogic.timeSignature));
    const numSubdivisions = SUBDIVISION_MULTIPLIERS[sectionDataForLogic.subdivision];
    const actualMeasures = sectionDataForLogic.measures || DEFAULT_MEASURES;

    const isEndOfCurrentTick = currentSubdivisionTick >= numSubdivisions - 1;
    const isEndOfCurrentBeat = currentBeat >= beatsPerMeasureNum - 1;
    const isEndOfCurrentMeasure = currentMeasure >= actualMeasures - 1;

    if (isEndOfCurrentTick && isEndOfCurrentBeat && isEndOfCurrentMeasure) {
      if (sectionDataForLogic.id === 'default-playback-section') {
        resetPlaybackPosition(undefined); // Loop default section
      } else if ((sectionDataForLogic as TempoSection).isLoopable) {
        resetPlaybackPosition(currentActiveId);
      } else {
        const currentSectionIndex = currentSections.findIndex(s => s.id === currentActiveId);
        const nextSectionArrayIndex = currentSectionIndex + 1;
        if (nextSectionArrayIndex < currentSections.length) {
          resetPlaybackPosition(currentSections[nextSectionArrayIndex].id);
        } else if (isLooping) { // Global loop
          resetPlaybackPosition(currentSections.length > 0 ? currentSections[0].id : undefined);
        } else {
          setIsPlaying(false);
          resetPlaybackPosition(currentSections.length > 0 ? currentSections[0].id : undefined);
        }
      }
    } else {
      let nextS = currentSubdivisionTick + 1;
      let nextB = currentBeat;
      let nextM = currentMeasure;

      if (nextS >= numSubdivisions) {
        nextS = 0;
        nextB += 1;
        if (nextB >= beatsPerMeasureNum) {
          nextB = 0;
          nextM += 1;
        }
      }
      setCurrentSubdivisionTick(nextS);
      setCurrentBeat(nextB);
      setCurrentMeasure(nextM);
    }
  }, [
    currentBeat, currentMeasure, currentSubdivisionTick,
    isLooping, resetPlaybackPosition,
    setCurrentBeat, setCurrentMeasure, setCurrentSubdivisionTick,
    setIsPlaying, setPrecountTargetSectionId, setPrecountProgress, setIsCurrentlyPrecounting, setPrecountBars // ensure setters used inside are included
  ]);

  // Update the ref whenever the function is recreated
  useEffect(() => {
    performTickTransitionRef.current = performTickTransition;
  }, [performTickTransition]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isPlaying) {
      return;
    }

    const currentSectionsVal = sectionsRef.current;
    const currentDefaultSettingsVal = defaultPlaybackSettingsRef.current;
    const currentFirstSectionVal = firstSectionRef.current;
    const currentActiveSectionIdVal = activeSectionIdRef.current;

    let sectionPropsForTiming: TempoSection | (DefaultPlaybackSettings & { measures: number, id?: string }) | undefined;
    let isCurrentTickInDefaultMode = false;

    if (isCurrentlyPrecountingRef.current) {
      const currentPrecountTarget = precountTargetSectionIdRef.current;
      if (currentPrecountTarget) {
        const targetSection = currentSectionsVal.find(s => s.id === currentPrecountTarget);
        sectionPropsForTiming = targetSection || (currentFirstSectionVal || currentDefaultSettingsVal);
      } else if (currentSectionsVal.length === 0) {
        isCurrentTickInDefaultMode = true;
        sectionPropsForTiming = { ...currentDefaultSettingsVal, measures: precountBarsRef.current, id: 'default-playback-section-precount-target' };
      } else {
        sectionPropsForTiming = currentFirstSectionVal || currentDefaultSettingsVal;
      }
    } else {
      if (currentSectionsVal.length === 0 && currentActiveSectionIdVal === null) {
        isCurrentTickInDefaultMode = true;
        sectionPropsForTiming = { ...currentDefaultSettingsVal, measures: 1, id: 'default-playback-section' };
      } else if (currentActiveSectionIdVal && currentSectionsVal.length > 0) {
        const actualSection = currentSectionsVal.find(s => s.id === currentActiveSectionIdVal);
        if (actualSection) { sectionPropsForTiming = actualSection; }
        else { setIsPlaying(false); return; }
      } else { setIsPlaying(false); return; }
    }

    if (!sectionPropsForTiming) { setIsPlaying(false); return; }

    const beatsPerMeasureNum = parseInt(String(sectionPropsForTiming.timeSignature));
    const numSubdivisions = SUBDIVISION_MULTIPLIERS[sectionPropsForTiming.subdivision];
    const currentMeasuresForTiming = isCurrentTickInDefaultMode && !isCurrentlyPrecountingRef.current ? 1 : (sectionPropsForTiming.measures || DEFAULT_MEASURES);

    // Calculate tempo for this specific tick
    let tempoForCurrentActualTick = sectionPropsForTiming.tempo;
    
    if (!isCurrentlyPrecounting && typeof sectionPropsForTiming.endTempo === 'number' && sectionPropsForTiming.endTempo !== sectionPropsForTiming.tempo) {
      const totalSubdivisionTicksInSection = currentMeasuresForTiming * beatsPerMeasureNum * numSubdivisions;
      const currentTickWithinSection = (currentMeasure * beatsPerMeasureNum * numSubdivisions) + (currentBeat * numSubdivisions) + currentSubdivisionTick;
      let progress = 0;
      if (totalSubdivisionTicksInSection > 1) {
        progress = Math.min(1, Math.max(0, currentTickWithinSection) / (totalSubdivisionTicksInSection - 1));
      } else if (totalSubdivisionTicksInSection === 1) {
        progress = 0;
      }
      const clampedProgress = Math.max(0, Math.min(1, progress));
      tempoForCurrentActualTick = sectionPropsForTiming.tempo + (sectionPropsForTiming.endTempo - sectionPropsForTiming.tempo) * clampedProgress;
    }

    const quarterNoteDurationMs = 60000 / tempoForCurrentActualTick;
    const subdivisionDurationMs = quarterNoteDurationMs / numSubdivisions;

    if (!isFinite(subdivisionDurationMs) || subdivisionDurationMs <= 0) {
      setIsPlaying(false);
      return;
    }

    // Recursive tick function using setTimeout for precise timing
    const scheduleTick = () => {
      const now = performance.now();
      
      // Get current state values from refs
      const currentIsPrecounting = isCurrentlyPrecountingRef.current;
      const currentActiveSectionIdVal = activeSectionIdRef.current;
      const currentSectionsVal = sectionsRef.current;
      const currentDefaultSettingsVal = defaultPlaybackSettingsRef.current;
      const currentFirstSectionVal = firstSectionRef.current;
      
      // Recalculate timing parameters to handle tempo changes
      let sectionPropsForTiming: TempoSection | (DefaultPlaybackSettings & { measures: number, id?: string }) | undefined;
      let isCurrentTickInDefaultMode = false;

      if (currentIsPrecounting) {
        const currentPrecountTarget = precountTargetSectionIdRef.current;
        if (currentPrecountTarget) {
          const targetSection = currentSectionsVal.find(s => s.id === currentPrecountTarget);
          sectionPropsForTiming = targetSection || (currentFirstSectionVal || currentDefaultSettingsVal);
        } else if (currentSectionsVal.length === 0) {
          isCurrentTickInDefaultMode = true;
          sectionPropsForTiming = { ...currentDefaultSettingsVal, measures: precountBarsRef.current, id: 'default-playback-section-precount-target' };
        } else {
          sectionPropsForTiming = currentFirstSectionVal || currentDefaultSettingsVal;
        }
      } else {
        if (currentSectionsVal.length === 0 && currentActiveSectionIdVal === null) {
          isCurrentTickInDefaultMode = true;
          sectionPropsForTiming = { ...currentDefaultSettingsVal, measures: 1, id: 'default-playback-section' };
        } else if (currentActiveSectionIdVal && currentSectionsVal.length > 0) {
          const actualSection = currentSectionsVal.find(s => s.id === currentActiveSectionIdVal);
          if (actualSection) { sectionPropsForTiming = actualSection; }
          else { return; }
        } else { return; }
      }

      if (!sectionPropsForTiming) { return; }

      const beatsPerMeasureNum = parseInt(String(sectionPropsForTiming.timeSignature));
      const numSubdivisions = SUBDIVISION_MULTIPLIERS[sectionPropsForTiming.subdivision];
      const currentMeasuresForTiming = isCurrentTickInDefaultMode && !currentIsPrecounting ? 1 : (sectionPropsForTiming.measures || DEFAULT_MEASURES);

      // Get current playback position from refs
      const currentBeatVal = currentBeatRef.current;
      const currentSubdivisionVal = currentSubdivisionTickRef.current;
      const currentMeasureVal = currentMeasureRef.current;

      // Calculate tempo for this specific tick
      let tempoForCurrentActualTick = sectionPropsForTiming.tempo;
      
      if (!currentIsPrecounting && typeof sectionPropsForTiming.endTempo === 'number' && sectionPropsForTiming.endTempo !== sectionPropsForTiming.tempo) {
        const totalSubdivisionTicksInSection = currentMeasuresForTiming * beatsPerMeasureNum * numSubdivisions;
        const currentTickWithinSection = (currentMeasureVal * beatsPerMeasureNum * numSubdivisions) + (currentBeatVal * numSubdivisions) + currentSubdivisionVal;
        let progress = 0;
        if (totalSubdivisionTicksInSection > 1) {
          progress = Math.min(1, Math.max(0, currentTickWithinSection) / (totalSubdivisionTicksInSection - 1));
        } else if (totalSubdivisionTicksInSection === 1) {
          progress = 0;
        }
        const clampedProgress = Math.max(0, Math.min(1, progress));
        tempoForCurrentActualTick = sectionPropsForTiming.tempo + (sectionPropsForTiming.endTempo - sectionPropsForTiming.tempo) * clampedProgress;
      }

      const quarterNoteDurationMs = 60000 / tempoForCurrentActualTick;
      const subdivisionDurationMs = quarterNoteDurationMs / numSubdivisions;

      if (!isFinite(subdivisionDurationMs) || subdivisionDurationMs <= 0) {
        return;
      }

      // Look ahead to see if we're transitioning sections
      const isEndOfCurrentTick = currentSubdivisionVal >= numSubdivisions - 1;
      const isEndOfCurrentBeat = currentBeatVal >= beatsPerMeasureNum - 1;
      const isEndOfCurrentMeasure = currentMeasureVal >= currentMeasuresForTiming - 1;
      const willTransitionSection = !currentIsPrecounting && isEndOfCurrentTick && isEndOfCurrentBeat && isEndOfCurrentMeasure;
      
      // Calculate next section's tempo for lookahead
      let nextSectionTempo = tempoForCurrentActualTick;
      if (willTransitionSection && sectionPropsForTiming && 'id' in sectionPropsForTiming) {
        if (sectionPropsForTiming.id === 'default-playback-section') {
          // Will loop default section
          nextSectionTempo = sectionPropsForTiming.tempo;
        } else if ((sectionPropsForTiming as TempoSection).isLoopable) {
          // Will loop current section
          nextSectionTempo = sectionPropsForTiming.tempo;
        } else {
          // Will move to next section or loop
          const currentSectionIndex = currentSectionsVal.findIndex(s => s.id === sectionPropsForTiming.id);
          const nextSectionArrayIndex = currentSectionIndex + 1;
          if (nextSectionArrayIndex < currentSectionsVal.length) {
            nextSectionTempo = currentSectionsVal[nextSectionArrayIndex].tempo;
          } else if (isLooping && currentSectionsVal.length > 0) {
            nextSectionTempo = currentSectionsVal[0].tempo;
          }
        }
      }
      
      // For precount completion, look ahead to target section tempo
      if (currentIsPrecounting) {
        const progressNow = precountProgressRef.current;
        const nextTick = progressNow.tick + 1;
        let nextBar = progressNow.bar;
        if (nextTick >= numSubdivisions) {
          const nextBeat = progressNow.beat + 1;
          if (nextBeat >= beatsPerMeasureNum) {
            nextBar = progressNow.bar + 1;
          }
        }
        
        // Check if precount will complete
        if (nextBar >= (precountBarsRef.current || 0)) {
          const targetId = precountTargetSectionIdRef.current;
          if (targetId) {
            const targetSection = currentSectionsVal.find(s => s.id === targetId);
            if (targetSection) {
              nextSectionTempo = targetSection.tempo;
            }
          } else if (currentSectionsVal.length > 0) {
            nextSectionTempo = currentSectionsVal[0].tempo;
          } else {
            nextSectionTempo = currentDefaultSettingsVal.tempo;
          }
        }
      }
      
      const useNextSectionTempo = willTransitionSection || (currentIsPrecounting && nextSectionTempo !== tempoForCurrentActualTick);
      const tempoForNextTick = useNextSectionTempo ? nextSectionTempo : tempoForCurrentActualTick;

      const tickAction = currentIsPrecounting ? performPrecountTickTransitionRef.current : performTickTransitionRef.current;
      
      // Handle first tick initialization - don't execute yet, just schedule
      if (nextTickTimeRef.current === 0) {
        nextTickTimeRef.current = now + subdivisionDurationMs;
        lastTempoRef.current = tempoForCurrentActualTick;
        // Schedule next check without executing tick action
        const delay = subdivisionDurationMs;
        timeoutRef.current = setTimeout(scheduleTick, delay);
        return;
      }
      
      // Execute tick action BEFORE calculating next delay so state updates
      if (tickAction) tickAction();
      
      // After tick action, check if timing was reset (e.g., precount completion)
      if (nextTickTimeRef.current === 0) {
        // Timing was reset - reinitialize and reschedule
        const delay = 10; // Small delay to let state settle
        timeoutRef.current = setTimeout(scheduleTick, delay);
        return;
      }
      
      // Check for tempo changes
      const tempoChanged = Math.abs(lastTempoRef.current - tempoForNextTick) > 0.5;
      
      if (tempoChanged) {
        const nextQuarterNoteDurationMs = 60000 / tempoForNextTick;
        const nextSubdivisionDurationMs = nextQuarterNoteDurationMs / numSubdivisions;
        nextTickTimeRef.current = performance.now() + nextSubdivisionDurationMs;
        lastTempoRef.current = tempoForNextTick;
      } else {
        // Maintain steady timing by adding exact duration
        nextTickTimeRef.current += subdivisionDurationMs;
      }
      
      // Calculate delay for next tick with drift compensation
      const delay = Math.max(0, nextTickTimeRef.current - performance.now());
      timeoutRef.current = setTimeout(scheduleTick, delay);
    };
    
    // Initialize and start first tick
    startTimeRef.current = performance.now();
    nextTickTimeRef.current = 0; // Will be initialized in first scheduleTick call
    scheduleTick();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    isPlaying, isMobile, setIsPlaying
  ]);


  const handlePlayPause = useCallback(async () => {
    await resumeAudioContext();
    const currentSections = sectionsRef.current;

    if (isPlaying) {
      setIsPlaying(false);
      if (isCurrentlyPrecounting) {
        precountStateMachine('reset');
      }
      // Reset timing refs immediately
      nextTickTimeRef.current = 0;
      startTimeRef.current = 0;
      lastTempoRef.current = 0;
      // Reset playback position
      startTransition(() => {
        setCurrentBeat(0);
        setCurrentMeasure(0);
        setCurrentSubdivisionTick(0);
      });

    } else {
      let targetIdForPlaybackLogic: string | null;
      let targetIdForPrecountLogic: string | null;

      if (currentSections.length === 0) {
        targetIdForPlaybackLogic = null;
        targetIdForPrecountLogic = null;
      } else if (activeSectionIdRef.current && currentSections.find(s => s.id === activeSectionIdRef.current)) {
        targetIdForPlaybackLogic = activeSectionIdRef.current;
        targetIdForPrecountLogic = activeSectionIdRef.current;
      } else {
        targetIdForPlaybackLogic = currentSections[0].id;
        targetIdForPrecountLogic = currentSections[0].id;
      }

      // Ensure audio context is fully initialized before starting
      await resumeAudioContext();
      // Increased delay to ensure audio context is ready after idle/suspend
      await new Promise(resolve => setTimeout(resolve, 50));

      // Reset timing refs before starting
      nextTickTimeRef.current = 0;
      startTimeRef.current = 0;
      lastTempoRef.current = 0;
      
      setActiveSectionId(targetIdForPlaybackLogic);
      startTransition(() => {
        setCurrentBeat(0);
        setCurrentMeasure(0);
        setCurrentSubdivisionTick(0);
      });

      if (isPrecountEnabled && precountBars > 0 && (currentSections.length > 0 || targetIdForPrecountLogic === null)) {
        // If a precount is already running, avoid overwriting its progress here.
        if (!isCurrentlyPrecountingRef.current) {
          precountStateMachine('start', { bars: precountBars, targetId: targetIdForPrecountLogic });
        }
        setIsPlaying(true); // Start playing immediately for precount
      } else {
        setIsCurrentlyPrecounting(false);
        setIsPlaying(true);
      }
    }
  }, [
    isPlaying, resumeAudioContext, setIsPlaying, setCurrentBeat, setCurrentMeasure, setCurrentSubdivisionTick,
    isPrecountEnabled, precountBars, setIsCurrentlyPrecounting, setPrecountProgress,
    setActiveSectionId, setPrecountTargetSectionId, isCurrentlyPrecounting // Added isCurrentlyPrecounting
  ]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    precountStateMachine('reset');
    const firstSectionId = sectionsRef.current.length > 0 ? sectionsRef.current[0].id : undefined;
    resetPlaybackPosition(firstSectionId);
    
    // Trigger scroll to first section by briefly setting it as active
    if (firstSectionId) {
      setTimeout(() => {
        setActiveSectionId(firstSectionId);
        // Dispatch custom event to ensure scroll to top
        window.dispatchEvent(new CustomEvent('scrollToTop'));
      }, 0);
    }
  }, [setIsPlaying, setIsCurrentlyPrecounting, setPrecountProgress, setPrecountTargetSectionId, resetPlaybackPosition, setActiveSectionId, precountStateMachine]);

  const handleGlobalLoopToggle = useCallback(() => {
    setUserPreferredLooping(prev => {
      if (sectionsRef.current.length === 0) return true;
      return !prev;
    });
  }, [setUserPreferredLooping]);

  // --- Precount Handlers ---
  const handlePrecountToggle = useCallback(() => {
    // Cycle through: disabled (0 bars) → 1 bar → 2 bars → disabled
    if (!isPrecountEnabled) {
      // Currently disabled, enable with 1 bar
      setPrecountBars(1);
      setIsPrecountEnabled(true);
      // Don't queue precount during active playback - it will only apply on next play press
    } else if (precountBars === 1) {
      // Currently 1 bar, change to 2 bars
      setPrecountBars(2);
      // Don't queue precount during active playback - it will only apply on next play press
    } else {
      // Currently 2 bars, disable
      setIsPrecountEnabled(false);
      // If disabling during playback, clear any pending precount start
      if (isPlaying) {
        pendingPrecountStartRef.current = null;
        // If currently precounting, let it finish naturally - don't interrupt
        // If not currently precounting, no need to call reset - states are already reset
      }
    }
  }, [isPrecountEnabled, precountBars, setIsPrecountEnabled, setPrecountBars, isPlaying, precountStateMachine]);




  // --- Volume Gesture ---
  const handleVolumePressMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isPressingVolumeRef.current || volumeInteractionStateRef.current === 'idle') return;

    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    if (volumeInteractionStateRef.current === 'pressing') {
      const deltaYFromStart = Math.abs(clientY - volumeStartYRef.current);
      if (deltaYFromStart > DRAG_THRESHOLD) {
        if (volumeClickMuteToggleTimerRef.current) {
          clearTimeout(volumeClickMuteToggleTimerRef.current);
          volumeClickMuteToggleTimerRef.current = null;
        }
        volumeInteractionStateRef.current = 'swiping';
        setShowVolumeIndicator(true);
        if (volumeIndicatorTimeoutRef.current) clearTimeout(volumeIndicatorTimeoutRef.current);
        document.body.style.overflow = 'hidden';
        if (event.type === 'touchmove' && event.cancelable) event.preventDefault();
      } else {
        return;
      }
    }

    if (volumeInteractionStateRef.current !== 'swiping') return;
    if (event.type === 'touchmove' && event.cancelable) event.preventDefault();

    const deltaYFromInitialPress = clientY - volumeStartYRef.current;
    const volumeChange = -deltaYFromInitialPress / VOLUME_SWIPE_SENSITIVITY;
    const newVolume = volumeInitialVolumeRef.current + volumeChange;
    setVolume(newVolume);
  }, [setVolume]);

  const handleVolumePressEnd = useCallback(() => {
    const wasPressing = isPressingVolumeRef.current;
    const finalInteractionState = volumeInteractionStateRef.current;

    if (volumeClickMuteToggleTimerRef.current) {
      clearTimeout(volumeClickMuteToggleTimerRef.current);
      volumeClickMuteToggleTimerRef.current = null;
    }

    isPressingVolumeRef.current = false;
    volumeInteractionStateRef.current = 'idle';
    if (finalInteractionState === 'swiping') {
      document.body.style.overflow = '';
    }

    window.removeEventListener('mousemove', handleVolumePressMove);
    window.removeEventListener('mouseup', handleVolumePressEnd);
    window.removeEventListener('touchmove', handleVolumePressMove, { passive: false });
    window.removeEventListener('touchend', handleVolumePressEnd);

    if (wasPressing && finalInteractionState === 'pressing') {
      toggleMute();
    }
    volumeButtonRef.current?.blur();

    if (finalInteractionState === 'swiping') {
      if (volumeIndicatorTimeoutRef.current) clearTimeout(volumeIndicatorTimeoutRef.current);
      volumeIndicatorTimeoutRef.current = setTimeout(() => {
        setShowVolumeIndicator(false);
      }, 1500);
    } else {
      setShowVolumeIndicator(false);
    }
  }, [toggleMute, handleVolumePressMove]);

  const handleVolumePressStart = useCallback((event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (event.type === 'mousedown' && (event as React.MouseEvent).button !== 0) return;
    if (event.type === 'mousedown') event.preventDefault();

    resumeAudioContext();
    isPressingVolumeRef.current = true;
    volumeInteractionStateRef.current = 'pressing';

    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    volumeStartYRef.current = clientY;
    volumeInitialVolumeRef.current = volume;

    if (volumeClickMuteToggleTimerRef.current) clearTimeout(volumeClickMuteToggleTimerRef.current);
    volumeClickMuteToggleTimerRef.current = setTimeout(() => {
      volumeClickMuteToggleTimerRef.current = null;
    }, VOLUME_CLICK_VS_SWIPE_TIMEOUT);

    window.addEventListener('mousemove', handleVolumePressMove);
    window.addEventListener('mouseup', handleVolumePressEnd);
    window.addEventListener('touchmove', handleVolumePressMove, { passive: false });
    window.addEventListener('touchend', handleVolumePressEnd);
  }, [volume, resumeAudioContext, handleVolumePressMove, handleVolumePressEnd, setVolume]); // Added setVolume


  const onVolumeMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => { handleVolumePressStart(e); };
  const onVolumeTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => { handleVolumePressStart(e); };


  return (
    <div id="playback-controls-container" className="flex flex-col items-center justify-center space-y-4 py-4">
      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
        <Button
          onClick={(e) => { handlePlayPause(); (e.currentTarget as HTMLButtonElement).blur(); }}
          onPointerUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          variant="outline"
          size="lg"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={36} className="text-primary sm:h-12 sm:w-12" /> : <Play size={36} className="text-primary sm:h-12 sm:w-12" />}
        </Button>
        <Button
          onClick={(e) => { handleStop(); (e.currentTarget as HTMLButtonElement).blur(); }}
          onPointerUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          variant="outline"
          size="lg"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Stop and Reset Sequence"
        >
          <Square size={32} className="text-primary sm:h-10 sm:w-10" />
        </Button>
        <Button
          onClick={(e) => { handleGlobalLoopToggle(); (e.currentTarget as HTMLButtonElement).blur(); }}
          onPointerUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          variant="ghost"
          size="icon"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Toggle Global Loop"
          disabled={sectionsRef.current.length === 0}
        >
          <Repeat size={28} className={cn(isLooping ? "text-primary" : "text-muted-foreground", "sm:h-8 sm:w-8")} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { handlePrecountToggle(); (e.currentTarget as HTMLButtonElement).blur(); }}
          onPointerUp={(e) => (e.currentTarget as HTMLButtonElement).blur()}
          className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0 flex items-center justify-center focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            isPrecountEnabled ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Precount: Click to cycle through Off → 1 Bar → 2 Bars"
          disabled={defaultPlaybackSettingsRef.current === null && sectionsRef.current.length === 0 && contextFirstSection === undefined}
        >
          <PrecountIcon bars={precountBars} enabled={isPrecountEnabled} />
        </Button>

        <div className="relative">
          <Button
            ref={volumeButtonRef}
            variant="ghost"
            size="icon"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Volume: Click to mute/unmute, or Press & Swipe to change volume"
            onMouseDown={onVolumeMouseDown}
            onTouchStart={onVolumeTouchStart}
          >
            {speakerIcon}
          </Button>
          {showVolumeIndicator && <VolumeIndicator volume={volume} visible={showVolumeIndicator} />}
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;


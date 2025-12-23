
"use client";

import { useCallback, useRef, useEffect, useState } from 'react';
import type { TempoSection, SoundParameters, SoundSet, DefaultPlaybackSettings } from '@/lib/types';
import { SOUND_SETS, DEFAULT_SOUND_SET_ID, PRECOUNT_SOUND_SETS, DEFAULT_PRECOUNT_SOUND_SET_ID } from '@/lib/constants';
import { useTempoFlow } from '@/contexts/tempo-flow-context';


interface MetronomeAudioProps {
  isPlaying: boolean;
  activeSection: TempoSection | undefined; // Could be the 'default-playback-section' virtual section
  currentBeatInMeasure: number;
  currentSubdivision: number;
  currentMeasure: number;
  isPrecounting?: boolean;
}

export function useMetronomeAudio({
  isPlaying,
  activeSection, 
  currentBeatInMeasure,
  currentSubdivision,
  currentMeasure,
  isPrecounting = false,
}: MetronomeAudioProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const lastTickPlayedRef = useRef<{ sectionId: string | null; bar?: number; beat: number; sub: number; } | null>(null);
  
  const { selectedSoundSetId, precountProgress, selectedPrecountSoundSetId, defaultPlaybackSettings } = useTempoFlow(); 

  const [volume, setInternalVolume] = useState(0.75); 
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (masterGainNodeRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
      masterGainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  const resumeAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext();
    }
    
    if (!masterGainNodeRef.current && audioContextRef.current) {
      masterGainNodeRef.current = audioContextRef.current.createGain();
      masterGainNodeRef.current.connect(audioContextRef.current.destination);
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (masterGainNodeRef.current && audioContextRef.current) { 
      masterGainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  const playSound = useCallback((time: number, type: 'accent' | 'beat' | 'sub') => {
    if (!audioContextRef.current || !masterGainNodeRef.current || audioContextRef.current.state !== 'running') {
      return;
    }
    const context = audioContextRef.current;
    
    const oscillator = context.createOscillator();
    const localGainNode = context.createGain(); 

    oscillator.connect(localGainNode);
    localGainNode.connect(masterGainNodeRef.current); 

    let soundParams: SoundParameters;

    if (isPrecounting) {
      const currentPrecountSoundProfile = 
        PRECOUNT_SOUND_SETS.find(s => s.id === selectedPrecountSoundSetId) || 
        PRECOUNT_SOUND_SETS.find(s => s.id === DEFAULT_PRECOUNT_SOUND_SET_ID) || 
        PRECOUNT_SOUND_SETS[0];
      
      switch (type) {
        case 'accent':
          soundParams = currentPrecountSoundProfile.accent;
          break;
        case 'beat':
          soundParams = currentPrecountSoundProfile.beat;
          break;
        case 'sub':
        default:
          soundParams = currentPrecountSoundProfile.sub;
          break;
      }
    } else {
      const currentSoundProfile = 
        SOUND_SETS.find(s => s.id === selectedSoundSetId) || 
        SOUND_SETS.find(s => s.id === DEFAULT_SOUND_SET_ID) || 
        SOUND_SETS[0];
      switch (type) {
        case 'accent':
          soundParams = currentSoundProfile.accent;
          break;
        case 'beat':
          soundParams = currentSoundProfile.beat;
          break;
        case 'sub':
        default:
          soundParams = currentSoundProfile.sub;
          break;
      }
    }
    
    oscillator.type = soundParams.type;
    oscillator.frequency.setValueAtTime(soundParams.frequency, time);

    localGainNode.gain.setValueAtTime(0, time); 
    localGainNode.gain.linearRampToValueAtTime(soundParams.gain, time + 0.005); 
    localGainNode.gain.linearRampToValueAtTime(0, time + 0.05); 

    oscillator.start(time);
    oscillator.stop(time + 0.05);
  }, [selectedSoundSetId, selectedPrecountSoundSetId, isPrecounting]); 

  useEffect(() => {
    if (isPlaying && audioContextRef.current && audioContextRef.current.state === 'running') {
      
      const currentTickIdentifier = {
        sectionId: activeSection?.id || (isPrecounting ? `precount-${activeSection?.id || 'default'}` : 'default-playback'),
        bar: isPrecounting ? precountProgress.bar : currentMeasure, 
        beat: currentBeatInMeasure,
        sub: currentSubdivision,
      };

      if (
        lastTickPlayedRef.current?.sectionId === currentTickIdentifier.sectionId &&
        lastTickPlayedRef.current?.bar === currentTickIdentifier.bar &&
        lastTickPlayedRef.current?.beat === currentTickIdentifier.beat &&
        lastTickPlayedRef.current?.sub === currentTickIdentifier.sub
      ) {
        return; 
      }
      lastTickPlayedRef.current = currentTickIdentifier;

      const context = audioContextRef.current;
      const lookahead = 0.1; // Increased from 0.05 to 0.1 for better mobile performance
      const scheduleTime = context.currentTime + lookahead;

      const isFirstSubdivisionOfBeat = currentSubdivision === 0;
      
      if (isPrecounting) {
        if (isFirstSubdivisionOfBeat) {
          playSound(scheduleTime, currentBeatInMeasure === 0 ? 'accent' : 'beat');
        } else {
          playSound(scheduleTime, 'sub');
        }
      } else { 
        const userAccentedBeats = activeSection?.accentedBeats || 
                                 (activeSection?.id === 'default-playback-section' ? defaultPlaybackSettings.accentedBeats : [0]);

        if (isFirstSubdivisionOfBeat) {
          const isAccented = userAccentedBeats.includes(currentBeatInMeasure);
          
          if (isAccented) {
            playSound(scheduleTime, 'accent');
          } else {
            playSound(scheduleTime, 'beat');
          }
        } else {
          playSound(scheduleTime, 'sub');
        }
      }
    }
  }, [
    isPlaying,
    activeSection,
    currentBeatInMeasure,
    currentSubdivision,
    currentMeasure,
    isPrecounting,
    precountProgress, 
    playSound,
    defaultPlaybackSettings // Added defaultPlaybackSettings
  ]);

  const setVolume = useCallback((level: number) => {
    const newVolume = Math.max(0, Math.min(1, level));
    setInternalVolume(newVolume);
    
    // Update gain immediately if audio context is available
    if (masterGainNodeRef.current && audioContextRef.current && audioContextRef.current.state === 'running') {
      masterGainNodeRef.current.gain.setValueAtTime(
        newVolume === 0 ? 0 : newVolume,
        audioContextRef.current.currentTime
      );
    }
    
    if (isMuted && newVolume > 0) { 
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) { 
      setIsMuted(true);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return { 
    resumeAudioContext, 
    volume, 
    isMuted, 
    setVolume, 
    toggleMute 
  };
}

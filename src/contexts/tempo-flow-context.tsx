
"use client";
import type { Preset, TempoSection, TimeSignature, Folder, Subdivision, SoundSet, DefaultPlaybackSettings, PrecountProgress, TempoFlowContextType } from '@/lib/types';
import React, { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { SECTION_COLORS, DEFAULT_TEMPO, DEFAULT_TIME_SIGNATURE, DEFAULT_SUBDIVISION, DEFAULT_MEASURES, TIME_SIGNATURES, DEFAULT_SOUND_SET_ID, PRECOUNT_SOUND_SETS, DEFAULT_PRECOUNT_SOUND_SET_ID, SOUND_SETS } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";


const TempoFlowContext = createContext<TempoFlowContextType | undefined>(undefined);

const initialDefaultPlaybackSettings: DefaultPlaybackSettings = {
  tempo: DEFAULT_TEMPO,
  timeSignature: DEFAULT_TIME_SIGNATURE,
  subdivision: DEFAULT_SUBDIVISION,
  accentedBeats: [0],
  endTempo: undefined,
};

export const TempoFlowProvider = ({ children }: { children: ReactNode }) => {
  const [sections, setSections] = useState<TempoSection[]>([]);
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeSectionId, setActiveSectionIdState] = useState<string | null>(null);
  const activeSectionIdRef = useRef(activeSectionId);
  useEffect(() => {
    activeSectionIdRef.current = activeSectionId;
  }, [activeSectionId]);


  const [activePresetId, setActivePresetIdState] = useState<string | null>(null);
  const setActivePresetId: Dispatch<SetStateAction<string | null>> = (value) => {
    setActivePresetIdState(value);
  };


  const [isPlaying, setIsPlaying] = useState(false);
  
  const [userPreferredLooping, setUserPreferredLoopingState] = useState(false);
  const isLooping = sectionsRef.current.length === 0 ? true : userPreferredLooping;
  const setUserPreferredLooping: Dispatch<SetStateAction<boolean>> = (value) => {
    if (sectionsRef.current.length > 0) {
      setUserPreferredLoopingState(value);
    }
  };


  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [currentSubdivisionTick, setCurrentSubdivisionTick] = useState(0);
  
  const [selectedSoundSetId, setSelectedSoundSetId] = useState<string>(DEFAULT_SOUND_SET_ID);
  const [selectedPrecountSoundSetId, setSelectedPrecountSoundSetId] = useState<string>(DEFAULT_PRECOUNT_SOUND_SET_ID);

  const [isPrecountEnabled, setIsPrecountEnabled] = useState<boolean>(false); 
  const [precountBars, setPrecountBars] = useState<number>(1);
  const [isCurrentlyPrecounting, setIsCurrentlyPrecounting] = useState<boolean>(false);
  const [precountProgress, setPrecountProgress] = useState<PrecountProgress>({ bar: 0, beat: 0, tick: 0 });
  const [precountTargetSectionId, setPrecountTargetSectionId] = useState<string | null>(null);

  const [defaultPlaybackSettings, setDefaultPlaybackSettingsState] = useState<DefaultPlaybackSettings>(initialDefaultPlaybackSettings);
  const defaultPlaybackSettingsRef = useRef(defaultPlaybackSettings);
   useEffect(() => {
    defaultPlaybackSettingsRef.current = defaultPlaybackSettings;
  }, [defaultPlaybackSettings]);
  
  const { toast } = useToast();

  const firstSection = sectionsRef.current.length > 0 ? sectionsRef.current[0] : undefined;
  const firstSectionRef = useRef(firstSection);
   useEffect(() => {
    firstSectionRef.current = sectionsRef.current.length > 0 ? sectionsRef.current[0] : undefined;
  }, [sections]);

  const resetToFlowDefaults = useCallback(() => {
    setIsPlaying(false);
    
    const defaultSectionId = uuidv4();
    const defaultSection: TempoSection = {
      id: defaultSectionId,
      name: "Section 1",
      tempo: DEFAULT_TEMPO,
      endTempo: undefined,
      timeSignature: DEFAULT_TIME_SIGNATURE,
      subdivision: DEFAULT_SUBDIVISION,
      color: SECTION_COLORS[0],
      measures: DEFAULT_MEASURES, 
      accentedBeats: [0],
      isLoopable: false,
    };

    setSections([defaultSection]);
    setActiveSectionIdState(defaultSectionId); 
    setActivePresetIdState(null); 
    setDefaultPlaybackSettingsState(initialDefaultPlaybackSettings);

    setCurrentBeat(0);
    setCurrentMeasure(0);
    setCurrentSubdivisionTick(0);
    setUserPreferredLoopingState(false);
    
    setIsPrecountEnabled(false); 
    setPrecountBars(1);      
    setIsCurrentlyPrecounting(false);
    setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
    setPrecountTargetSectionId(null);
    toast({
      title: "New Flow Created",
      description: "Workspace reset to default flow.",
      duration: 3000,
    });
  }, [toast]);


  const setActiveSectionId: Dispatch<SetStateAction<string | null>> = useCallback((newActiveId) => {
    setActiveSectionIdState(newActiveId);
  }, []);

  const setDefaultPlaybackSettings: Dispatch<SetStateAction<DefaultPlaybackSettings>> = (value) => {
    setActivePresetId(null); 
    setDefaultPlaybackSettingsState(value);
  };


  const resetPlaybackPosition = useCallback((sectionIdToActivate?: string | null) => {
    setCurrentBeat(0);
    setCurrentMeasure(0);
    setCurrentSubdivisionTick(0);
    
    setIsCurrentlyPrecounting(false); 
    setPrecountProgress({ bar: 0, beat: 0, tick: 0 });
    setPrecountTargetSectionId(null); 

    const currentSections = sectionsRef.current;

    if (sectionIdToActivate === null || (sectionIdToActivate === undefined && currentSections.length === 0)) {
      setActiveSectionId(null); 
    } else if (currentSections.length > 0) {
      let idToSet = sectionIdToActivate;
      if (!idToSet || !currentSections.find(s => s.id === idToSet)) {
        idToSet = currentSections[0].id; 
      }
      setActiveSectionId(idToSet);
    } else { 
      setActiveSectionId(null);
    }
  }, [setActiveSectionId, setCurrentBeat, setCurrentMeasure, setCurrentSubdivisionTick, setIsCurrentlyPrecounting, setPrecountProgress, setPrecountTargetSectionId]); 

  useEffect(() => {
    let initialSetupDone = false;
    if (typeof window !== 'undefined') {
      const storedSections = localStorage.getItem('tempoFlowSections');
      if (storedSections) {
        try {
          const parsedSections = JSON.parse(storedSections);
          if (Array.isArray(parsedSections) && parsedSections.length > 0) {
            setSections(parsedSections);
            if (parsedSections[0]?.id) {
               setActiveSectionIdState(parsedSections[0].id);
            }
            initialSetupDone = true;
          }
        } catch (e) {
          console.error("Failed to parse sections from localStorage", e);
          localStorage.removeItem('tempoFlowSections');
        }
      }
      
      const storedDefaultSettings = localStorage.getItem('tempoFlowDefaultPlaybackSettings');
      if (storedDefaultSettings) {
        try {
          setDefaultPlaybackSettingsState(JSON.parse(storedDefaultSettings));
        } catch (e) {
          console.error("Failed to parse default playback settings from localStorage", e);
          localStorage.removeItem('tempoFlowDefaultPlaybackSettings');
          setDefaultPlaybackSettingsState(initialDefaultPlaybackSettings); 
        }
      } else {
         if (!initialSetupDone) {
            setDefaultPlaybackSettingsState(initialDefaultPlaybackSettings);
         }
      }

      if (!initialSetupDone) { 
        resetToFlowDefaults();
      }
      
      const storedPresets = localStorage.getItem('tempoFlowPresets');
      if (storedPresets) setPresets(JSON.parse(storedPresets));
      const storedFolders = localStorage.getItem('tempoFlowFolders');
      if (storedFolders) setFolders(JSON.parse(storedFolders));
      
      const storedSoundSetId = localStorage.getItem('tempoFlowSoundSetId');
      if (storedSoundSetId && SOUND_SETS.find(s => s.id === storedSoundSetId)) setSelectedSoundSetId(storedSoundSetId);
      else setSelectedSoundSetId(DEFAULT_SOUND_SET_ID);

      const storedPrecountSoundSetId = localStorage.getItem('tempoFlowPrecountSoundSetId');
      if (storedPrecountSoundSetId && PRECOUNT_SOUND_SETS.find(s => s.id === storedPrecountSoundSetId)) setSelectedPrecountSoundSetId(storedPrecountSoundSetId);
      else setSelectedPrecountSoundSetId(DEFAULT_PRECOUNT_SOUND_SET_ID);


      const storedPrecountEnabled = localStorage.getItem('tempoFlowPrecountEnabled');
      setIsPrecountEnabled(storedPrecountEnabled === 'true'); 
      const storedPrecountBars = localStorage.getItem('tempoFlowPrecountBars');
      if (storedPrecountBars) setPrecountBars(parseInt(storedPrecountBars, 10));
      
      const storedUserLooping = localStorage.getItem('tempoFlowUserPreferredLooping');
      setUserPreferredLoopingState(storedUserLooping === 'true');

      const storedActivePresetId = localStorage.getItem('tempoFlowActivePresetId_temp'); 
      if (storedActivePresetId && presets.find(p => p.id === storedActivePresetId)) { // Check if preset still exists
         setActivePresetIdState(storedActivePresetId);
      } else {
        localStorage.removeItem('tempoFlowActivePresetId_temp'); // Clean up if preset no longer exists
        setActivePresetIdState(null);
      }


    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // resetToFlowDefaults removed from deps to prevent re-running on every definition change


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sections.length > 0) {
        if (!activeSectionId || !sections.find(s => s.id === activeSectionId)) {
          setActiveSectionIdState(sections[0].id);
        }
      } else { 
          if (activeSectionId !== null) { 
            setActiveSectionIdState(null); 
          }
      }
    }
  }, [sections, activeSectionId]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowSections', JSON.stringify(sections));
    }
  }, [sections]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowDefaultPlaybackSettings', JSON.stringify(defaultPlaybackSettings));
    }
  }, [defaultPlaybackSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowPresets', JSON.stringify(presets));
    }
  }, [presets]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowFolders', JSON.stringify(folders));
    }
  }, [folders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowSoundSetId', selectedSoundSetId);
    }
  }, [selectedSoundSetId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowPrecountSoundSetId', selectedPrecountSoundSetId);
    }
  }, [selectedPrecountSoundSetId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowPrecountEnabled', String(isPrecountEnabled));
    }
  }, [isPrecountEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowPrecountBars', String(precountBars));
    }
  }, [precountBars]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tempoFlowUserPreferredLooping', String(userPreferredLooping));
    }
  }, [userPreferredLooping]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if(activePresetId) {
        localStorage.setItem('tempoFlowActivePresetId_temp', activePresetId);
      } else {
        localStorage.removeItem('tempoFlowActivePresetId_temp');
      }
    }
  }, [activePresetId]);


  const addSection = useCallback((section?: Partial<TempoSection>) => {
    const wasInDefaultModeOrEmpty = sectionsRef.current.length === 0;
    const currentDefaultSettings = defaultPlaybackSettingsRef.current;
    const currentSectionsCount = sectionsRef.current.length;
    
    if (wasInDefaultModeOrEmpty && isPlaying) {
        setIsPlaying(false); 
        // No need to call resetPlaybackPosition here, as setActiveSectionIdState will trigger UI update
    }
    setActivePresetIdState(null); 

    const newSection: TempoSection = {
      id: uuidv4(),
      name: section?.name || `Section ${currentSectionsCount + 1}`,
      tempo: section?.tempo ?? currentDefaultSettings.tempo ?? DEFAULT_TEMPO,
      endTempo: section?.hasOwnProperty('endTempo') 
                ? (section.endTempo === '' || section.endTempo === null || section.endTempo === undefined ? undefined : Number(section.endTempo)) 
                : (currentDefaultSettings.hasOwnProperty('endTempo') ? (currentDefaultSettings.endTempo === '' || currentDefaultSettings.endTempo === null || currentDefaultSettings.endTempo === undefined ? undefined : Number(currentDefaultSettings.endTempo)) : undefined),
      timeSignature: section?.timeSignature ?? currentDefaultSettings.timeSignature ?? DEFAULT_TIME_SIGNATURE,
      subdivision: section?.subdivision ?? currentDefaultSettings.subdivision ?? DEFAULT_SUBDIVISION,
      color: section?.color || SECTION_COLORS[currentSectionsCount % SECTION_COLORS.length],
      measures: section?.measures || DEFAULT_MEASURES,
      accentedBeats: section?.accentedBeats ?? (currentDefaultSettings.accentedBeats || [0]),
      isLoopable: section?.isLoopable ?? false,
    };
    
    setSections(prev => {
      const newSectionsArray = [...prev, newSection];
      if ((wasInDefaultModeOrEmpty && newSectionsArray.length > 0) || (!activeSectionIdRef.current && newSectionsArray.length === 1) ) {
         setActiveSectionIdState(newSection.id);
      }
      return newSectionsArray;
    });
  }, [isPlaying]);

  const updateSection = (id: string, updates: Partial<TempoSection>) => {
    setSections(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s);
      return updated;
    });
    setActivePresetIdState(null); 
  };

  const deleteSection = (id: string) => {
    setSections(prevSections => {
      const newSections = prevSections.filter(s => s.id !== id);
      if (id === activeSectionIdRef.current) {
        setIsPlaying(false); 
        if (newSections.length > 0) {
          const oldIndex = prevSections.findIndex(sec => sec.id === id);
          const newActiveIndex = Math.max(0, Math.min(oldIndex, newSections.length - 1));
          setActiveSectionIdState(newSections[newActiveIndex]?.id || null);
          // resetPlaybackPosition is handled by activeSectionId change effect
        } else {
           resetToFlowDefaults(); // Resets to default flow with one section
        }
      }
       // If deleting the last section transitions to "no sections" mode, resetToFlowDefaults handles it.
       // If sections still exist, the activeSectionId effect will handle setting a new active ID.
      if (newSections.length === 0 && prevSections.length > 0) { 
         resetToFlowDefaults();
      }
      return newSections;
    });
    setActivePresetIdState(null); 
  };


  const reorderSections = (startIndex: number, endIndex: number) => {
    setSections(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
    setActivePresetIdState(null); 
  };

  const savePreset = (name: string, folderId?: string, description?: string): string | undefined => {
    let sectionsToSave: TempoSection[];
    const now = Date.now();
    const currentSectionsVal = sectionsRef.current;
    const currentDefaultSettingsVal = defaultPlaybackSettingsRef.current;

    if (currentSectionsVal.length === 0) {
        sectionsToSave = [{
            id: uuidv4(), 
            name: "Section 1", 
            tempo: currentDefaultSettingsVal.tempo,
            endTempo: currentDefaultSettingsVal.endTempo,
            timeSignature: currentDefaultSettingsVal.timeSignature,
            subdivision: currentDefaultSettingsVal.subdivision,
            color: SECTION_COLORS[0], 
            measures: DEFAULT_MEASURES, 
            accentedBeats: currentDefaultSettingsVal.accentedBeats || [0],
            isLoopable: false,
        }];
    } else {
        sectionsToSave = JSON.parse(JSON.stringify(currentSectionsVal.map(s => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { createdAt, updatedAt, ...rest } = s; // Omit previous timestamps
          return rest;
        }))); 
    }

    if (sectionsToSave.length === 0) return undefined; // Should not happen due to above logic

    const newPreset: Preset = { 
      id: uuidv4(), 
      name, 
      sections: sectionsToSave, 
      folderId: folderId,
      description: description || '',
      createdAt: now,
      updatedAt: now,
    }; 
    setPresets(prev => [...prev, newPreset]);
    setActivePresetIdState(newPreset.id); 
    return newPreset.id;
  };

  const loadPreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      const newSections = preset.sections.map(s => {
        let migratedTimeSignature: TempoSection['timeSignature'] = String(s.timeSignature) as TimeSignature; 
        if (!TIME_SIGNATURES.includes(migratedTimeSignature as TimeSignature)) {
            const parts = String(s.timeSignature).split('/');
            if (parts.length > 0 && TIME_SIGNATURES.includes(parts[0] as TimeSignature)) {
                migratedTimeSignature = parts[0] as TimeSignature;
            } else {
                 migratedTimeSignature = DEFAULT_TIME_SIGNATURE;
            }
        }

        return {
          ...s, 
          id: uuidv4(), 
          endTempo: s.endTempo || undefined,
          timeSignature: migratedTimeSignature,
          accentedBeats: s.accentedBeats || [0],
          isLoopable: s.isLoopable || false, 
        };
      });
      setSections(newSections);
      setActivePresetIdState(preset.id); 
      setIsPlaying(false);
      if (newSections.length > 0) {
        // setActiveSectionIdState will be handled by the useEffect watching sections and activeSectionId
        // resetPlaybackPosition(newSections[0].id);
        setActiveSectionIdState(newSections[0].id);
        setCurrentBeat(0); setCurrentMeasure(0); setCurrentSubdivisionTick(0);
      } else {
        resetToFlowDefaults();
      }
    }
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (id === activePresetIdRef.current) { // Use ref for current value
      setActivePresetIdState(null); 
    }
  };
  
  const updatePresetMetadata = (presetId: string, updates: { name?: string; description?: string }) => {
    setPresets(prevPresets =>
      prevPresets.map(p =>
        p.id === presetId
          ? { ...p, ...updates, updatedAt: Date.now() }
          : p
      )
    );
  };

  const importPresets = (newPresets: Preset[]) => {
    const validPresets = newPresets.filter(p => p.id && p.name && Array.isArray(p.sections));
    setPresets(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNewPresets = validPresets.filter(p => !existingIds.has(p.id));
      const processedNewPresets = uniqueNewPresets.map(p => {
        const now = Date.now();
        const migratedSections = p.sections.map(s => {
          let migratedTimeSignature: TempoSection['timeSignature'] = String(s.timeSignature) as TimeSignature;
           if (!TIME_SIGNATURES.includes(migratedTimeSignature as TimeSignature)) {
              const parts = String(s.timeSignature).split('/');
              if (parts.length > 0 && TIME_SIGNATURES.includes(parts[0] as TimeSignature)) {
                  migratedTimeSignature = parts[0] as TimeSignature;
              } else {
                  migratedTimeSignature = DEFAULT_TIME_SIGNATURE;
              }
          }
          return {
            ...s,
            id: uuidv4(), 
            endTempo: s.endTempo || undefined,
            timeSignature: migratedTimeSignature,
            accentedBeats: s.accentedBeats || [0],
            isLoopable: s.isLoopable || false,
          };
        });
        return {
          ...p,
          sections: migratedSections,
          folderId: undefined, 
          description: p.description || '',
          createdAt: p.createdAt || now,
          updatedAt: p.updatedAt || now,
        }
      });
      return [...prev, ...processedNewPresets];
    });
  };

  const addFolder = (name: string): string => {
    const newFolderId = uuidv4();
    const newFolder: Folder = { id: newFolderId, name };
    setFolders(prev => [...prev, newFolder]);
    return newFolderId;
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setPresets(prevPresets => 
      prevPresets.map(p => 
        p.folderId === id ? { ...p, folderId: undefined, updatedAt: Date.now() } : p
      )
    );
  };


  return (
    <TempoFlowContext.Provider value={{
      sections, setSections, addSection, updateSection, deleteSection, reorderSections,
      presets, setPresets, savePreset, loadPreset, deletePreset, importPresets, updatePresetMetadata,
      folders, setFolders, addFolder, deleteFolder,
      activeSectionId, setActiveSectionId,
      activePresetId, setActivePresetId, 
      isPlaying, setIsPlaying,
      userPreferredLooping, isLooping, setUserPreferredLooping,
      currentBeat, setCurrentBeat,
      currentMeasure, setCurrentMeasure,
      currentSubdivisionTick, setCurrentSubdivisionTick,
      resetPlaybackPosition,
      selectedSoundSetId, setSelectedSoundSetId,
      selectedPrecountSoundSetId, setSelectedPrecountSoundSetId,
      isPrecountEnabled, setIsPrecountEnabled,
      precountBars, setPrecountBars,
      isCurrentlyPrecounting, setIsCurrentlyPrecounting,
      precountProgress, setPrecountProgress,
      precountTargetSectionId, setPrecountTargetSectionId,
      defaultPlaybackSettings, setDefaultPlaybackSettings,
      resetToFlowDefaults,
      firstSection: firstSectionRef.current
    }}>
      {children}
    </TempoFlowContext.Provider>
  );
};

export const useTempoFlow = () => {
  const context = useContext(TempoFlowContext);
  if (context === undefined) {
    throw new Error('useTempoFlow must be used within a TempoFlowProvider');
  }
  return context;
};

// Helper to ensure context is properly initialized on client
export const useSafeTempoFlow = () => {
  const context = useContext(TempoFlowContext);
  if (context === undefined) {
    // This can happen during SSR or if provider is missing.
    // Return a default structure that won't break consumers.
    console.warn('TempoFlowContext is undefined. This might happen during SSR or if the provider is missing.');
     return {
      sections: [], setSections: () => {}, addSection: () => {}, updateSection: () => {}, deleteSection: () => {}, reorderSections: () => {},
      presets: [], setPresets: () => {}, savePreset: () => undefined, loadPreset: () => {}, deletePreset: () => {}, importPresets: () => {}, updatePresetMetadata: () => {},
      folders: [], setFolders: () => {}, addFolder: () => '', deleteFolder: () => {},
      activeSectionId: null, setActiveSectionId: () => {},
      activePresetId: null, setActivePresetId: () => {},
      isPlaying: false, setIsPlaying: () => {},
      userPreferredLooping: false, isLooping: false, setUserPreferredLooping: () => {},
      currentBeat: 0, setCurrentBeat: () => {},
      currentMeasure: 0, setCurrentMeasure: () => {},
      currentSubdivisionTick: 0, setCurrentSubdivisionTick: () => {},
      resetPlaybackPosition: () => {},
      selectedSoundSetId: DEFAULT_SOUND_SET_ID, setSelectedSoundSetId: () => {},
      selectedPrecountSoundSetId: DEFAULT_PRECOUNT_SOUND_SET_ID, setSelectedPrecountSoundSetId: () => {},
      isPrecountEnabled: false, setIsPrecountEnabled: () => {},
      precountBars: 1, setPrecountBars: () => {},
      isCurrentlyPrecounting: false, setIsCurrentlyPrecounting: () => {},
      precountProgress: { bar: 0, beat: 0, tick: 0 }, setPrecountProgress: () => {},
      precountTargetSectionId: null, setPrecountTargetSectionId: () => {},
      defaultPlaybackSettings: initialDefaultPlaybackSettings, setDefaultPlaybackSettings: () => {},
      resetToFlowDefaults: () => {},
      firstSection: undefined,
    } as unknown as TempoFlowContextType; // Cast to assure TypeScript this is the expected type
  }
  return context;
};

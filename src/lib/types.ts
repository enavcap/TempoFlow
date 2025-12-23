
export type TimeSignature = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";
export type Subdivision = "Quarter" | "Eighth" | "Triplet" | "Sixteenth";

export interface TempoSection {
  id: string;
  name: string;
  tempo: number; // Start BPM
  endTempo?: number; // Optional End BPM for transitions
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  color: string; // hex color string
  measures: number; // Number of measures for this section
  accentedBeats?: number[]; // Optional: Array of 0-indexed beat numbers to accent
  isLoopable?: boolean; // Optional: Whether this specific section should loop
}

export interface Preset {
  id: string;
  name: string;
  sections: TempoSection[];
  folderId?: string; // Optional: ID of the folder this preset belongs to
  description?: string;
  createdAt?: number; // Timestamp
  updatedAt?: number; // Timestamp
}

export interface Folder {
  id: string;
  name: string;
}

// Defines the parameters for a single metronome sound (accent, beat, or sub)
export interface SoundParameters {
  frequency: number;
  gain: number;
  type: OscillatorType; // 'sine', 'square', 'sawtooth', 'triangle'
}

// Defines a complete sound set for the metronome
export interface SoundSet {
  id: string;
  name: string;
  accent: SoundParameters;
  beat: SoundParameters;
  sub: SoundParameters;
}

export interface TempoMarkingDefinition {
  name: string;
  minBPM: number;
  maxBPM: number;
}

export interface DefaultPlaybackSettings {
  tempo: number;
  endTempo?: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
  accentedBeats: number[];
}

export interface PrecountProgress {
  bar: number;
  beat: number;
  tick: number;
}

export interface TempoFlowContextType {
  sections: TempoSection[];
  setSections: Dispatch<SetStateAction<TempoSection[]>>;
  addSection: (section?: Partial<TempoSection>) => void;
  updateSection: (id: string, updates: Partial<TempoSection>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  
  presets: Preset[];
  setPresets: Dispatch<SetStateAction<Preset[]>>;
  savePreset: (name: string, folderId?: string, description?: string) => string | undefined; // Returns preset ID
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  importPresets: (newPresets: Preset[]) => void;
  updatePresetMetadata: (presetId: string, updates: { name?: string; description?: string }) => void;


  folders: Folder[];
  setFolders: Dispatch<SetStateAction<Folder[]>>;
  addFolder: (name: string) => string; 
  deleteFolder: (id: string) => void; 

  activeSectionId: string | null;
  setActiveSectionId: Dispatch<SetStateAction<string | null>>;
  activePresetId: string | null; // New
  setActivePresetId: Dispatch<SetStateAction<string | null>>; // New


  isPlaying: boolean;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  
  userPreferredLooping: boolean; 
  isLooping: boolean; 
  setUserPreferredLooping: Dispatch<SetStateAction<boolean>>; 

  currentBeat: number; 
  setCurrentBeat: Dispatch<SetStateAction<number>>;
  currentMeasure: number; 
  setCurrentMeasure: Dispatch<SetStateAction<number>>;
  currentSubdivisionTick: number;
  setCurrentSubdivisionTick: Dispatch<SetStateAction<number>>;
  resetPlaybackPosition: (sectionIdToActivate?: string | null) => void; 
  
  selectedSoundSetId: string;
  setSelectedSoundSetId: Dispatch<SetStateAction<string>>;
  selectedPrecountSoundSetId: string;
  setSelectedPrecountSoundSetId: Dispatch<SetStateAction<string>>;

  isPrecountEnabled: boolean;
  setIsPrecountEnabled: Dispatch<SetStateAction<boolean>>;
  precountBars: number; 
  setPrecountBars: Dispatch<SetStateAction<number>>;
  isCurrentlyPrecounting: boolean;
  setIsCurrentlyPrecounting: Dispatch<SetStateAction<boolean>>;
  precountProgress: PrecountProgress;
  setPrecountProgress: Dispatch<SetStateAction<PrecountProgress>>;
  precountTargetSectionId: string | null; 
  setPrecountTargetSectionId: Dispatch<SetStateAction<string | null>>;

  defaultPlaybackSettings: DefaultPlaybackSettings;
  setDefaultPlaybackSettings: Dispatch<SetStateAction<DefaultPlaybackSettings>>;
  resetToFlowDefaults: () => void;
  firstSection?: TempoSection;
}

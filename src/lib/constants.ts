
import type { TimeSignature, Subdivision, SoundSet, TempoMarkingDefinition } from './types';

export const DEFAULT_TEMPO = 120;
export const DEFAULT_TIME_SIGNATURE: TimeSignature = "4";
export const DEFAULT_SUBDIVISION: Subdivision = "Quarter";
export const DEFAULT_MEASURES = 4;

export const TIME_SIGNATURES: TimeSignature[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const SUBDIVISIONS: Subdivision[] = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

export const SECTION_COLORS = [
  "#FF6B6B", // Light Red
  "#4ECDC4", // Turquoise
  "#45B7D1", // Sky Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Light Teal
  "#F7D794", // Light Yellow
  "#77DD77", // Pastel Green
  "#87CEEB", // Sky Blue (alternative)
  "#F4A460", // Sandy Brown
  "#FFDAB9", // Peach Puff
];

export const SUBDIVISION_MULTIPLIERS: Record<Subdivision, number> = {
  "Quarter": 1,
  "Eighth": 2,
  "Triplet": 3,
  "Sixteenth": 4,
};

export const SOUND_SETS: SoundSet[] = [
  {
    id: 'classic',
    name: 'Classic Tones',
    accent: { frequency: 880, gain: 0.6, type: 'sine' },
    beat: { frequency: 523.25, gain: 0.4, type: 'sine' },
    sub: { frequency: 349.23, gain: 0.28, type: 'sine' },
  },
  {
    id: 'digital',
    name: 'Digital Beeps',
    accent: { frequency: 1200, gain: 0.48, type: 'square' },
    beat: { frequency: 800, gain: 0.36, type: 'square' },
    sub: { frequency: 600, gain: 0.24, type: 'square' },
  },
  {
    id: 'wooden',
    name: 'Wooden Blocks',
    accent: { frequency: 600, gain: 0.7, type: 'triangle' },
    beat: { frequency: 400, gain: 0.5, type: 'triangle' },
    sub: { frequency: 300, gain: 0.3, type: 'triangle' },
  },
  {
    id: 'high_click',
    name: 'High Click',
    accent: { frequency: 1500, gain: 0.4, type: 'triangle' },
    beat: { frequency: 1000, gain: 0.32, type: 'triangle' },
    sub: { frequency: 800, gain: 0.2, type: 'triangle' },
  },
  {
    id: 'mellow_sine',
    name: 'Mellow Sine',
    accent: { frequency: 440, gain: 0.48, type: 'sine' },
    beat: { frequency: 330, gain: 0.36, type: 'sine' },
    sub: { frequency: 220, gain: 0.24, type: 'sine' },
  }
];
export const DEFAULT_SOUND_SET_ID = SOUND_SETS[1].id; // Digital Beeps

export const PRECOUNT_SOUND_SETS: SoundSet[] = [
  {
    id: 'default_precount',
    name: 'Default Precount Tones',
    accent: { frequency: 1000, gain: 0.4, type: 'triangle' as OscillatorType },
    beat: { frequency: 750, gain: 0.32, type: 'triangle' as OscillatorType },
    sub: { frequency: 500, gain: 0.2, type: 'triangle' as OscillatorType },
  },
  {
    id: 'sharp_precount',
    name: 'Sharp Precount Click',
    accent: { frequency: 1500, gain: 0.36, type: 'square' as OscillatorType },
    beat: { frequency: 1200, gain: 0.30, type: 'square' as OscillatorType },
    sub: { frequency: 1000, gain: 0.16, type: 'square' as OscillatorType },
  },
  {
    id: 'soft_precount_blip',
    name: 'Soft Precount Blip',
    accent: { frequency: 600, gain: 0.3, type: 'sine' as OscillatorType },
    beat: { frequency: 450, gain: 0.24, type: 'sine' as OscillatorType },
    sub: { frequency: 300, gain: 0.14, type: 'sine' as OscillatorType },
  },
];
export const DEFAULT_PRECOUNT_SOUND_SET_ID = PRECOUNT_SOUND_SETS[0].id;

export const TEMPO_MARKINGS: TempoMarkingDefinition[] = [
  { name: 'Grave', minBPM: 20, maxBPM: 39 },
  { name: 'Largo', minBPM: 40, maxBPM: 59 },
  { name: 'Lento', minBPM: 60, maxBPM: 65 },
  { name: 'Adagio', minBPM: 66, maxBPM: 75 },
  { name: 'Andante', minBPM: 76, maxBPM: 107 },
  { name: 'Moderato', minBPM: 108, maxBPM: 119 },
  { name: 'Allegro', minBPM: 120, maxBPM: 155 },
  { name: 'Vivace', minBPM: 156, maxBPM: 175 },
  { name: 'Presto', minBPM: 176, maxBPM: 200 },
];

export function getTempoMarking(bpm: number): string {
  const marking = TEMPO_MARKINGS.find(m => bpm >= m.minBPM && bpm <= m.maxBPM);
  return marking ? marking.name : '';
}

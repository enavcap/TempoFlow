# Tempo Flow - Features

## Overview
Tempo Flow is a progressive web app (PWA) and Android mobile metronome designed for musicians who need to practice complex tempo changes, multiple time signatures, and custom practice sequences.

## Core Features

### 🎵 Advanced Metronome
- **Variable Tempo**: Set any tempo from 20-300 BPM
- **Tempo Ramps**: Gradual tempo transitions within sections (e.g., 60 → 120 BPM)
- **Multiple Time Signatures**: Support for 1-12 beats per measure
- **Subdivisions**: Quarter notes, Eighth notes, Triplets, and Sixteenth notes
- **Custom Accents**: Click any beat in the visualizer to toggle accent emphasis
- **Visual Beat Indicator**: Large, clear display with color-coded beat visualization

### 📋 Section Management
- **Multi-Section Sequences**: Create unlimited tempo sections in a flow
- **Drag-to-Reorder**: Intuitive drag-and-drop section reordering
- **Swipe-to-Delete**: Quick section removal with horizontal swipe gesture
- **Section Looping**: Individual sections can loop independently
- **Global Loop**: Loop entire sequence or play through once
- **Auto-Scroll**: Active section automatically scrolls into view during playback
- **Color Coding**: 12 distinct colors for visual organization

### ⏱️ Precount System
- **Configurable Precount**: 0, 1, or 2 bars before playback starts
- **Click-to-Cycle**: Simple button click cycles through precount options
- **Visual Indicator**: Clear display shows current precount setting
- **Separate Sound Set**: Dedicated precount audio profile

### 🎨 Customization

#### Sound Sets
- **Metronome Sounds**:
  - Classic (traditional metronome)
  - Woodblock (warm wooden tone)
  - Digital (electronic beep)
  - Soft (gentle clicks)
- **Precount Sounds**:
  - Standard
  - Cowbell
  - Sticks
  - Voice Count

#### Visual Themes
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for low-light practice
- **Auto-switching**: Follows system preferences

#### Haptic Feedback (Mobile)
- **Vibration Mode**: Tactile feedback on each beat
- **Configurable**: Enable/disable in options

### 💾 Preset Library
- **Save Flows**: Store complete sequences with custom names
- **Folder Organization**: Group presets into folders
- **Quick Load**: One-tap preset loading
- **Import/Export**: JSON-based preset sharing
- **Metadata**: Add descriptions and timestamps to presets

### 🎯 Gesture Controls
- **Tempo Adjustment**: Long-press tempo display and swipe up/down
- **Beat Selection**: Long-press beats display and swipe up/down
- **Subdivision Change**: Long-press subdivision and swipe up/down (or tap for list)
- **Volume Control**: Long-press volume button and swipe up/down
- **Beat Accent Toggle**: Tap individual beats in visualizer
- **Section Reorder**: Drag sections in the list
- **Section Delete**: Swipe section right to reveal delete

### 📱 Mobile Optimized
- **Touch-First Design**: All controls optimized for touch interaction
- **Responsive Layout**: Adapts to all screen sizes
- **PWA Support**: Install as standalone app
- **Android APK**: Native Android build available
- **Offline Capable**: Works without internet connection
- **No Sticky Hover**: Touch interactions don't leave elements highlighted

### 🎼 Playback Features
- **Real-Time Editing**: Change tempo, beats, subdivision during playback
- **Precise Timing**: Drift-compensated timing loop for accuracy
- **Section Transitions**: Smooth automatic progression through sections
- **Stop & Reset**: Returns to first section and scrolls to top
- **Visual Feedback**: Active section highlighting and beat animation
- **Audio Scheduling**: Lookahead scheduling prevents audio glitches

### 🔧 Developer Features
- **Debug Overlay**: Toggle detailed timing and state information
- **Event Logging**: Custom events for debugging timing issues
- **Type Safety**: Full TypeScript implementation
- **Local Storage**: Automatic persistence of all settings and presets

## Technical Specifications

### Platform
- **Framework**: Next.js 15.2.3 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Audio**: Web Audio API
- **Mobile**: Capacitor for Android builds

### Performance
- **Timing Accuracy**: ±2ms typical drift compensation
- **Audio Latency**: 50ms lookahead scheduling
- **First Beat Buffer**: 50ms initialization delay for stability
- **Update Rate**: 60fps visual updates

### Storage
- **Local Storage**: All settings, sections, and presets
- **Export Format**: JSON for preset sharing
- **Auto-Save**: Settings persist automatically on change

### Accessibility
- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with assistive technologies
- **Color Contrast**: WCAG compliant color schemes

## User Experience

### Onboarding
- **Interactive Tour**: Multi-step guided tutorial
- **Skip Option**: Can dismiss or skip tour
- **Repeatable**: Re-run tour from options menu
- **Contextual Help**: Tooltips on complex features

### Error Handling
- **Validation**: Real-time form validation with Zod
- **Error Messages**: Clear, actionable error descriptions
- **Graceful Degradation**: Falls back to defaults on corrupt data
- **Audio Recovery**: Automatic audio context resume on interaction

### Performance Optimizations
- **State Refs**: Critical timing uses refs to avoid re-renders
- **Memoization**: Expensive calculations cached
- **Lazy Loading**: Components loaded on demand
- **Debouncing**: Drag operations debounced to prevent flicker
- **Transition Management**: React transitions for smooth updates

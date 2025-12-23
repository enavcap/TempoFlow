# Tempo Flow - Bug Tracker

## 🐛 Known Issues

### 🔴 Critical
*No critical bugs currently tracked*

---

### 🟡 High Priority
*No high priority bugs currently tracked*

---

### 🟢 Medium Priority
*No medium priority bugs currently tracked*

---

### 🔵 Low Priority / Enhancement Requests
*No low priority bugs currently tracked*

---

## ✅ Recently Fixed

### 2025-11-27
- **[FIXED]** Multi-bar sections only playing sound on first bar
  - **Issue**: Sections with multiple measures (bars) with only 1 beat were only producing sound on the first bar
  - **Cause**: Audio deduplication logic used `bar: undefined` for regular playback, treating all measures as identical
  - **Fix**: Added `currentMeasure` parameter to `useMetronomeAudio` hook to track each bar distinctly
  - **Files**: `src/hooks/useMetronomeAudio.ts`, `src/components/playback-controls.tsx`

- **[FIXED]** Precount triggering during active playback
  - **Issue**: Clicking precount button during section playback would queue and start precount mid-section
  - **Cause**: `handlePrecountToggle` was queuing pending precount starts during active playback
  - **Fix**: Removed pending precount queue logic during playback - changes only apply on next play press
  - **Files**: `src/components/playback-controls.tsx`

- **[FIXED]** Sticky hover states on mobile touch devices
  - **Issue**: Buttons remained highlighted after touch release until another screen area was tapped
  - **Cause**: Mobile browsers applying hover states on touch events
  - **Fix**: Added `@media (hover: none)` CSS rule to disable hover effects on touch devices, only show active state during touch
  - **Files**: `src/app/globals.css`

- **[FIXED]** Stop button not scrolling to top of section list
  - **Issue**: Clicking stop reset playback position but didn't scroll the list to show the first section
  - **Cause**: ScrollArea component viewport not being scrolled programmatically
  - **Fix**: Added `scrollViewportRef` to access ScrollArea viewport, scroll to top when stopped with first section active
  - **Files**: `src/components/tempo-section-list.tsx`, `src/components/ui/scroll-area.tsx`, `src/components/playback-controls.tsx`

- **[FIXED]** First beat timing issues on app boot
  - **Issue**: Tempo flickering and timing inaccuracy on the very first playback after opening the app
  - **Cause**: Audio context and React state not fully initialized before first tick calculation
  - **Fix**: Added 50ms initialization buffer to first tick, ensured audio context fully resumed with 10ms delay before playback start
  - **Files**: `src/components/playback-controls.tsx`

---

## 📝 Bug Report Template

When reporting a new bug, please include:

```markdown
### [Priority] Brief Description

**Environment:**
- Platform: [Web/Android/iOS]
- Browser/Version: [Chrome 120, Safari 17, etc.]
- Device: [Desktop/Mobile - Model]
- App Version: [0.1.0]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Videos:**
(if applicable)

**Console Errors:**
(check browser console if on web)

**Additional Context:**
```

---

## 🔍 Testing Checklist

### Core Functionality
- [ ] Metronome plays at correct tempo
- [ ] Beat visualization matches audio
- [ ] Subdivisions work correctly
- [ ] Accent beats play louder
- [ ] Precount functions properly

### Section Management
- [ ] Can create new sections
- [ ] Can edit existing sections
- [ ] Can delete sections (swipe)
- [ ] Can reorder sections (drag)
- [ ] Sections play in correct order
- [ ] Loop settings respected

### Preset System
- [ ] Can save presets
- [ ] Can load presets
- [ ] Can organize in folders
- [ ] Can import/export JSON
- [ ] Preset metadata saved correctly

### Gestures
- [ ] Tempo swipe gesture works
- [ ] Beat swipe gesture works
- [ ] Subdivision swipe gesture works
- [ ] Volume swipe gesture works
- [ ] Beat accent tap works
- [ ] No interference between gestures

### Mobile Specific
- [ ] Touch interactions smooth
- [ ] No sticky hover states
- [ ] Haptic feedback works (if enabled)
- [ ] Swipe-to-delete doesn't interfere with scroll
- [ ] App installs as PWA
- [ ] Offline functionality works

### Timing & Audio
- [ ] No drift over long sessions
- [ ] Tempo changes are smooth
- [ ] No audio glitches or pops
- [ ] First beat after boot is accurate
- [ ] Multi-bar sections maintain tempo

### UI/UX
- [ ] Responsive on all screen sizes
- [ ] Theme switching works
- [ ] Auto-scroll to active section
- [ ] Stop button resets to top
- [ ] Modal forms validate correctly
- [ ] Tour completes successfully

---

## 🚀 Future Enhancements

### Potential Features
- [ ] Custom sound samples upload
- [ ] MIDI output support
- [ ] Tap tempo functionality
- [ ] Polyrhythm support (multiple simultaneous tempos)
- [ ] Visual metronome (no sound, just visual)
- [ ] Practice statistics and tracking
- [ ] Cloud sync for presets
- [ ] Share presets via URL
- [ ] Audio file import for backing tracks
- [ ] Recording feature
- [ ] More time signatures (5/4, 7/8, etc.)
- [ ] Decimal BPM values
- [ ] Swing feel support
- [ ] Multiple subdivision layers simultaneously

### Platform Expansion
- [ ] iOS app
- [ ] Desktop apps (Electron)
- [ ] Web MIDI API integration
- [ ] Bluetooth MIDI support

---

## 📊 Performance Monitoring

### Metrics to Track
- **Timing Drift**: Maximum drift over 5-minute session
- **Audio Glitches**: Count of audio dropouts or pops
- **First Beat Latency**: Time from play press to first sound
- **UI Responsiveness**: Time to update after user interaction
- **Battery Impact**: Power consumption on mobile (Android vitals)
- **Memory Usage**: Heap size over extended sessions
- **Load Time**: Time to interactive on first load

### Testing Scenarios
1. **Endurance Test**: 30-minute continuous playback at 120 BPM
2. **Complex Sequence**: 10+ sections with different time signatures
3. **Rapid Changes**: Change tempo/beats/subdivision during playback every 5 seconds
4. **Stress Test**: Maximum tempo (300 BPM) with sixteenth note subdivisions
5. **Mobile Battery**: 1-hour playback on mobile device

---

## 📞 Contact

For bug reports or feature requests:
- Create an issue in the project repository
- Include detailed information using the bug report template above
- Attach screenshots/videos when possible
- Check if issue already exists before creating new one

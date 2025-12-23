# Tempo Flow

**A Progressive Web App (PWA) and Android Metronome for Musicians**

Version: 0.1.0  
Last Updated: November 27, 2025

---

## 📖 Documentation Index

- **[FEATURES.md](./FEATURES.md)** - Complete feature list and technical specifications
- **[BUG_TRACKER.md](./BUG_TRACKER.md)** - Known issues, fixes, and enhancement requests
- **[ALPHA_BUILD.md](./ALPHA_BUILD.md)** - Alpha build notes and testing information
- **[ANDROID_SETUP.md](./ANDROID_SETUP.md)** - Android build and deployment guide
- **[blueprint.md](./blueprint.md)** - Original project design and architecture

---

## 🎯 Project Overview

Tempo Flow is a sophisticated metronome application designed for musicians who need more than just a simple click track. It supports complex practice routines with multiple tempo sections, time signature changes, tempo ramps, and customizable accents.

### Key Differentiators
- **Section-Based Workflow**: Create sequences of different tempo/time signature sections
- **Gesture-First Interface**: Intuitive swipe and long-press controls
- **Real-Time Editing**: Change parameters while metronome is playing
- **Preset Management**: Save and organize complete practice sequences
- **Mobile-Optimized**: Touch-friendly design with haptic feedback

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.2.3 with React 19 and TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Audio**: Web Audio API with precision timing
- **Mobile**: Capacitor for native Android builds
- **State**: React Context API with localStorage persistence

### Project Structure
```
TempoFlow/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components (shadcn)
│   │   ├── beat-visualization.tsx
│   │   ├── playback-controls.tsx
│   │   ├── tempo-section-list.tsx
│   │   ├── section-editor-modal.tsx
│   │   └── preset-library-dialog.tsx
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and type definitions
│   └── ai/              # AI features (Genkit)
├── docs/                # Documentation
├── builds/              # Compiled APK/AAB files
├── android/             # Capacitor Android project
└── public/              # Static assets
```

---

## 🚀 Getting Started

### Development
```bash
# Install dependencies
npm install

# Start development server (port 9002)
npm run dev

# Run with Turbopack
npm run dev
```

### Building
```bash
# Build for web
npm run build

# Build for Android
npm run cap:build:android

# The APK will be in: android/app/build/outputs/apk/debug/
# Or saved to: builds/tempo-flow-debug.apk
```

### Cleaning
```bash
# Clean build artifacts
npm run clean

# Clean everything including node_modules
npm run clean:all
```

---

## 🎨 Design Philosophy

### User Experience Principles
1. **Immediate Feedback**: Every interaction provides visual/audio/haptic response
2. **Progressive Disclosure**: Advanced features don't clutter the main interface
3. **Fault Tolerance**: Invalid inputs prevented, errors handled gracefully
4. **Performance First**: Timing accuracy is paramount, everything else is secondary
5. **Touch-Optimized**: Large tap targets, gesture controls, no tiny buttons

### Audio Principles
1. **Precision Timing**: Drift compensation keeps beats accurate over long sessions
2. **Low Latency**: 50ms lookahead scheduling prevents audio glitches
3. **Smooth Transitions**: Tempo changes don't cause timing hiccups
4. **Distinct Sounds**: Accent, beat, and subdivision clearly differentiated

---

## 📊 Current Status

### ✅ Completed Features
- Core metronome with variable tempo, time signatures, subdivisions
- Multi-section sequence management with drag-to-reorder
- Precount system with configurable bars
- Preset library with folder organization
- Gesture controls for all parameters
- Mobile PWA and Android APK builds
- Theme switching (light/dark)
- Multiple sound sets for metronome and precount
- Haptic feedback on mobile
- Auto-scroll to active section
- Debug overlay toggle
- Comprehensive documentation

### 🔨 In Progress
- Performance optimization for long sessions
- Additional sound set options
- iOS build preparation

### 🎯 Planned Features
See [BUG_TRACKER.md](./BUG_TRACKER.md) for full list of enhancement requests

---

## 🧪 Testing

### Manual Testing
1. Open `http://localhost:9002` in browser
2. Click through the interactive tour
3. Create a few sections with different tempos
4. Test playback, editing, and gesture controls
5. Save/load presets
6. Test on mobile device or browser mobile emulation

### Android Testing
1. Build APK: `npm run cap:build:android`
2. Install on device: `adb install builds/tempo-flow-debug.apk`
3. Test touch gestures, haptics, and audio performance

---

## 📱 Deployment

### Web Deployment
The app can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages):
```bash
npm run build
# Upload the 'out' directory
```

### Android Deployment
1. Build APK: `npm run cap:build:android`
2. APK location: `builds/tempo-flow-debug.apk`
3. For production: Follow Google Play Console guidelines for release builds

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with TypeScript type safety
3. Test on both web and Android
4. Update documentation if needed
5. Submit pull request with clear description

### Code Style
- TypeScript strict mode enabled
- ESLint rules enforced
- Functional React components with hooks
- Tailwind CSS for styling (avoid custom CSS when possible)
- Component names in PascalCase, files in kebab-case

### Git Commit Messages
Follow conventional commits:
- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `style: Format/styling changes`
- `refactor: Code refactoring`
- `perf: Performance improvement`
- `test: Add/update tests`

---

## 📄 License

*License information to be added*

---

## 👥 Credits

### Libraries & Tools
- Next.js - React framework
- Tailwind CSS - Utility-first CSS
- shadcn/ui - Component library
- Radix UI - Accessible primitives
- Capacitor - Native mobile builds
- Lucide - Icon library

---

## 📞 Support

For issues, questions, or feature requests:
- Check [BUG_TRACKER.md](./BUG_TRACKER.md) for known issues
- Review [FEATURES.md](./FEATURES.md) for current capabilities
- Create GitHub issue with detailed information

---

**Last Updated**: November 27, 2025  
**Project Status**: Alpha - Active Development

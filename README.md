# TempoFlow

A modern, gesture-based metronome app for musicians. Built with Next.js and Capacitor for web and Android.

## Features

- **Gesture Controls**: Swipe up/down for tempo, left/right for subdivision changes
- **Visual Beat Display**: Clear beat visualization with accent pattern customization
- **Complex Tempo Changes**: Support for gradual tempo changes and multi-section flows
- **Precount**: Configurable precount bars before playback starts
- **Preset Library**: Save and load your favorite tempo configurations
- **Multiple Sound Sets**: Choose from different metronome sounds
- **PWA Support**: Install as a standalone app on mobile devices
- **Offline-First**: Works completely offline, no internet required

## Quick Start
- Node.js (>=18) and npm
- Android Studio + Android SDK (for building Android APK/AAB)
- (Optional) An Android device with USB debugging enabled for testing

## Local development
Start the development server (default port `9002` with turbopack):

```powershell
npm install
npm run dev
```

Open `http://localhost:9002` (or the network URL shown) in your browser.

## Build (production)
Create an optimized build and export static files (used by Capacitor):

```powershell
npm run build
npm run export
```

Note: `npm run export` is configured to run `next build && next export`.

## Capacitor / Android
The project includes a Capacitor config and an `android/` folder. Useful commands:

```powershell
# Sync web assets to Android platform
npx cap sync android

# Open Android Studio with the Android project
npx cap open android

# Build debug APK (Windows)
npm run cap:build:android

# Install debug APK on connected device
npm run cap:install:debug
```

Or inside Android Studio: open the `android` folder, let Gradle sync, choose an emulator or device and click Run.

## Scripts (high-level)
- `npm run dev` - start Next dev server
- `npm run build` - build for production
- `npm run export` - build and export static site
- `npm run cap:sync` - sync Capacitor assets
- `npm run cap:build:android` - build an Android debug APK via Gradle
- `npm run cap:install:debug` - install debug APK to device

## Testing on Phone (fast)
If your dev machine and phone share the same Wi‑Fi network, you can test the running dev server directly on the phone by opening the network URL shown by `npm run dev` (e.g. `http://192.168.x.x:9002`).

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Shadcn UI components
│   └── ...          # App-specific components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
└── lib/             # Utilities and constants

docs/                # Documentation
android/             # Capacitor Android project
```

## Documentation
- [Alpha Build Testing Guide](docs/ALPHA_BUILD.md)
- [Project Blueprint](docs/blueprint.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)

## Technologies

- **Framework**: Next.js 15 with React 19
- **UI**: Tailwind CSS + Shadcn UI
- **Mobile**: Capacitor for Android builds
- **Audio**: Web Audio API
- **Storage**: localStorage for offline-first data persistence

## Contributing
- Follow existing code style (Tailwind + React + TypeScript)
- Run `npm run lint` before committing
- Test on both web and Android before submitting PRs

## License

Proprietary - All Rights Reserved. See [LICENSE](LICENSE) for details.

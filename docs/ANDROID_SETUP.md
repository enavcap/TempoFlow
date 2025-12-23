# Tempo Flow - Google Play Store Setup Guide

## Prerequisites

Before publishing to Google Play Store, you need:

1. **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
2. **Android Studio** - [Download here](https://developer.android.com/studio)
3. **Java JDK 17** - Included with Android Studio or [download separately](https://www.oracle.com/java/technologies/downloads/)
4. **Google Play Developer Account** ($25 one-time fee) - [Register here](https://play.google.com/console)

## Setup Steps

### 1. Install Dependencies

First, make sure Node.js is installed, then run:

```bash
npm install
```

### 2. Build the Web App

```bash
npm run export
```

This creates an optimized static export in the `out/` directory.

### 3. Initialize Capacitor (First time only)

```bash
npm run cap:init
```

When prompted:
- App name: **Tempo Flow**
- App ID: **com.tempoflow.app** (or your own package name)
- Web asset directory: **out**

### 4. Add Android Platform (First time only)

```bash
npm run cap:add:android
```

This creates the `android/` folder with a native Android project.

### 5. Sync Web Assets to Android

After any code changes:

```bash
npm run cap:sync
```

### 6. Open in Android Studio

```bash
npm run cap:open:android
```

Or use the combined command:

```bash
npm run android:build
```

## Building for Production

### In Android Studio:

1. **Generate Signing Key** (first time only):
   - Build → Generate Signed Bundle/APK
   - Create new keystore
   - **IMPORTANT**: Save your keystore file and passwords securely!

2. **Build Release APK/Bundle**:
   - Build → Generate Signed Bundle/APK
   - Choose "Android App Bundle" (.aab) for Play Store
   - Select your keystore
   - Build variant: **release**

3. **Locate the Build**:
   - AAB: `android/app/release/app-release.aab`
   - APK: `android/app/release/app-release.apk`

## App Icons & Splash Screen

### Generate Icons

1. Create a 1024x1024 icon image
2. Use [Icon Kitchen](https://icon.kitchen/) or Android Studio's Asset Studio
3. Place generated files in `android/app/src/main/res/`

### Customize Splash Screen

Edit `android/app/src/main/res/values/styles.xml` or use Android Studio's Resource Manager.

## Google Play Console Setup

### 1. Create App Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create App
3. Fill in:
   - App name: **Tempo Flow**
   - Default language
   - App or Game: **App**
   - Free or Paid: **Free**

### 2. Store Listing

Required content:
- **App name**: Tempo Flow
- **Short description** (80 chars):
  ```
  Advanced metronome with tempo transitions, subdivisions & gesture controls
  ```
- **Full description** (4000 chars max):
  ```
  Tempo Flow is a powerful metronome app designed for musicians who need precise 
  tempo control and complex rhythm patterns.

  KEY FEATURES:
  • Multiple tempo sections with smooth transitions
  • Subdivision support: Quarter, Eighth, Triplet, Sixteenth notes
  • Gesture-based controls for easy parameter adjustment
  • Custom accent patterns for any time signature
  • Precount bars with customizable sounds
  • Dark and light themes
  • Save and organize preset sequences
  • No ads, no subscriptions

  PERFECT FOR:
  • Practice sessions
  • Live performances
  • Teaching
  • Composition
  • Any musician needing advanced tempo control

  [Add more details about your app's unique features]
  ```

- **Screenshots** (2-8 required):
  - Phone: 1080x1920 minimum
  - 7-inch tablet: 1920x1200 minimum
  - 10-inch tablet: 2560x1600 minimum
  - Take screenshots from Android Emulator or device

- **Feature graphic**: 1024x500 PNG

- **App icon**: 512x512 PNG

- **Privacy Policy URL**: (Required if app collects data)

### 3. Content Rating

Complete the questionnaire:
- Select "Utilities" or "Music & Audio" category
- Answer questions about violent content, social features, etc.

### 4. App Content

Declare:
- Target audience
- Privacy policy (if collecting data)
- Data safety information
- Ads declaration (None for your app)

### 5. Release Track

Choose:
- **Internal testing**: Small group of testers
- **Closed testing**: Larger group
- **Open testing**: Public beta
- **Production**: Full public release

Upload your `.aab` file to start.

## Version Updates

When updating the app:

1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.1.0"  // Your version number
   ```

2. Rebuild and upload new `.aab` to Play Console

## Common Issues

### Web Audio Not Working
- Ensure HTTPS is used (Capacitor's `androidScheme: 'https'`)
- Check Android permissions in `AndroidManifest.xml`

### Haptic Feedback Not Working
- Add to `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.VIBRATE" />
  ```

### LocalStorage Data Loss
- Already configured in Capacitor - data persists between sessions

## Testing

### On Physical Device:
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. Click "Run" in Android Studio

### On Emulator:
1. Tools → Device Manager
2. Create Virtual Device (Pixel 5 or similar)
3. Click "Run"

## App Metadata Checklist

Before submitting:
- [ ] App name and icon finalized
- [ ] All screenshots taken (phone + tablet)
- [ ] Feature graphic created
- [ ] Full description written
- [ ] Privacy policy (if needed)
- [ ] Content rating completed
- [ ] Signing key secured
- [ ] Release .aab built and tested
- [ ] Version code/name updated

## Quick Reference Commands

```bash
# Development cycle
npm run export          # Build web app
npm run cap:sync        # Sync to Android
npm run cap:open:android # Open Android Studio

# Or combined:
npm run android:build   # All of the above

# After making changes:
npm run export && npm run cap:sync
```

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Material Design Guidelines](https://m3.material.io/)

## Support

For issues:
1. Check Android Studio logs
2. Test on emulator first
3. Verify all permissions in AndroidManifest.xml
4. Check Capacitor compatibility

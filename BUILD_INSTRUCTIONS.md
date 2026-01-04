# Building APK for Music Player App

## Prerequisites
✅ EAS CLI installed (globally)
✅ Expo account logged in
✅ Configuration files ready (eas.json, app.json)

## Build Commands

### Option 1: Build Preview APK (Recommended for Testing)
```bash
npx eas-cli build --platform android --profile preview
```

This will:
- Build an APK file (not AAB)
- Build on Expo's servers (cloud build)
- Download the APK when build completes
- Build time: ~10-20 minutes

### Option 2: Build Production APK
```bash
npx eas-cli build --platform android --profile production
```

### Option 3: Build Locally (Requires Android Studio)
```bash
npx eas-cli build --platform android --profile preview --local
```

**Note:** Local builds require:
- Android Studio installed
- Android SDK configured
- More setup time but faster builds

## What Happens During Build

1. **Login**: You're already logged in as `puneetsharma123`
2. **Upload**: Your code is uploaded to Expo servers
3. **Build**: Expo builds the APK on their servers
4. **Download**: You'll get a download link for the APK

## After Build Completes

1. Download the APK from the provided link
2. Transfer to Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Install the APK

## Important Notes

- **Package Name**: Set to `com.musicplayer.app` (can be changed in app.json)
- **Build Type**: APK (for direct installation, not Play Store)
- **For Play Store**: Use `buildType: "aab"` instead of `"apk"`

## Troubleshooting

If build fails:
1. Check Expo account status: `npx eas-cli whoami`
2. Check build logs in Expo dashboard
3. Ensure all assets (icon.png, splash-icon.png) exist in `./assets/` folder

## Quick Start (Recommended)

Run this command to start building:
```bash
npx eas-cli build --platform android --profile preview
```


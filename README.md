# FA Direct

Secure communication platform for funeral arrangers and mourners.

## Quick Start

### First Time Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/madcrx/FADirect.git
   cd FADirect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Log in to Expo**
   ```bash
   npx expo login
   ```
   Use your credentials: `info@epsicon.com.au`

4. **Done!** You're ready to build and test.

## Testing on iPhone

### Build for Testing

```bash
npm run build:preview
```

**Wait 20-30 minutes** for the build to complete.

### Install on iPhone

**Option 1: Expo Orbit (Easiest)**
1. Install [Expo Orbit](https://expo.dev/orbit) on your computer
2. When build completes, the build will appear in Expo Orbit
3. Click "Install" and select your iPhone
4. App installs automatically

**Option 2: Direct Download**
1. When build completes, open the build URL on your iPhone
2. Tap "Install"
3. Go to **Settings → General → VPN & Device Management**
4. Tap "Brett Farley" → "Trust"
5. Open the app

## Making Changes and Republishing

```bash
# 1. Make your code changes

# 2. Commit and push
git add .
git commit -m "Describe your changes"
git push

# 3. Rebuild for testing
npm run build:preview

# 4. Install on iPhone (same process as above)
```

That's it! Every time you make changes: **commit → push → build → install**

## Build Commands

```bash
# Testing builds (for your iPhone)
npm run build:preview              # iOS + Android
npm run build:ios:preview          # iOS only
npm run build:android:preview      # Android only

# Production builds (for App Store)
npm run build:prod                 # iOS + Android
npm run build:ios:prod             # iOS only
```

## Firebase Setup

Firebase is configured for project: **fa-direct**

**Required**: Enable these services in [Firebase Console](https://console.firebase.google.com/project/fa-direct):
- ✓ Authentication → Phone provider
- ✓ Firestore Database
- ✓ Cloud Storage
- ✓ Cloud Messaging

## Troubleshooting

**Build fails:**
- Check build logs at the URL shown in terminal
- Most common issue: Firebase services not enabled in console

**App won't open on iPhone:**
1. Trust certificate: Settings → General → VPN & Device Management → Brett Farley → Trust
2. If still crashes, check recent builds at: https://expo.dev/accounts/madcrx/projects/fadirect/builds

**"Module not found":**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Info

- **Bundle ID**: com.fadirect.app
- **Apple Team**: Brett Farley (B672DMM8X6)
- **Expo Account**: @madcrx
- **Firebase Project**: fa-direct

## Tech Stack

- React Native 0.73 + Expo SDK 50
- Firebase (Auth, Firestore, Storage)
- Signal Protocol (E2E encryption)
- Redux Toolkit + React Navigation

---

**Need help?** Check [build logs](https://expo.dev/accounts/madcrx/projects/fadirect/builds) or contact support.

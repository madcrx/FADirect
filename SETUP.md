# FA Direct - Quick Setup Guide

This guide will help you get FA Direct running on your development machine in under 30 minutes.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] For iOS: Xcode 14+ and CocoaPods (`xcode-select --version`, `pod --version`)
- [ ] For Android: Android Studio with SDK 33+
- [ ] Git installed
- [ ] A Firebase account (free tier is fine)

## Step-by-Step Setup

### 1. Clone and Install (5 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd FADirect

# Install JavaScript dependencies
npm install

# Install iOS dependencies (Mac only)
cd ios
pod install
cd ..
```

### 2. Firebase Project Setup (10 minutes)

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "FA Direct Dev" (or your preferred name)
4. Disable Google Analytics for development (or enable if you prefer)
5. Click "Create project"

#### Add iOS App
1. In Firebase Console, click "Add app" → iOS
2. iOS bundle ID: `com.fadirect.dev` (for development)
3. App nickname: "FA Direct iOS Dev"
4. Click "Register app"
5. Download `GoogleService-Info.plist`
6. Move it to: `FADirect/ios/FADirect/GoogleService-Info.plist`
7. Click through the remaining steps (SDK already installed via npm)

#### Add Android App
1. In Firebase Console, click "Add app" → Android
2. Android package name: `com.fadirect.dev` (for development)
3. App nickname: "FA Direct Android Dev"
4. Click "Register app"
5. Download `google-services.json`
6. Move it to: `FADirect/android/app/google-services.json`
7. Click through the remaining steps (SDK already installed via npm)

### 3. Enable Firebase Services (5 minutes)

#### Enable Authentication
1. In Firebase Console, go to "Build" → "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Phone" provider
5. Click "Save"

**For Testing:** Add test phone numbers:
- Click "Phone numbers for testing"
- Add: `+61400000000` with code `123456`
- This lets you test without real SMS

#### Create Firestore Database
1. Go to "Build" → "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose location: `australia-southeast1` (Sydney)
5. Click "Enable"

#### Enable Storage
1. Go to "Build" → "Storage"
2. Click "Get started"
3. Select "Start in test mode"
4. Use same location: `australia-southeast1`
5. Click "Done"

### 4. Deploy Security Rules (5 minutes)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# When prompted, select:
# - Firestore (use existing rules)
# - Storage (use existing rules)
# - Choose your Firebase project
# - Accept default files

# Deploy the rules
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Configure Native Projects (5 minutes)

#### iOS Configuration

1. Open `FADirect/ios/FADirect.xcworkspace` in Xcode (NOT .xcodeproj)
2. Select the "FADirect" project in navigator
3. Select "FADirect" target
4. Under "Signing & Capabilities":
   - Select your team
   - Bundle Identifier: `com.fadirect.dev`
5. Go to "Build Phases"
6. Ensure `GoogleService-Info.plist` is listed under "Copy Bundle Resources"

#### Android Configuration

1. Open `FADirect/android` in Android Studio
2. Wait for Gradle sync to complete
3. Verify `google-services.json` is in `app/` directory
4. File should automatically be detected

### 6. Run the App!

#### Run on iOS Simulator

```bash
# Start Metro bundler (in one terminal)
npm start

# Run iOS app (in another terminal)
npm run ios

# Or specify a device
npx react-native run-ios --simulator="iPhone 15 Pro"
```

#### Run on Android Emulator

```bash
# Make sure an Android emulator is running
# You can start one from Android Studio

# Start Metro bundler (in one terminal)
npm start

# Run Android app (in another terminal)
npm run android
```

### 7. Test the App

1. **On Launch**: You should see the phone authentication screen
2. **Enter Test Number**: Use `+61400000000` (if you added it as a test number)
3. **Enter Code**: Use `123456`
4. **Complete Profile**: Fill in your name and select "Funeral Arranger"
5. **You're In!**: You should now see the Arrangements screen

## Quick Test Scenarios

### Test Phone Authentication
1. Launch app
2. Enter: `+61400000000`
3. Enter code: `123456`
4. Complete profile

### Test Creating an Arrangement
1. Login as Funeral Arranger
2. Tap the + button
3. Fill in:
   - Deceased name: "John Smith"
   - Mourner phone: "+61400000001" (another test number)
   - Service type: "Traditional"
4. Create arrangement
5. View the workflow progress

### Test Messaging
1. Navigate to Messages tab
2. Select an arrangement
3. Type a message
4. Send (encrypted with Signal Protocol!)

## Troubleshooting

### App Won't Build - iOS

```bash
# Clean and rebuild
cd ios
pod deintegrate
pod install
cd ..

# Reset Metro cache
npm start -- --reset-cache
```

### App Won't Build - Android

```bash
cd android
./gradlew clean
cd ..

# Reset Metro cache
npm start -- --reset-cache
```

### Firebase Errors

**"No Firebase App '[DEFAULT]' has been created"**
- Check `GoogleService-Info.plist` is in `ios/FADirect/`
- Check `google-services.json` is in `android/app/`
- Rebuild the app

**"Auth network request failed"**
- Check internet connection
- Check Firebase project is in correct region
- Verify Phone authentication is enabled

### Can't Send SMS Codes

**Development:**
- Use test phone numbers in Firebase Console
- Test numbers don't send real SMS

**Production:**
- Enable billing in Firebase (required for SMS)
- Set up SMS quota
- Configure reCAPTCHA for web

## Development Tips

### Using Firebase Emulators (Optional)

```bash
# Start emulators
firebase emulators:start

# Update app to use emulators
# In src/services/firebase/config.ts, uncomment:
# auth().useEmulator('http://localhost:9099');
# firestore().useEmulator('localhost', 8080);
# storage().useEmulator('localhost', 9199);
```

### Debugging

**React Native Debugger:**
```bash
# Install
brew install --cask react-native-debugger

# Run
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

**Flipper (Meta's debugging platform):**
- Included with React Native
- Opens automatically when you run the app
- Great for network requests, Redux state, and more

### Hot Reload

- Shake device (physical) or Cmd+D (iOS) / Cmd+M (Android)
- Enable "Fast Refresh"
- Changes will appear instantly

## Next Steps

Now that you have FA Direct running:

1. **Explore the Code**: Check `src/` directory structure
2. **Read the README**: Full documentation in `README.md`
3. **Try Features**: Test messaging, workflows, documents
4. **Customize**: Update theme, add workflows, modify screens
5. **Deploy Rules**: Use production security rules before launch

## Getting Help

**Common Resources:**
- React Native Docs: https://reactnative.dev
- Firebase Docs: https://firebase.google.com/docs
- Signal Protocol: https://signal.org/docs/

**Still Stuck?**
- Check the troubleshooting section
- Review Firebase Console for errors
- Check Metro bundler output
- Look at device logs in Xcode/Android Studio

---

**Happy Coding! 🚀**

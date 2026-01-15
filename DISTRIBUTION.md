# FA Direct - Distribution Guide

Complete guide for building and distributing FA Direct to multiple iOS and Android devices **from Windows** (no Mac required).

## 📦 Distribution Strategy

- **iOS**: TestFlight (up to 10,000 testers, 90-day builds)
- **Android**: Google Play Internal Testing (up to 100 testers initially)
- **Build Service**: EAS (Expo Application Services) - cloud building from Windows

## 🚀 One-Time Setup (30 minutes)

### Step 1: Install EAS CLI

```bash
# Install Expo and EAS CLI globally
npm install -g expo-cli eas-cli

# Login to Expo (create free account at expo.dev)
eas login
```

### Step 2: Apple Developer Account Setup (iOS)

**Cost: $99 USD/year** (required for TestFlight distribution)

1. **Sign up for Apple Developer Program**
   - Go to: https://developer.apple.com/programs/
   - Enroll using your Apple ID
   - Complete verification (may take 1-2 days)

2. **Create App Store Connect App**
   - Go to: https://appstoreconnect.apple.com
   - Click "My Apps" → "+" → "New App"
   - Platform: iOS
   - Name: "FA Direct"
   - Bundle ID: `com.fadirect.app`
   - SKU: `fadirect`

### Step 3: Google Play Console Setup (Android)

**Cost: $25 USD one-time fee**

1. **Create Google Play Developer Account**
   - Go to: https://play.google.com/console/signup
   - Pay one-time $25 fee

2. **Create App in Play Console**
   - Click "Create app"
   - App name: "FA Direct"
   - Default language: English (Australia)
   - Category: Communication

3. **Setup Internal Testing Track**
   - Go to "Testing" → "Internal testing"
   - Add testers (up to 100 email addresses)

### Step 4: Configure EAS Project

```bash
cd FADirect

# Initialize EAS (creates eas.json)
eas build:configure
```

### Step 5: Add Firebase Config Files

Place these files in the project root:
- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)

EAS will use them during the build.

## 📱 Building the App

### Build for iOS (TestFlight)

```bash
# Preview build (for internal testing)
eas build --platform ios --profile preview

# Production build (for App Store/TestFlight)
eas build --platform ios --profile production

# Wait 10-15 minutes for cloud build to complete
```

### Build for Android

```bash
# Preview build (APK for direct install)
eas build --platform android --profile preview

# Production build (AAB for Google Play)
eas build --platform android --profile production

# Wait 5-10 minutes
```

### Build Both Platforms

```bash
eas build --platform all --profile production
```

## 🚀 Distributing to Testers

### iOS - TestFlight Distribution

**Automatic Upload:**
```bash
# Build and automatically submit to TestFlight
eas submit --platform ios --latest
```

**Adding Testers:**
1. Go to: https://appstoreconnect.apple.com
2. Navigate to TestFlight
3. Create test group (e.g., "Beta Testers")
4. Add tester emails
5. Testers receive email invite
6. They install TestFlight app → Accept invite → Install

**Limits:**
- Internal: 100 testers (instant)
- External: 10,000 testers (requires Apple review)

### Android - Play Console Distribution

**Automatic Upload:**
```bash
eas submit --platform android --latest
```

**Adding Testers:**
1. Go to Play Console → Internal testing
2. Create email list with tester addresses
3. Copy opt-in URL
4. Send URL to testers
5. They click → Accept → Install

**Alternative: Direct APK Install**
```bash
# Build APK
eas build --platform android --profile preview

# Share .apk download link with testers
# They download and install directly
```

## 🔄 Updating the App

```bash
# 1. Update version in app.json
# 2. Make your changes
# 3. Build new version
eas build --platform all --profile production

# 4. Submit updates
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 👥 Managing Multiple Testers

### Tester Communication Template

```
Subject: FA Direct Beta - Installation Instructions

Hi [Name],

You're invited to test FA Direct!

iOS (iPhone/iPad):
1. Install "TestFlight" from App Store
2. Click: [TESTFLIGHT_INVITE_LINK]
3. Tap "Install"

Android:
1. Click: [PLAY_STORE_LINK]
2. Tap "Accept Invite" → "Download"

Please test:
✓ Phone authentication
✓ Creating arrangements
✓ Secure messaging
✓ Document/photo upload

Feedback: Reply to this email

Thanks!
```

## 💰 Cost Summary

| Item | Cost | Notes |
|------|------|-------|
| Expo Account | **Free** | Cloud builds |
| EAS Build (free tier) | **Free** | 30 builds/month |
| Apple Developer | **$99/year** | Required for iOS |
| Google Play | **$25 once** | Required for Android |
| **Total Year 1** | **$124** | One-time + annual |

## 📊 Build Status

```bash
# View all builds
eas build:list

# Check specific build
eas build:view [build-id]

# Cancel build
eas build:cancel [build-id]
```

## 🐛 Troubleshooting

### Build Fails
- Check `eas build:view [build-id]` for logs
- Verify Firebase config files are present
- Ensure bundle ID matches developer accounts

### Testers Can't Install

**iOS:**
- Check they installed TestFlight app
- Verify email in tester list
- iOS 13+ required

**Android:**
- For APK: Enable "Install Unknown Apps"
- For Play: Ensure they clicked opt-in link

## 🎯 Quick Start Checklist

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Sign up for Apple Developer ($99/year)
- [ ] Sign up for Google Play ($25 once)
- [ ] Run `eas build:configure`
- [ ] Add Firebase config files
- [ ] Build: `eas build --platform all --profile preview`
- [ ] Add yourself as first tester
- [ ] Test on your device
- [ ] Invite other testers
- [ ] Gather feedback
- [ ] Iterate and rebuild

## 📞 Support Resources

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **TestFlight Guide**: https://developer.apple.com/testflight/
- **Play Console Help**: https://support.google.com/googleplay/android-developer/

---

**You can now distribute to unlimited iOS and Android devices from Windows!** 🎉

# Testing FA Direct on Your iPhone/iPad from Windows

Complete guide for Windows users who want to test FA Direct on real iOS and Android devices.

## 🎯 What You'll Achieve

By the end of this guide, you'll be able to:
- ✅ Build iOS apps from Windows (no Mac needed!)
- ✅ Install FA Direct on your iPhone/iPad
- ✅ Install FA Direct on Android phones
- ✅ Distribute to multiple testers via TestFlight and Play Store
- ✅ Update the app and push to testers

## 📋 Prerequisites

### What You Need

**Hardware:**
- Windows PC (Windows 10/11)
- iPhone/iPad OR Android phone (for testing)
- Internet connection

**Accounts (one-time setup):**
- Expo account (free - sign up at expo.dev)
- Apple Developer account ($99/year - for iOS)
- Google Play Developer account ($25 one-time - for Android, optional)

**Software:**
- Node.js 18+ ([download](https://nodejs.org))
- Git ([download](https://git-scm.com))

### Cost Breakdown

| Service | Cost | What It's For |
|---------|------|---------------|
| **Expo/EAS (free tier)** | Free | 30 cloud builds per month |
| **Apple Developer** | $99/year | Required for iOS TestFlight |
| **Google Play** | $25 once | Optional for Play Store (can use APK instead) |
| **Total Year 1** | **$99-$124** | - |

**Note:** You can start with just iOS ($99) or just Android ($0-$25) and add the other later.

## 🚀 Step-by-Step Setup

### Step 1: Install Required Tools (5 minutes)

```bash
# Open PowerShell or Command Prompt

# Install EAS CLI globally
npm install -g eas-cli

# Verify installation
eas --version
```

### Step 2: Setup Expo Account (5 minutes)

```bash
# Create account and login
eas login

# Follow prompts to create account or login
# This is free - no credit card required initially
```

### Step 3: Setup Firebase (15 minutes)

**Create Firebase Project:**
1. Go to: https://console.firebase.google.com
2. Click "Create Project"
3. Name it "FA Direct" (or your preferred name)
4. Disable Google Analytics (or enable if you want)
5. Click "Create Project"

**Add iOS App:**
1. Click "Add App" → iOS
2. Bundle ID: `com.fadirect.app`
3. Download `GoogleService-Info.plist`
4. Save it to your FADirect project root folder

**Add Android App:**
1. Click "Add App" → Android
2. Package name: `com.fadirect.app`
3. Download `google-services.json`
4. Save it to your FADirect project root folder

**Enable Services:**
1. Authentication → Get Started → Enable "Phone"
2. Firestore → Create Database → Start in test mode → Location: australia-southeast1
3. Storage → Get Started → Start in test mode

### Step 4: Setup Apple Developer (iOS Only, 20 minutes)

**Sign up for Apple Developer Program:**
1. Go to: https://developer.apple.com/programs/
2. Click "Enroll"
3. Sign in with your Apple ID
4. Complete enrollment ($99/year)
5. Wait for approval (usually instant, can take 1-2 days)

**Create App in App Store Connect:**
1. Go to: https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: FA Direct
   - Primary Language: English (Australia)
   - Bundle ID: Select "com.fadirect.app" (or create new)
   - SKU: fadirect
4. Click "Create"

### Step 5: Setup Google Play (Android Only, Optional, 15 minutes)

**Only needed if you want Play Store distribution. Skip if using APK files.**

1. Go to: https://play.google.com/console/signup
2. Pay $25 one-time registration fee
3. Complete account verification
4. Create app:
   - App name: FA Direct
   - Default language: English (Australia)
   - App/Game: App
   - Free/Paid: Free
5. Complete app details

### Step 6: Configure EAS Build (5 minutes)

```bash
# Navigate to your project
cd FADirect

# Install dependencies
npm install

# Initialize EAS
eas build:configure

# This creates eas.json configuration file
# It will ask for your project details - follow the prompts
```

**Verify Configuration:**
- Check that `eas.json` exists in your project
- Check that Firebase config files are in project root:
  - `GoogleService-Info.plist`
  - `google-services.json`

### Step 7: Your First Build! (15 minutes cloud time)

**Build for iOS:**
```bash
npm run build:ios:preview
```

**Build for Android:**
```bash
npm run build:android:preview
```

**Build Both:**
```bash
npm run build:preview
```

**What Happens:**
1. Your code is uploaded to EAS cloud servers
2. EAS builds the app on their servers (macOS for iOS, Linux for Android)
3. You get a link to download the build
4. For iOS: `.ipa` file
5. For Android: `.apk` file

**Build Status:**
```bash
# Check your builds
eas build:list

# Watch a specific build
eas build:view [build-id]
```

## 📱 Installing on Your Devices

### iOS Installation (via TestFlight)

**Submit to TestFlight:**
```bash
npm run submit:ios
```

**Add Yourself as Tester:**
1. Go to: https://appstoreconnect.apple.com
2. Click your app → TestFlight tab
3. Click "Internal Testing" (under "Internal Group")
4. Click "+" next to Testers
5. Add your email address
6. Click "Add"

**Install on Your iPhone:**
1. Check your email for TestFlight invite
2. Install "TestFlight" app from App Store (if not already installed)
3. Open email and click "View in TestFlight"
4. Tap "Install"
5. FA Direct installs on your iPhone!

### Android Installation

**Method A: Direct APK Install (Easiest)**

1. After build completes, you'll get a download URL
2. Copy the URL
3. Open it on your Android phone's browser
4. Download the APK
5. Tap the downloaded file
6. If prompted, enable "Install Unknown Apps" for your browser
7. Tap "Install"

**Method B: Via Google Play Internal Testing**

```bash
# Submit to Play Console
npm run submit:android
```

Then:
1. Go to Play Console → Your App → Internal Testing
2. Create new release
3. Add testers (email addresses)
4. Save and send invites
5. Testers receive email with opt-in link
6. They click link → Accept → Install from Play Store

## 👥 Adding More Testers

### iOS (TestFlight)

**Internal Testing (up to 100 testers):**
```
App Store Connect → TestFlight → Internal Testing → Add Testers
Enter emails → They receive invite → Install via TestFlight
```

**External Testing (up to 10,000 testers):**
1. TestFlight → External Testing → Create Group
2. Add testers
3. Submit for Apple review (required, takes 1-3 days)
4. Once approved, testers can install

### Android

**Direct APK Sharing:**
- Share the download link from your build
- Anyone with link can download and install
- No Google Play account needed

**Play Console Internal Testing:**
- Add tester emails in Play Console
- They receive opt-in URL
- Install via Play Store

## 🔄 Making Updates

When you want to update the app:

### Step 1: Update Version

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "ios": {
      "buildNumber": "2"  // Auto-incremented
    },
    "android": {
      "versionCode": 2    // Auto-incremented
    }
  }
}
```

### Step 2: Rebuild

```bash
npm run build:preview
```

### Step 3: Resubmit

```bash
npm run submit:ios
npm run submit:android
```

### Step 4: Notify Testers

Testers will receive update notification in TestFlight/Play Store automatically!

## 🧪 Testing Checklist

Once installed, verify these features work:

**Authentication:**
- [ ] Phone number entry works
- [ ] SMS verification code received and accepted
- [ ] Profile setup completes

**Core Features:**
- [ ] Create new arrangement (as Arranger)
- [ ] View arrangement (as Mourner)
- [ ] Workflow steps display correctly
- [ ] Progress tracking updates
- [ ] Send messages (encrypted)
- [ ] Receive messages
- [ ] Upload document
- [ ] Upload photo
- [ ] View uploaded files

**UI/UX:**
- [ ] App looks correct on your device
- [ ] Navigation works smoothly
- [ ] Buttons respond correctly
- [ ] Forms work properly
- [ ] Date/time shows AU format (DD/MM/YYYY)
- [ ] Phone numbers show AU format (+61)

## 🐛 Troubleshooting

### Build Issues

**"Build failed - Firebase config not found"**
```bash
# Ensure these files are in project root:
# - GoogleService-Info.plist
# - google-services.json

# Verify with:
dir GoogleService-Info.plist
dir google-services.json
```

**"Build failed - bundle ID mismatch"**
- Check `app.json` bundle IDs match:
  - iOS: `com.fadirect.app`
  - Android: `com.fadirect.app`
- Verify they match your Apple/Google accounts

**"EAS CLI not recognized"**
```bash
# Reinstall globally
npm install -g eas-cli

# Close and reopen terminal
```

### Installation Issues

**iOS: "Can't install from TestFlight"**
- Verify you're on the tester list in App Store Connect
- Check email spam folder for invite
- Ensure iOS version is 13 or higher
- Try removing and reinstalling TestFlight app
- Verify Apple ID matches the invited email

**Android: "Can't install APK"**
- Enable "Install Unknown Apps" for your browser
- Go to: Settings → Apps → Browser → Install Unknown Apps → Allow
- Try downloading APK again
- Verify Android version is 8.0 or higher

**"Firebase Authentication not working"**
- Verify Firebase config files are correct
- Check Phone Authentication is enabled in Firebase Console
- For testing: Add test phone numbers in Firebase Console
  - Authentication → Sign-in method → Phone → Phone numbers for testing
  - Add: +61400000000 with code 123456

### Distribution Issues

**"Submit to TestFlight failed"**
- Verify Apple Developer account is active ($99 paid)
- Check app exists in App Store Connect
- Ensure bundle ID matches
- Try manual submission: `eas submit --platform ios --path path/to/app.ipa`

**"Testers not receiving invites"**
- Check email addresses are correct
- Look in spam folders
- Verify testers are added to correct test group
- For TestFlight: Check "Internal Testing" group has testers

## 💡 Pro Tips

### Speed Up Builds

```bash
# Build both platforms in parallel
npm run build:preview

# Builds take 10-15 minutes typically
# iOS: ~15 minutes
# Android: ~8 minutes
```

### Test Before Distributing

Always test the build yourself first:
1. Build preview version
2. Install on your own device
3. Test all major features
4. Fix any issues
5. Rebuild if needed
6. Then distribute to others

### Manage Build Costs

**Free tier (Expo):**
- 30 builds per month
- Sufficient for initial development

**When to upgrade ($29/month):**
- Need unlimited builds
- Multiple developers building
- Frequent updates to testers

### Version Naming Convention

```
Major.Minor.Patch
1.0.0 - Initial release
1.0.1 - Bug fixes
1.1.0 - New features
2.0.0 - Major changes
```

## 📊 Distribution Workflow

Here's your complete workflow from code to testers:

```
1. Make changes to code
   ↓
2. Update version in app.json
   ↓
3. Build: npm run build:preview
   ↓
4. Test on your device
   ↓
5. Submit: npm run submit:all
   ↓
6. Testers receive update
   ↓
7. Gather feedback
   ↓
8. Repeat!
```

## 🎯 Quick Reference Commands

```bash
# Setup (one-time)
npm install -g eas-cli
eas login
eas build:configure

# Building
npm run build:preview          # Both platforms
npm run build:ios:preview      # iOS only
npm run build:android:preview  # Android only

# Submitting
npm run submit:ios            # To TestFlight
npm run submit:android        # To Play Store
npm run submit:all            # Both

# Checking status
eas build:list                # List all builds
eas build:view [id]          # View specific build

# Managing
eas credentials               # Manage certificates
eas submit:list               # List submissions
```

## 📞 Getting Help

**Build Issues:**
- EAS Status: https://status.expo.dev/
- EAS Docs: https://docs.expo.dev/build/
- Expo Forum: https://forums.expo.dev/

**TestFlight Help:**
- Apple Guide: https://developer.apple.com/testflight/
- App Store Connect: https://appstoreconnect.apple.com

**Play Console Help:**
- Google Guide: https://support.google.com/googleplay/android-developer/

**FA Direct Specific:**
- Check DISTRIBUTION.md for detailed info
- Check QUICK_START_DISTRIBUTION.md for quick reference

## ✅ Success Criteria

You're ready to distribute to your team when you can:
- [x] Build iOS version from Windows
- [x] Build Android version from Windows
- [x] Install on your own iPhone/iPad
- [x] Install on your own Android phone
- [x] Add yourself as a tester
- [x] Update and push new version
- [x] All major features work on devices

**Next:** Start inviting your team and gather feedback!

## 🎉 Congratulations!

You've successfully set up cloud-based iOS/Android distribution from Windows. You can now:
- Build for both platforms without a Mac
- Distribute to unlimited testers
- Push updates easily
- Scale your testing team

**Start inviting testers and gathering feedback!**

---

Need more help? See:
- [DISTRIBUTION.md](DISTRIBUTION.md) - Complete distribution guide
- [QUICK_START_DISTRIBUTION.md](QUICK_START_DISTRIBUTION.md) - Quick reference
- [SETUP.md](SETUP.md) - Local development setup

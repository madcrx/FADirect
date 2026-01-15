# Quick Start: Test on Your Phone (Windows)

Get FA Direct running on your iPhone/iPad and Android phones in under 1 hour from Windows.

## ⚡ Fast Track (3 Steps)

### Step 1: Setup (15 minutes)

```bash
# Install build tools
npm install -g eas-cli

# Login to Expo (create free account at expo.dev)
eas login

# Configure project
cd FADirect
npm install
eas build:configure
```

### Step 2: Build (10 minutes + 15 min cloud build)

**Add Firebase config files to project root:**
- `GoogleService-Info.plist` (for iOS)
- `google-services.json` (for Android)

**Build for your platform:**

```bash
# For iOS (iPhone/iPad)
eas build --platform ios --profile preview

# For Android
eas build --platform android --profile preview

# Or both at once
eas build --platform all --profile preview
```

**Wait:** Builds happen in the cloud. You'll get download links when complete.

### Step 3: Install (5 minutes)

**iOS:**
1. Sign up for Apple Developer Program ($99/year)
2. Run: `eas submit --platform ios --latest`
3. Add your email as tester in App Store Connect → TestFlight
4. Install TestFlight app on your iPhone
5. Accept invite and install FA Direct

**Android:**
1. Download the `.apk` file from EAS build
2. Email/AirDrop it to your Android phone
3. Open file on phone
4. Enable "Install from Unknown Sources" if prompted
5. Install

## 📱 Testing Checklist

Once installed, test these features:

- [ ] **Authentication**: Enter phone number and verification code
- [ ] **Profile Setup**: Complete your profile (Arranger or Mourner)
- [ ] **Create Arrangement**: Create a test funeral arrangement
- [ ] **Workflow**: View the step-by-step progress
- [ ] **Messaging**: Send encrypted messages
- [ ] **Documents**: Upload a test document
- [ ] **Photos**: Upload a test photo
- [ ] **Profile**: View your profile settings

## 👥 Adding More Testers

### iOS (TestFlight)

```bash
# After first build is submitted
# Go to: https://appstoreconnect.apple.com
# TestFlight → Add Testers → Enter emails
# They receive invite email → Install TestFlight → Accept → Install
```

**Limits:**
- Internal testing: 100 testers
- External testing: 10,000 testers

### Android (Direct Install)

```bash
# Share the .apk download link
# Recipients download and install
# No Google Play account needed
```

**OR use Google Play Internal Testing:**

1. Sign up for Google Play Console ($25 one-time)
2. Create app and internal testing track
3. Run: `eas submit --platform android --latest`
4. Add tester emails in Play Console
5. Send them the opt-in URL

## 🔄 Making Updates

```bash
# 1. Make your code changes

# 2. Update version in app.json
# "version": "1.0.1"

# 3. Build new version
eas build --platform all --profile preview

# 4. Submit updates
eas submit --platform ios --latest
eas submit --platform android --latest

# 5. Testers get update notification
```

## 💰 Costs

| Service | Cost | Required For |
|---------|------|-------------|
| Expo/EAS (free tier) | **Free** | 30 builds/month |
| Apple Developer | **$99/year** | iOS TestFlight |
| Google Play | **$25 once** | Play Store (optional for Android) |

**Minimum to start:** $99 (iOS only) or $0 (Android APK only)

## 🐛 Common Issues

### "Build Failed"
```bash
# Check build logs
eas build:list
eas build:view [build-id]

# Common fixes:
# - Ensure Firebase config files are in project root
# - Check eas.json configuration
# - Verify bundle IDs match developer accounts
```

### "Can't Install on iPhone"
- Ensure you have Apple Developer account ($99/year)
- Check you're added as tester in TestFlight
- Verify iOS version is 13+
- Try removing and reinstalling TestFlight app

### "Android Won't Install"
- Enable "Install Unknown Apps" for your browser/file manager
- Check Android version is 8.0+
- Ensure file downloaded completely
- Try downloading APK again

## 📞 Need Help?

**EAS Build Issues:**
- Docs: https://docs.expo.dev/build/introduction/
- Status: https://status.expo.dev/

**TestFlight:**
- Guide: https://developer.apple.com/testflight/

**Questions?**
- Check DISTRIBUTION.md for detailed instructions
- Visit Expo forums: https://forums.expo.dev/

## 🎯 Success!

If you can:
- ✅ Install app on your iPhone/iPad
- ✅ Install app on Android phone
- ✅ Log in with phone number
- ✅ Create an arrangement
- ✅ Send messages

**You're ready to invite more testers!** 🎉

---

**Next Steps:**
1. Invite 2-3 beta testers to get feedback
2. Make improvements based on feedback
3. Rebuild and redistribute
4. Expand to more testers
5. Submit to App Store/Play Store when ready

See DISTRIBUTION.md for full distribution guide.

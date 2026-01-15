# 🚀 Build Walkthrough - Your First FA Direct Build

Let's build FA Direct and get it running on your devices! This guide will walk you through every step.

## 📋 Before You Start

**What you need:**
- ✅ Windows PC
- ✅ 30 minutes of time
- ✅ Internet connection
- ✅ Your iPhone/iPad or Android phone ready

**Accounts you'll create (as we go):**
- Expo account (free, 2 minutes)
- Firebase project (free, 10 minutes)
- Apple Developer ($99/year) - only if testing on iOS
- Google Play ($25 once) - optional for Android

## 🎯 Step-by-Step Process

### Step 1: Check Your Environment (2 minutes)

Open PowerShell or Command Prompt and navigate to the project:

```bash
cd FADirect

# Run the prerequisite checker
npm run check
```

**What this checks:**
- ✅ Node.js version (need 18+)
- ✅ npm version (need 9+)
- ✅ EAS CLI installed
- ✅ Firebase config files
- ✅ Project dependencies

**If you see errors**, follow the instructions it provides. Common fixes:

```bash
# If Node.js is old
# Download from: https://nodejs.org (get LTS version)

# If EAS CLI is missing
npm install -g eas-cli

# If dependencies are missing
npm install
```

### Step 2: Setup Expo Account (3 minutes)

```bash
# Login to Expo (creates account if you don't have one)
eas login
```

**Follow the prompts:**
1. If you don't have an account, choose "Sign up"
2. Enter your email
3. Create a password
4. Verify your email
5. Login

**No credit card required!** Free tier includes 30 builds per month.

### Step 3: Setup Firebase (10 minutes)

#### Create Firebase Project

1. Open browser → https://console.firebase.google.com
2. Click **"Create Project"** or **"Add Project"**
3. Project name: `FA Direct Dev` (or your choice)
4. Google Analytics: **Disable** (for simpler setup)
5. Click **"Create Project"**
6. Wait ~30 seconds
7. Click **"Continue"**

#### Add iOS App to Firebase

1. On project homepage, click **iOS icon** (or "Add app" → iOS)
2. **iOS bundle ID**: `com.fadirect.app` (must match exactly!)
3. **App nickname**: `FA Direct iOS`
4. Click **"Register app"**
5. Click **"Download GoogleService-Info.plist"**
6. **IMPORTANT:** Save this file to your `FADirect` project folder (the root, same level as package.json)
7. Click **"Next"** → **"Next"** → **"Continue to console"**

#### Add Android App to Firebase

1. On project homepage, click **Android icon** (or "Add app" → Android)
2. **Android package name**: `com.fadirect.app` (must match exactly!)
3. **App nickname**: `FA Direct Android`
4. Click **"Register app"**
5. Click **"Download google-services.json"**
6. **IMPORTANT:** Save this file to your `FADirect` project folder (root)
7. Click **"Next"** → **"Next"** → **"Continue to console"**

#### Enable Firebase Services

1. In Firebase Console, left menu → **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click **"Phone"** → **Enable** → **Save**

5. Left menu → **"Build"** → **"Firestore Database"**
6. Click **"Create database"**
7. Choose **"Start in test mode"** (for development)
8. Location: **"australia-southeast1 (Sydney)"**
9. Click **"Enable"**

10. Left menu → **"Build"** → **"Storage"**
11. Click **"Get started"**
12. Choose **"Start in test mode"**
13. Same location: **"australia-southeast1"**
14. Click **"Done"**

**✅ Firebase setup complete!**

### Step 4: Verify Firebase Files (1 minute)

Check that your files are in the right place:

```bash
# Run the checker again
npm run check
```

You should see:
- ✅ Android Firebase Config - google-services.json found
- ✅ iOS Firebase Config - GoogleService-Info.plist found

**If not found:**
- Make sure files are in project root (same folder as package.json)
- Check the file names match exactly (case-sensitive!)

### Step 5: Configure EAS Build (3 minutes)

```bash
# Initialize EAS for this project
eas build:configure
```

**You'll be asked:**

**"Would you like to automatically create an EAS project?"**
→ Answer: **Y** (Yes)

**"Generate a new project ID?"**
→ Answer: **Y** (Yes)

**What happens:**
- Creates EAS project linked to your account
- Updates app.json with your project ID
- Creates/updates eas.json configuration

You should see: ✅ "EAS project created!"

### Step 6: Choose Your Platform (Decision Point)

You need to decide which platform(s) to build for first:

**Option A: iOS Only** (need Apple Developer account - $99/year)
- Best if you primarily use iPhone/iPad
- TestFlight distribution to testers
- Continue to Step 7a

**Option B: Android Only** (free or $25 for Play Store)
- Free if using APK distribution
- $25 if using Google Play Internal Testing
- Continue to Step 7b

**Option C: Both Platforms** (recommended but costs $99-124)
- Maximum reach to testers
- Continue to both 7a and 7b

### Step 7a: Setup Apple Developer (iOS - 10 minutes)

**Only do this if building for iOS**

#### Sign Up

1. Go to: https://developer.apple.com/programs/
2. Click **"Enroll"**
3. Sign in with your Apple ID
4. Follow enrollment process
5. Pay **$99** (annual fee)
6. Wait for approval (usually instant, can take 1-2 days)

#### Create App in App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Sign in with same Apple ID
3. Click **"My Apps"**
4. Click **"+"** → **"New App"**
5. Fill in:
   - **Platform**: iOS
   - **Name**: FA Direct
   - **Primary Language**: English (Australia)
   - **Bundle ID**: Select **"com.fadirect.app"** from dropdown
     - If not in dropdown, click "Register a new bundle ID" and enter `com.fadirect.app`
   - **SKU**: fadirect
6. Click **"Create"**

**✅ iOS setup complete!**

### Step 7b: Setup Google Play (Android - Optional, 10 minutes)

**Only needed if you want Play Store distribution**
**Skip if you'll use direct APK installation**

1. Go to: https://play.google.com/console/signup
2. Sign in with Google account
3. Pay **$25** (one-time fee)
4. Complete developer account setup
5. Accept terms
6. Click **"Create app"**
7. Fill in:
   - **App name**: FA Direct
   - **Default language**: English (Australia)
   - **App or Game**: App
   - **Free or Paid**: Free
8. Accept declarations
9. Click **"Create app"**

**✅ Android setup complete!**

### Step 8: Your First Build! (15 minutes)

Now for the exciting part - let's build the app!

#### Choose which platform to build:

**For iOS only:**
```bash
npm run build:ios:preview
```

**For Android only:**
```bash
npm run build:android:preview
```

**For both platforms:**
```bash
npm run build:preview
```

#### What happens next:

1. **Upload** (30 seconds)
   - Your code uploads to EAS servers
   - You'll see a progress bar

2. **Queue** (0-5 minutes)
   - Build queued on EAS servers
   - Free tier may have short wait

3. **Build** (10-15 minutes for iOS, 5-10 for Android)
   - EAS builds your app in the cloud
   - You'll see build logs in terminal
   - You can close terminal and check later

4. **Complete**
   - You get a download link
   - Build appears in your Expo dashboard

**While building, you'll see:**
```
✔ Build started
✔ Uploading code
✔ Build queued
✔ Build started on EAS servers
⠋ Building... (this takes ~10-15 minutes)
```

**You can:**
- Leave terminal open and watch
- Close terminal and check: `eas build:list`
- View in browser: https://expo.dev/accounts/[your-username]/projects/fadirect/builds

### Step 9: Check Build Status

If you closed the terminal or want to check status:

```bash
# List all your builds
eas build:list

# View specific build details
eas build:view [build-id]
```

**Build statuses:**
- 🟡 **In Queue**: Waiting to start
- 🔵 **In Progress**: Currently building
- 🟢 **Finished**: Success! Ready to download
- 🔴 **Errored**: Something went wrong (check logs)

### Step 10: Install on Your Devices

#### iOS Installation (via TestFlight)

**Submit to TestFlight:**
```bash
npm run submit:ios
```

**You'll be prompted:**
- Apple ID email
- Apple ID password
- App-specific password (if you use 2FA)

**Generate app-specific password (if needed):**
1. Go to: https://appleid.apple.com
2. Sign-in & Security → App-Specific Passwords
3. Generate new password
4. Copy and use in terminal

**Add yourself as tester:**
1. Go to: https://appstoreconnect.apple.com
2. Your app → **TestFlight** tab
3. Click **"Internal Testing"** (under the "Internal Group")
4. Click **"+"** next to Testers
5. Enter your email (same as Apple ID)
6. Click **"Add"**

**Install on your iPhone:**
1. Open **App Store** on your iPhone
2. Search **"TestFlight"** and install it (if not already installed)
3. Check your email for TestFlight invitation
4. Open email, click **"View in TestFlight"**
5. TestFlight app opens → Click **"Accept"** → **"Install"**
6. FA Direct installs on your iPhone!

#### Android Installation (Direct APK)

After build completes, you'll get a download link.

**On your Android phone:**

**Method 1: Download directly on phone**
1. Copy the download link from EAS
2. Open link in phone's browser
3. Download APK
4. Tap downloaded file
5. If prompted: **Settings** → **Install unknown apps** → **[Your Browser]** → **Allow**
6. Tap **Install**
7. Open FA Direct!

**Method 2: Download on PC, transfer to phone**
1. Download APK from EAS link on PC
2. Connect phone via USB
3. Copy APK to phone's Downloads folder
4. On phone: Open **Files** app → **Downloads**
5. Tap the APK file
6. Allow installation → **Install**

**Method 3: Google Play Internal Testing** (if you set it up)
```bash
npm run submit:android
```
Then add testers in Play Console and share opt-in link.

### Step 11: Test the App!

Open FA Direct on your device and test:

**Authentication Flow:**
1. App opens to phone auth screen
2. Enter phone number (use +61 4XX XXX XXX format)
3. For testing, add test numbers in Firebase:
   - Firebase Console → Authentication → Sign-in method
   - Phone → Add test number: `+61400000000` code: `123456`
4. Enter code → Verify
5. Complete profile setup

**Test Core Features:**
- ✅ Create arrangement (if you're Arranger)
- ✅ View arrangement
- ✅ Check workflow steps
- ✅ Send a message
- ✅ Upload a photo
- ✅ Upload a document

**Found bugs?** That's expected in first build! Make notes and fix them in code.

## 🎉 Success! What Next?

You've successfully:
- ✅ Built iOS and/or Android app from Windows
- ✅ Submitted to TestFlight and/or Play Store
- ✅ Installed on your device
- ✅ Tested basic functionality

### Next Steps:

**1. Add More Testers**
- iOS: Add emails in TestFlight
- Android: Share APK link or Play Store opt-in

**2. Make Updates**
- Fix bugs you found
- Update version in app.json
- Rebuild: `npm run build:preview`
- Resubmit: `npm run submit:ios` / `npm run submit:android`

**3. Gather Feedback**
- Send TestFlight invites to 5-10 funeral homes
- Ask them to test real scenarios
- Collect feedback

**4. Iterate**
- Improve based on feedback
- Add features
- Rebuild and redistribute

## 🐛 Troubleshooting

### Build Failed

**Check the logs:**
```bash
eas build:list
eas build:view [build-id]
```

**Common issues:**

**"Firebase config not found"**
- Ensure google-services.json and GoogleService-Info.plist are in project root
- Run `npm run check` to verify

**"Bundle ID doesn't exist"**
- Verify bundle ID in app.json matches Apple Developer Portal
- iOS: Should be `com.fadirect.app`
- Android: Should be `com.fadirect.app`

**"Build quota exceeded"**
- Free tier: 30 builds/month
- Either wait for next month or upgrade to paid plan

### TestFlight Issues

**"Can't submit to TestFlight"**
- Verify Apple Developer account is active ($99 paid)
- Check app exists in App Store Connect
- Ensure you're using correct Apple ID

**"Invite not received"**
- Check spam folder
- Verify email matches tester list
- Resend invitation in App Store Connect

### Android Install Issues

**"Can't install app"**
- Enable "Install unknown apps" for your browser
- Settings → Apps → [Browser] → Install unknown apps → Allow
- Try redownloading APK

**"App not compatible"**
- Check Android version (need 8.0+)
- Verify APK is for correct architecture

## 📞 Need More Help?

**Resources:**
- Full guide: `WINDOWS_TESTING_GUIDE.md`
- Quick reference: `QUICK_START_DISTRIBUTION.md`
- Distribution details: `DISTRIBUTION.md`

**Online Help:**
- EAS Builds: https://docs.expo.dev/build/
- Expo Forums: https://forums.expo.dev/
- Firebase: https://firebase.google.com/support

**Common Questions:**

**Q: How long do builds take?**
A: iOS: 10-15 min, Android: 5-10 min

**Q: How many builds can I do?**
A: Free tier: 30/month. Paid: unlimited ($29/mo)

**Q: Do I need a Mac?**
A: No! EAS builds iOS apps in the cloud

**Q: How much does it cost?**
A: iOS: $99/year (Apple). Android: $0-25. EAS: Free (30 builds/mo)

**Q: Can I update the app later?**
A: Yes! Just rebuild and resubmit. Testers get notified automatically.

## ✅ Checklist

Before moving forward, verify:

- [ ] Ran `npm run check` - all green
- [ ] Created Expo account
- [ ] Created Firebase project
- [ ] Downloaded Firebase config files
- [ ] Configured EAS build
- [ ] Set up Apple Developer (for iOS)
- [ ] Built app successfully
- [ ] Submitted to TestFlight or generated APK
- [ ] Installed on your device
- [ ] Tested basic features
- [ ] Took notes on what to improve

---

**🎉 Congratulations! You've built and deployed FA Direct!**

Ready to add more testers? See DISTRIBUTION.md for tester management.

Have feedback on this guide? Let us know what was helpful or confusing!

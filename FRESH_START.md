# Fresh Start Guide

Follow these steps to clean up everything and start fresh with a streamlined workflow.

## Step 1: Clean Up Current Installation

### On Windows (PowerShell):

```powershell
# 1. Navigate out of the project directory
cd C:\

# 2. Remove the entire FADirect folder
Remove-Item -Recurse -Force C:\FADirect

# 3. Done! Old installation is removed.
```

## Step 2: Fresh Clone

```powershell
# 1. Navigate to where you want the project
cd C:\

# 2. Clone the repository
git clone https://github.com/madcrx/FADirect.git

# 3. Enter the directory
cd FADirect

# 4. Install dependencies
npm install

# 5. Log in to Expo (if not already logged in)
npx expo login
# Use: info@epsicon.com.au
```

That's it! You're ready to go.

## Step 3: First Build

```powershell
# Build for testing on iPhone
npm run build:preview
```

**What happens:**
- Build starts on Expo servers (no local setup needed!)
- Takes about 20-30 minutes
- You'll see build progress in terminal
- When done, you get a URL to download the app

## Step 4: Install on iPhone

### Option A: Expo Orbit (Recommended - Easiest!)

1. **Install Expo Orbit** on your computer
   - Download from: https://expo.dev/orbit
   - Install and open it

2. **Log in to Expo Orbit**
   - Use: info@epsicon.com.au
   - Same credentials as `npx expo login`

3. **Wait for build to complete**
   - Build will automatically appear in Expo Orbit
   - Click "Install on Device"
   - Select your iPhone (must be connected via USB or same WiFi)
   - App installs automatically!

4. **Trust the developer certificate**
   - On iPhone: Settings → General → VPN & Device Management
   - Tap "Brett Farley" → Trust

5. **Open the app!**

### Option B: Direct Download (Alternative)

1. When build completes, open the build URL on your iPhone
2. Tap "Install" or "Download"
3. Trust certificate (Settings → General → VPN & Device Management → Brett Farley → Trust)
4. Open the app

## Step 5: Make Changes and Republish

This is your everyday workflow:

```powershell
# 1. Make code changes in your editor

# 2. Test locally if you want (optional)
npm start

# 3. Commit your changes
git add .
git commit -m "Description of what you changed"
git push

# 4. Rebuild for testing
npm run build:preview

# 5. Wait for build (~20-30 min)

# 6. Install on iPhone again (via Expo Orbit or direct download)
```

## Streamlined Workflow Summary

```
MAKE CHANGES → COMMIT → PUSH → BUILD → INSTALL → TEST → REPEAT
```

That's it! No complex setup, no local simulators, no Xcode needed.

## Common Commands

```powershell
# Build for testing
npm run build:preview           # iOS + Android
npm run build:ios:preview       # iOS only

# View recent builds
# Go to: https://expo.dev/accounts/madcrx/projects/fadirect/builds

# Check build status
eas build:list --limit 5
```

## Important URLs

- **Builds**: https://expo.dev/accounts/madcrx/projects/fadirect/builds
- **Supabase Dashboard**: https://supabase.com/dashboard/project/wvxnwecxupvwappomajl
- **Expo Orbit**: https://expo.dev/orbit
- **GitHub Repo**: https://github.com/madcrx/FADirect

## What You Need

**Software:**
- Node.js (already installed)
- Git (already installed)
- Expo Orbit (download once)

**Accounts:**
- Expo: info@epsicon.com.au
- Apple Developer: Brett Farley (B672DMM8X6)
- Supabase: wvxnwecxupvwappomajl.supabase.co

**Hardware:**
- iPhone (registered device)
- Computer with internet

## Tips

1. **Save time**: Use `npm run build:ios:preview` instead of building both platforms
2. **Expo Orbit**: Keeps history of all builds, easy to reinstall previous versions
3. **Git commits**: Make small, frequent commits with clear messages
4. **Build times**: Builds take 20-30 minutes, plan accordingly
5. **Backend**: App uses Supabase for authentication, database, and storage

## If Something Goes Wrong

**Build fails:**
```powershell
# Check the build logs URL shown in terminal
# Most common: EAS build secrets not configured correctly
```

**App crashes on iPhone:**
```powershell
# 1. Make sure you trusted the certificate
# 2. Check build logs for errors
# 3. Verify app installed correctly via Expo Orbit
```

**Can't push to GitHub:**
```powershell
# Make sure you're on the right branch
git branch

# Should show: claude/fix-build-errors-XqVrB
```

## Need Help?

1. Check build logs: https://expo.dev/accounts/madcrx/projects/fadirect/builds
2. Check Supabase Dashboard: https://supabase.com/dashboard/project/wvxnwecxupvwappomajl
3. Review the simple README.md in the project

---

**You're all set!** The streamlined workflow is:
1. Make changes
2. Commit & push
3. Build
4. Install
5. Test
6. Repeat

No more confusion with multiple tools and complex setups!

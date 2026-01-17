# Firebase Setup for EAS Build

## The Problem

EAS Build validates Firebase configuration files (`google-services.json` and `GoogleService-Info.plist`). If these files contain placeholder values, the build will fail with "file is missing" errors, even though the files are tracked in git.

## Solution Options

### Option 1: Use EAS File Secrets (Recommended for Production)

This approach keeps your Firebase credentials secure and out of version control.

#### Step 1: Get Your Firebase Configuration Files

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. For Android:
   - Go to Project Settings → Your Apps → Android App
   - Download `google-services.json`
4. For iOS:
   - Go to Project Settings → Your Apps → iOS App
   - Download `GoogleService-Info.plist`

#### Step 2: Convert Files to Base64

**macOS/Linux:**
```bash
# Android
base64 -i google-services.json | pbcopy

# iOS
base64 -i GoogleService-Info.plist | pbcopy
```

**Windows (PowerShell):**
```powershell
# Android
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json")) | Set-Clipboard

# iOS
[Convert]::ToBase64String([IO.File]::ReadAllBytes("ios\GoogleService-Info.plist")) | Set-Clipboard
```

#### Step 3: Create EAS Secrets

```bash
# Set Android Firebase config
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value "$(base64 -i google-services.json)"

# Set iOS Firebase config
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value "$(base64 -i ios/GoogleService-Info.plist)"
```

#### Step 4: Update eas.json

Add the following to your build profiles in `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "GOOGLE_SERVICES_JSON": "@file:google-services.json",
        "GOOGLE_SERVICE_INFO_PLIST": "@file:ios/GoogleService-Info.plist"
      },
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "GOOGLE_SERVICES_JSON": "@file:google-services.json",
        "GOOGLE_SERVICE_INFO_PLIST": "@file:ios/GoogleService-Info.plist"
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Option 2: Use Real Firebase Credentials in Repo (Quick Testing)

**⚠️ Warning:** Only use this for private repositories or testing. Never commit real credentials to public repos.

1. Download your real Firebase configuration files from Firebase Console
2. Replace the placeholder files:
   - `google-services.json` (root directory)
   - `ios/GoogleService-Info.plist`
3. Commit and push the changes
4. Run your build

```bash
# After adding real Firebase files
git add google-services.json ios/GoogleService-Info.plist
git commit -m "Add Firebase configuration"
git push
```

### Option 3: Temporarily Disable Firebase (Not Recommended)

The app uses Firebase for core functionality, so this will cause runtime errors. Only use this for testing non-Firebase features.

The `app.config.js` file automatically detects invalid Firebase configs and excludes them from the build. The build will succeed, but Firebase features won't work.

## Current Status

The repository has:
- ✓ Placeholder `google-services.json` with fake values
- ✓ Placeholder `ios/GoogleService-Info.plist` with fake values
- ✓ `app.config.js` that validates Firebase configs before including them
- ✓ `.gitignore` configured to allow Firebase files (lines 72-73 commented out)

## Next Steps

**Choose ONE of the options above:**

1. **For production/secure builds:** Use Option 1 (EAS Secrets)
2. **For quick testing:** Use Option 2 (Real credentials in repo)
3. **For non-Firebase testing:** Use Option 3 (Disable Firebase)

## Verifying Your Setup

After setting up Firebase configs, verify they work:

```bash
# Check if configs are valid
npm run build:preview

# If using EAS Secrets, verify they're set
eas secret:list --scope project
```

## Troubleshooting

### Build fails with "google-services.json is missing"
- If using EAS Secrets: Verify the secret is created with `eas secret:list`
- If using repo files: Check that the file contains real values, not placeholders
- Check that `app.config.js` is detecting the files as valid

### Firebase doesn't work at runtime
- Verify your Firebase project is properly configured in Firebase Console
- Check that all required Firebase services are enabled (Auth, Firestore, Storage, etc.)
- Review your Firestore Security Rules and Storage Rules

### "Your API key is restricted" errors
- Go to Google Cloud Console → APIs & Services → Credentials
- Find your API key and update the restrictions to allow your app's bundle ID

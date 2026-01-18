const fs = require('fs');
const path = require('path');

// Function to check if Firebase config files exist
const hasFirebaseConfigs = () => {
  const androidConfig = path.join(__dirname, 'google-services.json');
  const iosConfig = path.join(__dirname, 'ios', 'GoogleService-Info.plist');

  const androidExists = fs.existsSync(androidConfig);
  const iosExists = fs.existsSync(iosConfig);

  // Check if files have real content (not placeholder values)
  let androidValid = false;
  let iosValid = false;

  if (androidExists) {
    const content = fs.readFileSync(androidConfig, 'utf8');
    androidValid = !content.includes('YOUR_PROJECT_NUMBER');
  }

  if (iosExists) {
    const content = fs.readFileSync(iosConfig, 'utf8');
    iosValid = !content.includes('YOUR_IOS_API_KEY');
  }

  return { androidValid, iosValid };
};

const firebaseConfig = hasFirebaseConfigs();

module.exports = ({ config }) => {
  const baseConfig = {
    ...config,
    name: 'FA Direct',
    slug: 'fadirect',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    splash: {
      backgroundColor: '#1A3A52',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fadirect.app',
      buildNumber: '1',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'FA Direct needs access to your photo library to upload photos for arrangements.',
        NSCameraUsageDescription: 'FA Direct needs access to your camera to take photos for arrangements.',
        NSMicrophoneUsageDescription: 'FA Direct needs access to your microphone for future video calling features.',
        NSLocationWhenInUseUsageDescription: 'FA Direct needs your location to show nearby funeral services.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1A3A52',
      },
      package: 'com.fadirect.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
      ],
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            deploymentTarget: '13.4',
          },
        },
      ],
    ],
  };

  // Only add Firebase config if valid files exist
  if (firebaseConfig.iosValid) {
    baseConfig.ios.googleServicesFile = './ios/GoogleService-Info.plist';
  }

  if (firebaseConfig.androidValid) {
    baseConfig.android.googleServicesFile = './google-services.json';
  }

  return baseConfig;
};

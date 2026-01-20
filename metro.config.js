const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Provide stub modules for Firebase packages to allow build to succeed
// The project has migrated to Supabase - stub modules prevent resolution errors
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@react-native-firebase/auth': path.resolve(__dirname, '.stubs/@react-native-firebase/auth'),
    '@react-native-firebase/firestore': path.resolve(__dirname, '.stubs/@react-native-firebase/firestore'),
    '@react-native-firebase/storage': path.resolve(__dirname, '.stubs/@react-native-firebase/storage'),
    '@react-native-firebase/functions': path.resolve(__dirname, '.stubs/@react-native-firebase/functions'),
    '@react-native-firebase/messaging': path.resolve(__dirname, '.stubs/@react-native-firebase/messaging'),
  },
};

module.exports = config;

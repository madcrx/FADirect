const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Block Firebase modules from being resolved during build
// The project has migrated to Supabase - using compatibility layer instead
config.resolver = {
  ...config.resolver,
  blacklistRE: /@react-native-firebase\/.*/,
};

module.exports = config;

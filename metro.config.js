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
  nodeModulesPaths: [
    path.resolve(__dirname, '.stubs'),
    path.resolve(__dirname, 'node_modules'),
  ],
};

module.exports = config;

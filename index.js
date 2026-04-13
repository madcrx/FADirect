/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL CRITICAL CRITICAL: URL polyfill MUST BE ABSOLUTELY FIRST
// Import before ANY other code including console.log
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Lock down URL/URLSearchParams to prevent Expo from overwriting them
// Expo's winter/runtime.native.ts tries to install its own lazy URL polyfill
// which conflicts with react-native-url-polyfill and causes crashes
Object.defineProperty(global, 'URL', {
  configurable: false,  // Make it non-configurable so Expo can't overwrite
  enumerable: true,
  writable: false,
  value: global.URL
});
Object.defineProperty(global, 'URLSearchParams', {
  configurable: false,
  enumerable: true,
  writable: false,
  value: global.URLSearchParams
});

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

console.log('=== Polyfills loaded and locked ===');
console.log('URL available:', typeof URL !== 'undefined');
console.log('URLSearchParams available:', typeof URLSearchParams !== 'undefined');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL: URL polyfill MUST BE ABSOLUTELY FIRST
// Import before ANY other code including console.log
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Minimal logging - don't interfere with XHR operation
console.log('🔍 === DIAGNOSTIC MODE ===');
console.log('🔍 XMLHttpRequest exists:', typeof global.XMLHttpRequest);
console.log('🔍 URL polyfill loaded:', typeof URL !== 'undefined');

// Log entry point
console.log('=== index.js loading ===');
console.log('=== Polyfills loaded ===');
console.log('URL available:', typeof URL !== 'undefined');
console.log('URLSearchParams available:', typeof URLSearchParams !== 'undefined');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

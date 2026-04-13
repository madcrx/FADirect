/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL: Polyfills MUST BE ABSOLUTELY FIRST
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import 'whatwg-fetch';  // Pure JS fetch implementation - bypass native XHR bug

console.log('=== index.js loading ===');
console.log('=== Polyfills loaded (including whatwg-fetch) ===');
console.log('URL available:', typeof URL !== 'undefined');
console.log('URLSearchParams available:', typeof URLSearchParams !== 'undefined');
console.log('fetch available:', typeof fetch !== 'undefined');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

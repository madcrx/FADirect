/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL: URL polyfill MUST BE ABSOLUTELY FIRST
// Import before ANY other code including console.log
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// CRITICAL: Patch XMLHttpRequest before React Native loads it
// React Native 0.83.4 has a bug where XMLHttpRequest constants are frozen
if (global.XMLHttpRequest) {
  const OriginalXHR = global.XMLHttpRequest;
  global.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    // Make sure properties are configurable
    try {
      if (xhr.NONE !== undefined) {
        Object.defineProperty(xhr, 'NONE', {
          value: xhr.NONE,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    } catch (e) {
      // Ignore if property doesn't exist
    }
    return xhr;
  };
  // Copy static properties
  Object.setPrototypeOf(global.XMLHttpRequest, OriginalXHR);
  Object.setPrototypeOf(global.XMLHttpRequest.prototype, OriginalXHR.prototype);
}

// Log entry point - if this doesn't show, JS bundle isn't loading
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

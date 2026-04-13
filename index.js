/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL: URL polyfill MUST BE ABSOLUTELY FIRST
// Import before ANY other code including console.log
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// CRITICAL: Patch Event constructor to fix NONE property bug
// React Native 0.83.4 bug where Event/XMLHttpRequest constants are frozen
const OriginalEvent = global.Event;
if (OriginalEvent) {
  global.Event = function Event(type, eventInitDict) {
    const event = new OriginalEvent(type, eventInitDict);
    // Prevent NONE property from being read-only
    const descriptor = Object.getOwnPropertyDescriptor(event, 'NONE');
    if (descriptor && !descriptor.writable) {
      try {
        Object.defineProperty(event, 'NONE', {
          ...descriptor,
          writable: true,
          configurable: true,
        });
      } catch (e) {
        // Ignore if we can't modify it
      }
    }
    return event;
  };
  global.Event.prototype = OriginalEvent.prototype;
}

// Patch XMLHttpRequest readyState constants
if (global.XMLHttpRequest) {
  const states = ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE', 'NONE'];
  const XHRProto = global.XMLHttpRequest.prototype;
  states.forEach(state => {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(XHRProto, state);
      if (descriptor && !descriptor.writable) {
        Object.defineProperty(XHRProto, state, {
          ...descriptor,
          writable: true,
          configurable: true,
        });
      }
    } catch (e) {
      // Ignore
    }
  });
}

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

console.log('=== Polyfills and patches loaded ===');
console.log('URL available:', typeof URL !== 'undefined');
console.log('URLSearchParams available:', typeof URLSearchParams !== 'undefined');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

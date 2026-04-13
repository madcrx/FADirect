/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// CRITICAL: URL polyfill MUST BE ABSOLUTELY FIRST
// Import before ANY other code including console.log
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// === COMPREHENSIVE DEBUGGING FOR NONE ERROR ===
console.log('🔍 === DIAGNOSTIC MODE ENABLED ===');

// Global error handler to catch NONE errors
const originalErrorHandler = global.ErrorUtils?.getGlobalHandler();
global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
  if (error && error.message && error.message.includes('NONE')) {
    console.error('🚨 NONE ERROR CAUGHT BY GLOBAL HANDLER:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    console.error('  Fatal:', isFatal);
  }
  if (originalErrorHandler) {
    originalErrorHandler(error, isFatal);
  }
});

// Log initial state of XMLHttpRequest
console.log('🔍 Initial XMLHttpRequest state:');
if (global.XMLHttpRequest) {
  const xhr = new global.XMLHttpRequest();
  console.log('  XMLHttpRequest exists:', typeof global.XMLHttpRequest);
  console.log('  XHR instance:', typeof xhr);

  // Check all possible NONE locations
  const checkNONE = (obj, name) => {
    if (obj && obj.NONE !== undefined) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, 'NONE');
      console.log(`  ${name}.NONE:`, {
        value: obj.NONE,
        writable: descriptor?.writable,
        configurable: descriptor?.configurable,
        enumerable: descriptor?.enumerable,
      });
    }
  };

  checkNONE(global.XMLHttpRequest, 'XMLHttpRequest (static)');
  checkNONE(global.XMLHttpRequest.prototype, 'XMLHttpRequest.prototype');
  checkNONE(xhr, 'xhr instance');
}

// Wrap XMLHttpRequest to log all operations
if (global.XMLHttpRequest) {
  const OriginalXHR = global.XMLHttpRequest;

  global.XMLHttpRequest = function XMLHttpRequest() {
    console.log('🔍 XMLHttpRequest constructor called');
    const xhr = new OriginalXHR();

    // Wrap open method
    const originalOpen = xhr.open;
    xhr.open = function(...args) {
      console.log('🔍 XHR.open called:', args[0], args[1]);
      try {
        return originalOpen.apply(this, args);
      } catch (e) {
        console.error('🚨 Error in XHR.open:', e.message);
        throw e;
      }
    };

    // Wrap send method
    const originalSend = xhr.send;
    xhr.send = function(...args) {
      console.log('🔍 XHR.send called');
      try {
        return originalSend.apply(this, args);
      } catch (e) {
        console.error('🚨 Error in XHR.send:', e.message);
        throw e;
      }
    };

    // Wrap setRequestHeader
    const originalSetRequestHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function(...args) {
      console.log('🔍 XHR.setRequestHeader:', args[0]);
      try {
        return originalSetRequestHeader.apply(this, args);
      } catch (e) {
        console.error('🚨 Error in XHR.setRequestHeader:', e.message);
        throw e;
      }
    };

    // Monitor readyState changes
    Object.defineProperty(xhr, 'readyState', {
      get() {
        const state = Object.getOwnPropertyDescriptor(OriginalXHR.prototype, 'readyState')?.get?.call(this);
        return state;
      },
      set(value) {
        console.log('🔍 XHR.readyState changing to:', value);
        try {
          Object.getOwnPropertyDescriptor(OriginalXHR.prototype, 'readyState')?.set?.call(this, value);
        } catch (e) {
          console.error('🚨 Error setting readyState:', e.message);
          throw e;
        }
      },
      configurable: true,
      enumerable: true,
    });

    return xhr;
  };

  // Copy all static properties and prototype
  Object.setPrototypeOf(global.XMLHttpRequest, OriginalXHR);
  Object.setPrototypeOf(global.XMLHttpRequest.prototype, OriginalXHR.prototype);

  // Copy constants
  ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'].forEach(constant => {
    if (OriginalXHR[constant] !== undefined) {
      global.XMLHttpRequest[constant] = OriginalXHR[constant];
    }
  });
}

// Wrap Event constructor
if (global.Event) {
  const OriginalEvent = global.Event;

  global.Event = function Event(type, eventInitDict) {
    console.log('🔍 Event constructor called:', type);
    try {
      const event = new OriginalEvent(type, eventInitDict);

      // Log NONE property if it exists
      if (event.NONE !== undefined) {
        const descriptor = Object.getOwnPropertyDescriptor(event, 'NONE');
        console.log('🔍 Event.NONE found:', {
          value: event.NONE,
          writable: descriptor?.writable,
          configurable: descriptor?.configurable,
        });
      }

      return event;
    } catch (e) {
      console.error('🚨 Error in Event constructor:', e.message, e.stack);
      throw e;
    }
  };

  global.Event.prototype = OriginalEvent.prototype;
  Object.setPrototypeOf(global.Event, OriginalEvent);
}

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

console.log('=== Polyfills and debugging loaded ===');
console.log('URL available:', typeof URL !== 'undefined');
console.log('URLSearchParams available:', typeof URLSearchParams !== 'undefined');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

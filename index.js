/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

// CRITICAL: This must be imported FIRST before any other imports
// It polyfills crypto.getRandomValues for React Native
import 'react-native-get-random-values';

console.log('=== Crypto polyfill loaded ===');

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('=== Registering app component ===');
AppRegistry.registerComponent(appName, () => App);
console.log('=== App registered successfully ===');

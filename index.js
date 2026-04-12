/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

// CRITICAL: Polyfills must be imported FIRST
import 'react-native-get-random-values';
// Note: URL polyfill removed - not needed with custom API backend

console.log('=== Polyfills loaded ===');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

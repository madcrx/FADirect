/**
 * FA Direct - Funeral Arranger Direct
 * Secure communication platform for funeral arrangers and mourners
 */

// Log entry point - if this doesn't show, JS bundle isn't loading
console.log('=== index.js loading ===');

// CRITICAL: These polyfills must be imported FIRST before any other imports
// They polyfill crypto.getRandomValues and URL for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

console.log('=== Crypto and URL polyfills loaded ===');

import { AppRegistry } from 'react-native';
import App from './App';

console.log('=== Registering app component ===');
// For Expo projects, the app name is always "main"
AppRegistry.registerComponent('main', () => App);
console.log('=== App registered successfully ===');

/**
 * FA Direct - Entry Point
 * Loads polyfills before app initialization
 */

// CRITICAL: Load polyfills FIRST, before any other imports
import { TextEncoder, TextDecoder } from 'fast-text-encoding';

// Polyfill global TextEncoder/TextDecoder for libsignal and other libraries
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Now register the app
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

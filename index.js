/**
 * FA Direct - Entry Point
 * Loads polyfills before app initialization
 */

// Load polyfills FIRST, before any other imports
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Now register the app
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

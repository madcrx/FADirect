import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * OFFLINE MODE ROOT NAVIGATOR
 * Minimal navigator without any Supabase dependencies
 */

console.log('=== RootNavigator loading (offline mode) ===');

const RootNavigator = () => {
  console.log('=== RootNavigator rendering ===');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📴 FA Direct</Text>
        <Text style={styles.subtitle}>Offline Mode</Text>
        <Text style={styles.message}>
          App is running in offline mode.{'\n'}
          Supabase integration is disabled.
        </Text>
        <Text style={styles.info}>
          The app loads successfully! 🎉{'\n\n'}
          Navigation and backend features{'\n'}
          will be added once URL polyfill{'\n'}
          issues are resolved.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A3A52',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#B8956A',
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RootNavigator;

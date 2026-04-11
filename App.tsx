/**
 * ULTRA MINIMAL TEST APP - v1.0.4
 * No Redux, no Navigation, no Services - NOTHING
 * Just React Native core components
 * FORCED CACHE BUST: 2026-04-11-23:00
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

console.log('=== MINIMAL APP LOADED ===');

const App = () => {
  console.log('=== MINIMAL APP RENDERING ===');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A52" />
      <View style={styles.content}>
        <Text style={styles.title}>✅ FA Direct</Text>
        <Text style={styles.subtitle}>Minimal Test - No Services</Text>
        <Text style={styles.message}>
          If you see this, React Native is working!
        </Text>
        <Text style={styles.info}>
          No Redux • No Navigation • No Supabase
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
    fontSize: 18,
    color: '#B8956A',
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default App;

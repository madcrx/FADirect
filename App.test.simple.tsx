// ULTRA SIMPLE TEST APP
// Rename this to App.tsx to test if ANY JavaScript runs

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('========== SIMPLE APP LOADED ==========');

const App = () => {
  console.log('========== APP RENDERING ==========');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ JavaScript is Working!</Text>
      <Text style={styles.subtext}>If you see this, the JS bundle loaded</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3A52',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  subtext: {
    fontSize: 16,
    color: '#B8956A',
  },
});

export default App;

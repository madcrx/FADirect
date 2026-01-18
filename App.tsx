import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// MINIMAL TEST VERSION - Just to verify builds work
const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FA Direct</Text>
      <Text style={styles.subtitle}>Test Build</Text>
      <Text style={styles.message}>
        ✓ App is running successfully!
      </Text>
      <Text style={styles.hint}>
        If you see this, the build and installation process works.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A3A52',
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
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default App;

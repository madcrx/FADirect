import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-get-random-values'; // Required for UUID and encryption

import { store } from '@store/index';
import { theme } from '@utils/theme';
import RootNavigator from '@navigation/RootNavigator';
import { initializeFirebase } from '@services/firebase/config';
import { initializeEncryption } from '@services/encryption/signalProtocol';

// Ignore specific warnings
LogBox.ignoreLogs(['ViewPropTypes will be removed']);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Initialization Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error occurred'}
          </Text>
          <Text style={styles.errorHint}>
            Please check Firebase Console to ensure all services are enabled:
            {'\n'}- Authentication (Phone provider)
            {'\n'}- Firestore Database
            {'\n'}- Cloud Storage
            {'\n'}- Cloud Messaging
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing Firebase...');
        initializeFirebase();
        console.log('Firebase initialized');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize Firebase:', message);
        setInitError(`Firebase: ${message}`);
      }

      try {
        console.log('Initializing encryption...');
        initializeEncryption();
        console.log('Encryption initialized');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize encryption:', message);
        // Don't set error for encryption - it's less critical
      }
    };

    initializeServices();
  }, []);

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
        <Text style={styles.errorHint}>
          Check Firebase Console at:
          {'\n'}https://console.firebase.google.com/project/fa-direct
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StoreProvider store={store}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <NavigationContainer>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primary}
              />
              <RootNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default App;

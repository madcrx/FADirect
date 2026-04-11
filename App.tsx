import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as StoreProvider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from '@store/index';
import { theme } from '@utils/theme';
import RootNavigator from '@navigation/RootNavigator';
import { supabase } from '@config/supabase';
import { initializeEncryption } from '@services/encryption/signalProtocol';

// Ignore specific warnings
LogBox.ignoreLogs(['ViewPropTypes will be removed']);

// Log app start
console.log('=== FA Direct App Starting ===');

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
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.errorHint}>
            Please restart the app. If the problem persists, contact support.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeServices = async () => {
      console.log('=== Starting initialization ===');
      const errors: string[] = [];

      try {
        console.log('1. Initializing Supabase...');
        // Test Supabase connection
        const { error } = await supabase.auth.getSession();
        if (error && error.message !== 'Auth session missing!') {
          console.warn('Supabase auth error (non-critical):', error.message);
          errors.push(`Supabase: ${error.message}`);
          // Don't fail - just log the warning
        } else {
          console.log('✓ Supabase initialized successfully');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Supabase initialization error (non-critical):', message);
        errors.push(`Supabase: ${message}`);
        // Don't fail app - continue with limited functionality
      }

      try {
        console.log('2. Initializing encryption...');
        await initializeEncryption();
        console.log('✓ Encryption initialized successfully');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Failed to initialize encryption (non-critical):', message);
        errors.push(`Encryption: ${message}`);
        // Don't fail app for encryption errors - it's less critical
      }

      // Initialization complete
      console.log('3. Initialization complete');
      setIsInitializing(false);

      // Show errors if any (for debugging)
      if (errors.length > 0) {
        console.warn('Initialization completed with warnings:', errors);
        // Only show alert in development builds
        if (__DEV__) {
          Alert.alert(
            'Initialization Warnings',
            errors.join('\n\n'),
            [{ text: 'OK' }]
          );
        }
      }

      console.log('=== App ready ===');
    };

    initializeServices().catch(error => {
      console.error('FATAL: Initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
    });
  }, []);

  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
        <Text style={styles.errorHint}>
          Please check Supabase Dashboard to ensure all services are enabled:
          {'\n'}- Authentication
          {'\n'}- Database
          {'\n'}- Storage
        </Text>
      </View>
    );
  }

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>FA Direct</Text>
        <ActivityIndicator size="large" color="#B8956A" style={styles.spinner} />
        <Text style={styles.loadingText}>Initializing app...</Text>
      </View>
    );
  }

  // Render main app
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3A52',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#B8956A',
  },
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

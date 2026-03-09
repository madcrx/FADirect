import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

// Helper to safely extract error message from potentially frozen error objects
const getErrorMessage = (error: any): string => {
  try {
    return error?.message || error?.error_description || error?.msg || 'An error occurred';
  } catch {
    return 'An error occurred';
  }
};

// Safe console wrapper to handle frozen objects
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

const safeStringify = (arg: any): any => {
  if (arg === null || arg === undefined) return arg;
  if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') return arg;

  try {
    // Check if object is frozen and try to extract meaningful info
    if (Object.isFrozen(arg)) {
      if (arg instanceof Error || arg?.message) {
        return getErrorMessage(arg);
      }
      // Try to create a plain copy
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return arg;
  } catch {
    return String(arg);
  }
};

console.error = (...args: any[]) => {
  try {
    const safeArgs = args.map(safeStringify);
    originalConsoleError(...safeArgs);
  } catch (e) {
    originalConsoleError('Error in console.error:', String(e));
  }
};

console.warn = (...args: any[]) => {
  try {
    const safeArgs = args.map(safeStringify);
    originalConsoleWarn(...safeArgs);
  } catch (e) {
    originalConsoleWarn('Error in console.warn:', String(e));
  }
};

console.log = (...args: any[]) => {
  try {
    const safeArgs = args.map(safeStringify);
    originalConsoleLog(...safeArgs);
  } catch (e) {
    originalConsoleLog('Error in console.log:', String(e));
  }
};

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
    // Safely log error without modifying frozen objects
    const errorMessage = getErrorMessage(error);
    console.error('App Error:', errorMessage);
    try {
      console.error('Error Info:', JSON.stringify(errorInfo));
    } catch {
      console.error('Error Info: [Unable to stringify error info]');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Error</Text>
          <Text style={styles.errorMessage}>
            {getErrorMessage(this.state.error) || 'An unexpected error occurred'}
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
      try {
        console.log('Initializing Supabase...');
        // Test Supabase connection
        const { error } = await supabase.auth.getSession();
        if (error) {
          const errorMessage = getErrorMessage(error);
          if (errorMessage !== 'Auth session missing!') {
            throw new Error(errorMessage);
          }
        }
        console.log('✓ Supabase initialized successfully');
      } catch (error) {
        const message = getErrorMessage(error);
        console.error('Failed to initialize Supabase:', message);
        setInitError(`Supabase initialization failed: ${message}`);
        setIsInitializing(false);
        return;
      }

      try {
        console.log('Initializing encryption...');
        initializeEncryption();
        console.log('✓ Encryption initialized successfully');
      } catch (error) {
        const message = getErrorMessage(error);
        console.error('Failed to initialize encryption:', message);
        // Don't fail app for encryption errors - it's less critical
      }

      // Initialization complete
      setIsInitializing(false);
      console.log('✓ App initialization complete');
    };

    initializeServices();
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

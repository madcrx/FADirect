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
  const [initLogs, setInitLogs] = useState<string[]>([]);

  useEffect(() => {
    const initializeServices = async () => {
      const addLog = (msg: string) => {
        console.log(msg);
        setInitLogs(prev => [...prev, msg]);
      };

      addLog('🚀 Starting initialization...');
      const errors: string[] = [];

      try {
        addLog('📡 Initializing Supabase...');
        // Test Supabase connection
        const { error } = await supabase.auth.getSession();
        if (error && error.message !== 'Auth session missing!') {
          console.warn('Supabase auth error (non-critical):', error.message);
          errors.push(`Supabase: ${error.message}`);
          addLog(`⚠️ Supabase: ${error.message.substring(0, 50)}...`);
        } else {
          addLog('✅ Supabase OK');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Supabase initialization error (non-critical):', message);
        errors.push(`Supabase: ${message}`);
        addLog(`⚠️ Supabase failed: ${message.substring(0, 40)}...`);
      }

      try {
        addLog('🔐 Initializing encryption...');
        await initializeEncryption();
        addLog('✅ Encryption OK');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.warn('Failed to initialize encryption (non-critical):', message);
        errors.push(`Encryption: ${message}`);
        addLog(`⚠️ Encryption failed: ${message.substring(0, 40)}...`);
      }

      // Initialization complete
      addLog('✅ Initialization complete!');

      // Wait 2 seconds so user can see the logs, then proceed
      setTimeout(() => {
        setIsInitializing(false);
      }, 2000);

      // Show errors if any (for debugging)
      if (errors.length > 0) {
        console.warn('Initialization completed with warnings:', errors);
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

        {/* Debug logs - visible on screen */}
        <View style={styles.debugContainer}>
          {initLogs.map((log, index) => (
            <Text key={index} style={styles.debugText}>{log}</Text>
          ))}
        </View>
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
  debugContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    width: '100%',
    maxHeight: 300,
  },
  debugText: {
    fontSize: 12,
    color: '#B8956A',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default App;

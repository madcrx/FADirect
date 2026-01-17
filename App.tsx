import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
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

const App = () => {
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Firebase
        initializeFirebase();
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }

      try {
        // Initialize encryption service
        initializeEncryption();
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
      }
    };

    initializeServices();
  }, []);

  return (
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
  );
};

export default App;

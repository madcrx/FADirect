import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList, RootState } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { setUser, setLoading } from '@store/slices/authSlice';
import { theme } from '@utils/theme';

// Auth Screens
import PhoneAuthScreen from '@screens/auth/PhoneAuthScreen';
import VerifyCodeScreen from '@screens/auth/VerifyCodeScreen';
import UserSetupScreen from '@screens/auth/UserSetupScreen';

// Main App
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChanged(async user => {
      dispatch(setLoading(true));

      if (user) {
        // User is signed in, load their profile
        try {
          const userProfile = await AuthService.getUserProfile(user.uid);
          if (userProfile) {
            dispatch(setUser(userProfile));
            // Update last seen
            AuthService.updateLastSeen(user.uid);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        // User is signed out
        dispatch(setUser(null));
      }

      dispatch(setLoading(false));
      setInitializing(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (initializing || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="PhoneAuth"
            component={PhoneAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VerifyCode"
            component={VerifyCodeScreen}
            options={{ title: 'Verify Phone Number' }}
          />
          <Stack.Screen
            name="UserSetup"
            component={UserSetupScreen}
            options={{ title: 'Setup Profile', headerLeft: () => null }}
          />
        </>
      ) : (
        // Main App
        <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default RootNavigator;

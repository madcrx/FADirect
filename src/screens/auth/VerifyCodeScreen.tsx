import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { setUser, setLoading } from '@store/slices/authSlice';
import { theme } from '@utils/theme';

type VerifyCodeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerifyCode'>;
type VerifyCodeScreenRouteProp = RouteProp<RootStackParamList, 'VerifyCode'>;

const VerifyCodeScreen = () => {
  const navigation = useNavigation<VerifyCodeScreenNavigationProp>();
  const route = useRoute<VerifyCodeScreenRouteProp>();
  const dispatch = useDispatch();

  const { phoneNumber } = route.params;
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  const codeInputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    // Auto-focus the input
    codeInputRef.current?.focus();

    // Re-send code if needed
    resendCode();
  }, []);

  const resendCode = async () => {
    try {
      const result = await AuthService.sendVerificationCode(phoneNumber);
      setConfirmation(result);
    } catch (err: any) {
      setError('Failed to send code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Verify the code
      const userCredential = await AuthService.verifyCode(confirmation, code);
      const uid = userCredential.user.uid;

      // Check if user profile exists
      const profileExists = await AuthService.userProfileExists(uid);

      if (profileExists) {
        // Load existing user profile
        const userProfile = await AuthService.getUserProfile(uid);
        if (userProfile) {
          dispatch(setUser(userProfile));
          // User will be redirected to Main by RootNavigator
        }
      } else {
        // Navigate to user setup
        navigation.navigate('UserSetup', { phoneNumber });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setCode('');
    await resendCode();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Enter verification code
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            We sent a 6-digit code to
          </Text>
          <Text variant="titleMedium" style={styles.phoneNumber}>
            {phoneNumber}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            ref={codeInputRef}
            label="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            mode="outlined"
            maxLength={6}
            disabled={verifying}
            error={!!error}
            style={styles.input}
            autoFocus
          />

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleVerifyCode}
            loading={verifying}
            disabled={verifying || code.length !== 6}
            style={styles.button}>
            Verify
          </Button>

          <Button mode="text" onPress={handleResendCode} disabled={verifying}>
            Resend Code
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={verifying}
            style={styles.backButton}>
            Change Phone Number
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  phoneNumber: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: theme.spacing.xs,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  backButton: {
    marginTop: theme.spacing.md,
  },
});

export default VerifyCodeScreen;

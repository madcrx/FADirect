import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { theme } from '@utils/theme';
import { PHONE_COUNTRY_CODE } from '@utils/constants';

type PhoneAuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhoneAuth'>;

const PhoneAuthScreen = () => {
  const navigation = useNavigation<PhoneAuthScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePhoneNumber = (number: string): boolean => {
    // Australian mobile: 04XX XXX XXX or 4XX XXX XXX
    const cleaned = number.replace(/\s/g, '');
    const australianMobile = /^(04|\+614|4)\d{8}$/;
    return australianMobile.test(cleaned);
  };

  const formatPhoneNumber = (number: string): string => {
    // Remove all non-digits
    let cleaned = number.replace(/\D/g, '');

    // Remove leading 0 if present (will add +61)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add country code if not present
    if (!cleaned.startsWith('61')) {
      cleaned = '61' + cleaned;
    }

    return '+' + cleaned;
  };

  const handleSendCode = async () => {
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Australian mobile number');
      return;
    }

    setLoading(true);

    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      const confirmation = await AuthService.sendVerificationCode(formattedNumber);

      navigation.navigate('VerifyCode', {
        verificationId: (confirmation as any).verificationId || 'pending',
        phoneNumber: formattedNumber,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="displaySmall" style={styles.title}>
              FA Direct
            </Text>
            <Text variant="titleMedium" style={styles.subtitle}>
              Funeral Arranger Direct
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Secure communication between funeral arrangers and families
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="titleMedium" style={styles.formTitle}>
              Sign in with your phone number
            </Text>

            <TextInput
              label="Mobile Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              mode="outlined"
              placeholder="04XX XXX XXX"
              left={<TextInput.Affix text={PHONE_COUNTRY_CODE} />}
              disabled={loading}
              error={!!error}
              style={styles.input}
            />

            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSendCode}
              loading={loading}
              disabled={loading || !phoneNumber}
              style={styles.button}>
              Send Verification Code
            </Button>

            <Text variant="bodySmall" style={styles.privacy}>
              By continuing, you agree to our Terms of Service and Privacy Policy. We'll send
              you a verification code via SMS.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.onBackground,
  },
  input: {
    marginBottom: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  privacy: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PhoneAuthScreen;

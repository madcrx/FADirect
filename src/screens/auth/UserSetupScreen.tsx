import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  RadioButton,
  HelperText,
  Divider,
} from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { RootStackParamList, UserRole } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { setUser } from '@store/slices/authSlice';
import { auth } from '@services/firebase/config';
import { theme } from '@utils/theme';

type UserSetupScreenRouteProp = RouteProp<RootStackParamList, 'UserSetup'>;

const UserSetupScreen = () => {
  const route = useRoute<UserSetupScreenRouteProp>();
  const dispatch = useDispatch();
  const { phoneNumber } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('mourner');
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleComplete = async () => {
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name');
      return;
    }

    if (email && !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (role === 'arranger' && !organizationName.trim()) {
      setError('Please enter your organization name');
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      const userProfile = await AuthService.createUserProfile(
        currentUser.uid,
        phoneNumber,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          email: email.trim() || undefined,
          organizationName: role === 'arranger' ? organizationName.trim() : undefined,
        },
      );

      dispatch(setUser(userProfile));
      // Navigation will happen automatically via RootNavigator
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.');
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
            <Text variant="headlineMedium" style={styles.title}>
              Complete your profile
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Tell us a bit about yourself
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              disabled={loading}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              disabled={loading}
              style={styles.input}
              autoCapitalize="words"
            />

            <TextInput
              label="Email (Optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              disabled={loading}
              style={styles.input}
              autoCapitalize="none"
            />

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              I am a:
            </Text>

            <RadioButton.Group onValueChange={value => setRole(value as UserRole)} value={role}>
              <View style={styles.radioItem}>
                <RadioButton.Android value="mourner" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">Family Member / Mourner</Text>
                  <Text variant="bodySmall" style={styles.radioDescription}>
                    Arranging a funeral for a loved one
                  </Text>
                </View>
              </View>

              <View style={styles.radioItem}>
                <RadioButton.Android value="arranger" />
                <View style={styles.radioContent}>
                  <Text variant="bodyLarge">Funeral Arranger</Text>
                  <Text variant="bodySmall" style={styles.radioDescription}>
                    Professional funeral director or arranger
                  </Text>
                </View>
              </View>
            </RadioButton.Group>

            {role === 'arranger' && (
              <TextInput
                label="Funeral Home / Organization Name"
                value={organizationName}
                onChangeText={setOrganizationName}
                mode="outlined"
                disabled={loading}
                style={[styles.input, styles.organizationInput]}
                autoCapitalize="words"
              />
            )}

            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleComplete}
              loading={loading}
              disabled={loading}
              style={styles.button}>
              Complete Setup
            </Button>
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  divider: {
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.onBackground,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  radioContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  radioDescription: {
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  organizationInput: {
    marginTop: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
});

export default UserSetupScreen;

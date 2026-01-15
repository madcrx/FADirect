import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Divider, Avatar, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { logout } from '@store/slices/authSlice';
import { theme } from '@utils/theme';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      dispatch(logout());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text variant="bodyMedium" style={styles.role}>
          {user.role === 'arranger' ? 'Funeral Arranger' : 'Family Member'}
        </Text>
        {user.organizationName && (
          <Text variant="bodySmall" style={styles.organization}>
            {user.organizationName}
          </Text>
        )}
      </View>

      <List.Section>
        <List.Subheader>Account Information</List.Subheader>
        <List.Item
          title="Phone Number"
          description={user.phoneNumber}
          left={props => <List.Icon {...props} icon="phone" />}
        />
        <Divider />
        {user.email && (
          <>
            <List.Item
              title="Email"
              description={user.email}
              left={props => <List.Icon {...props} icon="email" />}
            />
            <Divider />
          </>
        )}
      </List.Section>

      <List.Section>
        <List.Subheader>Security & Privacy</List.Subheader>
        <List.Item
          title="End-to-End Encryption"
          description="Your messages are encrypted with the Signal Protocol"
          left={props => <List.Icon {...props} icon="shield-lock" />}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="file-document" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={props => <List.Icon {...props} icon="file-document-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>App Information</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
        <Divider />
        <List.Item
          title="Region"
          description="Australia (AU)"
          left={props => <List.Icon {...props} icon="map-marker" />}
        />
      </List.Section>

      <View style={styles.signOutContainer}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          icon="logout"
          textColor={theme.colors.error}
          style={styles.signOutButton}>
          Sign Out
        </Button>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  name: {
    marginBottom: theme.spacing.xs,
  },
  role: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  organization: {
    color: theme.colors.secondary,
  },
  signOutContainer: {
    padding: theme.spacing.lg,
  },
  signOutButton: {
    borderColor: theme.colors.error,
  },
  bottomSpacing: {
    height: theme.spacing.md,
  },
});

export default ProfileScreen;

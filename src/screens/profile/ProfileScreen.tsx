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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Safely get user name
  let displayName = 'User';
  try {
    if (user.firstName && user.lastName) {
      displayName = `${user.firstName} ${user.lastName}`;
    } else if ((user as any).name) {
      displayName = (user as any).name;
    }
  } catch (e) {
    displayName = 'User';
  }

  // Safely get initials
  let initials = 'U';
  try {
    if (user.firstName && user.lastName) {
      initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if ((user as any).name) {
      const parts = (user as any).name.split(' ');
      initials = parts.map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    } else {
      initials = user.phoneNumber.substring(0, 2);
    }
  } catch (e) {
    initials = 'U';
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text
          size={80}
          label={initials}
          style={styles.avatar}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.role}>
          {user.role === 'arranger' ? 'Funeral Arranger' : 'Family Member'}
        </Text>
      </View>

      <List.Section>
        <List.Subheader>Account Information</List.Subheader>
        <List.Item
          title="Phone Number"
          description={user.phoneNumber || 'Not set'}
          left={props => <List.Icon {...props} icon="phone" />}
        />
        <Divider />
        <List.Item
          title="Email"
          description={user.email || 'Not set'}
          left={props => <List.Icon {...props} icon="email" />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>App Information</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
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

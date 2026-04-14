import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, List, Divider, Avatar, Button, TextInput, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@types/index';
import { AuthService } from '@services/auth/authService';
import { logout, setUser } from '@store/slices/authSlice';
import { apiClient } from '@services/api/client';
import { theme } from '@utils/theme';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedEmail, setEditedEmail] = useState(user?.email || '');
  const [editedPhone, setEditedPhone] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      dispatch(logout());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        // TODO: Upload profile photo to backend
        Alert.alert('Coming Soon', 'Profile photo upload will be available soon');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await apiClient.put<{ user: any }>('/users/me', {
        name: editedName || undefined,
        email: editedEmail || undefined,
      });

      dispatch(setUser(response.user));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(user?.name || '');
    setEditedEmail(user?.email || '');
    setEditedPhone(user?.phoneNumber || '');
    setIsEditing(false);
  };

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : user.phoneNumber.substring(0, 2);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.profilePhotoUrl ? (
            <Avatar.Image size={80} source={{ uri: user.profilePhotoUrl }} style={styles.avatar} />
          ) : (
            <Avatar.Text size={80} label={initials} style={styles.avatar} />
          )}
          {isEditing && (
            <TouchableOpacity style={styles.editPhotoButton} onPress={handleEditPhoto}>
              <IconButton icon="camera" size={20} iconColor="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput
              label="Name"
              value={editedName}
              onChangeText={setEditedName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Email"
              value={editedEmail}
              onChangeText={setEditedEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="Phone Number"
              value={editedPhone}
              mode="outlined"
              disabled={true}
              style={styles.input}
              right={<TextInput.Icon icon="lock" />}
            />
          </View>
        ) : (
          <>
            <Text variant="headlineSmall" style={styles.name}>
              {user.name || 'No name set'}
            </Text>
            <Text variant="bodyMedium" style={styles.role}>
              {user.role === 'arranger' ? 'Funeral Arranger' : 'Family Member'}
            </Text>
          </>
        )}

        <View style={styles.editButtonContainer}>
          {isEditing ? (
            <View style={styles.editActions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={saving}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}>
                Save
              </Button>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={() => setIsEditing(true)}
              icon="pencil"
              style={styles.editButton}>
              Edit Profile
            </Button>
          )}
        </View>
      </View>

      {!isEditing && (
        <>
          <List.Section>
            <List.Subheader>Account Information</List.Subheader>
            <List.Item
              title="Phone Number"
              description={user.phoneNumber}
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
            <List.Subheader>Security & Privacy</List.Subheader>
            <List.Item
              title="End-to-End Encryption"
              description="Your messages are encrypted"
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
        </>
      )}

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
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  editPhotoButton: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  editSection: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  name: {
    marginBottom: theme.spacing.xs,
  },
  role: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  editButtonContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  editButton: {
    width: '100%',
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
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

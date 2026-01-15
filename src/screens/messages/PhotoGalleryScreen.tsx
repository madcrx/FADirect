import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '@utils/theme';

const PhotoGalleryScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Photo Gallery</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Photo gallery feature - allows uploading and viewing photos related to the arrangement
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  placeholder: {
    marginTop: theme.spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
});

export default PhotoGalleryScreen;

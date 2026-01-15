import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '@utils/theme';

const DocumentViewerScreen = () => {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge">Document Viewer</Text>
      <Text variant="bodyMedium" style={styles.placeholder}>
        Document viewer feature - displays PDF and document files securely
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

export default DocumentViewerScreen;

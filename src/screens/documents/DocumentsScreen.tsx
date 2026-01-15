import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, FAB, List, Divider } from 'react-native-paper';
import { theme } from '@utils/theme';

const DocumentsScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Shared Documents</List.Subheader>
          <List.Item
            title="Death Certificate"
            description="Uploaded 2 days ago"
            left={props => <List.Icon {...props} icon="file-pdf-box" />}
            right={props => <List.Icon {...props} icon="download" />}
          />
          <Divider />
          <List.Item
            title="Service Contract"
            description="Uploaded 5 days ago"
            left={props => <List.Icon {...props} icon="file-document" />}
            right={props => <List.Icon {...props} icon="download" />}
          />
        </List.Section>

        <Text variant="bodyMedium" style={styles.info}>
          Document sharing feature - allows secure upload and download of important documents
          like death certificates, contracts, and other funeral-related paperwork.
        </Text>
      </ScrollView>

      <FAB
        icon="upload"
        style={styles.fab}
        label="Upload Document"
        onPress={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  info: {
    padding: theme.spacing.lg,
    color: theme.colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default DocumentsScreen;

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, FAB, List, Divider, ActivityIndicator } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { documentsApi, Document } from '@services/api/documents';
import { theme } from '@utils/theme';
import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';

type DocumentsScreenRouteProp = RouteProp<{ Documents: { arrangementId: string } }, 'Documents'>;

const DocumentsScreen = () => {
  const route = useRoute<DocumentsScreenRouteProp>();
  const arrangementId = route.params?.arrangementId;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (arrangementId) {
      loadDocuments();
    } else {
      setLoading(false);
    }
  }, [arrangementId]);

  const loadDocuments = async () => {
    if (!arrangementId) return;

    try {
      setLoading(true);
      const response = await documentsApi.getDocuments(arrangementId);
      setDocuments(response.documents);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', error.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!arrangementId) {
      Alert.alert('Error', 'No arrangement selected');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setUploading(true);

      await documentsApi.uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        arrangementId
      );

      Alert.alert('Success', 'Document uploaded successfully');
      await loadDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  if (!arrangementId) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge">Please select an arrangement first</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No documents uploaded yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the upload button to add documents
            </Text>
          </View>
        ) : (
          <List.Section>
            <List.Subheader>Shared Documents</List.Subheader>
            {documents.map((doc, index) => {
              // Safely format the date
              let dateStr = 'Unknown date';
              try {
                if (doc.createdAt) {
                  const date = new Date(doc.createdAt);
                  if (!isNaN(date.getTime())) {
                    dateStr = format(date, 'MMM d, yyyy');
                  }
                }
              } catch (e) {
                console.error('Error formatting date:', e);
              }

              return (
                <React.Fragment key={doc.id}>
                  {index > 0 && <Divider />}
                  <List.Item
                    title={doc.fileName}
                    description={`Uploaded ${dateStr}`}
                    left={props => <List.Icon {...props} icon="file-document" />}
                    right={props => <List.Icon {...props} icon="download" />}
                    onPress={() => Alert.alert('Download', 'Download functionality coming soon')}
                  />
                </React.Fragment>
              );
            })}
          </List.Section>
        )}
      </ScrollView>

      <FAB
        icon="upload"
        style={styles.fab}
        label={uploading ? 'Uploading...' : 'Upload Document'}
        onPress={handleUpload}
        disabled={uploading}
        visible={true}
        extended={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
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

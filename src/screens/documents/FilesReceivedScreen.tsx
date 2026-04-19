import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  IconButton,
  Badge,
} from 'react-native-paper';
import { format } from 'date-fns';
import { fileSendsApi, FileSend } from '@services/api';
import { useNavigation } from '@react-navigation/native';

export default function FilesReceivedScreen() {
  const [fileSends, setFileSends] = useState<FileSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadFileSends();
  }, []);

  const loadFileSends = async () => {
    try {
      setLoading(true);
      const data = await fileSendsApi.getMyReceivedFiles();
      setFileSends(data);
    } catch (error) {
      console.error('Failed to load received files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFileSends();
    setRefreshing(false);
  };

  const handleViewFile = async (fileSend: FileSend) => {
    try {
      // Mark as viewed if not already
      if (fileSend.status === 'sent') {
        await fileSendsApi.markAsViewed(fileSend.id);
        await loadFileSends();
      }

      // Navigate to appropriate screen based on file type
      if (fileSend.fileType === 'document') {
        // Open document viewer or download
        Alert.alert('Document', 'Document viewing functionality');
      } else if (fileSend.fileType === 'photo') {
        // Navigate to photo gallery
        navigation.navigate('PhotoGallery' as never, {
          arrangementId: fileSend.arrangementId,
        } as never);
      } else if (fileSend.fileType === 'form') {
        // Navigate to form viewer
        navigation.navigate('PreArrangementForm' as never, {
          arrangementId: fileSend.arrangementId,
        } as never);
      }
    } catch (error) {
      console.error('Failed to view file:', error);
    }
  };

  const handleReturnFile = async (fileSend: FileSend) => {
    Alert.alert(
      'Return File',
      'Are you sure you want to return this file? This will notify the funeral home.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: async () => {
            try {
              await fileSendsApi.updateStatus(fileSend.id, 'returned');
              await loadFileSends();
              Alert.alert('Success', 'File returned successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to return file');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: FileSend['status']) => {
    switch (status) {
      case 'sent':
        return '#ff9800';
      case 'viewed':
        return '#2196f3';
      case 'returned':
        return '#4caf50';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  const getFileTypeIcon = (type: FileSend['fileType']) => {
    switch (type) {
      case 'document':
        return 'file-document';
      case 'photo':
        return 'image';
      case 'video':
        return 'video';
      case 'form':
        return 'clipboard-text';
      default:
        return 'file';
    }
  };

  const getFileTypeLabel = (type: FileSend['fileType']) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderFileItem = ({ item }: { item: FileSend }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <IconButton icon={getFileTypeIcon(item.fileType)} size={32} />
              {item.status === 'sent' && (
                <Badge style={styles.badge} size={12} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.fileType}>{getFileTypeLabel(item.fileType)}</Text>
              <Text style={styles.sender}>From: {item.sentByName || 'Unknown'}</Text>
            </View>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>

        <Text style={styles.sentDate}>
          Sent: {format(new Date(item.sentAt), 'dd MMM yyyy, HH:mm')}
        </Text>

        {item.viewedAt && (
          <Text style={styles.viewedDate}>
            Viewed: {format(new Date(item.viewedAt), 'dd MMM yyyy, HH:mm')}
          </Text>
        )}

        {item.returnedAt && (
          <Text style={styles.returnedDate}>
            Returned: {format(new Date(item.returnedAt), 'dd MMM yyyy, HH:mm')}
          </Text>
        )}

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => handleViewFile(item)}
            style={styles.viewButton}
            icon={getFileTypeIcon(item.fileType)}
          >
            View
          </Button>
          {item.status !== 'returned' && item.status !== 'cancelled' && (
            <Button
              mode="outlined"
              onPress={() => handleReturnFile(item)}
              style={styles.returnButton}
            >
              Return
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Files Received
        </Text>
        <Text style={styles.headerSubtitle}>
          Files sent to you by the funeral home
        </Text>
      </View>

      <FlatList
        data={fileSends}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="inbox" size={64} iconColor="#ccc" />
            <Text style={styles.emptyText}>No files received yet</Text>
            <Text style={styles.emptySubtext}>
              Files sent to you by the funeral home will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
  },
  headerText: {
    marginLeft: 8,
    flex: 1,
  },
  fileType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  sender: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sentDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  viewedDate: {
    fontSize: 13,
    color: '#2196f3',
    marginBottom: 4,
  },
  returnedDate: {
    fontSize: 13,
    color: '#4caf50',
    marginBottom: 4,
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  viewButton: {
    flex: 1,
  },
  returnButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
  },
});

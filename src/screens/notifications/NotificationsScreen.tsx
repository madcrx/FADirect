import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Badge,
  Menu,
  Divider,
} from 'react-native-paper';
import { format } from 'date-fns';
import { notificationsApi, Notification } from '@services/api';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigation = useNavigation();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll(filter === 'unread');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await notificationsApi.markAsRead(notification.id);
        await loadNotifications();
      }

      // Navigate based on notification type and entity
      if (notification.entityType && notification.entityId) {
        switch (notification.entityType) {
          case 'arrangement':
            navigation.navigate('ArrangementDetail' as never, {
              id: notification.entityId,
            } as never);
            break;
          case 'message':
            navigation.navigate('Chat' as never, {
              arrangementId: notification.entityId,
            } as never);
            break;
          case 'pre_arrangement_form':
            navigation.navigate('PreArrangementForm' as never, {
              arrangementId: notification.entityId,
            } as never);
            break;
          case 'file_send':
            navigation.navigate('FilesReceived' as never);
            break;
          case 'leave_request':
            navigation.navigate('Leave' as never);
            break;
        }
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setMenuVisible(false);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'message';
      case 'document_sent':
        return 'file-document';
      case 'document_returned':
        return 'file-undo';
      case 'form_sent':
        return 'clipboard-text';
      case 'form_completed':
        return 'clipboard-check';
      case 'leave_request':
        return 'calendar';
      case 'leave_approved':
        return 'check-circle';
      case 'leave_rejected':
        return 'close-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return '#2196f3';
      case 'document_sent':
      case 'form_sent':
        return '#ff9800';
      case 'document_returned':
      case 'form_completed':
        return '#4caf50';
      case 'leave_request':
        return '#9c27b0';
      case 'leave_approved':
        return '#4caf50';
      case 'leave_rejected':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <Card
        style={[styles.card, !item.read && styles.unreadCard]}
      >
        <Card.Content>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <IconButton
                icon={getNotificationIcon(item.type)}
                size={24}
                iconColor={getNotificationColor(item.type)}
                style={styles.icon}
              />
              {!item.read && <Badge style={styles.unreadBadge} size={8} />}
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>
                {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
              </Text>
            </View>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteNotification(item.id)}
              style={styles.deleteButton}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Badge style={styles.headerBadge}>{unreadCount}</Badge>
          )}
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setFilter('all');
              setMenuVisible(false);
            }}
            title="Show All"
            leadingIcon="inbox"
          />
          <Menu.Item
            onPress={() => {
              setFilter('unread');
              setMenuVisible(false);
            }}
            title="Show Unread Only"
            leadingIcon="email-alert"
          />
          <Divider />
          <Menu.Item
            onPress={handleMarkAllRead}
            title="Mark All as Read"
            leadingIcon="check-all"
            disabled={unreadCount === 0}
          />
        </Menu>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconButton icon="bell-off" size={64} iconColor="#ccc" />
            <Text style={styles.emptyText}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </Text>
            <Text style={styles.emptySubtext}>
              You're all caught up!
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: '#f44336',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
  },
  unreadCard: {
    backgroundColor: '#e3f2fd',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  icon: {
    margin: 0,
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#f44336',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    margin: 0,
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
    marginTop: 4,
  },
});

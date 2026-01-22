import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Avatar, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { MessageStackParamList, RootState, Arrangement } from '@types/index';
import { ArrangementService } from '@services/arrangements/arrangementService';
import { theme } from '@utils/theme';
import { formatDistanceToNow } from 'date-fns';

type ConversationListScreenNavigationProp = StackNavigationProp<
  MessageStackParamList,
  'ConversationList'
>;

interface ConversationItem extends Arrangement {
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
}

const ConversationListScreen = () => {
  const navigation = useNavigation<ConversationListScreenNavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const arrangements = await ArrangementService.getArrangements(user.id, user.role);

      // TODO: Fetch last messages and unread counts for each arrangement
      const conversationItems: ConversationItem[] = arrangements.map(arr => ({
        ...arr,
        unreadCount: 0, // Placeholder
        lastMessage: 'Start a conversation...',
        lastMessageTime: arr.updatedAt,
      }));

      setConversations(conversationItems);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }: { item: ConversationItem }) => {
    // Determine the other party in the conversation
    const isArranger = user?.role === 'arranger';
    const recipientId = isArranger ? item.mournerId : item.arrangerId;

    return (
      <List.Item
        title={item.deceasedName}
        description={item.lastMessage}
        left={props => (
          <Avatar.Text
            {...props}
            size={56}
            label={item.deceasedName.substring(0, 2).toUpperCase()}
          />
        )}
        right={() =>
          item.lastMessageTime ? (
            <View style={styles.rightContainer}>
              <Text variant="bodySmall" style={styles.timeText}>
                {formatDistanceToNow(item.lastMessageTime, { addSuffix: true })}
              </Text>
              {item.unreadCount > 0 && (
                <Badge size={20} style={styles.badge}>
                  {item.unreadCount}
                </Badge>
              )}
            </View>
          ) : null
        }
        onPress={() =>
          navigation.navigate('Chat', {
            arrangementId: item.id,
            recipientId,
          })
        }
        style={styles.listItem}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="message-outline" style={styles.emptyIcon} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No messages yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Messages will appear here when you start a conversation
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id}
        contentContainerStyle={conversations.length === 0 ? styles.listEmpty : undefined}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listEmpty: {
    flexGrow: 1,
  },
  listItem: {
    paddingVertical: theme.spacing.sm,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  badge: {
    backgroundColor: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default ConversationListScreen;

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, IconButton, Avatar } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { MessageStackParamList, RootState, Message } from '@types/index';
import { MessageService } from '@services/messaging/messageService';
import { theme } from '@utils/theme';
import { format } from 'date-fns';
import { TIME_FORMAT } from '@utils/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ChatScreenRouteProp = RouteProp<MessageStackParamList, 'Chat'>;

interface DecryptedMessage extends Message {
  decryptedContent?: string;
  isDecrypting?: boolean;
}

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { arrangementId, recipientId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);

  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Listen to messages in real-time
    const unsubscribe = MessageService.onMessagesChanged(arrangementId, async newMessages => {
      // Decrypt all messages
      const decryptedMessages = await Promise.all(
        newMessages.map(async msg => {
          try {
            const decryptedContent = await MessageService.decryptMessageContent(msg, user!.id);
            return {
              ...msg,
              decryptedContent,
              isDecrypting: false,
            };
          } catch (error) {
            return {
              ...msg,
              decryptedContent: '[Unable to decrypt]',
              isDecrypting: false,
            };
          }
        }),
      );

      setMessages(decryptedMessages);

      // Mark unread messages as read
      newMessages.forEach(msg => {
        if (msg.recipientId === user!.id && !msg.readAt) {
          MessageService.markAsRead(msg.id);
        }
      });
    });

    return unsubscribe;
  }, [arrangementId, user]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await MessageService.sendMessage({
        arrangementId,
        senderId: user.id,
        recipientId,
        content: textToSend,
        type: 'text',
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Restore message to input on error
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: DecryptedMessage; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const showAvatar =
      index === messages.length - 1 ||
      messages[index + 1]?.senderId !== item.senderId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}>
        {!isMyMessage && showAvatar && (
          <Avatar.Text
            size={32}
            label="A"
            style={styles.avatar}
          />
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarPlaceholder} />}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}>
          {item.isDecrypting ? (
            <Text style={styles.decryptingText}>Decrypting...</Text>
          ) : (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}>
              {item.decryptedContent || item.encryptedContent}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}>
              {format(item.timestamp, TIME_FORMAT)}
            </Text>

            {isMyMessage && (
              <Icon
                name={
                  item.readAt
                    ? 'check-all'
                    : item.deliveredAt
                    ? 'check-all'
                    : 'check'
                }
                size={16}
                color={
                  item.readAt
                    ? theme.colors.primary
                    : isMyMessage
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface
                }
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="attachment" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          mode="outlined"
          multiline
          maxLength={1000}
          style={styles.input}
          disabled={sending}
        />

        <IconButton
          icon="send"
          size={24}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          iconColor={theme.colors.primary}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  theirMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: theme.spacing.xs,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: theme.spacing.xs,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: theme.spacing.sm,
    borderRadius: theme.roundness * 2,
  },
  myMessageBubble: {
    backgroundColor: theme.colors.messageSent,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: theme.colors.messageReceived,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: theme.colors.onPrimary,
  },
  theirMessageText: {
    color: theme.colors.onSurface,
  },
  decryptingText: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  messageTime: {
    fontSize: 11,
    marginRight: theme.spacing.xs,
  },
  myMessageTime: {
    color: theme.colors.onPrimary,
    opacity: 0.7,
  },
  theirMessageTime: {
    color: theme.colors.onSurfaceVariant,
  },
  readIcon: {
    marginLeft: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  attachButton: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    maxHeight: 100,
  },
});

export default ChatScreen;

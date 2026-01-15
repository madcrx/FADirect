import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MessageStackParamList } from '@types/index';
import { theme } from '@utils/theme';

import ConversationListScreen from '@screens/messages/ConversationListScreen';
import ChatScreen from '@screens/messages/ChatScreen';
import PhotoGalleryScreen from '@screens/messages/PhotoGalleryScreen';
import DocumentViewerScreen from '@screens/messages/DocumentViewerScreen';

const Stack = createStackNavigator<MessageStackParamList>();

const MessageNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ title: 'Messages' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: 'Chat' })}
      />
      <Stack.Screen
        name="PhotoGallery"
        component={PhotoGalleryScreen}
        options={{ title: 'Photos' }}
      />
      <Stack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={{ title: 'Document' }}
      />
    </Stack.Navigator>
  );
};

export default MessageNavigator;

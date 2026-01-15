import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from '@types/index';
import { theme } from '@utils/theme';

// Tab Screens
import ArrangementNavigator from './ArrangementNavigator';
import MessageNavigator from './MessageNavigator';
import DocumentsScreen from '@screens/documents/DocumentsScreen';
import ProfileScreen from '@screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Arrangements') {
            iconName = 'clipboard-list';
          } else if (route.name === 'Messages') {
            iconName = 'message';
          } else if (route.name === 'Documents') {
            iconName = 'file-document-multiple';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen
        name="Arrangements"
        component={ArrangementNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Messages"
        component={MessageNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;

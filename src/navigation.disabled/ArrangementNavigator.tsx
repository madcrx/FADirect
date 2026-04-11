import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ArrangementStackParamList } from '@types/index';
import { theme } from '@utils/theme';

import ArrangementListScreen from '@screens/arrangements/ArrangementListScreen';
import ArrangementDetailScreen from '@screens/arrangements/ArrangementDetailScreen';
import CreateArrangementScreen from '@screens/arrangements/CreateArrangementScreen';
import WorkflowProgressScreen from '@screens/arrangements/WorkflowProgressScreen';

const Stack = createStackNavigator<ArrangementStackParamList>();

const ArrangementNavigator = () => {
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
        name="ArrangementList"
        component={ArrangementListScreen}
        options={{ title: 'Arrangements' }}
      />
      <Stack.Screen
        name="ArrangementDetail"
        component={ArrangementDetailScreen}
        options={{ title: 'Arrangement Details' }}
      />
      <Stack.Screen
        name="CreateArrangement"
        component={CreateArrangementScreen}
        options={{ title: 'New Arrangement' }}
      />
      <Stack.Screen
        name="WorkflowProgress"
        component={WorkflowProgressScreen}
        options={{ title: 'Progress' }}
      />
    </Stack.Navigator>
  );
};

export default ArrangementNavigator;

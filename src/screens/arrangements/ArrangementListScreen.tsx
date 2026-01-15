import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Card, Chip, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { ArrangementStackParamList, RootState, Arrangement } from '@types/index';
import { ArrangementService } from '@services/arrangements/arrangementService';
import { setArrangements, setLoading } from '@store/slices/arrangementsSlice';
import { theme } from '@utils/theme';
import { format } from 'date-fns';
import { DATE_FORMAT } from '@utils/constants';

type ArrangementListScreenNavigationProp = StackNavigationProp<
  ArrangementStackParamList,
  'ArrangementList'
>;

const ArrangementListScreen = () => {
  const navigation = useNavigation<ArrangementListScreenNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { arrangements, isLoading } = useSelector((state: RootState) => state.arrangements);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArrangements();
  }, []);

  const loadArrangements = async () => {
    if (!user) return;

    try {
      dispatch(setLoading(true));
      const data = await ArrangementService.getArrangements(user.id, user.role);
      dispatch(setArrangements(data));
    } catch (error: any) {
      console.error('Error loading arrangements:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadArrangements();
    setRefreshing(false);
  };

  const renderArrangement = ({ item }: { item: Arrangement }) => {
    const progress =
      item.workflowSteps.filter(step => step.status === 'completed').length /
      item.workflowSteps.length;
    const progressPercentage = Math.round(progress * 100);

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('ArrangementDetail', { arrangementId: item.id })}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleLarge" style={styles.deceasedName}>
              {item.deceasedName}
            </Text>
            <Chip mode="flat" compact>
              {item.funeralType.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          <View style={styles.cardBody}>
            <Text variant="bodyMedium" style={styles.status}>
              Status: {item.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Text variant="bodySmall" style={styles.date}>
              Created: {format(item.createdAt, DATE_FORMAT)}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Text variant="bodySmall" style={styles.progressLabel}>
              Progress: {progressPercentage}%
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="clipboard-list-outline" style={styles.emptyIcon} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        {user?.role === 'arranger' ? 'No arrangements yet' : 'No active arrangements'}
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {user?.role === 'arranger'
          ? 'Create a new arrangement to get started'
          : 'Your funeral arranger will create an arrangement for you'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={arrangements}
        renderItem={renderArrangement}
        keyExtractor={item => item.id}
        contentContainerStyle={arrangements.length === 0 ? styles.listEmpty : styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {user?.role === 'arranger' && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateArrangement')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  deceasedName: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  cardBody: {
    marginBottom: theme.spacing.md,
  },
  status: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  date: {
    color: theme.colors.onSurfaceVariant,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressLabel: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
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
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
});

export default ArrangementListScreen;

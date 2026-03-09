import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Chip, Divider, List } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrangementStackParamList, Arrangement } from '@types/index';
import { ArrangementService } from '@services/arrangements/arrangementService';
import { theme } from '@utils/theme';
import { format } from 'date-fns';
import { DATE_FORMAT } from '@utils/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ArrangementDetailScreenNavigationProp = StackNavigationProp<
  ArrangementStackParamList,
  'ArrangementDetail'
>;
type ArrangementDetailScreenRouteProp = RouteProp<
  ArrangementStackParamList,
  'ArrangementDetail'
>;

const ArrangementDetailScreen = () => {
  const navigation = useNavigation<ArrangementDetailScreenNavigationProp>();
  const route = useRoute<ArrangementDetailScreenRouteProp>();
  const { arrangementId } = route.params;

  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArrangement();

    // Listen to real-time updates
    const unsubscribe = ArrangementService.onArrangementChanged(
      arrangementId,
      updatedArrangement => {
        setArrangement(updatedArrangement);
        setLoading(false);
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangementId]);

  const loadArrangement = async () => {
    try {
      const data = await ArrangementService.getArrangement(arrangementId);
      setArrangement(data);
    } catch (error) {
      console.error('Error loading arrangement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !arrangement) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const progress =
    arrangement.workflowSteps.filter(step => step.status === 'completed').length /
    arrangement.workflowSteps.length;
  const progressPercentage = Math.round(progress * 100);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.deceasedName}>
              {arrangement.deceasedName}
            </Text>
            <Chip mode="flat">
              {arrangement.funeralType.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.status}>
            Status: {arrangement.status.replace('_', ' ').toUpperCase()}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            Created: {format(arrangement.createdAt, DATE_FORMAT)}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Progress Overview
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text variant="bodyMedium">Overall Progress</Text>
              <Text variant="titleMedium" style={styles.progressPercentage}>
                {progressPercentage}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate('WorkflowProgress', { arrangementId: arrangement.id })
            }
            style={styles.viewProgressButton}
            icon="timeline">
            View Detailed Progress
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Current Step
          </Text>

          {arrangement.workflowSteps[arrangement.currentStepIndex] && (
            <View style={styles.currentStep}>
              <View style={styles.stepHeader}>
                <Icon
                  name={
                    arrangement.workflowSteps[arrangement.currentStepIndex].icon ||
                    'checkbox-marked-circle'
                  }
                  size={32}
                  color={theme.colors.primary}
                />
                <View style={styles.stepInfo}>
                  <Text variant="titleMedium">
                    {arrangement.workflowSteps[arrangement.currentStepIndex].title}
                  </Text>
                  <Text variant="bodySmall" style={styles.stepDescription}>
                    {arrangement.workflowSteps[arrangement.currentStepIndex].description}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Quick Actions
          </Text>

          <List.Item
            title="Send Message"
            left={props => <List.Icon {...props} icon="message" />}
            onPress={() => {}}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Upload Documents"
            left={props => <List.Icon {...props} icon="file-upload" />}
            onPress={() => {}}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Upload Photos"
            left={props => <List.Icon {...props} icon="image-plus" />}
            onPress={() => {}}
            style={styles.listItem}
          />
          <Divider />
          <List.Item
            title="Complete Forms"
            left={props => <List.Icon {...props} icon="clipboard-list" />}
            onPress={() => {}}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
  card: {
    margin: theme.spacing.md,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  deceasedName: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  status: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  date: {
    color: theme.colors.onSurfaceVariant,
  },
  cardTitle: {
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressPercentage: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  viewProgressButton: {
    marginTop: theme.spacing.sm,
  },
  currentStep: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.roundness,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  stepDescription: {
    marginTop: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  listItem: {
    paddingVertical: theme.spacing.xs,
  },
  bottomSpacing: {
    height: theme.spacing.md,
  },
});

export default ArrangementDetailScreen;

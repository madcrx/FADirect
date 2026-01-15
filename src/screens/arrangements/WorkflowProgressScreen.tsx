import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ArrangementStackParamList, Arrangement, WorkflowStep } from '@types/index';
import { ArrangementService } from '@services/arrangements/arrangementService';
import { theme } from '@utils/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { DATE_FORMAT } from '@utils/constants';

type WorkflowProgressScreenRouteProp = RouteProp<
  ArrangementStackParamList,
  'WorkflowProgress'
>;

const WorkflowProgressScreen = () => {
  const route = useRoute<WorkflowProgressScreenRouteProp>();
  const { arrangementId } = route.params;

  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = ArrangementService.onArrangementChanged(
      arrangementId,
      updatedArrangement => {
        setArrangement(updatedArrangement);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [arrangementId]);

  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === 'completed') {
      return 'check-circle';
    } else if (step.status === 'in_progress') {
      return 'progress-clock';
    } else if (step.status === 'skipped') {
      return 'skip-forward';
    }
    return 'circle-outline';
  };

  const getStepColor = (step: WorkflowStep) => {
    if (step.status === 'completed') {
      return theme.colors.success;
    } else if (step.status === 'in_progress') {
      return theme.colors.primary;
    } else if (step.status === 'skipped') {
      return theme.colors.onSurfaceVariant;
    }
    return theme.colors.outline;
  };

  const renderStep = (step: WorkflowStep, index: number, isLast: boolean) => {
    const stepColor = getStepColor(step);

    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepTimeline}>
          <View style={[styles.stepIconContainer, { borderColor: stepColor }]}>
            <Icon name={getStepIcon(step)} size={24} color={stepColor} />
          </View>
          {!isLast && <View style={[styles.stepConnector, { backgroundColor: stepColor }]} />}
        </View>

        <Card style={[styles.stepCard, step.status === 'in_progress' && styles.activeStepCard]}>
          <Card.Content>
            <View style={styles.stepHeader}>
              <View style={styles.stepTitleContainer}>
                <Text variant="titleMedium" style={styles.stepTitle}>
                  {step.title}
                </Text>
                <Chip
                  mode="flat"
                  compact
                  style={[
                    styles.statusChip,
                    { backgroundColor: `${stepColor}20` },
                  ]}>
                  {step.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>

            <Text variant="bodyMedium" style={styles.stepDescription}>
              {step.description}
            </Text>

            {step.completedAt && (
              <Text variant="bodySmall" style={styles.completedDate}>
                Completed: {format(step.completedAt, DATE_FORMAT)}
              </Text>
            )}

            {step.requiredForms && step.requiredForms.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text variant="bodySmall" style={styles.requirementsTitle}>
                  Required Forms:
                </Text>
                {step.requiredForms.map((form, i) => (
                  <Text key={i} variant="bodySmall" style={styles.requirementItem}>
                    • {form}
                  </Text>
                ))}
              </View>
            )}

            {step.requiredDocuments && step.requiredDocuments.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text variant="bodySmall" style={styles.requirementsTitle}>
                  Required Documents:
                </Text>
                {step.requiredDocuments.map((doc, i) => (
                  <Text key={i} variant="bodySmall" style={styles.requirementItem}>
                    • {doc}
                  </Text>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (loading || !arrangement) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const completedSteps = arrangement.workflowSteps.filter(
    step => step.status === 'completed',
  ).length;
  const totalSteps = arrangement.workflowSteps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.summaryTitle}>
            {arrangement.deceasedName}
          </Text>
          <Text variant="bodyMedium" style={styles.summarySubtitle}>
            {arrangement.funeralType.replace('_', ' ').toUpperCase()}
          </Text>

          <View style={styles.progressSummary}>
            <View style={styles.progressHeader}>
              <Text variant="bodyLarge">Overall Progress</Text>
              <Text variant="headlineSmall" style={styles.progressPercentage}>
                {progress}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.progressText}>
              {completedSteps} of {totalSteps} steps completed
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.timelineContainer}>
        {arrangement.workflowSteps.map((step, index) =>
          renderStep(step, index, index === arrangement.workflowSteps.length - 1),
        )}
      </View>

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
  summaryCard: {
    margin: theme.spacing.md,
  },
  summaryTitle: {
    marginBottom: theme.spacing.xs,
  },
  summarySubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  progressSummary: {
    marginTop: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
  },
  timelineContainer: {
    paddingHorizontal: theme.spacing.md,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  stepTimeline: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginVertical: theme.spacing.xs,
  },
  stepCard: {
    flex: 1,
  },
  activeStepCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  stepHeader: {
    marginBottom: theme.spacing.sm,
  },
  stepTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  stepTitle: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusChip: {
    height: 28,
  },
  stepDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  completedDate: {
    color: theme.colors.success,
    fontStyle: 'italic',
  },
  requirementsContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  requirementItem: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  bottomSpacing: {
    height: theme.spacing.md,
  },
});

export default WorkflowProgressScreen;

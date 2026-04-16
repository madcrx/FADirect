import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface WorkflowStep {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

interface WorkflowTrackerProps {
  arrangementId: string;
  steps: WorkflowStep[];
  onUpdateStep: (stepId: string, completed: boolean, notes?: string) => Promise<void>;
}

const defaultSteps = [
  { id: 'initial_contact', name: 'Initial Contact & Consultation', order: 0 },
  { id: 'paperwork', name: 'Complete Paperwork & Documentation', order: 1 },
  { id: 'service_planning', name: 'Service Planning & Arrangements', order: 2 },
  { id: 'government_submissions', name: 'Government Submissions (BDM/Coroner)', order: 3 },
  { id: 'preparation', name: 'Deceased Preparation', order: 4 },
  { id: 'service_execution', name: 'Service Execution', order: 5 },
  { id: 'final_documentation', name: 'Final Documentation & Certificates', order: 6 },
  { id: 'invoicing', name: 'Invoicing & Payment', order: 7 },
  { id: 'followup', name: 'Follow-up & Closure', order: 8 },
];

export default function WorkflowTracker({ arrangementId, steps = [], onUpdateStep }: WorkflowTrackerProps) {
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [stepNotes, setStepNotes] = useState('');

  // Merge default steps with actual steps
  const workflowSteps = defaultSteps.map(defaultStep => {
    const actualStep = steps.find(s => s.id === defaultStep.id);
    return {
      ...defaultStep,
      completed: actualStep?.completed || false,
      completedAt: actualStep?.completedAt,
      completedBy: actualStep?.completedBy,
      notes: actualStep?.notes || '',
    };
  });

  const completedCount = workflowSteps.filter(s => s.completed).length;
  const progressPercentage = (completedCount / workflowSteps.length) * 100;

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      setEditingStep(stepId);
    } else {
      await onUpdateStep(stepId, false);
    }
  };

  const handleSaveStep = async (stepId: string) => {
    await onUpdateStep(stepId, true, stepNotes);
    setEditingStep(null);
    setStepNotes('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Workflow Progress
          </Typography>
          <Chip
            label={`${completedCount} / ${workflowSteps.length} Complete`}
            color={completedCount === workflowSteps.length ? 'success' : 'primary'}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                flex: 1,
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  bgcolor: progressPercentage === 100 ? 'success.main' : 'primary.main',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ ml: 2, minWidth: 50 }}>
              {progressPercentage.toFixed(0)}%
            </Typography>
          </Box>
        </Box>

        <Stepper orientation="vertical" nonLinear>
          {workflowSteps.map((step, index) => (
            <Step key={step.id} active={true} completed={step.completed}>
              <StepLabel
                optional={
                  step.completed && step.completedAt ? (
                    <Typography variant="caption" color="text.secondary">
                      Completed {formatDate(step.completedAt)}
                      {step.completedBy && ` by ${step.completedBy}`}
                    </Typography>
                  ) : null
                }
                StepIconComponent={() => (
                  <Box
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleToggleStep(step.id, step.completed)}
                  >
                    {step.completed ? (
                      <CheckIcon color="success" />
                    ) : (
                      <UncheckedIcon color="action" />
                    )}
                  </Box>
                )}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: step.completed ? 400 : 600,
                    textDecoration: step.completed ? 'line-through' : 'none',
                    color: step.completed ? 'text.secondary' : 'text.primary',
                  }}
                >
                  {step.name}
                </Typography>
              </StepLabel>
              <StepContent>
                {editingStep === step.id ? (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes (optional)"
                      value={stepNotes}
                      onChange={(e) => setStepNotes(e.target.value)}
                      sx={{ mb: 2 }}
                      placeholder="Add notes about this step..."
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSaveStep(step.id)}
                      >
                        Mark Complete
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingStep(null);
                          setStepNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : step.notes ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    {step.notes}
                  </Typography>
                ) : null}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
}

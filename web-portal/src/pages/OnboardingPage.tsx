import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Chip,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Description as DocumentIcon,
  HourglassEmpty as PendingIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api, { authApi } from '@/services/api';
import type { User } from '@/types';

interface PolicyDocument {
  id: string;
  title: string;
  category_name?: string;
  version: string;
  updated_at?: string;
  created_at: string;
  file_size?: number;
  file_name: string;
  requires_acknowledgment: boolean;
  acknowledged: boolean;
  description?: string;
}

export default function OnboardingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCurrentUser();
    loadPolicies();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/policies');
      const allPolicies = response.data.policies || [];

      // Filter to only show policies requiring acknowledgment
      const requiredPolicies = allPolicies.filter(
        (p: PolicyDocument) => p.requires_acknowledgment
      );
      setPolicies(requiredPolicies);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (policyId: string) => {
    try {
      await api.post(`/policies/${policyId}/acknowledge`);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, acknowledged: true } : p))
      );
      setSuccess('Policy acknowledged successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to acknowledge policy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDownload = async (policyId: string, fileName: string) => {
    try {
      const response = await api.get(`/policies/${policyId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download policy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const acknowledgedCount = policies.filter(p => p.acknowledged).length;
  const totalRequired = policies.length;
  const progress = totalRequired > 0 ? (acknowledgedCount / totalRequired) * 100 : 0;
  const isComplete = acknowledgedCount === totalRequired;

  const steps = [
    'Account Created',
    'Review Policies',
    'Complete Onboarding',
  ];

  const activeStep = isComplete ? 2 : 1;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome to CarePortal
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Complete your onboarding by reviewing and acknowledging the required policies
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Progress Card */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Onboarding Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="600">
                  {acknowledgedCount}/{totalRequired}
                </Typography>
              </Box>

              {isComplete ? (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  <Typography variant="body2" fontWeight="600">
                    Onboarding Complete!
                  </Typography>
                  <Typography variant="caption">
                    You've acknowledged all required policies. You now have full access to the portal.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" icon={<PendingIcon />}>
                  <Typography variant="body2" fontWeight="600">
                    Action Required
                  </Typography>
                  <Typography variant="caption">
                    Please review and acknowledge {totalRequired - acknowledgedCount} more{' '}
                    {totalRequired - acknowledgedCount === 1 ? 'policy' : 'policies'} to complete your onboarding.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Welcome Message */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Getting Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Welcome {currentUser?.name}! To complete your onboarding:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="1. Review each policy document"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color={acknowledgedCount > 0 ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="2. Acknowledge required policies"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon fontSize="small" color={isComplete ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="3. Access full portal features"
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Required Policies */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Required Policy Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please review and acknowledge the following documents
              </Typography>

              {loading ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Loading policies...
                </Typography>
              ) : policies.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No policies require acknowledgment at this time
                </Typography>
              ) : (
                <List>
                  {policies.map((policy) => (
                    <Paper key={policy.id} variant="outlined" sx={{ mb: 1.5 }}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() => handleDownload(policy.id, policy.file_name)}
                            >
                              Download
                            </Button>
                            {!policy.acknowledged && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleAcknowledge(policy.id)}
                                sx={{ color: 'white' }}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </Box>
                        }
                        sx={{ pr: 25 }}
                      >
                        <ListItemIcon>
                          {policy.acknowledged ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <DocumentIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="500">
                                {policy.title}
                              </Typography>
                              {policy.acknowledged && (
                                <Chip label="Acknowledged" size="small" color="success" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {policy.description || 'Required reading for all staff members'}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Version {policy.version} • Updated{' '}
                                {format(new Date(policy.updated_at || policy.created_at), 'MMM d, yyyy')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import PreArrangementForm from '@/components/PreArrangementForm';
import { preArrangementFormsApi, arrangementsApi } from '@/services/api';
import type { Arrangement } from '@/types';

export default function PreArrangementFormPage() {
  const { id: arrangementId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (arrangementId) {
      loadData();
    }
  }, [arrangementId]);

  const loadData = async () => {
    if (!arrangementId) return;

    try {
      const [arrData, formData] = await Promise.all([
        arrangementsApi.getById(arrangementId),
        preArrangementFormsApi.getByArrangement(arrangementId).catch(() => null),
      ]);

      setArrangement(arrData);
      setForm(formData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load form data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    if (!form?.id) return;

    try {
      await preArrangementFormsApi.update(form.id, formData, 'in_progress');
      setSnackbar({
        open: true,
        message: 'Draft saved successfully',
        severity: 'success',
      });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to save draft',
        severity: 'error',
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!form?.id) return;

    setSubmitting(true);
    try {
      await preArrangementFormsApi.update(form.id, formData, 'completed');
      setSnackbar({
        open: true,
        message: 'Pre-Arrangement Form submitted successfully! The funeral home has been notified.',
        severity: 'success',
      });

      // Navigate back after a brief delay
      setTimeout(() => {
        navigate(`/arrangements/${arrangementId}`);
      }, 2000);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to submit form',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No pre-arrangement form has been sent for this arrangement yet.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/arrangements/${arrangementId}`)}
          sx={{ mt: 2 }}
        >
          Back to Arrangement
        </Button>
      </Box>
    );
  }

  const isCompleted = form.status === 'completed';

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/arrangements/${arrangementId}`)}
        sx={{ mb: 2 }}
      >
        Back to Arrangement
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Pre-Arrangement Form
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {arrangement?.deceasedName || 'Arrangement Details'}
          </Typography>
          {isCompleted && (
            <Alert severity="success" sx={{ mt: 2 }}>
              This form has been completed and submitted on{' '}
              {new Date(form.completedAt).toLocaleDateString()}
            </Alert>
          )}
        </CardContent>
      </Card>

      <PreArrangementForm
        initialData={form.formData || {}}
        onSubmit={handleSubmit}
        onSave={handleSave}
        readOnly={isCompleted}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

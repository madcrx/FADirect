import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface GovernmentSubmission {
  id: string;
  arrangementId: string;
  submissionType: 'bdm_death_registration' | 'coroner_report' | 'death_certificate_application';
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'rejected';
  referenceNumber?: string;
  submissionDate?: string;
  completionDate?: string;
  notes?: string;
  deceasedName?: string;
  formData?: any;
  createdAt: string;
  updatedAt: string;
}

interface Arrangement {
  id: string;
  deceasedName: string;
}

const submissionTypeLabels = {
  bdm_death_registration: 'BDM Death Registration',
  coroner_report: 'Coroner Report',
  death_certificate_application: 'Death Certificate Application',
};

const submissionTypeIcons = {
  bdm_death_registration: <AssignmentIcon />,
  coroner_report: <GavelIcon />,
  death_certificate_application: <DescriptionIcon />,
};

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  draft: 'default',
  submitted: 'info',
  in_progress: 'warning',
  completed: 'success',
  rejected: 'error',
};

export default function GovernmentFormsPage() {
  const [submissions, setSubmissions] = useState<GovernmentSubmission[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<GovernmentSubmission | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [formData, setFormData] = useState({
    arrangementId: '',
    submissionType: 'bdm_death_registration' as const,
    status: 'draft' as const,
    referenceNumber: '',
    submissionDate: '',
    completionDate: '',
    notes: '',
  });

  useEffect(() => {
    loadSubmissions();
    loadArrangements();
  }, []);

  const loadSubmissions = async () => {
    try {
      const response = await api.get('/government-forms');
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArrangements = async () => {
    try {
      const response = await api.get('/arrangements');
      setArrangements(response.data.arrangements || []);
    } catch (error) {
      console.error('Failed to load arrangements:', error);
    }
  };

  const handleOpenDialog = (submission?: GovernmentSubmission) => {
    if (submission) {
      setEditingSubmission(submission);
      setFormData({
        arrangementId: submission.arrangementId,
        submissionType: submission.submissionType,
        status: submission.status,
        referenceNumber: submission.referenceNumber || '',
        submissionDate: submission.submissionDate ? submission.submissionDate.split('T')[0] : '',
        completionDate: submission.completionDate ? submission.completionDate.split('T')[0] : '',
        notes: submission.notes || '',
      });
    } else {
      setEditingSubmission(null);
      setFormData({
        arrangementId: '',
        submissionType: 'bdm_death_registration',
        status: 'draft',
        referenceNumber: '',
        submissionDate: '',
        completionDate: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSubmission(null);
  };

  const handleSaveSubmission = async () => {
    try {
      const data = {
        ...formData,
        submissionDate: formData.submissionDate || null,
        completionDate: formData.completionDate || null,
        referenceNumber: formData.referenceNumber || null,
        notes: formData.notes || null,
      };

      if (editingSubmission) {
        await api.put(`/government-forms/${editingSubmission.id}`, data);
      } else {
        await api.post('/government-forms', data);
      }

      await loadSubmissions();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save submission:', error);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await api.delete(`/government-forms/${submissionId}`);
        await loadSubmissions();
      } catch (error) {
        console.error('Failed to delete submission:', error);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  const filterByType = (type?: string) => {
    if (!type) return submissions;
    return submissions.filter(s => s.submissionType === type);
  };

  const getSubmissionsForTab = () => {
    switch (selectedTab) {
      case 0: return submissions;
      case 1: return filterByType('bdm_death_registration');
      case 2: return filterByType('coroner_report');
      case 3: return filterByType('death_certificate_application');
      default: return submissions;
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Government Forms
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage BDM registrations, coroner reports, and death certificate applications
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Submission
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)} sx={{ mb: 3 }}>
            <Tab label="All Submissions" />
            <Tab label="BDM Registrations" />
            <Tab label="Coroner Reports" />
            <Tab label="Death Certificates" />
          </Tabs>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Deceased</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Reference #</strong></TableCell>
                  <TableCell><strong>Submitted</strong></TableCell>
                  <TableCell><strong>Completed</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getSubmissionsForTab().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        No submissions found. Create your first submission to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  getSubmissionsForTab().map((submission) => (
                    <TableRow key={submission.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {submissionTypeIcons[submission.submissionType]}
                          <Typography variant="body2">
                            {submissionTypeLabels[submission.submissionType]}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {submission.deceasedName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={statusColors[submission.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {submission.referenceNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(submission.submissionDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(submission.completionDate)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenDialog(submission)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSubmission(submission.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSubmission ? 'Edit Submission' : 'New Government Submission'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Arrangement"
                  value={formData.arrangementId}
                  onChange={(e) => setFormData({ ...formData, arrangementId: e.target.value })}
                  required
                  disabled={!!editingSubmission}
                >
                  <MenuItem value="">Select arrangement</MenuItem>
                  {arrangements.map((arr) => (
                    <MenuItem key={arr.id} value={arr.id}>
                      {arr.deceasedName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Submission Type"
                  value={formData.submissionType}
                  onChange={(e) => setFormData({ ...formData, submissionType: e.target.value as any })}
                  required
                  disabled={!!editingSubmission}
                >
                  <MenuItem value="bdm_death_registration">BDM Death Registration</MenuItem>
                  <MenuItem value="coroner_report">Coroner Report</MenuItem>
                  <MenuItem value="death_certificate_application">Death Certificate Application</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="e.g., BDM-2024-123456"
                  helperText="Enter once received from government agency"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Submission Date"
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Completion Date"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes, special instructions, or comments"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveSubmission} variant="contained">
            {editingSubmission ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

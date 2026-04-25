import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Download as DownloadIcon,
  Restore as RestoreIcon,
  Edit as EditIcon,
  CloudUpload as CloudIcon,
  Storage as LocalIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  destination: 'local' | 's3' | 'google-drive' | 'dropbox';
  destinationConfig: any;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdAt: string;
}

interface BackupHistory {
  id: string;
  scheduleId: string | null;
  scheduleName: string | null;
  status: 'running' | 'completed' | 'failed';
  filePath: string | null;
  fileSize: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export default function BackupsPage() {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [history, setHistory] = useState<BackupHistory[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [scheduleDialog, setScheduleDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    schedule?: BackupSchedule;
  }>({ open: false, mode: 'create' });
  const [manualBackupDialog, setManualBackupDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; backup?: BackupHistory }>({
    open: false,
  });
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    destination: 'local' as 'local' | 's3' | 'google-drive' | 'dropbox',
    isActive: true,
    s3Config: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: '',
    },
  });

  const [manualBackupData, setManualBackupData] = useState({
    destination: 'download' as 'download' | 'server' | 'local' | 's3' | 'google-drive' | 'dropbox',
    s3Config: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucket: '',
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, historyRes] = await Promise.all([
        api.get('/backups/schedules'),
        api.get('/backups/history'),
      ]);
      setSchedules(schedulesRes.data.schedules);
      setHistory(historyRes.data.history);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load backup data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const destinationConfig = formData.destination === 's3' ? formData.s3Config : {};

      await api.post('/backups/schedules', {
        name: formData.name,
        frequency: formData.frequency,
        destination: formData.destination,
        destinationConfig,
      });

      setSuccess('Backup schedule created successfully');
      setScheduleDialog({ open: false, mode: 'create' });
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create backup schedule');
    }
  };

  const handleUpdateSchedule = async (id: string) => {
    try {
      const destinationConfig = formData.destination === 's3' ? formData.s3Config : {};

      await api.put(`/backups/schedules/${id}`, {
        name: formData.name,
        frequency: formData.frequency,
        destination: formData.destination,
        destinationConfig,
        isActive: formData.isActive,
      });

      setSuccess('Backup schedule updated successfully');
      setScheduleDialog({ open: false, mode: 'create' });
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update backup schedule');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backup schedule?')) return;

    try {
      await api.delete(`/backups/schedules/${id}`);
      setSuccess('Backup schedule deleted successfully');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete backup schedule');
    }
  };

  const handleManualBackup = async () => {
    try {
      const destinationConfig = manualBackupData.destination === 's3' ? manualBackupData.s3Config : {};

      // If download option, get the file directly
      if (manualBackupData.destination === 'download') {
        const response = await api.post('/backups/manual', {
          destination: 'download',
          destinationConfig,
        }, { responseType: 'blob' });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `careportal-backup-${timestamp}.sql`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSuccess('Backup downloaded successfully');
      } else {
        await api.post('/backups/manual', {
          destination: manualBackupData.destination,
          destinationConfig,
        });

        setSuccess('Manual backup created successfully');
      }

      setManualBackupDialog(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create manual backup');
    }
  };

  const handleDownloadBackup = async (id: string) => {
    try {
      const response = await api.get(`/backups/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${id}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to download backup');
    }
  };

  const handleRestoreBackup = async (id: string) => {
    try {
      await api.post(`/backups/restore/${id}`);
      setSuccess('Database restored successfully from backup');
      setRestoreDialog({ open: false });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to restore backup');
    }
  };

  const openEditDialog = (schedule: BackupSchedule) => {
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      destination: schedule.destination,
      isActive: schedule.isActive,
      s3Config:
        schedule.destination === 's3'
          ? schedule.destinationConfig
          : {
              accessKeyId: '',
              secretAccessKey: '',
              region: 'us-east-1',
              bucket: '',
            },
    });
    setScheduleDialog({ open: true, mode: 'edit', schedule });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: 'daily',
      destination: 'local',
      isActive: true,
      s3Config: {
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        bucket: '',
      },
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  const getDestinationIcon = (destination: string) => {
    switch (destination) {
      case 'local':
        return <LocalIcon />;
      case 's3':
      case 'google-drive':
      case 'dropbox':
        return <CloudIcon />;
      default:
        return <LocalIcon />;
    }
  };

  const getDestinationLabel = (destination: string) => {
    switch (destination) {
      case 'local':
        return 'Server';
      case 's3':
        return 'Amazon S3';
      case 'google-drive':
        return 'Google Drive';
      case 'dropbox':
        return 'Dropbox';
      default:
        return destination;
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
            Backup & Restore
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage automated backups and restore data
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RunIcon />}
            onClick={() => setManualBackupDialog(true)}
            sx={{ mr: 2 }}
          >
            Manual Backup
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setScheduleDialog({ open: true, mode: 'create' });
            }}
          >
            New Schedule
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
          <Tab label="Backup Schedules" />
          <Tab label="Backup History" />
          <Tab label="Data Export" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Card>
          <CardContent>
            {schedules.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CloudIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No backup schedules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a schedule to automatically backup your data
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Run</TableCell>
                      <TableCell>Next Run</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {schedule.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={schedule.frequency} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getDestinationIcon(schedule.destination)}
                            <Typography variant="body2">{getDestinationLabel(schedule.destination)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={schedule.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {schedule.lastRunAt
                            ? format(new Date(schedule.lastRunAt), 'dd MMM yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(schedule.nextRunAt), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEditDialog(schedule)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === 1 && (
        <Card>
          <CardContent>
            {history.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CloudIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No backup history
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Backup history will appear here
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Schedule</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>File Size</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((backup) => (
                      <TableRow key={backup.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {backup.scheduleName || 'Manual Backup'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={backup.status}
                            size="small"
                            color={getStatusColor(backup.status) as any}
                          />
                          {backup.errorMessage && (
                            <Typography variant="caption" color="error" display="block">
                              {backup.errorMessage}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                        <TableCell>
                          {format(new Date(backup.startedAt), 'dd MMM yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {backup.completedAt
                            ? format(new Date(backup.completedAt), 'dd MMM yyyy HH:mm')
                            : 'Running...'}
                        </TableCell>
                        <TableCell align="right">
                          {backup.status === 'completed' && (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownloadBackup(backup.id)}
                                title="Download Backup"
                              >
                                <DownloadIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setRestoreDialog({ open: true, backup })}
                                title="Restore from Backup"
                              >
                                <RestoreIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Export specific data sets to CSV or JSON format for reporting and analysis
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Arrangements Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export all arrangements with deceased information, dates, and status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/arrangements?format=csv', '_blank')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/arrangements?format=json', '_blank')}
                    >
                      Export JSON
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Invoices & Revenue
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export invoice data including line items, payments, and balances
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/invoices?format=csv', '_blank')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/invoices?format=json', '_blank')}
                    >
                      Export JSON
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Staff & Rostering
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export staff profiles, roles, and assignment history
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/staff?format=csv', '_blank')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/staff?format=json', '_blank')}
                    >
                      Export JSON
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Audit Logs
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export system audit logs for compliance and security review
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/audit-logs?format=csv', '_blank')}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open('/api/export/audit-logs?format=json', '_blank')}
                    >
                      Export JSON
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <strong>Note:</strong> Exports include all data from the database. Use filters in your reporting tools to analyze specific date ranges or subsets of data.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Schedule Dialog */}
      <Dialog
        open={scheduleDialog.open}
        onClose={() => setScheduleDialog({ open: false, mode: 'create' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {scheduleDialog.mode === 'create' ? 'Create Backup Schedule' : 'Edit Backup Schedule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schedule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frequency"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Destination</InputLabel>
                <Select
                  value={formData.destination}
                  label="Destination"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destination: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="local">Server</MenuItem>
                  <MenuItem value="s3">Amazon S3</MenuItem>
                  <MenuItem value="google-drive">Google Drive</MenuItem>
                  <MenuItem value="dropbox">Dropbox</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.destination === 's3' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="AWS Access Key ID"
                    value={formData.s3Config.accessKeyId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        s3Config: { ...formData.s3Config, accessKeyId: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="AWS Secret Access Key"
                    value={formData.s3Config.secretAccessKey}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        s3Config: { ...formData.s3Config, secretAccessKey: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Region"
                    value={formData.s3Config.region}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        s3Config: { ...formData.s3Config, region: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bucket Name"
                    value={formData.s3Config.bucket}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        s3Config: { ...formData.s3Config, bucket: e.target.value },
                      })
                    }
                  />
                </Grid>
              </>
            )}

            {scheduleDialog.mode === 'edit' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog({ open: false, mode: 'create' })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (scheduleDialog.mode === 'create') {
                handleCreateSchedule();
              } else if (scheduleDialog.schedule) {
                handleUpdateSchedule(scheduleDialog.schedule.id);
              }
            }}
          >
            {scheduleDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Backup Dialog */}
      <Dialog
        open={manualBackupDialog}
        onClose={() => setManualBackupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Manual Backup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Destination</InputLabel>
                <Select
                  value={manualBackupData.destination}
                  label="Destination"
                  onChange={(e) =>
                    setManualBackupData({
                      ...manualBackupData,
                      destination: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="download">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DownloadIcon fontSize="small" />
                      Download to Computer
                    </Box>
                  </MenuItem>
                  <MenuItem value="server">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalIcon fontSize="small" />
                      Store on Server
                    </Box>
                  </MenuItem>
                  <MenuItem value="s3">Amazon S3</MenuItem>
                  <MenuItem value="google-drive">Google Drive</MenuItem>
                  <MenuItem value="dropbox">Dropbox</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {manualBackupData.destination === 's3' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="AWS Access Key ID"
                    value={manualBackupData.s3Config.accessKeyId}
                    onChange={(e) =>
                      setManualBackupData({
                        ...manualBackupData,
                        s3Config: { ...manualBackupData.s3Config, accessKeyId: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="AWS Secret Access Key"
                    value={manualBackupData.s3Config.secretAccessKey}
                    onChange={(e) =>
                      setManualBackupData({
                        ...manualBackupData,
                        s3Config: {
                          ...manualBackupData.s3Config,
                          secretAccessKey: e.target.value,
                        },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Region"
                    value={manualBackupData.s3Config.region}
                    onChange={(e) =>
                      setManualBackupData({
                        ...manualBackupData,
                        s3Config: { ...manualBackupData.s3Config, region: e.target.value },
                      })
                    }
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bucket Name"
                    value={manualBackupData.s3Config.bucket}
                    onChange={(e) =>
                      setManualBackupData({
                        ...manualBackupData,
                        s3Config: { ...manualBackupData.s3Config, bucket: e.target.value },
                      })
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualBackupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualBackup}>
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog.open} onClose={() => setRestoreDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Database from Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Warning:</strong> This will replace ALL current data with the backup data. This action CANNOT be undone.
          </Alert>

          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Important:</strong> Before restoring:
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              <li>Ensure all users are logged out</li>
              <li>Create a current backup first</li>
              <li>Verify this is the correct backup to restore</li>
            </ul>
          </Alert>

          {restoreDialog.backup && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Backup Details:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Created:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {format(new Date(restoreDialog.backup.startedAt), 'dd MMM yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    File Size:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {formatFileSize(restoreDialog.backup.fileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Schedule:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {restoreDialog.backup.scheduleName || 'Manual Backup'}
                  </Typography>
                </Grid>
                {restoreDialog.backup.filePath && (
                  <>
                    <Grid item xs={5}>
                      <Typography variant="body2" color="text.secondary">
                        File Path:
                      </Typography>
                    </Grid>
                    <Grid item xs={7}>
                      <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                        {restoreDialog.backup.filePath}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          )}

          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Double Confirmation Required
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              To confirm this destructive action, please type <strong>RESTORE</strong> in the field below:
            </Typography>
          </Alert>

          <TextField
            fullWidth
            placeholder="Type RESTORE to confirm"
            value={restoreConfirmText}
            onChange={(e) => setRestoreConfirmText(e.target.value)}
            autoFocus
            sx={{ mt: 1 }}
            helperText="This confirmation ensures you understand the consequences of restoring"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRestoreDialog({ open: false });
              setRestoreConfirmText('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RestoreIcon />}
            disabled={restoreConfirmText !== 'RESTORE'}
            onClick={() => {
              if (restoreDialog.backup && restoreConfirmText === 'RESTORE') {
                handleRestoreBackup(restoreDialog.backup.id);
                setRestoreConfirmText('');
              }
            }}
          >
            Restore Database
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assignment as ArrangementIcon,
  AttachMoney as InvoiceIcon,
  Receipt as PriceIcon,
  Gavel as GovernmentIcon,
  People as UsersIcon,
  CalendarMonth as CalendarIcon,
  Backup as BackupIcon,
} from '@mui/icons-material';
import api from '@/services/api';

export default function ExportPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async (type: string, filename: string) => {
    setExporting(type);
    setError('');
    setSuccess('');

    try {
      const response = await api.get(`/export/${type}`, {
        responseType: type === 'all' ? 'json' : 'blob',
      });

      // Create download link
      let blob: Blob;
      if (type === 'all') {
        blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        filename = `fadirect_backup_${Date.now()}.json`;
      } else {
        blob = new Blob([response.data], { type: 'text/csv' });
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      setSuccess(`Successfully exported ${filename}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      type: 'arrangements',
      title: 'Arrangements',
      description: 'Export all funeral arrangements',
      filename: 'arrangements.csv',
      icon: <ArrangementIcon color="primary" />,
    },
    {
      type: 'invoices',
      title: 'Invoices',
      description: 'Export all invoices and payments',
      filename: 'invoices.csv',
      icon: <InvoiceIcon color="success" />,
    },
    {
      type: 'price-lists',
      title: 'Price Lists',
      description: 'Export all price list items',
      filename: 'price_lists.csv',
      icon: <PriceIcon color="info" />,
    },
    {
      type: 'government-forms',
      title: 'Government Forms',
      description: 'Export all government submissions',
      filename: 'government_forms.csv',
      icon: <GovernmentIcon color="warning" />,
    },
    {
      type: 'users',
      title: 'Users',
      description: 'Export all user accounts',
      filename: 'users.csv',
      icon: <UsersIcon color="secondary" />,
    },
    {
      type: 'calendar',
      title: 'Calendar Events',
      description: 'Export all calendar events',
      filename: 'calendar_events.csv',
      icon: <CalendarIcon color="primary" />,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Export & Backup
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Export data to CSV or create complete backups
        </Typography>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Export Individual Datasets
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Export specific data types to CSV format
              </Typography>
              <Divider sx={{ my: 2 }} />

              <List>
                {exportOptions.map((option, index) => (
                  <div key={option.type}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemIcon>{option.icon}</ListItemIcon>
                      <ListItemText
                        primary={option.title}
                        secondary={option.description}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport(option.type, option.filename)}
                        disabled={exporting === option.type}
                      >
                        {exporting === option.type ? 'Exporting...' : 'Export CSV'}
                      </Button>
                    </ListItem>
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <BackupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Complete Backup
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Export all data as a JSON backup file. This includes all arrangements, invoices, users, and settings.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExport('all', 'fadirect_backup.json')}
                  disabled={exporting === 'all'}
                  fullWidth
                >
                  {exporting === 'all' ? 'Creating Backup...' : 'Create Full Backup'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Export Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>CSV Format:</strong> Comma-separated values that can be opened in Excel, Google Sheets, or any spreadsheet application.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>JSON Backup:</strong> Complete backup of all data in JSON format. Can be used to restore your system or migrate to another instance.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> Exports only include active (non-deleted) records unless specified otherwise.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ConfigValue {
  id: string;
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  value: string;
  label: string;
  description: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Dropdown management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [configValues, setConfigValues] = useState<ConfigValue[]>([]);
  const [configDialog, setConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigValue | null>(null);
  const [configFormData, setConfigFormData] = useState({
    value: '',
    label: '',
    isActive: true,
    sortOrder: 0,
  });
  const [formData, setFormData] = useState({
    companyName: '',
    abn: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    primaryColor: '#1A3A52',
    secondaryColor: '#2C5F7F',
    emailFromName: '',
    emailFromAddress: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    invoicePrefix: 'INV',
    invoiceTerms: '',
  });

  useEffect(() => {
    loadSettings();
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadConfigValues();
    }
  }, [selectedCategory]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      const settings = response.data.settings;
      setFormData({
        companyName: settings.companyName || '',
        abn: settings.abn || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || '',
        primaryColor: settings.primaryColor || '#1A3A52',
        secondaryColor: settings.secondaryColor || '#2C5F7F',
        emailFromName: settings.emailFromName || '',
        emailFromAddress: settings.emailFromAddress || '',
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort?.toString() || '',
        smtpUser: settings.smtpUser || '',
        smtpPassword: '',
        smtpSecure: settings.smtpSecure !== false,
        invoicePrefix: settings.invoicePrefix || 'INV',
        invoiceTerms: settings.invoiceTerms || '',
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/config/categories');
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setSelectedCategory(response.data.categories[0].value);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadConfigValues = async () => {
    try {
      const response = await api.get(`/config/values/${selectedCategory}`, {
        params: { includeInactive: true }
      });
      setConfigValues(response.data.values);
    } catch (err) {
      console.error('Failed to load config values:', err);
    }
  };

  const handleOpenConfigDialog = (config?: ConfigValue) => {
    if (config) {
      setEditingConfig(config);
      setConfigFormData({
        value: config.value,
        label: config.label,
        isActive: config.isActive,
        sortOrder: config.sortOrder,
      });
    } else {
      setEditingConfig(null);
      setConfigFormData({
        value: '',
        label: '',
        isActive: true,
        sortOrder: configValues.length,
      });
    }
    setConfigDialog(true);
  };

  const handleSaveConfig = async () => {
    try {
      if (editingConfig) {
        await api.put(`/config/values/${editingConfig.id}`, configFormData);
      } else {
        await api.post(`/config/values/${selectedCategory}`, configFormData);
      }
      setConfigDialog(false);
      await loadConfigValues();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save config value');
    }
  };

  const handleDeleteConfig = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;

    try {
      await api.delete(`/config/values/${id}`);
      await loadConfigValues();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete config value');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const data: any = { ...formData };
      if (formData.smtpPort) {
        data.smtpPort = parseInt(formData.smtpPort);
      }
      if (!formData.smtpPassword) {
        delete data.smtpPassword;
      }

      await api.put('/settings', data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure your company information and system preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
            <Tab label="Company Information" />
            <Tab label="Email Configuration" />
            <Tab label="Invoice Settings" />
            <Tab label="Appearance" />
            <Tab label="Dropdown Lists" />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Company Details
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ABN"
                  value={formData.abn}
                  onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                  placeholder="XX XXX XXX XXX"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+61 2 XXXX XXXX"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Email Settings
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure SMTP settings for sending emails
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Name"
                  value={formData.emailFromName}
                  onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
                  placeholder="FA Direct"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Email Address"
                  type="email"
                  value={formData.emailFromAddress}
                  onChange={(e) => setFormData({ ...formData, emailFromAddress: e.target.value })}
                  placeholder="noreply@fadirect.com.au"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={formData.smtpHost}
                  onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Port"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                  placeholder="587"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={formData.smtpUser}
                  onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Password"
                  type="password"
                  value={formData.smtpPassword}
                  onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                  placeholder="Leave blank to keep existing"
                  helperText="Only enter to change password"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Invoice Configuration
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV"
                  helperText="Prefix for invoice numbers (e.g., INV-000001)"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Invoice Terms & Conditions"
                  value={formData.invoiceTerms}
                  onChange={(e) => setFormData({ ...formData, invoiceTerms: e.target.value })}
                  multiline
                  rows={6}
                  placeholder="Payment is due within 14 days of invoice date..."
                  helperText="Terms displayed on invoices"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Branding
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Customize the look and feel of your portal
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primary Color"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Secondary Color"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  Changes to colors will require a page refresh to take effect
                </Alert>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Dropdown List Management
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Manage dropdown options used throughout the system
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedCategory && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {categories.find(c => c.value === selectedCategory)?.description}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenConfigDialog()}
                    disabled={!selectedCategory}
                  >
                    Add New Option
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12}>
                {selectedCategory && (
                  <Card variant="outlined">
                    <List>
                      {configValues.map((config, index) => (
                        <div key={config.id}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body1">{config.label}</Typography>
                                  {!config.isActive && (
                                    <Chip label="Inactive" size="small" color="default" />
                                  )}
                                </Box>
                              }
                              secondary={`Value: ${config.value} • Sort Order: ${config.sortOrder}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => handleOpenConfigDialog(config)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDeleteConfig(config.id, config.label)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </div>
                      ))}
                      {configValues.length === 0 && (
                        <ListItem>
                          <ListItemText
                            primary="No options configured"
                            secondary="Click 'Add New Option' to create one"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Card>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            {tabValue !== 4 && (
              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Config Value Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingConfig ? 'Edit Option' : 'Add New Option'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Value"
              value={configFormData.value}
              onChange={(e) => setConfigFormData({ ...configFormData, value: e.target.value })}
              disabled={!!editingConfig}
              helperText="Internal value used in database (lowercase, underscores for spaces)"
              placeholder="e.g., direct_cremation"
            />
            <TextField
              fullWidth
              label="Label"
              value={configFormData.label}
              onChange={(e) => setConfigFormData({ ...configFormData, label: e.target.value })}
              helperText="Display name shown to users"
              placeholder="e.g., Direct Cremation"
            />
            <TextField
              fullWidth
              type="number"
              label="Sort Order"
              value={configFormData.sortOrder}
              onChange={(e) => setConfigFormData({ ...configFormData, sortOrder: parseInt(e.target.value) || 0 })}
              helperText="Controls the display order (lower numbers appear first)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={configFormData.isActive}
                  onChange={(e) => setConfigFormData({ ...configFormData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained" disabled={!configFormData.label || !configFormData.value}>
            {editingConfig ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

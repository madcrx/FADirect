import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '@/services/api';
import { authApi } from '@/services/api';
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
}

interface PolicyCategory {
  id: string;
  name: string;
  count: number;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category_id: '',
    version: '',
    description: '',
    requires_acknowledgment: false,
    file: null as File | null,
  });

  useEffect(() => {
    loadCurrentUser();
    loadPolicies();
    loadCategories();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!currentUser?.role) return false;
    const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
    return roles.some(role => userRoles.includes(role));
  };

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/policies');
      setPolicies(response.data.policies || []);

      // Calculate pending acknowledgments
      const pending = (response.data.policies || []).filter(
        (p: PolicyDocument) => p.requires_acknowledgment && !p.acknowledged
      ).length;
      setPendingCount(pending);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/policies/categories');
      const cats = response.data.categories || [];

      // Add "All Documents" option
      setCategories([
        { id: 'all', name: 'All Documents', count: policies.length },
        ...cats.map((c: any) => ({ id: c.id, name: c.name, count: 0 }))
      ]);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const filteredPolicies =
    selectedCategory === 'all'
      ? policies
      : policies.filter((p) => p.category_name === categories.find(c => c.id === selectedCategory)?.name);

  const handleAcknowledge = async (policyId: string) => {
    try {
      await api.post(`/policies/${policyId}/acknowledge`);
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, acknowledged: true } : p))
      );
      setPendingCount((prev) => Math.max(0, prev - 1));
      setSuccess('Policy acknowledged successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to acknowledge policy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpload = async () => {
    try {
      if (!uploadForm.file || !uploadForm.title || !uploadForm.category_id || !uploadForm.version) {
        setError('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('category_id', uploadForm.category_id);
      formData.append('version', uploadForm.version);
      formData.append('description', uploadForm.description);
      formData.append('requires_acknowledgment', uploadForm.requires_acknowledgment.toString());

      await api.post('/policies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Policy uploaded successfully');
      setUploadDialog(false);
      setUploadForm({
        title: '',
        category_id: '',
        version: '',
        description: '',
        requires_acknowledgment: false,
        file: null,
      });
      loadPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload policy');
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

  const handleDelete = async (policyId: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;

    try {
      await api.delete(`/policies/${policyId}`);
      setSuccess('Policy deleted successfully');
      loadPolicies();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete policy');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategoryColor = (categoryName?: string) => {
    if (!categoryName) return 'default';
    const colors: Record<string, string> = {
      'HR Policies': 'primary',
      'Health & Safety': 'error',
      'Service Standards': 'info',
      'Operations': 'success',
      'Compliance': 'warning',
    };
    return colors[categoryName] || 'default';
  };

  const recentlyUpdated = [...policies]
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 3);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Policy & Procedures Library
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Centralized repository for company protocols and compliance documents
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />}>
            Print Directory
          </Button>
          {hasRole(['admin', 'management']) && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialog(true)}
              sx={{ color: 'white' }}
            >
              Upload New
            </Button>
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Required Reading Alert */}
      {pendingCount > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" sx={{ color: 'text.primary' }}>
              Review Now
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="600">
            Required Reading
          </Typography>
          <Typography variant="caption">
            You have {pendingCount} pending policy update{pendingCount !== 1 ? 's' : ''} that require your acknowledgment.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Sidebar: Categories */}
        <Grid item xs={12} md={3}>
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                }}
              >
                Document Categories
              </Typography>
              <List dense sx={{ mt: 1 }}>
                {categories.map((category) => (
                  <ListItem key={category.id} disablePadding>
                    <ListItemButton
                      selected={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText primary={category.name} />
                      <Chip label={category.count} size="small" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Recently Updated */}
          <Card sx={{ mt: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" fontWeight="600" color="white" gutterBottom>
                Required Reading
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, display: 'block' }}>
                You have {pendingCount} pending policy updates that require your acknowledgement.
              </Typography>
              <Button variant="contained" size="small" fullWidth sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
                Review Now →
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content: Recently Updated & All Policies */}
        <Grid item xs={12} md={9}>
          {/* Recently Updated Section */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Recently Updated
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {recentlyUpdated.map((policy) => (
                  <Grid item xs={12} sm={4} key={policy.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              bgcolor: `${getCategoryColor(policy.category_name)}.light`,
                              borderRadius: 1.5,
                              p: 1,
                              display: 'flex',
                            }}
                          >
                            <DocumentIcon sx={{ fontSize: 24, color: `${getCategoryColor(policy.category_name)}.main` }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                          {policy.title}
                        </Typography>
                        {policy.category_name && (
                          <Chip
                            label={policy.category_name}
                            size="small"
                            sx={{
                              bgcolor: `${getCategoryColor(policy.category_name)}.light`,
                              color: `${getCategoryColor(policy.category_name)}.main`,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          Updated {format(new Date(policy.updated_at || policy.created_at), 'MMM d, yyyy')} • {policy.version}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* All Policies Table */}
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                All Policies
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPolicies.map((policy) => (
                      <TableRow key={policy.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <DocumentIcon fontSize="small" color="action" />
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {policy.title}
                              </Typography>
                              {policy.requires_acknowledgment && !policy.acknowledged && (
                                <Chip label="Acknowledgment Required" size="small" color="warning" sx={{ height: '20px', fontSize: '0.7rem', mt: 0.5 }} />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {policy.category_name ? (
                            <Chip
                              label={policy.category_name}
                              size="small"
                              sx={{
                                bgcolor: `${getCategoryColor(policy.category_name)}.light`,
                                color: `${getCategoryColor(policy.category_name)}.main`,
                                fontSize: '0.7rem',
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {format(new Date(policy.updated_at || policy.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{formatFileSize(policy.file_size)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownload(policy.id, policy.file_name)}
                              title="Download"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            {policy.requires_acknowledgment && !policy.acknowledged && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAcknowledge(policy.id)}
                                title="Acknowledge"
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            )}
                            {hasRole(['admin', 'management']) && (
                              <>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(policy.id)}
                                  title="Delete"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Showing 1-{filteredPolicies.length} of {policies.length} documents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Policy Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Document Title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              required
            />
            <TextField
              fullWidth
              select
              label="Category"
              value={uploadForm.category_id}
              onChange={(e) => setUploadForm({ ...uploadForm, category_id: e.target.value })}
              required
            >
              {categories
                .filter(c => c.id !== 'all')
                .map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              fullWidth
              label="Version"
              placeholder="e.g., v1.0"
              value={uploadForm.version}
              onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
            <Box>
              <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth>
                {uploadForm.file ? uploadForm.file.name : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setUploadForm({ ...uploadForm, file });
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Accepted formats: PDF, DOC, DOCX (Max 50MB)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="checkbox"
                id="requires-ack"
                checked={uploadForm.requires_acknowledgment}
                onChange={(e) => setUploadForm({ ...uploadForm, requires_acknowledgment: e.target.checked })}
              />
              <label htmlFor="requires-ack">
                <Typography variant="body2">Requires staff acknowledgment</Typography>
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} sx={{ color: 'white' }}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

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
} from '@mui/material';
import {
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  version: string;
  lastUpdated: Date;
  size: string;
  requiresAcknowledgment: boolean;
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

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = () => {
    // Mock data - replace with actual API call
    const mockPolicies: PolicyDocument[] = [
      {
        id: '1',
        title: 'COVID-19 Protocol',
        category: 'Health & Safety',
        version: 'v4.2',
        lastUpdated: new Date('2023-10-24'),
        size: '1.2 MB',
        requiresAcknowledgment: true,
        acknowledged: false,
      },
      {
        id: '2',
        title: 'Ceremony Conduct Guide',
        category: 'Service Standards',
        version: 'v2.1',
        lastUpdated: new Date('2023-10-16'),
        size: '2.8 MB',
        requiresAcknowledgment: false,
        acknowledged: true,
      },
      {
        id: '3',
        title: 'Employee Dress Code',
        category: 'HR Policies',
        version: 'v3.0',
        lastUpdated: new Date('2023-09-30'),
        size: '850 KB',
        requiresAcknowledgment: false,
        acknowledged: true,
      },
      {
        id: '4',
        title: 'Staff Bereavement Leave Policy',
        category: 'HR Policies',
        version: 'v1.0',
        lastUpdated: new Date('2023-10-05'),
        size: '1.2 MB',
        requiresAcknowledgment: true,
        acknowledged: true,
      },
      {
        id: '5',
        title: 'Emergency Response Plan - Crematorium',
        category: 'Health & Safety',
        version: 'v4.5',
        lastUpdated: new Date('2023-08-22'),
        size: '4.5 MB',
        requiresAcknowledgment: false,
        acknowledged: true,
      },
      {
        id: '6',
        title: 'Floral Arrangement Display Standards',
        category: 'Service Standards',
        version: 'v2.8',
        lastUpdated: new Date('2023-07-15'),
        size: '2.8 MB',
        requiresAcknowledgment: false,
        acknowledged: true,
      },
      {
        id: '7',
        title: 'Company Vehicle Maintenance Log',
        category: 'Operations',
        version: 'v1.0',
        lastUpdated: new Date('2023-06-02'),
        size: '850 KB',
        requiresAcknowledgment: false,
        acknowledged: true,
      },
      {
        id: '8',
        title: 'Data Privacy & GDPR Guidelines',
        category: 'HR Policies',
        version: 'v2.1',
        lastUpdated: new Date('2023-05-14'),
        size: '2.1 MB',
        requiresAcknowledgment: true,
        acknowledged: false,
      },
    ];

    setPolicies(mockPolicies);

    // Calculate categories
    const categoryMap = new Map<string, number>();
    mockPolicies.forEach((policy) => {
      categoryMap.set(policy.category, (categoryMap.get(policy.category) || 0) + 1);
    });

    const cats: PolicyCategory[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name.toLowerCase().replace(/ /g, '_'),
      name,
      count,
    }));

    setCategories([{ id: 'all', name: 'All Documents', count: mockPolicies.length }, ...cats]);

    // Calculate pending acknowledgments
    const pending = mockPolicies.filter((p) => p.requiresAcknowledgment && !p.acknowledged).length;
    setPendingCount(pending);
  };

  const filteredPolicies =
    selectedCategory === 'all'
      ? policies
      : policies.filter((p) => p.category.toLowerCase().replace(/ /g, '_') === selectedCategory);

  const handleAcknowledge = (policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, acknowledged: true } : p))
    );
    setPendingCount((prev) => Math.max(0, prev - 1));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'HR Policies': 'primary',
      'Health & Safety': 'error',
      'Service Standards': 'info',
      'Operations': 'success',
    };
    return colors[category] || 'default';
  };

  const recentlyUpdated = [...policies]
    .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
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
          <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadDialog(true)}>
            Upload New
          </Button>
        </Box>
      </Box>

      {/* Required Reading Alert */}
      {pendingCount > 0 && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
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
                              bgcolor: `${getCategoryColor(policy.category)}.light`,
                              borderRadius: 1.5,
                              p: 1,
                              display: 'flex',
                            }}
                          >
                            <DocumentIcon sx={{ fontSize: 24, color: `${getCategoryColor(policy.category)}.main` }} />
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                          {policy.title}
                        </Typography>
                        <Chip
                          label={policy.category}
                          size="small"
                          sx={{
                            bgcolor: `${getCategoryColor(policy.category)}.light`,
                            color: `${getCategoryColor(policy.category)}.main`,
                            fontSize: '0.7rem',
                          }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          Updated {format(policy.lastUpdated, 'MMM d, yyyy')} • {policy.version}
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
                              {policy.requiresAcknowledgment && !policy.acknowledged && (
                                <Chip label="Acknowledgment Required" size="small" color="warning" sx={{ height: '20px', fontSize: '0.7rem', mt: 0.5 }} />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={policy.category}
                            size="small"
                            sx={{
                              bgcolor: `${getCategoryColor(policy.category)}.light`,
                              color: `${getCategoryColor(policy.category)}.main`,
                              fontSize: '0.7rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {format(policy.lastUpdated, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{policy.size}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton size="small" color="primary">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="primary">
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            {policy.requiresAcknowledgment && !policy.acknowledged && (
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAcknowledge(policy.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
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
            <TextField fullWidth label="Document Title" />
            <TextField fullWidth select label="Category" defaultValue="">
              <MenuItem value="HR Policies">HR Policies</MenuItem>
              <MenuItem value="Health & Safety">Health & Safety</MenuItem>
              <MenuItem value="Service Standards">Service Standards</MenuItem>
              <MenuItem value="Operations">Operations</MenuItem>
            </TextField>
            <TextField fullWidth label="Version" placeholder="e.g., v1.0" />
            <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
              Choose File
              <input type="file" hidden />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

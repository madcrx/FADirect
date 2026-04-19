import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface Mourner {
  id: string;
  arrangementId: string;
  deceasedName: string;
  mournerName: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  serviceDate: string | null;
  status: string;
}

export default function MournersPage() {
  const [mourners, setMourners] = useState<Mourner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMourner, setSelectedMourner] = useState<Mourner | null>(null);
  const [editForm, setEditForm] = useState({
    mournerName: '',
    mournerRelationship: '',
    mournerPhone: '',
    mournerEmail: '',
  });

  useEffect(() => {
    loadMourners();
  }, []);

  const loadMourners = async () => {
    setLoading(true);
    try {
      const response = await api.get('/arrangements');

      // Extract mourners from arrangements
      const mournersData: Mourner[] = [];
      response.data.arrangements.forEach((arrangement: any) => {
        if (arrangement.mournerPhone) {
          mournersData.push({
            id: arrangement.id,
            arrangementId: arrangement.id,
            deceasedName: arrangement.deceasedName,
            mournerName: arrangement.mournerName || 'Unknown',
            relationship: arrangement.mournerRelationship || 'Family',
            phoneNumber: arrangement.mournerPhone,
            email: arrangement.mournerEmail,
            serviceDate: arrangement.serviceDate,
            status: arrangement.status,
          });
        }
      });

      setMourners(mournersData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load mourners');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (mourner: Mourner) => {
    setSelectedMourner(mourner);
    setEditForm({
      mournerName: mourner.mournerName,
      mournerRelationship: mourner.relationship,
      mournerPhone: mourner.phoneNumber,
      mournerEmail: mourner.email || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedMourner(null);
    setEditForm({
      mournerName: '',
      mournerRelationship: '',
      mournerPhone: '',
      mournerEmail: '',
    });
  };

  const handleEditSave = async () => {
    if (!selectedMourner) return;

    try {
      await api.put(`/arrangements/${selectedMourner.arrangementId}`, {
        mournerName: editForm.mournerName,
        mournerRelationship: editForm.mournerRelationship,
        mournerPhone: editForm.mournerPhone,
        mournerEmail: editForm.mournerEmail || null,
      });

      await loadMourners();
      handleEditClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update mourner');
    }
  };

  const handleDeleteClick = (mourner: Mourner) => {
    setSelectedMourner(mourner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMourner) return;

    try {
      await api.delete(`/arrangements/${selectedMourner.arrangementId}`);
      await loadMourners();
      setDeleteDialogOpen(false);
      setSelectedMourner(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete mourner');
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedMourner(null);
  };

  const filteredMourners = mourners.filter((mourner) => {
    const search = searchTerm.toLowerCase();
    return (
      mourner.mournerName.toLowerCase().includes(search) ||
      mourner.deceasedName.toLowerCase().includes(search) ||
      mourner.phoneNumber.includes(search)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'confirmed':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading mourners...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Mourners
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Contact information for family members and mourners
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by mourner name, deceased name, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mourner</TableCell>
                <TableCell>Deceased</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Service Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMourners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 8 }}>
                      <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No mourners found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mourners will appear here when phone numbers are added to arrangements
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMourners.map((mourner) => (
                  <TableRow key={mourner.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                        <Typography fontWeight="medium">{mourner.mournerName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{mourner.deceasedName}</TableCell>
                    <TableCell>{mourner.relationship}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">{mourner.phoneNumber}</Typography>
                        </Box>
                        {mourner.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{mourner.email}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {mourner.serviceDate ? format(new Date(mourner.serviceDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={mourner.status.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={getStatusColor(mourner.status) as any}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(mourner)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(mourner)}
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
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Mourner</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Mourner Name"
              fullWidth
              value={editForm.mournerName}
              onChange={(e) => setEditForm({ ...editForm, mournerName: e.target.value })}
            />
            <TextField
              label="Relationship"
              fullWidth
              value={editForm.mournerRelationship}
              onChange={(e) => setEditForm({ ...editForm, mournerRelationship: e.target.value })}
            />
            <TextField
              label="Phone Number"
              fullWidth
              value={editForm.mournerPhone}
              onChange={(e) => setEditForm({ ...editForm, mournerPhone: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={editForm.mournerEmail}
              onChange={(e) => setEditForm({ ...editForm, mournerEmail: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm">
        <DialogTitle>Delete Mourner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this mourner? This will soft delete the entire arrangement for{' '}
            <strong>{selectedMourner?.deceasedName}</strong>.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action can be reversed from the Trash page.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

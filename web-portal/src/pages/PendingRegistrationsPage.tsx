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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface PendingRegistration {
  id: string;
  phone_number: string;
  name: string;
  email: string | null;
  requested_role: string;
  registration_data: any;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function PendingRegistrationsPage() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Approve dialog
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, [statusFilter]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/registration/pending${params}`);
      setRegistrations(response.data.registrations);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setAssignedRoles([registration.requested_role]);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRegistration) return;

    try {
      await api.post(`/registration/${selectedRegistration.id}/approve`, {
        assignedRoles,
      });
      setSuccess(`Successfully approved ${selectedRegistration.name}`);
      setApproveDialogOpen(false);
      setSelectedRegistration(null);
      setAssignedRoles([]);
      await loadRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to approve registration');
      setApproveDialogOpen(false);
    }
  };

  const handleApproveCancel = () => {
    setApproveDialogOpen(false);
    setSelectedRegistration(null);
    setAssignedRoles([]);
  };

  const handleRejectClick = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRegistration) return;

    try {
      await api.post(`/registration/${selectedRegistration.id}/reject`, {
        reason: rejectionReason || 'No reason provided',
      });
      setSuccess(`Rejected registration for ${selectedRegistration.name}`);
      setRejectDialogOpen(false);
      setSelectedRegistration(null);
      setRejectionReason('');
      await loadRegistrations();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reject registration');
      setRejectDialogOpen(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setSelectedRegistration(null);
    setRejectionReason('');
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const search = searchTerm.toLowerCase();
    return (
      reg.name.toLowerCase().includes(search) ||
      reg.phone_number.includes(search) ||
      (reg.email && reg.email.toLowerCase().includes(search))
    );
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'success' as const, label: 'Approved', icon: <CheckCircleIcon /> };
      case 'rejected':
        return { color: 'error' as const, label: 'Rejected', icon: <CancelIcon /> };
      case 'pending':
      default:
        return { color: 'warning' as const, label: 'Pending', icon: <PendingIcon /> };
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading registrations...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            User Registrations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and approve user registration requests
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by name, phone number, or email..."
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
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Requested Role</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reviewed By</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 8 }}>
                      <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        No registrations found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {statusFilter === 'pending'
                          ? 'No pending registrations at this time'
                          : 'Try adjusting your search or filters'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((reg) => {
                  const statusConfig = getStatusConfig(reg.status);
                  return (
                    <TableRow key={reg.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <PersonIcon />
                          </Avatar>
                          <Typography fontWeight="medium">{reg.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(reg.requested_role)}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{reg.phone_number}</Typography>
                          </Box>
                          {reg.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{reg.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(reg.created_at), 'dd MMM yyyy HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={reg.rejection_reason || ''}>
                          <Chip
                            label={statusConfig.label}
                            size="small"
                            color={statusConfig.color}
                            icon={statusConfig.icon}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {reg.reviewed_by_name ? (
                          <Box>
                            <Typography variant="body2">{reg.reviewed_by_name}</Typography>
                            {reg.reviewed_at && (
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(reg.reviewed_at), 'dd MMM yyyy')}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {reg.status === 'pending' && (
                          <>
                            <Tooltip title="Approve Registration">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApproveClick(reg)}
                                sx={{ mr: 1 }}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Registration">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectClick(reg)}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={handleApproveCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Registration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Alert severity="info">
              Approving this registration will create a user account and send a notification to{' '}
              <strong>{selectedRegistration?.name}</strong>.
            </Alert>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Applicant Details:
              </Typography>
              <Typography variant="body2">Name: {selectedRegistration?.name}</Typography>
              <Typography variant="body2">Phone: {selectedRegistration?.phone_number}</Typography>
              {selectedRegistration?.email && (
                <Typography variant="body2">Email: {selectedRegistration?.email}</Typography>
              )}
              <Typography variant="body2">
                Requested Role: {getRoleLabel(selectedRegistration?.requested_role || '')}
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Assign Roles</InputLabel>
              <Select
                multiple
                value={assignedRoles}
                label="Assign Roles"
                onChange={(e) => setAssignedRoles(e.target.value as string[])}
              >
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="conductor">Conductor</MenuItem>
                <MenuItem value="arranger">Arranger</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="mourner">Mourner</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="management">Management</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApproveCancel}>Cancel</Button>
          <Button
            onClick={handleApproveConfirm}
            variant="contained"
            color="success"
            disabled={assignedRoles.length === 0}
          >
            Approve & Create Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Registration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Alert severity="warning">
              Rejecting this registration will notify <strong>{selectedRegistration?.name}</strong> via
              email.
            </Alert>

            <TextField
              fullWidth
              label="Rejection Reason (Optional)"
              multiline
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection (will be sent to the applicant)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button onClick={handleRejectConfirm} variant="contained" color="error">
            Reject Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

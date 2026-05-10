import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api, { leaveApi, authApi } from '@/services/api';
import type { Leave, User } from '@/types';

const LeaveManagementPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leaveRequest, setLeaveRequest] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadCurrentUser();
    fetchLeaves();
  }, [currentTab]);

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

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (currentTab !== 'all') {
        params.status = currentTab;
      }
      // Use /leave endpoint instead of /staff-profiles/leave/all
      const response = await api.get('/leave', { params });
      const leaveData = response.data.leaveRequests || response.data.leaves || [];

      // Backend already returns camelCase, just use it directly
      const transformedLeaves = leaveData.map((lr: any) => ({
        id: lr.id,
        userId: lr.staffId,
        staffName: lr.staffName,
        leaveType: lr.leaveType || 'annual',
        startDate: lr.startDate,
        endDate: lr.endDate,
        reason: lr.reason,
        status: lr.status,
        createdAt: lr.createdAt,
        approvedBy: lr.approvedBy,
        approvedAt: lr.approvedAt,
      }));

      setLeaves(transformedLeaves);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      showSnackbar('Failed to load leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'pending' | 'approved' | 'rejected' | 'all') => {
    setCurrentTab(newValue);
  };

  const handleOpenConfirmDialog = (leave: Leave, action: 'approve' | 'reject' | 'delete') => {
    setSelectedLeave(leave);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedLeave(null);
    setConfirmAction(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedLeave || !confirmAction) return;

    try {
      if (confirmAction === 'delete') {
        await api.delete(`/leave/${selectedLeave.id}`);
        showSnackbar('Leave request deleted successfully', 'success');
      } else {
        const newStatus = confirmAction === 'approve' ? 'approved' : 'rejected';
        await api.put(`/leave/${selectedLeave.id}/status`, { status: newStatus });
        showSnackbar(`Leave request ${confirmAction}d successfully`, 'success');
      }
      fetchLeaves();
    } catch (error: any) {
      console.error(`Error ${confirmAction}ing leave:`, error);
      showSnackbar(error.response?.data?.error?.message || `Failed to ${confirmAction} leave request`, 'error');
    } finally {
      handleCloseConfirmDialog();
    }
  };

  const handleOpenRequestDialog = () => {
    setLeaveRequest({
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    });
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
  };

  const handleSubmitRequest = async () => {
    if (!currentUser || !leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.reason) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Use the /leave endpoint directly instead of staff-profiles endpoint
      await api.post('/leave', {
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        leaveType: leaveRequest.leaveType,
        reason: leaveRequest.reason,
      });
      showSnackbar('Leave request submitted successfully', 'success');
      handleCloseRequestDialog();
      fetchLeaves();
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      showSnackbar(error.response?.data?.error?.message || 'Failed to submit leave request', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual':
        return 'Annual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'personal':
        return 'Personal Leave';
      case 'unpaid':
        return 'Unpaid Leave';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Leave Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasRole(['admin', 'management']) ? 'Review and approve staff leave requests' : 'Request and manage your leave'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenRequestDialog}
            sx={{ color: 'white' }}
          >
            Request Leave
          </Button>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Pending" value="pending" />
            <Tab label="Approved" value="approved" />
            <Tab label="Rejected" value="rejected" />
            <Tab label="All" value="all" />
          </Tabs>
        </Paper>

        {loading ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Loading leave requests...</Typography>
          </Paper>
        ) : leaves.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No leave requests found</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id} hover>
                    <TableCell>{leave.staffName || 'Unknown'}</TableCell>
                    <TableCell>{getLeaveTypeLabel(leave.leaveType)}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{calculateDuration(leave.startDate, leave.endDate)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leave.reason || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        color={getStatusColor(leave.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(leave.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {leave.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleOpenConfirmDialog(leave, 'approve')}
                              title="Approve"
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenConfirmDialog(leave, 'reject')}
                              title="Reject"
                            >
                              <CloseIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenConfirmDialog(leave, 'delete')}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          {confirmAction === 'approve' && 'Approve Leave Request'}
          {confirmAction === 'reject' && 'Reject Leave Request'}
          {confirmAction === 'delete' && 'Delete Leave Request'}
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box>
              <Typography>
                {confirmAction === 'approve' && 'Are you sure you want to approve this leave request?'}
                {confirmAction === 'reject' && 'Are you sure you want to reject this leave request?'}
                {confirmAction === 'delete' && 'Are you sure you want to delete this leave request? This action cannot be undone.'}
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2"><strong>Staff:</strong> {selectedLeave.staffName}</Typography>
                <Typography variant="body2"><strong>Type:</strong> {getLeaveTypeLabel(selectedLeave.leaveType)}</Typography>
                <Typography variant="body2"><strong>Dates:</strong> {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}</Typography>
                <Typography variant="body2"><strong>Duration:</strong> {calculateDuration(selectedLeave.startDate, selectedLeave.endDate)}</Typography>
                {selectedLeave.reason && <Typography variant="body2"><strong>Reason:</strong> {selectedLeave.reason}</Typography>}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmAction === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {confirmAction === 'approve' && 'Approve'}
            {confirmAction === 'reject' && 'Reject'}
            {confirmAction === 'delete' && 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={requestDialogOpen} onClose={handleCloseRequestDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Leave Type"
              value={leaveRequest.leaveType}
              onChange={(e) => setLeaveRequest({ ...leaveRequest, leaveType: e.target.value })}
              required
            >
              <MenuItem value="annual">Annual Leave</MenuItem>
              <MenuItem value="sick">Sick Leave</MenuItem>
              <MenuItem value="personal">Personal Leave</MenuItem>
              <MenuItem value="unpaid">Unpaid Leave</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={leaveRequest.startDate}
              onChange={(e) => setLeaveRequest({ ...leaveRequest, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={leaveRequest.endDate}
              onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{ min: leaveRequest.startDate }}
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason"
              value={leaveRequest.reason}
              onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRequestDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest} sx={{ color: 'white' }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LeaveManagementPage;

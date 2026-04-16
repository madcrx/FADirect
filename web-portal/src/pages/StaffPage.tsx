import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  photoUrl: string | null;
  position: string | null;
  licenseNumber: string | null;
  isAvailable: boolean;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    fullName: '',
    roles: ['arranger'] as string[],
    position: '',
    licenseNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/staff-profiles');
      setStaff(response.data.staff);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      // First, create or find the user
      const userResponse = await api.post('/users/find-or-create', {
        phoneNumber: formData.phoneNumber,
        name: formData.fullName,
        role: formData.roles.length > 0 ? formData.roles : ['arranger'],
      });

      const userId = userResponse.data.user.id;

      // Then create the staff profile
      await api.post('/staff-profiles', {
        userId,
        position: formData.position,
        licenseNumber: formData.licenseNumber,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        isAvailable: true,
      });

      setSuccess('Staff member added successfully');
      setDialogOpen(false);
      setFormData({
        phoneNumber: '',
        fullName: '',
        roles: ['arranger'],
        position: '',
        licenseNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      await loadStaff();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add staff member');
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading staff...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage staff profiles, photos, and availability
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Staff Member
        </Button>
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
        {staff.map((member) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={member.photoUrl || undefined}
                    sx={{ width: 80, height: 80, mb: 2 }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold" textAlign="center">
                    {member.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {member.position || member.role}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={member.isAvailable ? 'Available' : 'Unavailable'}
                      size="small"
                      color={member.isAvailable ? 'success' : 'default'}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {member.phoneNumber && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{member.phoneNumber}</Typography>
                    </Box>
                  )}
                  {member.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {member.email}
                      </Typography>
                    </Box>
                  )}
                  {member.licenseNumber && (
                    <Typography variant="caption" color="text.secondary">
                      License: {member.licenseNumber}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {staff.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No staff members found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add staff members to get started
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="+61412345678"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={formData.roles}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const value = e.target.value;
                  setFormData({ ...formData, roles: typeof value === 'string' ? value.split(',') : value });
                }}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="management">Management</MenuItem>
                <MenuItem value="arranger">Arranger</MenuItem>
                <MenuItem value="conductor">Conductor</MenuItem>
                <MenuItem value="funeral_director_assistant">Funeral Director Assistant</MenuItem>
                <MenuItem value="embalmer">Embalmer</MenuItem>
                <MenuItem value="hearse_driver">Hearse Driver</MenuItem>
                <MenuItem value="coach_driver">Coach Driver</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Position / Job Title"
              placeholder="e.g., Senior Funeral Director, Head Embalmer"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              helperText="Optional: Specific job title (different from role)"
            />
            <TextField
              fullWidth
              label="License Number"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            />
            <TextField
              fullWidth
              label="Emergency Contact Name"
              value={formData.emergencyContactName}
              onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Emergency Contact Phone"
              value={formData.emergencyContactPhone}
              onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddStaff}
            disabled={!formData.phoneNumber || !formData.fullName}
          >
            Add Staff Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

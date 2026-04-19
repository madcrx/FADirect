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
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string | string[];
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
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      phoneNumber: member.phoneNumber,
      fullName: member.fullName,
      roles: Array.isArray(member.role) ? member.role : [member.role],
      position: member.position || '',
      licenseNumber: member.licenseNumber || '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
    setPhotoPreview(member.photoUrl);
    setSelectedPhoto(null);
    setDialogOpen(true);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStaff(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setFormData({
      phoneNumber: '',
      fullName: '',
      roles: ['arranger'],
      position: '',
      licenseNumber: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
  };

  const handleSaveStaff = async () => {
    try {
      let photoUrl = null;

      if (editingStaff) {
        // Update existing staff

        // Upload photo if selected
        if (selectedPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('file', selectedPhoto);
          photoFormData.append('userId', editingStaff.userId);

          const photoResponse = await api.post('/staff-profiles/upload-photo', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = photoResponse.data.photoUrl;
        }

        // Update user roles
        await api.put(`/users/${editingStaff.userId}`, {
          name: formData.fullName,
          role: formData.roles,
        });

        // Update staff profile
        await api.post('/staff-profiles', {
          userId: editingStaff.userId,
          photoUrl: photoUrl,
          position: formData.position,
          licenseNumber: formData.licenseNumber,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          isAvailable: true,
        });

        setSuccess('Staff member updated successfully');
        handleCloseDialog();
        await loadStaff();
      } else {
        // Add new staff

        // First, create or find the user
        const userResponse = await api.post('/users/find-or-create', {
          phoneNumber: formData.phoneNumber,
          name: formData.fullName,
          role: formData.roles.length > 0 ? formData.roles : ['arranger'],
        });

        const userId = userResponse.data.user.id;

        // Upload photo if selected
        if (selectedPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('file', selectedPhoto);
          photoFormData.append('userId', userId);

          const photoResponse = await api.post('/staff-profiles/upload-photo', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = photoResponse.data.photoUrl;
        }

        // Then create the staff profile
        await api.post('/staff-profiles', {
          userId,
          photoUrl: photoUrl,
          position: formData.position,
          licenseNumber: formData.licenseNumber,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          isAvailable: true,
        });

        setSuccess('Staff member added successfully');
        handleCloseDialog();
        await loadStaff();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save staff member');
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
                  {member.position && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {member.position}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {(Array.isArray(member.role) ? member.role : [member.role]).map((r) => (
                      <Chip
                        key={r}
                        label={r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
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
                  <IconButton size="small" onClick={() => handleOpenEdit(member)}>
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

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="+61412345678"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              disabled={!!editingStaff}
              helperText={editingStaff ? "Phone number cannot be changed" : ""}
            />
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            {/* Photo Upload */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Staff Photo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {photoPreview && (
                  <Avatar
                    src={photoPreview}
                    sx={{ width: 80, height: 80 }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                )}
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handlePhotoSelect}
                  />
                </Button>
              </Box>
            </Box>

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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveStaff}
            disabled={!formData.fullName || (!editingStaff && !formData.phoneNumber)}
          >
            {editingStaff ? 'Update Staff Member' : 'Add Staff Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useEffect, useState, useMemo } from 'react';
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
  InputAdornment,
  Paper,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import api, { getAuthenticatedImageUrl } from '@/services/api';
import ImageCropDialog from '@/components/ImageCropDialog';

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
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalStaff = staff.length;
    const available = staff.filter(s => s.isAvailable).length;
    const unavailable = totalStaff - available;
    const conductors = staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      return roles.includes('conductor');
    }).length;
    const arrangers = staff.filter(s => {
      const roles = Array.isArray(s.role) ? s.role : [s.role];
      return roles.includes('arranger');
    }).length;

    return { totalStaff, available, unavailable, conductors, arrangers };
  }, [staff]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phoneNumber.includes(searchTerm) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Role filter
      const roles = Array.isArray(member.role) ? member.role : [member.role];
      const matchesRole = roleFilter === 'all' || roles.includes(roleFilter);

      // Availability filter
      const matchesAvailability = availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && member.isAvailable) ||
        (availabilityFilter === 'unavailable' && !member.isAvailable);

      return matchesSearch && matchesRole && matchesAvailability;
    });
  }, [staff, searchTerm, roleFilter, availabilityFilter]);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], 'cropped-photo.jpg', { type: 'image/jpeg' });
    setSelectedPhoto(croppedFile);
    const previewUrl = URL.createObjectURL(croppedBlob);
    setPhotoPreview(previewUrl);
    setCropDialogOpen(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    setImageToCrop(null);
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
        if (selectedPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('file', selectedPhoto);
          photoFormData.append('userId', editingStaff.userId);

          const photoResponse = await api.post('/staff-profiles/upload-photo', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = photoResponse.data.photoUrl;
        }

        await api.put(`/users/${editingStaff.userId}`, {
          name: formData.fullName,
          role: formData.roles,
        });

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
        const userResponse = await api.post('/users/find-or-create', {
          phoneNumber: formData.phoneNumber,
          name: formData.fullName,
          role: formData.roles.length > 0 ? formData.roles : ['arranger'],
        });

        const userId = userResponse.data.user.id;

        if (selectedPhoto) {
          const photoFormData = new FormData();
          photoFormData.append('file', selectedPhoto);
          photoFormData.append('userId', userId);

          const photoResponse = await api.post('/staff-profiles/upload-photo', photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          photoUrl = photoResponse.data.photoUrl;
        }

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

  const handleCallStaff = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmailStaff = (email: string) => {
    window.location.href = `mailto:${email}`;
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Staff Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your team members and their availability
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => setDialogOpen(true)}>
          Add Staff Member
        </Button>
      </Box>

      {/* Alerts */}
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

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Total Staff
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.totalStaff}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, bgcolor: 'success.main', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Available
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.available}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, bgcolor: 'info.main', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Conductors
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.conductors}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, bgcolor: 'secondary.main', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Arrangers
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.arrangers}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, phone, or email..."
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
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="management">Management</MenuItem>
                  <MenuItem value="arranger">Arranger</MenuItem>
                  <MenuItem value="conductor">Conductor</MenuItem>
                  <MenuItem value="hearse_driver">Hearse Driver</MenuItem>
                  <MenuItem value="embalmer">Embalmer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={availabilityFilter}
                  label="Availability"
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="unavailable">Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <Grid container spacing={3}>
        {filteredStaff.map((member) => {
          const roles = Array.isArray(member.role) ? member.role : [member.role];
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Availability Badge */}
                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                  <Chip
                    icon={member.isAvailable ? <CheckCircleIcon /> : <CancelIcon />}
                    label={member.isAvailable ? 'Available' : 'Unavailable'}
                    size="small"
                    color={member.isAvailable ? 'success' : 'default'}
                  />
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        member.isAvailable ? (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              border: '2px solid white',
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        src={getAuthenticatedImageUrl(member.photoUrl)}
                        sx={{ width: 100, height: 100, mb: 2, border: '3px solid', borderColor: 'divider' }}
                      >
                        <PersonIcon sx={{ fontSize: 50 }} />
                      </Avatar>
                    </Badge>
                    <Typography variant="h6" fontWeight="bold" textAlign="center" gutterBottom>
                      {member.fullName}
                    </Typography>
                    {member.position && (
                      <Typography variant="body2" color="primary" fontWeight="medium" textAlign="center" gutterBottom>
                        {member.position}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                      {roles.map((r) => (
                        <Chip
                          key={r}
                          label={r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {member.phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {member.phoneNumber}
                        </Typography>
                        <Tooltip title="Call">
                          <IconButton size="small" color="primary" onClick={() => handleCallStaff(member.phoneNumber)}>
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    {member.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
                          {member.email}
                        </Typography>
                        <Tooltip title="Email">
                          <IconButton size="small" color="primary" onClick={() => handleEmailStaff(member.email)}>
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                    {member.licenseNumber && (
                      <Typography variant="caption" color="text.secondary">
                        License: {member.licenseNumber}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    size="small"
                    onClick={() => handleOpenEdit(member)}
                    fullWidth
                  >
                    Edit
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {filteredStaff.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm || roleFilter !== 'all' || availabilityFilter !== 'all'
                  ? 'No staff members match your filters'
                  : 'No staff members found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || roleFilter !== 'all' || availabilityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add staff members to get started'}
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
                    src={photoPreview.startsWith('blob:') || photoPreview.startsWith('data:') ? photoPreview : getAuthenticatedImageUrl(photoPreview)}
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

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          image={imageToCrop}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          aspect={1}
        />
      )}
    </Box>
  );
}

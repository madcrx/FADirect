import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Alert,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DriveEta as CarIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import api, { getAuthenticatedImageUrl } from '@/services/api';
import ImageCropDialog from '@/components/ImageCropDialog';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  registrationExpiry: string | null;
  color: string;
  photoUrl: string | null;
  seatingCapacity: number | null;
  transmission: string | null;
  engineNumber: string | null;
  vinNumber: string | null;
  allocatedToStaffId: string | null;
  allocatedToStaffName: string | null;
  status: string;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    vehicleType: 'hearse',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registration: '',
    registrationExpiry: '',
    color: '',
    seatingCapacity: 2,
    transmission: 'automatic',
    engineNumber: '',
    vinNumber: '',
    allocatedToStaffId: null as string | null,
  });

  useEffect(() => {
    loadVehicles();
    loadStaff();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await api.get('/staff-profiles');
      setStaff(response.data.staff);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const available = vehicles.filter(v => v.status === 'available').length;
    const inUse = vehicles.filter(v => v.status === 'in_use').length;
    const maintenance = vehicles.filter(v => v.status === 'maintenance').length;
    const hearses = vehicles.filter(v => v.vehicleType === 'hearse').length;
    const limousines = vehicles.filter(v => v.vehicleType === 'limousine').length;

    return { totalVehicles, available, inUse, maintenance, hearses, limousines };
  }, [vehicles]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'all' || vehicle.vehicleType === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, searchTerm, typeFilter, statusFilter]);

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleType: vehicle.vehicleType,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registration: vehicle.registration,
      registrationExpiry: vehicle.registrationExpiry || '',
      color: vehicle.color,
      seatingCapacity: vehicle.seatingCapacity || 2,
      transmission: vehicle.transmission || 'automatic',
      engineNumber: vehicle.engineNumber || '',
      vinNumber: vehicle.vinNumber || '',
      allocatedToStaffId: vehicle.allocatedToStaffId,
    });
    setPhotoPreview(vehicle.photoUrl);
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
    const croppedFile = new File([croppedBlob], 'cropped-vehicle.jpg', { type: 'image/jpeg' });
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
    setEditingVehicle(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setFormData({
      vehicleType: 'hearse',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      registration: '',
      registrationExpiry: '',
      color: '',
      seatingCapacity: 2,
      transmission: 'automatic',
      engineNumber: '',
      vinNumber: '',
      allocatedToStaffId: null,
    });
  };

  const handleSaveVehicle = async () => {
    try {
      let vehicleId = editingVehicle?.id;

      const vehicleData = {
        vehicleType: formData.vehicleType,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        registration: formData.registration,
        registrationExpiry: formData.registrationExpiry || null,
        color: formData.color,
        seatingCapacity: formData.seatingCapacity,
        transmission: formData.transmission,
        engineNumber: formData.engineNumber || null,
        vinNumber: formData.vinNumber || null,
        allocatedToStaffId: formData.allocatedToStaffId,
      };

      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, vehicleData);
      } else {
        const response = await api.post('/vehicles', vehicleData);
        vehicleId = response.data.vehicle.id;
      }

      if (selectedPhoto && vehicleId) {
        const photoFormData = new FormData();
        photoFormData.append('file', selectedPhoto);
        photoFormData.append('vehicleId', vehicleId);

        await api.post('/vehicles/upload-photo', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
      handleCloseDialog();
      await loadVehicles();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save vehicle');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'success' as const, icon: <CheckCircleIcon />, label: 'Available' };
      case 'in_use':
        return { color: 'info' as const, icon: <CarIcon />, label: 'In Use' };
      case 'maintenance':
        return { color: 'warning' as const, icon: <BuildIcon />, label: 'Maintenance' };
      case 'out_of_service':
        return { color: 'error' as const, icon: <ErrorIcon />, label: 'Out of Service' };
      default:
        return { color: 'default' as const, icon: <CarIcon />, label: status };
    }
  };

  const isRegistrationExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isServiceDue = (nextServiceDate: string | null) => {
    if (!nextServiceDate) return false;
    const daysUntilService = Math.floor((new Date(nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilService <= 30 && daysUntilService >= 0;
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading vehicles...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Fleet Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage vehicles, maintenance, and allocations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => setDialogOpen(true)}>
          Add Vehicle
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
              Total Vehicles
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.totalVehicles}
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
              In Use
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.inUse}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, bgcolor: 'warning.main', color: 'white' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Maintenance
            </Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats.maintenance}
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
                placeholder="Search by make, model, or registration..."
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
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Vehicle Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="hearse">Hearse</MenuItem>
                  <MenuItem value="limousine">Limousine</MenuItem>
                  <MenuItem value="family_car">Family Car</MenuItem>
                  <MenuItem value="van">Van</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="in_use">In Use</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="out_of_service">Out of Service</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <Grid container spacing={3}>
        {filteredVehicles.map((vehicle) => {
          const statusConfig = getStatusConfig(vehicle.status);
          const regExpired = isRegistrationExpired(vehicle.registrationExpiry);
          const serviceDue = isServiceDue(vehicle.nextServiceDate);

          return (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Status Badge */}
                <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
                  <Chip
                    icon={statusConfig.icon}
                    label={statusConfig.label}
                    size="small"
                    color={statusConfig.color}
                  />
                </Box>

                {/* Vehicle Photo */}
                {vehicle.photoUrl ? (
                  <CardMedia
                    component="img"
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                    image={getAuthenticatedImageUrl(vehicle.photoUrl)}
                    alt={`${vehicle.make} ${vehicle.model}`}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <CarIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {vehicle.make} {vehicle.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {vehicle.year} • {vehicle.color}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={vehicle.vehicleType.replace('_', ' ').toUpperCase()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {vehicle.transmission && (
                        <Chip
                          label={vehicle.transmission.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Registration
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {vehicle.registration}
                      </Typography>
                    </Box>

                    {vehicle.registrationExpiry && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Registration Expiry
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={regExpired ? 'error' : 'text.primary'}
                        >
                          {format(new Date(vehicle.registrationExpiry), 'dd MMM yyyy')}
                          {regExpired && ' (EXPIRED)'}
                        </Typography>
                      </Box>
                    )}

                    {vehicle.seatingCapacity && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Capacity
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {vehicle.seatingCapacity} seats
                        </Typography>
                      </Box>
                    )}

                    {vehicle.allocatedToStaffName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" color="primary" />
                        <Typography variant="body2" color="primary" fontWeight="medium">
                          {vehicle.allocatedToStaffName}
                        </Typography>
                      </Box>
                    )}

                    {vehicle.nextServiceDate && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Next Service
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={serviceDue ? 'warning.main' : 'text.primary'}
                        >
                          {format(new Date(vehicle.nextServiceDate), 'dd MMM yyyy')}
                          {serviceDue && ' (DUE SOON)'}
                        </Typography>
                      </Box>
                    )}

                    {vehicle.vinNumber && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        VIN: {vehicle.vinNumber}
                      </Typography>
                    )}
                  </Stack>

                  {/* Warnings */}
                  {(regExpired || serviceDue) && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {regExpired && 'Registration expired! '}
                      {serviceDue && 'Service due soon!'}
                    </Alert>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    size="small"
                    onClick={() => handleOpenEdit(vehicle)}
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
      {filteredVehicles.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No vehicles match your filters'
                  : 'No vehicles found'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Add vehicles to your fleet to get started'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Vehicle Type"
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            >
              <MenuItem value="hearse">Hearse</MenuItem>
              <MenuItem value="limousine">Limousine</MenuItem>
              <MenuItem value="family_car">Family Car</MenuItem>
              <MenuItem value="van">Van</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            {/* Photo Upload */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vehicle Photo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {photoPreview && (
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="Vehicle preview"
                    sx={{
                      width: 120,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  />
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

            <TextField
              fullWidth
              label="Make"
              placeholder="e.g., Mercedes-Benz, Cadillac"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Model"
              placeholder="e.g., E-Class, XTS"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
            <TextField
              fullWidth
              label="Registration"
              placeholder="e.g., ABC123"
              value={formData.registration}
              onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Registration Expiry"
              type="date"
              value={formData.registrationExpiry}
              onChange={(e) => setFormData({ ...formData, registrationExpiry: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Seating Capacity"
              type="number"
              value={formData.seatingCapacity}
              onChange={(e) => setFormData({ ...formData, seatingCapacity: parseInt(e.target.value) })}
            />
            <TextField
              fullWidth
              select
              label="Transmission"
              value={formData.transmission}
              onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
            >
              <MenuItem value="automatic">Automatic</MenuItem>
              <MenuItem value="manual">Manual</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Engine Number"
              value={formData.engineNumber}
              onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
            />
            <TextField
              fullWidth
              label="VIN Number"
              value={formData.vinNumber}
              onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value })}
            />
            <Autocomplete
              options={staff}
              getOptionLabel={(option) => option.fullName}
              value={staff.find((s) => s.userId === formData.allocatedToStaffId) || null}
              onChange={(_, newValue) => {
                setFormData({ ...formData, allocatedToStaffId: newValue?.userId || null });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Allocated to Staff Member"
                  placeholder="Select staff member"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveVehicle}
            disabled={!formData.make || !formData.model || !formData.registration}
          >
            {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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
          aspect={16 / 9}
        />
      )}
    </Box>
  );
}

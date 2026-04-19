import { useEffect, useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DriveEta as CarIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '@/services/api';

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
        // Update existing vehicle
        await api.put(`/vehicles/${editingVehicle.id}`, vehicleData);
      } else {
        // Add new vehicle
        const response = await api.post('/vehicles', vehicleData);
        vehicleId = response.data.vehicle.id;
      }

      // Upload photo if selected
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_use':
        return 'info';
      case 'maintenance':
        return 'warning';
      case 'out_of_service':
        return 'error';
      default:
        return 'default';
    }
  };

  const getVehicleTypeIcon = (type: string) => {
    return '🚗'; // Could customize based on type
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Fleet Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage vehicles, photos, and maintenance schedules
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Vehicle
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
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <Card>
              {vehicle.photoUrl ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={vehicle.photoUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                />
              ) : (
                <Box
                  sx={{
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
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {vehicle.make} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.year} • {vehicle.color}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={vehicle.vehicleType.replace('_', ' ').toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={vehicle.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(vehicle.status) as any}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Registration:</strong> {vehicle.registration}
                  </Typography>
                  {vehicle.registrationExpiry && (
                    <Typography variant="body2" color={new Date(vehicle.registrationExpiry) < new Date() ? 'error' : 'text.primary'}>
                      <strong>Reg Expiry:</strong> {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                    </Typography>
                  )}
                  {vehicle.transmission && (
                    <Typography variant="body2">
                      <strong>Transmission:</strong> {vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1)}
                    </Typography>
                  )}
                  {vehicle.vinNumber && (
                    <Typography variant="caption" color="text.secondary">
                      VIN: {vehicle.vinNumber}
                    </Typography>
                  )}
                  {vehicle.allocatedToStaffName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="primary">
                        Allocated to: {vehicle.allocatedToStaffName}
                      </Typography>
                    </Box>
                  )}
                  {vehicle.seatingCapacity && (
                    <Typography variant="body2">
                      <strong>Capacity:</strong> {vehicle.seatingCapacity} seats
                    </Typography>
                  )}
                  {vehicle.nextServiceDate && (
                    <Typography variant="caption" color="text.secondary">
                      Next service: {new Date(vehicle.nextServiceDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleOpenEdit(vehicle)}>
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {vehicles.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No vehicles found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add vehicles to your fleet to get started
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
    </Box>
  );
}

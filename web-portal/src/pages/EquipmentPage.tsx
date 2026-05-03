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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Inventory as EquipmentIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api, { getAuthenticatedImageUrl } from '@/services/api';
import ImageCropDialog from '@/components/ImageCropDialog';

interface Equipment {
  id: string;
  name: string;
  equipmentType: string;
  description: string | null;
  serialNumber: string | null;
  photoUrl: string | null;
  status: string;
  purchaseDate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  location: string | null;
  vehicleId: string | null;
  vehicleRegistration: string | null;
  notes: string | null;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [vehicles, setVehicles] = useState<Array<{id: string; registration: string; make: string; model: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [locationType, setLocationType] = useState<'vehicle' | 'custom'>('custom');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    equipmentType: 'trolley',
    description: '',
    serialNumber: '',
    status: 'available',
    purchaseDate: '',
    location: '',
    vehicleId: '',
    notes: '',
  });

  useEffect(() => {
    loadEquipment();
    loadVehicles();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const response = await api.get('/equipment');
      setEquipment(response.data.equipment);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles);
    } catch (err: any) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingEquipment(item);

    // Determine location type
    if (item.vehicleId) {
      setLocationType('vehicle');
    } else {
      setLocationType('custom');
    }

    setFormData({
      name: item.name,
      equipmentType: item.equipmentType,
      description: item.description || '',
      serialNumber: item.serialNumber || '',
      status: item.status,
      purchaseDate: item.purchaseDate || '',
      location: item.location || '',
      vehicleId: item.vehicleId || '',
      notes: item.notes || '',
    });
    setPhotoPreview(item.photoUrl);
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
    const croppedFile = new File([croppedBlob], 'cropped-equipment.jpg', { type: 'image/jpeg' });
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
    setEditingEquipment(null);
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setLocationType('custom');
    setFormData({
      name: '',
      equipmentType: 'trolley',
      description: '',
      serialNumber: '',
      status: 'available',
      purchaseDate: '',
      location: '',
      vehicleId: '',
      notes: '',
    });
  };

  const handleSaveEquipment = async () => {
    try {
      let equipmentId = editingEquipment?.id;

      if (editingEquipment) {
        // Update existing equipment
        await api.put(`/equipment/${editingEquipment.id}`, {
          name: formData.name,
          equipmentType: formData.equipmentType,
          description: formData.description,
          serialNumber: formData.serialNumber,
          status: formData.status,
          purchaseDate: formData.purchaseDate || null,
          location: locationType === 'custom' ? formData.location : null,
          vehicleId: locationType === 'vehicle' ? formData.vehicleId : null,
          notes: formData.notes,
        });
      } else {
        // Add new equipment
        const response = await api.post('/equipment', {
          name: formData.name,
          equipmentType: formData.equipmentType,
          description: formData.description,
          serialNumber: formData.serialNumber,
          status: formData.status,
          purchaseDate: formData.purchaseDate || null,
          location: locationType === 'custom' ? formData.location : null,
          vehicleId: locationType === 'vehicle' ? formData.vehicleId : null,
          notes: formData.notes,
        });
        equipmentId = response.data.equipment.id;
      }

      // Upload photo if selected
      if (selectedPhoto && equipmentId) {
        const photoFormData = new FormData();
        photoFormData.append('file', selectedPhoto);
        photoFormData.append('equipmentId', equipmentId);

        await api.post('/equipment/upload-photo', photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess(editingEquipment ? 'Equipment updated successfully' : 'Equipment added successfully');
      handleCloseDialog();
      await loadEquipment();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save equipment');
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
      case 'retired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEquipmentTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading equipment...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Equipment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage equipment, assets, and inventory
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Equipment
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
        {equipment.map((item) => (
          <Grid item xs={12} sm={4} md={3} lg={2} key={item.id}>
            <Card>
              {item.photoUrl ? (
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'contain',
                    bgcolor: 'action.hover',
                  }}
                  image={getAuthenticatedImageUrl(item.photoUrl)}
                  alt={item.name}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                  }}
                >
                  <EquipmentIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                </Box>
              )}
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getEquipmentTypeLabel(item.equipmentType)}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={item.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(item.status) as any}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {item.serialNumber && (
                    <Typography variant="body2">
                      <strong>Serial:</strong> {item.serialNumber}
                    </Typography>
                  )}
                  {item.location && (
                    <Typography variant="body2">
                      <strong>Location:</strong> {item.location}
                    </Typography>
                  )}
                  {item.nextMaintenanceDate && (
                    <Typography variant="caption" color="text.secondary">
                      Next maintenance: {new Date(item.nextMaintenanceDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => handleOpenEdit(item)}>
                    <EditIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {equipment.length === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EquipmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No equipment found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add equipment to your inventory to get started
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              placeholder="e.g., Coffin Trolley #1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              select
              label="Equipment Type"
              value={formData.equipmentType}
              onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
            >
              <MenuItem value="casket">Casket</MenuItem>
              <MenuItem value="urn">Urn</MenuItem>
              <MenuItem value="trolley">Trolley</MenuItem>
              <MenuItem value="coffin_lowering_device">Coffin Lowering Device</MenuItem>
              <MenuItem value="flowers">Flowers</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>

            {/* Photo Upload */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Equipment Photo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {photoPreview && (
                  <Box
                    component="img"
                    src={
                      photoPreview.startsWith('blob:') || photoPreview.startsWith('data:')
                        ? photoPreview
                        : getAuthenticatedImageUrl(photoPreview)
                    }
                    alt="Equipment preview"
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
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Serial Number"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="in_use">In Use</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="retired">Retired</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            {/* Location Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Location</FormLabel>
              <RadioGroup
                row
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as 'vehicle' | 'custom')}
              >
                <FormControlLabel value="vehicle" control={<Radio />} label="Assigned to Vehicle" />
                <FormControlLabel value="custom" control={<Radio />} label="Custom Location" />
              </RadioGroup>
            </FormControl>

            {locationType === 'vehicle' ? (
              <TextField
                select
                fullWidth
                label="Select Vehicle"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                helperText="Equipment is currently assigned to this vehicle"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.registration} - {vehicle.make} {vehicle.model}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label="Custom Location"
                placeholder="e.g., Storage Room A, Head Office"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                helperText="Enter the storage location or facility name"
              />
            )}
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEquipment}
            disabled={!formData.name}
          >
            {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
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
          aspect={4 / 3}
        />
      )}
    </Box>
  );
}

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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  DriveEta as CarIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface Vehicle {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  registration: string;
  color: string;
  photoUrl: string | null;
  seatingCapacity: number | null;
  status: string;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVehicles();
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
        <Button variant="contained" startIcon={<AddIcon />}>
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
                  <IconButton size="small">
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
    </Box>
  );
}

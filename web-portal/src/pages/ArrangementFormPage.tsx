import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { arrangementsApi, usersApi } from '@/services/api';
import type { Arrangement, User } from '@/types';

export default function ArrangementFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [mourners, setMourners] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    deceasedName: '',
    deceasedDateOfBirth: '',
    deceasedDateOfDeath: '',
    funeralType: 'burial' as const,
    status: 'draft' as const,
    serviceDate: '',
    serviceLocation: '',
    notes: '',
    mournerId: '',
    mournerPhone: '',
    mournerName: '',
  });

  useEffect(() => {
    loadMourners();
    if (isEdit) {
      loadArrangement();
    }
  }, [id]);

  const loadMourners = async () => {
    try {
      const users = await usersApi.getAll();
      setMourners(users.filter(u => {
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.includes('mourner');
      }));
    } catch (error) {
      console.error('Failed to load mourners:', error);
    }
  };

  const loadArrangement = async () => {
    if (!id) return;
    try {
      const arrangement = await arrangementsApi.getById(id);
      setFormData({
        deceasedName: arrangement.deceasedName || '',
        deceasedDateOfBirth: arrangement.deceasedDateOfBirth || '',
        deceasedDateOfDeath: arrangement.deceasedDateOfDeath || '',
        funeralType: arrangement.funeralType || 'burial',
        status: arrangement.status || 'draft',
        serviceDate: arrangement.serviceDate || '',
        serviceLocation: arrangement.serviceLocation || '',
        notes: arrangement.notes || '',
        mournerId: arrangement.mournerId || '',
        mournerPhone: '',
        mournerName: '',
      });
    } catch (error) {
      console.error('Failed to load arrangement:', error);
      setError('Failed to load arrangement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        deceasedName: formData.deceasedName,
        deceasedDateOfBirth: formData.deceasedDateOfBirth || null,
        deceasedDateOfDeath: formData.deceasedDateOfDeath || null,
        funeralType: formData.funeralType,
        status: formData.status,
        serviceDate: formData.serviceDate || null,
        serviceLocation: formData.serviceLocation || null,
        notes: formData.notes || null,
        mournerId: formData.mournerId || null,
        mournerPhone: formData.mournerPhone || null,
      };

      if (isEdit) {
        await arrangementsApi.update(id!, data);
      } else {
        await arrangementsApi.create(data);
      }

      navigate('/arrangements');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save arrangement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/arrangements')}
        sx={{ mb: 2 }}
      >
        Back to Arrangements
      </Button>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {isEdit ? 'Edit Arrangement' : 'New Arrangement'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Deceased Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Deceased Name"
                  value={formData.deceasedName}
                  onChange={(e) => setFormData({ ...formData, deceasedName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.deceasedDateOfBirth}
                  onChange={(e) => setFormData({ ...formData, deceasedDateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Death"
                  type="date"
                  value={formData.deceasedDateOfDeath}
                  onChange={(e) => setFormData({ ...formData, deceasedDateOfDeath: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Funeral Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Funeral Type"
                  value={formData.funeralType}
                  onChange={(e) => setFormData({ ...formData, funeralType: e.target.value as any })}
                >
                  <MenuItem value="burial">Burial</MenuItem>
                  <MenuItem value="cremation">Cremation</MenuItem>
                  <MenuItem value="traditional">Traditional</MenuItem>
                  <MenuItem value="memorial">Memorial</MenuItem>
                  <MenuItem value="direct_cremation">Direct Cremation</MenuItem>
                  <MenuItem value="repatriation">Repatriation</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Date"
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Location"
                  value={formData.serviceLocation}
                  onChange={(e) => setFormData({ ...formData, serviceLocation: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Family Contact
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mourner Phone Number"
                  value={formData.mournerPhone}
                  onChange={(e) => setFormData({ ...formData, mournerPhone: e.target.value })}
                  placeholder="+61 4XX XXX XXX"
                  helperText="Enter phone to create/find mourner"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mourner Name"
                  value={formData.mournerName}
                  onChange={(e) => setFormData({ ...formData, mournerName: e.target.value })}
                  helperText="Optional - for new mourners"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes, special requests, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/arrangements')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Saving...' : isEdit ? 'Update Arrangement' : 'Create Arrangement'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

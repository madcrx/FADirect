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
  Autocomplete,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { arrangementsApi, usersApi } from '@/services/api';
import api from '@/services/api';
import type { Arrangement, User } from '@/types';
import { format } from 'date-fns';

export default function ArrangementFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [mourners, setMourners] = useState<User[]>([]);
  const [mournerSuggestions, setMournerSuggestions] = useState<Array<any>>([]);
  const [arrangers, setArrangers] = useState<Array<any>>([]);
  const [jobs, setJobs] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    arrangerId: '',
    deceasedName: '',
    deceasedDateOfBirth: '',
    deceasedDateOfDeath: '',
    deceasedAddressLine1: '',
    deceasedAddressLine2: '',
    deceasedCity: '',
    deceasedState: '',
    deceasedPostcode: '',
    deceasedCountry: 'Australia',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    nextOfKinEmail: '',
    locationOfDeceased: '',
    funeralType: 'burial' as const,
    status: 'draft' as const,
    jobId: '',
    serviceDate: '',
    serviceLocation: '',
    notes: '',
    mournerId: '',
    mournerPhone: '',
    mournerName: '',
    mournerEmail: '',
    mournerRelationship: '',
  });

  useEffect(() => {
    loadMourners();
    loadJobs();
    loadArrangers();
    loadMournerSuggestions();
    if (isEdit) {
      loadArrangement();
    }
  }, [id]);

  const loadJobs = async () => {
    try {
      const response = await api.get('/roster/jobs', {
        params: {
          startDate: format(new Date(), 'yyyy-MM-dd'),
          endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // Next 90 days
        },
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleJobSelect = (jobId: string) => {
    const selectedJob = jobs.find(j => j.id === jobId);
    if (selectedJob) {
      setFormData({
        ...formData,
        jobId: jobId,
        serviceDate: selectedJob.startTime ? format(new Date(selectedJob.startTime), 'yyyy-MM-dd') : formData.serviceDate,
        serviceLocation: selectedJob.location || formData.serviceLocation,
      });
    } else {
      setFormData({ ...formData, jobId: '' });
    }
  };

  const handleMournerSelect = (mourner: any) => {
    if (mourner) {
      setFormData({
        ...formData,
        mournerPhone: mourner.phone || '',
        mournerName: mourner.name || '',
        mournerEmail: mourner.email || '',
        mournerRelationship: mourner.relationship || '',
      });
    }
  };

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

  const loadMournerSuggestions = async (search = '') => {
    try {
      const response = await api.get('/arrangements/lookup/mourners', {
        params: { search },
      });
      setMournerSuggestions(response.data.mourners || []);
    } catch (error) {
      console.error('Failed to load mourner suggestions:', error);
    }
  };

  const loadArrangers = async () => {
    try {
      const response = await api.get('/arrangements/lookup/arrangers');
      setArrangers(response.data.arrangers || []);
    } catch (error) {
      console.error('Failed to load arrangers:', error);
    }
  };

  const loadArrangement = async () => {
    if (!id) return;
    try {
      const arrangement = await arrangementsApi.getById(id);
      setFormData({
        arrangerId: arrangement.arrangerId || '',
        deceasedName: arrangement.deceasedName || '',
        deceasedDateOfBirth: arrangement.deceasedDateOfBirth || '',
        deceasedDateOfDeath: arrangement.deceasedDateOfDeath || '',
        deceasedAddressLine1: arrangement.deceasedAddressLine1 || '',
        deceasedAddressLine2: arrangement.deceasedAddressLine2 || '',
        deceasedCity: arrangement.deceasedCity || '',
        deceasedState: arrangement.deceasedState || '',
        deceasedPostcode: arrangement.deceasedPostcode || '',
        deceasedCountry: arrangement.deceasedCountry || 'Australia',
        nextOfKinName: arrangement.nextOfKinName || '',
        nextOfKinRelationship: arrangement.nextOfKinRelationship || '',
        nextOfKinPhone: arrangement.nextOfKinPhone || '',
        nextOfKinEmail: arrangement.nextOfKinEmail || '',
        locationOfDeceased: arrangement.locationOfDeceased || '',
        funeralType: arrangement.funeralType || 'burial',
        status: arrangement.status || 'draft',
        jobId: arrangement.jobId || '',
        serviceDate: arrangement.serviceDate || '',
        serviceLocation: arrangement.serviceLocation || '',
        notes: arrangement.notes || '',
        mournerId: arrangement.mournerId || '',
        mournerPhone: arrangement.mournerPhone || '',
        mournerName: arrangement.mournerName || '',
        mournerEmail: arrangement.mournerEmail || '',
        mournerRelationship: arrangement.mournerRelationship || '',
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
        arrangerId: formData.arrangerId || null,
        deceasedName: formData.deceasedName,
        deceasedDateOfBirth: formData.deceasedDateOfBirth || null,
        deceasedDateOfDeath: formData.deceasedDateOfDeath || null,
        deceasedAddressLine1: formData.deceasedAddressLine1 || null,
        deceasedAddressLine2: formData.deceasedAddressLine2 || null,
        deceasedCity: formData.deceasedCity || null,
        deceasedState: formData.deceasedState || null,
        deceasedPostcode: formData.deceasedPostcode || null,
        deceasedCountry: formData.deceasedCountry || null,
        nextOfKinName: formData.nextOfKinName || null,
        nextOfKinRelationship: formData.nextOfKinRelationship || null,
        nextOfKinPhone: formData.nextOfKinPhone || null,
        nextOfKinEmail: formData.nextOfKinEmail || null,
        locationOfDeceased: formData.locationOfDeceased || null,
        funeralType: formData.funeralType,
        status: formData.status,
        jobId: formData.jobId || null,
        serviceDate: formData.serviceDate || null,
        serviceLocation: formData.serviceLocation || null,
        notes: formData.notes || null,
        mournerId: formData.mournerId || null,
        mournerPhone: formData.mournerPhone || null,
        mournerName: formData.mournerName || null,
        mournerEmail: formData.mournerEmail || null,
        mournerRelationship: formData.mournerRelationship || null,
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
                  Arranger
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={arrangers}
                  getOptionLabel={(option) => option.name || ''}
                  value={arrangers.find(a => a.id === formData.arrangerId) || null}
                  onChange={(_, newValue) => setFormData({ ...formData, arrangerId: newValue?.id || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Arranger"
                      placeholder="Search staff with arranger role..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
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
                  Deceased Address
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  value={formData.deceasedAddressLine1}
                  onChange={(e) => setFormData({ ...formData, deceasedAddressLine1: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  value={formData.deceasedAddressLine2}
                  onChange={(e) => setFormData({ ...formData, deceasedAddressLine2: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City/Suburb"
                  value={formData.deceasedCity}
                  onChange={(e) => setFormData({ ...formData, deceasedCity: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State/Territory"
                  value={formData.deceasedState}
                  onChange={(e) => setFormData({ ...formData, deceasedState: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postcode"
                  value={formData.deceasedPostcode}
                  onChange={(e) => setFormData({ ...formData, deceasedPostcode: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location of Deceased"
                  value={formData.locationOfDeceased}
                  onChange={(e) => setFormData({ ...formData, locationOfDeceased: e.target.value })}
                  helperText="Current location (e.g., hospital, morgue, funeral home)"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Funeral Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Select from Schedule (Optional)"
                  value={formData.jobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  helperText="Link this arrangement to a scheduled job/service"
                >
                  <MenuItem value="">
                    <em>None - Enter manually</em>
                  </MenuItem>
                  {jobs.map((job) => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.title} - {format(new Date(job.startTime), 'dd MMM yyyy HH:mm')} - {job.location || 'No location'}
                    </MenuItem>
                  ))}
                </TextField>
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
                  Next of Kin
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Next of Kin Name"
                  value={formData.nextOfKinName}
                  onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Relationship to Deceased"
                  value={formData.nextOfKinRelationship}
                  onChange={(e) => setFormData({ ...formData, nextOfKinRelationship: e.target.value })}
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Next of Kin Phone"
                  value={formData.nextOfKinPhone}
                  onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })}
                  placeholder="+61 4XX XXX XXX"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Next of Kin Email"
                  type="email"
                  value={formData.nextOfKinEmail}
                  onChange={(e) => setFormData({ ...formData, nextOfKinEmail: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Family Contact
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={mournerSuggestions}
                  getOptionLabel={(option) => typeof option === 'string' ? option : (option.phone || '')}
                  inputValue={formData.mournerPhone}
                  onInputChange={(_, newValue) => {
                    setFormData({ ...formData, mournerPhone: newValue });
                    if (newValue.length >= 3) {
                      loadMournerSuggestions(newValue);
                    }
                  }}
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'object' && newValue) {
                      handleMournerSelect(newValue);
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">{option.phone}</Typography>
                        {option.name && <Typography variant="body2" color="text.secondary">{option.name}</Typography>}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Mourner Phone Number"
                      placeholder="+61 4XX XXX XXX"
                      helperText="Start typing to search existing mourners or enter new number"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mourner Name"
                  value={formData.mournerName}
                  onChange={(e) => setFormData({ ...formData, mournerName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mourner Relationship"
                  value={formData.mournerRelationship}
                  onChange={(e) => setFormData({ ...formData, mournerRelationship: e.target.value })}
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mourner Email"
                  type="email"
                  value={formData.mournerEmail}
                  onChange={(e) => setFormData({ ...formData, mournerEmail: e.target.value })}
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

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { firstCallReportsApi } from '@/services/firstCallReportsApi';

const steps = ['Call Details', 'Deceased Information', 'Location Details', 'Removal Details', 'Medical Information'];

export default function FirstCallReportPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdArrangementId, setCreatedArrangementId] = useState<number | null>(null);
  const [createdJobId, setCreatedJobId] = useState<number | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    call_details: {
      callReceived: '',
      callerName: '',
      callerPhone: '',
      callerRelationship: '',
      referralSource: '',
    },
    deceased_details: {
      deceasedFullName: '',
      dateOfBirth: '',
      dateOfDeath: '',
      timeOfDeath: '',
      age: '',
      gender: '',
      socialSecurityNumber: '',
    },
    location_details: {
      currentLocation: '',
      facilityName: '',
      address: '',
      roomNumber: '',
      contactPerson: '',
      contactPhone: '',
    },
    removal_details: {
      removalDate: '',
      removalTime: '',
      staffAssigned: '',
      vehicleUsed: '',
      coronerCase: false,
      coronerReleaseNumber: '',
      specialInstructions: '',
    },
    medical_info: {
      causeOfDeath: '',
      attendingPhysician: '',
      physicianPhone: '',
      infectiousDisease: false,
      diseaseDetails: '',
      medicalDevices: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set default call received time to now
  useEffect(() => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData((prev) => ({
      ...prev,
      call_details: {
        ...prev.call_details,
        callReceived: localDateTime,
      },
    }));
  }, []);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${section}.${field}`];
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Call Details
        if (!formData.call_details.callReceived) {
          newErrors['call_details.callReceived'] = 'Call received date/time is required';
        }
        if (!formData.call_details.callerName) {
          newErrors['call_details.callerName'] = 'Caller name is required';
        }
        if (!formData.call_details.callerPhone) {
          newErrors['call_details.callerPhone'] = 'Caller phone is required';
        }
        if (!formData.call_details.callerRelationship) {
          newErrors['call_details.callerRelationship'] = 'Relationship to deceased is required';
        }
        break;

      case 1: // Deceased Information
        if (!formData.deceased_details.deceasedFullName) {
          newErrors['deceased_details.deceasedFullName'] = 'Full name is required';
        }
        if (!formData.deceased_details.dateOfDeath) {
          newErrors['deceased_details.dateOfDeath'] = 'Date of death is required';
        }
        break;

      case 2: // Location Details
        if (!formData.location_details.currentLocation) {
          newErrors['location_details.currentLocation'] = 'Current location is required';
        }
        if (!formData.location_details.address) {
          newErrors['location_details.address'] = 'Address is required';
        }
        break;

      case 3: // Removal Details
        if (!formData.removal_details.removalDate) {
          newErrors['removal_details.removalDate'] = 'Removal date is required';
        }
        if (!formData.removal_details.removalTime) {
          newErrors['removal_details.removalTime'] = 'Removal time is required';
        }
        break;

      case 4: // Medical Information
        // No required fields in this section
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const response = await firstCallReportsApi.submit({
        formData,
      });

      setSubmitSuccess(true);
      setCreatedArrangementId(response.report.arrangementId);
      setCreatedJobId(response.report.jobId);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'Failed to submit First Call Report');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Call Received Date/Time"
                type="datetime-local"
                value={formData.call_details.callReceived}
                onChange={(e) => handleChange('call_details', 'callReceived', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors['call_details.callReceived']}
                helperText={errors['call_details.callReceived']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Caller Name"
                value={formData.call_details.callerName}
                onChange={(e) => handleChange('call_details', 'callerName', e.target.value)}
                required
                error={!!errors['call_details.callerName']}
                helperText={errors['call_details.callerName']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Caller Phone"
                type="tel"
                value={formData.call_details.callerPhone}
                onChange={(e) => handleChange('call_details', 'callerPhone', e.target.value)}
                required
                error={!!errors['call_details.callerPhone']}
                helperText={errors['call_details.callerPhone']}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relationship to Deceased"
                value={formData.call_details.callerRelationship}
                onChange={(e) => handleChange('call_details', 'callerRelationship', e.target.value)}
                required
                error={!!errors['call_details.callerRelationship']}
                helperText={errors['call_details.callerRelationship']}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Referral Source"
                value={formData.call_details.referralSource}
                onChange={(e) => handleChange('call_details', 'referralSource', e.target.value)}
              >
                <MenuItem value="Family">Family</MenuItem>
                <MenuItem value="Hospital">Hospital</MenuItem>
                <MenuItem value="Nursing Home">Nursing Home</MenuItem>
                <MenuItem value="Hospice">Hospice</MenuItem>
                <MenuItem value="Coroner">Coroner</MenuItem>
                <MenuItem value="Police">Police</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.deceased_details.deceasedFullName}
                onChange={(e) => handleChange('deceased_details', 'deceasedFullName', e.target.value)}
                required
                error={!!errors['deceased_details.deceasedFullName']}
                helperText={errors['deceased_details.deceasedFullName']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={formData.deceased_details.dateOfBirth}
                onChange={(e) => handleChange('deceased_details', 'dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Death"
                type="date"
                value={formData.deceased_details.dateOfDeath}
                onChange={(e) => handleChange('deceased_details', 'dateOfDeath', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors['deceased_details.dateOfDeath']}
                helperText={errors['deceased_details.dateOfDeath']}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Time of Death"
                type="time"
                value={formData.deceased_details.timeOfDeath}
                onChange={(e) => handleChange('deceased_details', 'timeOfDeath', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.deceased_details.age}
                onChange={(e) => handleChange('deceased_details', 'age', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={formData.deceased_details.gender}
                onChange={(e) => handleChange('deceased_details', 'gender', e.target.value)}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Social Security Number"
                value={formData.deceased_details.socialSecurityNumber}
                onChange={(e) => handleChange('deceased_details', 'socialSecurityNumber', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Location of Deceased"
                value={formData.location_details.currentLocation}
                onChange={(e) => handleChange('location_details', 'currentLocation', e.target.value)}
                required
                placeholder="Hospital, Home, Nursing facility, etc."
                error={!!errors['location_details.currentLocation']}
                helperText={errors['location_details.currentLocation']}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Facility Name"
                value={formData.location_details.facilityName}
                onChange={(e) => handleChange('location_details', 'facilityName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Address"
                value={formData.location_details.address}
                onChange={(e) => handleChange('location_details', 'address', e.target.value)}
                required
                multiline
                rows={2}
                error={!!errors['location_details.address']}
                helperText={errors['location_details.address']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room/Unit Number"
                value={formData.location_details.roomNumber}
                onChange={(e) => handleChange('location_details', 'roomNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person at Location"
                value={formData.location_details.contactPerson}
                onChange={(e) => handleChange('location_details', 'contactPerson', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Phone"
                type="tel"
                value={formData.location_details.contactPhone}
                onChange={(e) => handleChange('location_details', 'contactPhone', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Removal Date"
                type="date"
                value={formData.removal_details.removalDate}
                onChange={(e) => handleChange('removal_details', 'removalDate', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors['removal_details.removalDate']}
                helperText={errors['removal_details.removalDate']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Removal Time"
                type="time"
                value={formData.removal_details.removalTime}
                onChange={(e) => handleChange('removal_details', 'removalTime', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                error={!!errors['removal_details.removalTime']}
                helperText={errors['removal_details.removalTime']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Staff Assigned"
                value={formData.removal_details.staffAssigned}
                onChange={(e) => handleChange('removal_details', 'staffAssigned', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle"
                value={formData.removal_details.vehicleUsed}
                onChange={(e) => handleChange('removal_details', 'vehicleUsed', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.removal_details.coronerCase}
                    onChange={(e) => handleChange('removal_details', 'coronerCase', e.target.checked)}
                  />
                }
                label="Coroner Case"
              />
            </Grid>
            {formData.removal_details.coronerCase && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Coroner Release Number"
                  value={formData.removal_details.coronerReleaseNumber}
                  onChange={(e) => handleChange('removal_details', 'coronerReleaseNumber', e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Instructions"
                value={formData.removal_details.specialInstructions}
                onChange={(e) => handleChange('removal_details', 'specialInstructions', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cause of Death"
                value={formData.medical_info.causeOfDeath}
                onChange={(e) => handleChange('medical_info', 'causeOfDeath', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Attending Physician"
                value={formData.medical_info.attendingPhysician}
                onChange={(e) => handleChange('medical_info', 'attendingPhysician', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Physician Phone"
                type="tel"
                value={formData.medical_info.physicianPhone}
                onChange={(e) => handleChange('medical_info', 'physicianPhone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.medical_info.infectiousDisease}
                    onChange={(e) => handleChange('medical_info', 'infectiousDisease', e.target.checked)}
                  />
                }
                label="Infectious Disease"
              />
            </Grid>
            {formData.medical_info.infectiousDisease && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Disease Details"
                  value={formData.medical_info.diseaseDetails}
                  onChange={(e) => handleChange('medical_info', 'diseaseDetails', e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medical Devices (Pacemaker, etc.)"
                value={formData.medical_info.medicalDevices}
                onChange={(e) => handleChange('medical_info', 'medicalDevices', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (submitSuccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SuccessIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                First Call Report Submitted Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                The following records have been automatically created:
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {createdArrangementId && (
                  <Chip
                    label={`Arrangement #${createdArrangementId}`}
                    color="primary"
                    onClick={() => navigate(`/arrangements/${createdArrangementId}`)}
                    clickable
                  />
                )}
                {createdJobId && (
                  <Chip
                    label={`Removal Job #${createdJobId}`}
                    color="secondary"
                    onClick={() => navigate('/calendar')}
                    clickable
                  />
                )}
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => window.location.reload()}>
                  Submit Another Report
                </Button>
                <Button variant="contained" onClick={() => navigate('/arrangements')}>
                  View Arrangements
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          First Call Report
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Complete this report when receiving a new call. This will automatically create an arrangement and schedule a removal job.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

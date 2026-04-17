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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format, addDays, startOfWeek } from 'date-fns';

interface Job {
  id: string;
  title: string;
  jobTypeName: string;
  jobTypeColor: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  staff: Array<{ fullName: string; role: string }>;
  vehicles: Array<{ registration: string; type: string }>;
}

interface JobType {
  id: string;
  name: string;
  color: string;
  defaultDuration: number;
}

export default function BookingsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [arrangements, setArrangements] = useState<Array<{id: string; deceasedName: string}>>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobDialog, setJobDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    jobTypeId: '',
    arrangementId: '',
    startTime: '',
    endTime: '',
    location: '',
    requirements: {
      arranger: 0,
      conductor: 0,
      funeral_director_assistant: 0,
      embalmer: 0,
      hearse_driver: 0,
      coach_driver: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(addDays(startOfWeek(selectedDate), 6), 'yyyy-MM-dd');

      const [jobsRes, typesRes, arrangementsRes] = await Promise.all([
        api.get('/roster/jobs', {
          params: { startDate, endDate },
        }),
        api.get('/roster/job-types'),
        api.get('/arrangements'),
      ]);

      setJobs(jobsRes.data.jobs);
      setJobTypes(typesRes.data.jobTypes);
      setArrangements(arrangementsRes.data.arrangements.filter((a: any) => a.status !== 'completed'));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load roster data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.jobTypeId || !formData.startTime || !formData.endTime) {
        setError('Please fill in all required fields: Title, Job Type, Start Time, and End Time');
        return;
      }

      // Convert datetime-local format to ISO8601
      const payload = {
        ...formData,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : '',
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : '',
      };

      await api.post('/roster/jobs', payload);
      setSuccess('Job created successfully');
      setJobDialog(false);
      setFormData({
        title: '',
        jobTypeId: '',
        arrangementId: '',
        startTime: '',
        endTime: '',
        location: '',
        requirements: {
          arranger: 0,
          conductor: 0,
          funeral_director_assistant: 0,
          embalmer: 0,
          hearse_driver: 0,
          coach_driver: 0,
        },
      });
      await loadData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to create job';
      const details = err.response?.data?.error?.details;
      const detailsMsg = details ? '\n' + details.map((d: any) => `- ${d.msg}`).join('\n') : '';
      setError(errorMsg + detailsMsg);
    }
  };

  const getJobsForDay = (date: Date) => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.startTime);
      return format(jobDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate), i));

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading roster...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Bookings Board
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule jobs and assign staff/vehicles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setJobDialog(true)}>
            Add Job
          </Button>
        </Box>
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

      {/* Week View */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {weekDays.map((day) => {
          const dayJobs = getJobsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Grid item xs={12} md={6} lg={3} key={day.toString()}>
              <Card
                sx={{
                  minHeight: 400,
                  bgcolor: isToday ? 'action.hover' : 'background.paper',
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'divider',
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {format(day, 'EEE')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(day, 'MMM d')}
                    </Typography>
                    <Chip label={`${dayJobs.length} jobs`} size="small" sx={{ mt: 1 }} />
                  </Box>

                  {dayJobs.map((job) => (
                    <Card
                      key={job.id}
                      sx={{
                        mb: 1,
                        borderLeft: 4,
                        borderColor: job.jobTypeColor || 'primary.main',
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          {job.title}
                        </Typography>
                        <Chip
                          label={job.jobTypeName}
                          size="small"
                          sx={{
                            bgcolor: job.jobTypeColor || 'primary.main',
                            color: 'white',
                            mb: 1,
                          }}
                        />
                        <Typography variant="caption" display="block">
                          {format(new Date(job.startTime), 'HH:mm')} -{' '}
                          {format(new Date(job.endTime), 'HH:mm')}
                        </Typography>
                        {job.location && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            📍 {job.location}
                          </Typography>
                        )}
                        {job.staff.length > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            👤 {job.staff.map((s) => s.fullName).join(', ')}
                          </Typography>
                        )}
                        {job.vehicles.length > 0 && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            🚗 {job.vehicles.map((v) => v.registration).join(', ')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Create Job Dialog */}
      <Dialog open={jobDialog} onClose={() => setJobDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Job</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Job Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={formData.jobTypeId}
                label="Job Type"
                onChange={(e) => setFormData({ ...formData, jobTypeId: e.target.value })}
              >
                {jobTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: type.color,
                        }}
                      />
                      {type.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Arrangement (Deceased)</InputLabel>
              <Select
                value={formData.arrangementId}
                label="Arrangement (Deceased)"
                onChange={(e) => setFormData({ ...formData, arrangementId: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {arrangements.map((arrangement) => (
                  <MenuItem key={arrangement.id} value={arrangement.id}>
                    {arrangement.deceasedName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            {/* Staff Requirements */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Staff Requirements
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Arrangers"
                type="number"
                value={formData.requirements.arranger}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, arranger: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Conductors"
                type="number"
                value={formData.requirements.conductor}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, conductor: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="FDA (Assistants)"
                type="number"
                value={formData.requirements.funeral_director_assistant}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, funeral_director_assistant: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Embalmers"
                type="number"
                value={formData.requirements.embalmer}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, embalmer: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Hearse Drivers"
                type="number"
                value={formData.requirements.hearse_driver}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, hearse_driver: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Coach Drivers"
                type="number"
                value={formData.requirements.coach_driver}
                onChange={(e) => setFormData({
                  ...formData,
                  requirements: { ...formData.requirements, coach_driver: parseInt(e.target.value) || 0 }
                })}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateJob}>
            Create Job
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

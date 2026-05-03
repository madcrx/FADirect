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
  OutlinedInput,
  SelectChangeEvent,
  Menu,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  DriveEta as VehicleIcon,
  Inventory as EquipmentIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { socketService, RosterEvents } from '@/services/socket';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, addWeeks, subMonths, addMonths, startOfDay, endOfDay, isSameDay } from 'date-fns';

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
  equipment: Array<{ name: string; equipmentType: string }>;
  requirements?: {
    arranger?: number;
    conductor?: number;
    funeral_director_assistant?: number;
    embalmer?: number;
    hearse_driver?: number;
    coach_driver?: number;
    hearse?: number;
    limousine?: number;
  };
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
  const [equipment, setEquipment] = useState<Array<{id: string; name: string; equipmentType: string; status: string}>>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [deletedFilter, setDeletedFilter] = useState<'hide' | 'only' | 'all'>('hide');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobDialog, setJobDialog] = useState(false);

  // Resource allocation sidebar state
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resourceTab, setResourceTab] = useState<'staff' | 'vehicles' | 'equipment'>('staff');
  const [availableStaff, setAvailableStaff] = useState<Array<any>>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Array<any>>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Array<any>>([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{staffId: string; userId: string; role: string} | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    jobTypeId: '',
    arrangementId: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    notes: '',
    allDay: false,
    attendees: '',
    reminderMinutes: 0,
    equipmentIds: [] as string[],
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
  }, [selectedDate, deletedFilter, viewMode]);

  // WebSocket connection and real-time updates
  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();

    // Handle roster events for real-time updates
    const handleStaffAssigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    const handleStaffUnassigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    const handleVehicleAssigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    const handleVehicleUnassigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    const handleEquipmentAssigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    const handleEquipmentUnassigned = () => {
      loadData();
      if (selectedJob) {
        refreshSelectedJob(selectedJob.id);
      }
    };

    // Subscribe to events
    socketService.on(RosterEvents.STAFF_ASSIGNED, handleStaffAssigned);
    socketService.on(RosterEvents.STAFF_UNASSIGNED, handleStaffUnassigned);
    socketService.on(RosterEvents.VEHICLE_ASSIGNED, handleVehicleAssigned);
    socketService.on(RosterEvents.VEHICLE_UNASSIGNED, handleVehicleUnassigned);
    socketService.on(RosterEvents.EQUIPMENT_ASSIGNED, handleEquipmentAssigned);
    socketService.on(RosterEvents.EQUIPMENT_UNASSIGNED, handleEquipmentUnassigned);

    // Cleanup on unmount
    return () => {
      socketService.off(RosterEvents.STAFF_ASSIGNED, handleStaffAssigned);
      socketService.off(RosterEvents.STAFF_UNASSIGNED, handleStaffUnassigned);
      socketService.off(RosterEvents.VEHICLE_ASSIGNED, handleVehicleAssigned);
      socketService.off(RosterEvents.VEHICLE_UNASSIGNED, handleVehicleUnassigned);
      socketService.off(RosterEvents.EQUIPMENT_ASSIGNED, handleEquipmentAssigned);
      socketService.off(RosterEvents.EQUIPMENT_UNASSIGNED, handleEquipmentUnassigned);
      socketService.disconnect();
    };
  }, [selectedJob]);

  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        };
      case 'week':
        return {
          start: startOfWeek(selectedDate),
          end: addDays(startOfWeek(selectedDate), 6),
        };
      case 'month':
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
      default:
        return {
          start: startOfWeek(selectedDate),
          end: addDays(startOfWeek(selectedDate), 6),
        };
    }
  };

  const handlePreviousDate = () => {
    switch (viewMode) {
      case 'day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
    }
  };

  const handleNextDate = () => {
    switch (viewMode) {
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'month':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange();
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'EEEE, d MMMM yyyy');
      case 'week':
        return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return '';
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const [jobsRes, typesRes, arrangementsRes, equipmentRes] = await Promise.all([
        api.get('/roster/jobs', {
          params: {
            startDate,
            endDate,
            includeDeleted: deletedFilter,
          },
        }),
        api.get('/roster/job-types'),
        api.get('/arrangements'),
        api.get('/equipment'),
      ]);

      setJobs(jobsRes.data.jobs);
      setJobTypes(typesRes.data.jobTypes);
      setArrangements(arrangementsRes.data.arrangements.filter((a: any) => a.status !== 'completed'));
      setEquipment(equipmentRes.data.equipment.filter((e: any) => e.status !== 'retired'));
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

      const startTime = new Date(formData.startTime).toISOString();
      const endTime = new Date(formData.endTime).toISOString();

      // Check equipment availability
      if (formData.equipmentIds.length > 0) {
        const unavailableEquipment: string[] = [];

        for (const equipmentId of formData.equipmentIds) {
          const response = await api.post('/equipment/check-availability', {
            equipmentId,
            startTime,
            endTime,
          });

          if (!response.data.available) {
            const item = equipment.find(e => e.id === equipmentId);
            if (item) {
              unavailableEquipment.push(item.name);
            }
          }
        }

        if (unavailableEquipment.length > 0) {
          setError(`The following equipment is already assigned to another job during this time: ${unavailableEquipment.join(', ')}`);
          return;
        }
      }

      // Convert datetime-local format to ISO8601
      // Parse attendees string into array
      const attendeesArray = formData.attendees
        ? formData.attendees.split(',').map(name => ({ name: name.trim() }))
        : null;

      const payload = {
        ...formData,
        startTime,
        endTime,
        attendees: attendeesArray,
        reminderMinutes: formData.reminderMinutes || null,
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
        description: '',
        notes: '',
        allDay: false,
        attendees: '',
        reminderMinutes: 0,
        equipmentIds: [],
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

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to delete the job "${jobTitle}"?`)) return;

    try {
      await api.delete(`/roster/jobs/${jobId}`);
      setSuccess('Job deleted successfully');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete job');
    }
  };

  // Load available resources for the selected job
  const loadAvailableResources = async (job: Job) => {
    try {
      const [staffRes, vehiclesRes, equipmentRes] = await Promise.all([
        api.get('/staff-profiles'),
        api.get('/vehicles'),
        api.get('/equipment'),
      ]);

      // Filter out already assigned resources
      // Note: Staff can be assigned multiple times with different roles, so don't filter them out
      const assignedVehicleIds = job.vehicles.map((v: any) => v.id);
      const assignedEquipmentIds = job.equipment?.map((e: any) => e.id) || [];

      setAvailableStaff(staffRes.data.staff || []);
      setAvailableVehicles(vehiclesRes.data.vehicles?.filter((v: any) => !assignedVehicleIds.includes(v.id) && v.status === 'available') || []);
      setAvailableEquipment(equipmentRes.data.equipment?.filter((e: any) => !assignedEquipmentIds.includes(e.id) && e.status === 'available') || []);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
    }
  };

  // Open role selection dialog for staff assignment
  const handleStaffClick = (staff: any) => {
    setSelectedStaffForAssignment(staff);

    // If staff has multiple roles, show dialog to select which role
    const roles = Array.isArray(staff.role) ? staff.role : [staff.role];
    if (roles.length > 1) {
      setSelectedRole(roles[0]);
      setRoleDialogOpen(true);
    } else {
      // If only one role, assign directly with that role
      handleAssignStaff(staff.id, staff.userId, roles[0]);
    }
  };

  // Assign staff to job
  const handleAssignStaff = async (staffId: string, userId: string, role: string, force: boolean = false) => {
    if (!selectedJob) return;

    try {
      await api.post(`/roster/jobs/${selectedJob.id}/assign-staff`, { staffId: userId, role, force });
      setSuccess(`Staff assigned successfully as ${role}`);
      setRoleDialogOpen(false);
      setSelectedStaffForAssignment(null);
      setConflictDialogOpen(false);
      setPendingAssignment(null);
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      // Check if this is a conflict error (409)
      if (err.response?.status === 409 && !force) {
        // Store the pending assignment and conflict details
        setPendingAssignment({ staffId, userId, role });
        setConflictDetails(err.response.data.error.conflict);
        setConflictDialogOpen(true);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to assign staff');
      }
    }
  };

  // Confirm and proceed with conflicting assignment
  const handleConfirmConflictAssignment = async () => {
    if (!pendingAssignment) return;
    await handleAssignStaff(
      pendingAssignment.staffId,
      pendingAssignment.userId,
      pendingAssignment.role,
      true
    );
  };

  // Unassign staff from job
  const handleUnassignStaff = async (staffId: string, role: string) => {
    if (!selectedJob) return;

    try {
      await api.delete(`/roster/jobs/${selectedJob.id}/unassign-staff`, {
        data: { staffId, role }
      });
      setSuccess(`Staff removed from ${role} role`);
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to unassign staff');
    }
  };

  // Refresh the selected job data
  const refreshSelectedJob = async (jobId: string) => {
    try {
      const { start, end } = getDateRange();
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const response = await api.get('/roster/jobs', {
        params: { startDate, endDate }
      });

      const updatedJob = response.data.jobs?.find((j: any) => j.id === jobId);
      if (updatedJob) {
        setSelectedJob(updatedJob);
        await loadAvailableResources(updatedJob);
      }
    } catch (err: any) {
      console.error('Failed to refresh job:', err);
    }
  };

  // Unassign vehicle from job
  const handleUnassignVehicle = async (vehicleId: string) => {
    if (!selectedJob) return;

    try {
      await api.delete(`/roster/jobs/${selectedJob.id}/unassign-vehicle`, {
        data: { vehicleId }
      });
      setSuccess('Vehicle removed from job');
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to unassign vehicle');
    }
  };

  // Unassign equipment from job
  const handleUnassignEquipment = async (equipmentId: string) => {
    if (!selectedJob) return;

    try {
      await api.delete(`/roster/jobs/${selectedJob.id}/unassign-equipment`, {
        data: { equipmentId }
      });
      setSuccess('Equipment removed from job');
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to unassign equipment');
    }
  };

  const handleRoleDialogConfirm = () => {
    if (selectedStaffForAssignment && selectedRole) {
      handleAssignStaff(
        selectedStaffForAssignment.id,
        selectedStaffForAssignment.userId,
        selectedRole
      );
    }
  };

  // Assign vehicle to job
  const handleAssignVehicle = async (vehicleId: string) => {
    if (!selectedJob) return;

    try {
      await api.post(`/roster/jobs/${selectedJob.id}/assign-vehicle`, { vehicleId });
      setSuccess('Vehicle assigned successfully');
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign vehicle');
    }
  };

  // Assign equipment to job
  const handleAssignEquipment = async (equipmentId: string) => {
    if (!selectedJob) return;

    try {
      await api.post(`/roster/jobs/${selectedJob.id}/assign-equipment`, { equipmentId });
      setSuccess('Equipment assigned successfully');
      await loadData();
      await refreshSelectedJob(selectedJob.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to assign equipment');
    }
  };

  // Get vacant/unassigned staff roles
  const getVacantStaffRoles = () => {
    if (!selectedJob?.requirements) return [];

    const vacant: Array<{ role: string; count: number }> = [];
    const roleMap: { [key: string]: string } = {
      arranger: 'Arranger',
      conductor: 'Conductor',
      funeral_director_assistant: 'Funeral Director Assistant',
      embalmer: 'Embalmer',
      hearse_driver: 'Hearse Driver',
      coach_driver: 'Coach Driver',
    };

    Object.entries(selectedJob.requirements).forEach(([roleKey, required]) => {
      if (typeof required === 'number' && required > 0) {
        const assigned = selectedJob.staff.filter(s =>
          s.role?.toLowerCase().replace(/ /g, '_') === roleKey
        ).length;
        const vacantCount = required - assigned;
        if (vacantCount > 0) {
          vacant.push({ role: roleMap[roleKey] || roleKey, count: vacantCount });
        }
      }
    });

    return vacant;
  };

  // Format role for display
  const formatRole = (role: string) => {
    const roleMap: { [key: string]: string } = {
      arranger: 'Arranger',
      conductor: 'Conductor',
      funeral_director_assistant: 'Funeral Director Assistant',
      embalmer: 'Embalmer',
      hearse_driver: 'Hearse Driver',
      coach_driver: 'Coach Driver',
    };
    const roleKey = role.toLowerCase().replace(/ /g, '_');
    return roleMap[roleKey] || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get confirmation status display info
  const getConfirmationStatus = (status: string) => {
    switch (status) {
      case 'accepted':
        return { color: 'success' as const, label: 'Confirmed', icon: '✓' };
      case 'declined':
        return { color: 'error' as const, label: 'Declined', icon: '✗' };
      case 'pending':
      default:
        return { color: 'warning' as const, label: 'Pending', icon: '?' };
    }
  };

  // Get vacant vehicle types
  const getVacantVehicles = () => {
    if (!selectedJob?.requirements) return [];

    const vacant: Array<{ type: string; count: number }> = [];
    const vehicleTypes = ['hearse', 'limousine'];

    vehicleTypes.forEach(type => {
      const required = (selectedJob.requirements as any)?.[type] || 0;
      if (required > 0) {
        const assigned = selectedJob.vehicles.filter(v =>
          v.type?.toLowerCase() === type
        ).length;
        const vacantCount = required - assigned;
        if (vacantCount > 0) {
          vacant.push({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            count: vacantCount
          });
        }
      }
    });

    return vacant;
  };

  // Load resources when job is selected
  useEffect(() => {
    if (selectedJob && resourceDrawerOpen) {
      loadAvailableResources(selectedJob);
    }
  }, [selectedJob, resourceDrawerOpen]);

  const getJobsForDay = (date: Date) => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.startTime);
      return format(jobDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  const getDaysToDisplay = () => {
    const { start, end } = getDateRange();
    const days = [];
    let currentDay = start;

    while (currentDay <= end) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    return days;
  };

  const daysToDisplay = getDaysToDisplay();

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
            Daily Run Sheet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage daily operations, jobs, and resource allocation
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
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

      {/* Navigation and Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* Date Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={handlePreviousDate} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <Box sx={{ minWidth: 200, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date, from 6 am
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {getDateRangeLabel()}
                </Typography>
              </Box>
              <IconButton onClick={handleNextDate} size="small">
                <ChevronRightIcon />
              </IconButton>
              <Button
                size="small"
                variant="outlined"
                startIcon={<TodayIcon />}
                onClick={handleToday}
                sx={{ ml: 1 }}
              >
                Today
              </Button>
            </Box>

            {/* View Mode Selector */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant={viewMode === 'day' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                size="small"
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
              <Button
                size="small"
                variant={viewMode === 'month' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
            </Box>

            {/* Deleted Items Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Deleted Items</InputLabel>
              <Select
                value={deletedFilter}
                label="Deleted Items"
                onChange={(e) => setDeletedFilter(e.target.value as 'hide' | 'only' | 'all')}
              >
                <MenuItem value="hide">Hide Deleted</MenuItem>
                <MenuItem value="only">Only Deleted</MenuItem>
                <MenuItem value="all">All Including Deleted</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Jobs View */}
      <Grid container spacing={2}>
        {daysToDisplay.map((day) => {
          const dayJobs = getJobsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <Grid
              item
              xs={12}
              md={viewMode === 'day' ? 12 : viewMode === 'week' ? 6 : 4}
              lg={viewMode === 'day' ? 12 : viewMode === 'week' ? 3 : 2}
              key={day.toString()}
            >
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
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => {
                        setSelectedJob(job);
                        setResourceDrawerOpen(true);
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
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
                                👤 {job.staff.map((s) => `${s.fullName} (${formatRole(s.role)})`).join(', ')}
                              </Typography>
                            )}
                            {job.vehicles.length > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                🚗 {job.vehicles.map((v) => v.registration).join(', ')}
                              </Typography>
                            )}
                            {job.equipment && job.equipment.length > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                📦 {job.equipment.map((e) => e.name).join(', ')}
                              </Typography>
                            )}
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteJob(job.id, job.title)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
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
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
            <TextField
              fullWidth
              label="Attendees (comma-separated names)"
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
              placeholder="John Doe, Jane Smith"
              helperText="Optional: List people attending this event"
            />
            <TextField
              fullWidth
              label="Reminder (minutes before)"
              type="number"
              value={formData.reminderMinutes}
              onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) || 0 })}
              InputProps={{ inputProps: { min: 0, step: 15 } }}
              helperText="Optional: Set reminder notification (e.g., 30 for 30 minutes before)"
            />

            {/* Equipment Assignment */}
            <FormControl fullWidth>
              <InputLabel>Equipment</InputLabel>
              <Select
                multiple
                value={formData.equipmentIds}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const value = e.target.value;
                  setFormData({ ...formData, equipmentIds: typeof value === 'string' ? value.split(',') : value });
                }}
                input={<OutlinedInput label="Equipment" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const item = equipment.find(e => e.id === id);
                      return item ? (
                        <Chip key={id} label={item.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {equipment.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography sx={{ flex: 1 }}>{item.name}</Typography>
                      <Chip
                        label={item.equipmentType.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'available' ? 'success' : 'default'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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

      {/* Resource Allocation Drawer */}
      <Drawer
        anchor="right"
        open={resourceDrawerOpen}
        onClose={() => {
          setResourceDrawerOpen(false);
          setSelectedJob(null);
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Assign Resources
          </Typography>
          <IconButton
            onClick={() => {
              setResourceDrawerOpen(false);
              setSelectedJob(null);
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedJob && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium">
                {selectedJob.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(selectedJob.startTime), 'MMM d, HH:mm')} -{' '}
                {format(new Date(selectedJob.endTime), 'HH:mm')}
              </Typography>
            </Box>

            <Tabs
              value={resourceTab}
              onChange={(_, val) => setResourceTab(val)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Staff" value="staff" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Vehicles" value="vehicles" icon={<VehicleIcon />} iconPosition="start" />
              <Tab label="Equipment" value="equipment" icon={<EquipmentIcon />} iconPosition="start" />
            </Tabs>

            {/* Currently Assigned Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Currently Assigned
              </Typography>
              <List dense>
                {/* Staff Tab */}
                {resourceTab === 'staff' && (
                  <>
                    {selectedJob.staff.map((staff: any, index: number) => {
                      const confirmStatus = getConfirmationStatus(staff.confirmationStatus);
                      return (
                        <ListItem
                          key={`assigned-${index}`}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'error.lighter', borderRadius: 1 },
                          }}
                          onClick={() => handleUnassignStaff(staff.id, staff.role)}
                          secondaryAction={
                            <Chip
                              label={confirmStatus.label}
                              size="small"
                              color={confirmStatus.color}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          }
                        >
                          <ListItemIcon>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={staff.fullName}
                            secondary={`${formatRole(staff.role)} (click to remove)`}
                          />
                        </ListItem>
                      );
                    })}
                    {getVacantStaffRoles().map((vacant, index) => (
                      <ListItem key={`vacant-${index}`}>
                        <ListItemIcon>
                          <PersonIcon color="disabled" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${vacant.count} ${vacant.role}${vacant.count > 1 ? 's' : ''} needed`}
                          secondary="Unassigned"
                          primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                        />
                      </ListItem>
                    ))}
                    {selectedJob.staff.length === 0 && getVacantStaffRoles().length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        No staff assigned yet
                      </Typography>
                    )}
                  </>
                )}

                {/* Vehicles Tab */}
                {resourceTab === 'vehicles' && (
                  <>
                    {selectedJob.vehicles.map((vehicle: any, index: number) => (
                      <ListItem
                        key={`assigned-${index}`}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'error.lighter', borderRadius: 1 },
                        }}
                        onClick={() => handleUnassignVehicle(vehicle.id)}
                      >
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={vehicle.registration}
                          secondary={`${vehicle.type} (click to remove)`}
                        />
                      </ListItem>
                    ))}
                    {getVacantVehicles().map((vacant, index) => (
                      <ListItem key={`vacant-${index}`}>
                        <ListItemIcon>
                          <VehicleIcon color="disabled" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${vacant.count} ${vacant.type}${vacant.count > 1 ? 's' : ''} needed`}
                          secondary="Unassigned"
                          primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                        />
                      </ListItem>
                    ))}
                    {selectedJob.vehicles.length === 0 && getVacantVehicles().length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        No vehicles assigned yet
                      </Typography>
                    )}
                  </>
                )}

                {/* Equipment Tab */}
                {resourceTab === 'equipment' && (
                  <>
                    {selectedJob.equipment && selectedJob.equipment.map((equip: any, index: number) => (
                      <ListItem
                        key={`assigned-${index}`}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'error.lighter', borderRadius: 1 },
                        }}
                        onClick={() => handleUnassignEquipment(equip.id)}
                      >
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={equip.name}
                          secondary={`${equip.equipmentType} (click to remove)`}
                        />
                      </ListItem>
                    ))}
                    {(!selectedJob.equipment || selectedJob.equipment.length === 0) && (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        No equipment assigned yet
                      </Typography>
                    )}
                  </>
                )}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Available Resources Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Available {resourceTab.charAt(0).toUpperCase() + resourceTab.slice(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Double-click to assign
              </Typography>

              <List dense>
                {resourceTab === 'staff' && availableStaff.map((staff: any) => (
                  <ListItem
                    key={staff.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                    onDoubleClick={() => handleStaffClick(staff)}
                  >
                    <ListItemIcon>
                      <Avatar
                        src={staff.photoUrl}
                        sx={{ width: 32, height: 32 }}
                      >
                        {staff.fullName?.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={staff.fullName}
                      secondary={staff.position || 'Staff Member'}
                    />
                  </ListItem>
                ))}

                {resourceTab === 'vehicles' && availableVehicles.map((vehicle: any) => (
                  <ListItem
                    key={vehicle.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                    onDoubleClick={() => handleAssignVehicle(vehicle.id)}
                  >
                    <ListItemIcon>
                      <VehicleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={vehicle.registration}
                      secondary={`${vehicle.make} ${vehicle.model} - ${vehicle.vehicleType}`}
                    />
                  </ListItem>
                ))}

                {resourceTab === 'equipment' && availableEquipment.map((equip: any) => (
                  <ListItem
                    key={equip.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                    onDoubleClick={() => handleAssignEquipment(equip.id)}
                  >
                    <ListItemIcon>
                      <EquipmentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={equip.name}
                      secondary={equip.equipmentType.replace(/_/g, ' ')}
                    />
                  </ListItem>
                ))}

                {resourceTab === 'staff' && availableStaff.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                    All staff are assigned or unavailable
                  </Typography>
                )}
                {resourceTab === 'vehicles' && availableVehicles.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                    All vehicles are assigned or unavailable
                  </Typography>
                )}
                {resourceTab === 'equipment' && availableEquipment.length === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                    All equipment is assigned or unavailable
                  </Typography>
                )}
              </List>
            </Box>
          </>
        )}
      </Drawer>

      {/* Role Selection Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Select Role for Assignment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedStaffForAssignment?.fullName} has multiple roles. Select which role to assign:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Role"
            >
              {selectedStaffForAssignment && Array.isArray(selectedStaffForAssignment.role) &&
                selectedStaffForAssignment.role.map((role: string) => (
                  <MenuItem key={role} value={role}>
                    {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRoleDialogConfirm} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conflict Confirmation Dialog */}
      <Dialog open={conflictDialogOpen} onClose={() => setConflictDialogOpen(false)}>
        <DialogTitle>Conflicting Assignment</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This staff member has a conflicting assignment
          </Alert>
          {conflictDetails && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Conflicting Job:</strong> {conflictDetails.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Time:</strong> {format(new Date(conflictDetails.start_time), 'PPp')} - {format(new Date(conflictDetails.end_time), 'p')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Do you want to proceed with this assignment anyway?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmConflictAssignment} variant="contained" color="warning">
            Accept and Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

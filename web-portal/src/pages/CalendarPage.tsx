import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location?: string;
  arrangementId?: string;
  deceasedName?: string;
  status: string;
  color?: string;
}

interface Arrangement {
  id: string;
  deceasedName: string;
}

const eventTypes = [
  { value: 'service', label: 'Funeral Service', color: '#1976d2' },
  { value: 'appointment', label: 'Appointment', color: '#9c27b0' },
  { value: 'meeting', label: 'Meeting', color: '#f57c00' },
  { value: 'reminder', label: 'Reminder', color: '#388e3c' },
  { value: 'other', label: 'Other', color: '#757575' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'service',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    arrangementId: '',
    status: 'scheduled',
  });

  useEffect(() => {
    loadEvents();
    loadArrangements();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      const response = await api.get(`/calendar?start=${start}&end=${end}`);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadArrangements = async () => {
    try {
      const response = await api.get('/arrangements');
      setArrangements(response.data.arrangements || []);
    } catch (error) {
      console.error('Failed to load arrangements:', error);
    }
  };

  const handleOpenDialog = (event?: CalendarEvent, date?: Date) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        eventType: event.eventType,
        startTime: event.startTime.slice(0, 16),
        endTime: event.endTime.slice(0, 16),
        allDay: event.allDay,
        location: event.location || '',
        arrangementId: event.arrangementId || '',
        status: event.status,
      });
    } else {
      setEditingEvent(null);
      const defaultDate = date || new Date();
      const defaultTime = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
      setFormData({
        title: '',
        description: '',
        eventType: 'service',
        startTime: defaultTime,
        endTime: defaultTime,
        allDay: false,
        location: '',
        arrangementId: '',
        status: 'scheduled',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = async () => {
    try {
      const data = {
        ...formData,
        arrangementId: formData.arrangementId || null,
      };

      if (editingEvent) {
        await api.put(`/calendar/${editingEvent.id}`, data);
      } else {
        await api.post('/calendar', data);
      }

      await loadEvents();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/calendar/${eventId}`);
        await loadEvents();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const getDaysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event =>
      isSameDay(parseISO(event.startTime), day)
    );
  };

  const getEventColor = (eventType: string) => {
    return eventTypes.find(t => t.value === eventType)?.color || '#757575';
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Calendar
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage services, appointments, and important dates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Event
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={goToPreviousMonth}>
                <PrevIcon />
              </IconButton>
              <Button onClick={goToToday}>Today</Button>
              <IconButton onClick={goToNextMonth}>
                <NextIcon />
              </IconButton>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <Box width={120} /> {/* Spacer for alignment */}
          </Box>

          <Grid container spacing={1}>
            {getDaysInMonth().map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <Grid item xs={12} sm={6} md={3} key={day.toString()}>
                  <Card
                    variant="outlined"
                    sx={{
                      minHeight: 120,
                      bgcolor: isToday ? 'primary.light' : 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleOpenDialog(undefined, day)}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color={isToday ? 'primary.contrastText' : 'text.primary'}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {dayEvents.map(event => (
                        <Chip
                          key={event.id}
                          label={event.title}
                          size="small"
                          sx={{
                            mt: 0.5,
                            width: '100%',
                            bgcolor: getEventColor(event.eventType),
                            color: 'white',
                            '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(event);
                          }}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Upcoming Events
          </Typography>
          <List>
            {events
              .filter(e => new Date(e.startTime) >= new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 10)
              .map((event, index) => (
                <div key={event.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" onClick={() => handleOpenDialog(event)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteEvent(event.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <EventIcon sx={{ mr: 2, color: getEventColor(event.eventType) }} />
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          {format(parseISO(event.startTime), 'dd MMM yyyy, HH:mm')}
                          {event.location && ` • ${event.location}`}
                          {event.deceasedName && ` • ${event.deceasedName}`}
                        </>
                      }
                    />
                  </ListItem>
                </div>
              ))}
          </List>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Event Type"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  required
                >
                  {eventTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Time"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Link to Arrangement (Optional)"
                  value={formData.arrangementId}
                  onChange={(e) => setFormData({ ...formData, arrangementId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {arrangements.map(arr => (
                    <MenuItem key={arr.id} value={arr.id}>
                      {arr.deceasedName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEvent} variant="contained">
            {editingEvent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

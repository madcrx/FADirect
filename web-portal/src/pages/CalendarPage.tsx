import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { arrangementsApi } from '@/services/api';
import type { Arrangement } from '@/types';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadArrangements();
  }, [currentDate]);

  const loadArrangements = async () => {
    setLoading(true);
    try {
      const allArrangements = await arrangementsApi.getAll();
      setArrangements(allArrangements);
    } catch (error) {
      console.error('Failed to load arrangements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleArrangementClick = (arrangement: Arrangement) => {
    setSelectedArrangement(arrangement);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedArrangement(null);
  };

  const getArrangementsForDay = (date: Date) => {
    return arrangements.filter((arr) => {
      if (!arr.serviceDate) return false;
      const serviceDate = parseISO(arr.serviceDate);
      return isSameDay(serviceDate, date);
    });
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayArrangements = getArrangementsForDay(currentDay);
        const isCurrentMonth = isSameMonth(currentDay, monthStart);
        const isToday = isSameDay(currentDay, new Date());

        days.push(
          <Box
            key={day.toString()}
            sx={{
              minHeight: 120,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: isCurrentMonth ? 'background.paper' : 'action.hover',
              position: 'relative',
              cursor: dayArrangements.length > 0 ? 'pointer' : 'default',
              '&:hover': {
                bgcolor: dayArrangements.length > 0 ? 'action.hover' : undefined,
              },
            }}
          >
            <Typography
              variant="body2"
              fontWeight={isToday ? 'bold' : 'normal'}
              color={isToday ? 'primary' : isCurrentMonth ? 'text.primary' : 'text.disabled'}
              sx={{ mb: 0.5 }}
            >
              {format(currentDay, 'd')}
            </Typography>
            {dayArrangements.map((arr) => (
              <Box
                key={arr.id}
                onClick={() => handleArrangementClick(arr)}
                sx={{
                  mb: 0.5,
                  p: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  fontSize: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                }}
              >
                {arr.deceasedName}
              </Box>
            ))}
          </Box>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <Box key={day.toString()} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days}
        </Box>
      );
      days = [];
    }

    return rows;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'warning';
    }
  };

  const getFuneralTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      traditional: 'Traditional',
      cremation: 'Cremation',
      burial: 'Burial',
      memorial: 'Memorial',
      direct_cremation: 'Direct Cremation',
      repatriation: 'Repatriation',
    };
    return labels[type] || type;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Arrangements Calendar
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Button variant="outlined" startIcon={<TodayIcon />} onClick={handleToday}>
            Today
          </Button>
          <IconButton onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h5" sx={{ mb: 2 }}>
        {format(currentDate, 'MMMM yyyy')}
      </Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: 'action.hover' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Typography
                key={day}
                variant="body2"
                fontWeight="bold"
                sx={{ p: 1, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider' }}
              >
                {day}
              </Typography>
            ))}
          </Box>
          {renderCalendar()}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedArrangement && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Arrangement Details</Typography>
                <IconButton onClick={handleCloseDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom>
                    {selectedArrangement.deceasedName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={selectedArrangement.status.toUpperCase()}
                      color={getStatusColor(selectedArrangement.status) as any}
                      size="small"
                    />
                    <Chip
                      label={getFuneralTypeLabel(selectedArrangement.funeralType)}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Grid>

                {selectedArrangement.serviceDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Service Date
                    </Typography>
                    <Typography variant="body1">
                      {format(parseISO(selectedArrangement.serviceDate), 'PPP')}
                    </Typography>
                  </Grid>
                )}

                {selectedArrangement.serviceLocation && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Service Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedArrangement.serviceLocation}
                    </Typography>
                  </Grid>
                )}

                {selectedArrangement.deceasedDateOfBirth && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {format(parseISO(selectedArrangement.deceasedDateOfBirth), 'PP')}
                    </Typography>
                  </Grid>
                )}

                {selectedArrangement.deceasedDateOfDeath && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Date of Death
                    </Typography>
                    <Typography variant="body1">
                      {format(parseISO(selectedArrangement.deceasedDateOfDeath), 'PP')}
                    </Typography>
                  </Grid>
                )}

                {selectedArrangement.mournerName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Family Contact
                    </Typography>
                    <Typography variant="body1">
                      {selectedArrangement.mournerName}
                    </Typography>
                    {selectedArrangement.mournerPhone && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedArrangement.mournerPhone}
                      </Typography>
                    )}
                  </Grid>
                )}

                {selectedArrangement.nextOfKinName && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Next of Kin
                    </Typography>
                    <Typography variant="body1">
                      {selectedArrangement.nextOfKinName}
                      {selectedArrangement.nextOfKinRelationship && \` (\${selectedArrangement.nextOfKinRelationship})\`}
                    </Typography>
                    {selectedArrangement.nextOfKinPhone && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedArrangement.nextOfKinPhone}
                      </Typography>
                    )}
                  </Grid>
                )}

                {selectedArrangement.locationOfDeceased && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Location of Deceased
                    </Typography>
                    <Typography variant="body1">
                      {selectedArrangement.locationOfDeceased}
                    </Typography>
                  </Grid>
                )}

                {selectedArrangement.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {selectedArrangement.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                onClick={() => {
                  handleCloseDialog();
                  window.location.href = \`/arrangements/\${selectedArrangement.id}\`;
                }}
              >
                View Full Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

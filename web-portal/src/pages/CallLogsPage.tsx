import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CallMade as OutboundIcon,
  CallReceived as InboundIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface CallLog {
  id: string;
  callSid: string;
  userId: string;
  userName: string;
  arrangementId: string | null;
  deceasedName: string | null;
  toNumber: string;
  fromNumber: string;
  status: string;
  direction: 'outbound' | 'inbound';
  duration: number | null;
  recordingUrl: string | null;
  createdAt: string;
}

export default function CallLogsPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/phone/call-logs', {
        params: { limit: 100 }
      });
      setCallLogs(response.data.callLogs);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+61')) {
      const number = phone.substring(3);
      return `(+61) ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'busy':
      case 'no-answer':
        return 'warning';
      case 'failed':
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredLogs = callLogs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.toNumber.toLowerCase().includes(search) ||
      log.fromNumber.toLowerCase().includes(search) ||
      log.userName?.toLowerCase().includes(search) ||
      log.deceasedName?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Call Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View history of all phone calls
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by phone number, user, or arrangement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Card>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No call logs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Call history will appear here
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Arrangement</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Recording</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.createdAt), 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(log.createdAt), 'HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.direction === 'outbound' ? (
                          <Tooltip title="Outbound">
                            <OutboundIcon color="primary" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Inbound">
                            <InboundIcon color="secondary" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatPhoneNumber(log.toNumber)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatPhoneNumber(log.fromNumber)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.userName || 'N/A'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.deceasedName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          color={getStatusColor(log.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(log.duration)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {log.recordingUrl ? (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => window.open(log.recordingUrl!, '_blank')}
                          >
                            <PlayIcon />
                          </IconButton>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

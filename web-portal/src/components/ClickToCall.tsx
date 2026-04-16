import { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface ClickToCallProps {
  phoneNumber: string;
  label?: string;
  arrangementId?: string;
  variant?: 'icon' | 'button';
  showSms?: boolean;
}

export default function ClickToCall({
  phoneNumber,
  label,
  arrangementId,
  variant = 'icon',
  showSms = false,
}: ClickToCallProps) {
  const [callDialog, setCallDialog] = useState(false);
  const [smsDialog, setSmsDialog] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleCall = async () => {
    setLoading(true);
    setError('');

    try {
      await api.post('/phone/call', {
        toNumber: phoneNumber,
        arrangementId,
      });

      setSuccess('Call initiated successfully');
      setCallDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to initiate call');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/phone/sms', {
        toNumber: phoneNumber,
        message: smsMessage,
        arrangementId,
      });

      setSuccess('SMS sent successfully');
      setSmsDialog(false);
      setSmsMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple formatting for display
    if (phone.startsWith('+61')) {
      const number = phone.substring(3);
      return `(+61) ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    return phone;
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: 'inline-flex', gap: 1 }}>
        {variant === 'icon' ? (
          <>
            <Tooltip title="Call">
              <IconButton
                size="small"
                color="primary"
                onClick={() => setCallDialog(true)}
              >
                <PhoneIcon />
              </IconButton>
            </Tooltip>
            {showSms && (
              <Tooltip title="Send SMS">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setSmsDialog(true)}
                >
                  <SmsIcon />
                </IconButton>
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={() => setCallDialog(true)}
              size="small"
            >
              {label || 'Call'}
            </Button>
            {showSms && (
              <Button
                variant="outlined"
                startIcon={<SmsIcon />}
                onClick={() => setSmsDialog(true)}
                size="small"
              >
                Send SMS
              </Button>
            )}
          </>
        )}
      </Box>

      {/* Call Confirmation Dialog */}
      <Dialog open={callDialog} onClose={() => setCallDialog(false)}>
        <DialogTitle>Initiate Call</DialogTitle>
        <DialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to call:
          </Typography>
          <Typography variant="h6" fontWeight="medium">
            {formatPhoneNumber(phoneNumber)}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            You will receive a call on your registered phone number, which will then be connected to this contact.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCall}
            disabled={loading}
            startIcon={<PhoneIcon />}
          >
            {loading ? 'Calling...' : 'Call Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={smsDialog} onClose={() => setSmsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send SMS</DialogTitle>
        <DialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            To: {formatPhoneNumber(phoneNumber)}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={smsMessage}
            onChange={(e) => setSmsMessage(e.target.value)}
            placeholder="Enter your message..."
            helperText={`${smsMessage.length}/160 characters`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSmsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendSms}
            disabled={loading || !smsMessage.trim()}
            startIcon={<SmsIcon />}
          >
            {loading ? 'Sending...' : 'Send SMS'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

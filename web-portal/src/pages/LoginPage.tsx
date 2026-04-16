import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { authApi } from '@/services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');
    setLoading(true);
    try {
      // In development, automatically set code sent
      setCodeSent(true);
      setCode('123456'); // Auto-fill development code
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(phoneNumber, code);

      // Check if user is admin or arranger
      if (response.user.role !== 'admin' && response.user.role !== 'arranger') {
        setError('Access denied. Portal is for administrators and arrangers only.');
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A3A52 0%, #2C5F7F 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
                FA Direct Portal
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Funeral Arrangement Management System
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+61 4XX XXX XXX"
                disabled={codeSent}
                sx={{ mb: 2 }}
              />

              {codeSent && (
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  sx={{ mb: 2 }}
                  autoFocus
                />
              )}

              {!codeSent ? (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendCode}
                  disabled={loading || !phoneNumber}
                >
                  Send Verification Code
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setCodeSent(false);
                      setCode('');
                    }}
                  >
                    Change Number
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={loading || !code}
                  >
                    Login
                  </Button>
                </Box>
              )}
            </form>

            <Typography variant="caption" display="block" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
              Development mode: Use code 123456
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

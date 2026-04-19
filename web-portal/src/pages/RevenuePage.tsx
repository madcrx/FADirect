import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Description as QuotationIcon,
  Receipt as InvoiceIcon,
  Payment as OutstandingIcon,
} from '@mui/icons-material';
import { invoiceApi } from '@/services/api';

interface InvoiceStats {
  quotations: {
    count: number;
    total: number;
  };
  invoices: {
    count: number;
    total: number;
  };
  outstanding: {
    count: number;
    total: number;
  };
}

export default function RevenuePage() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load invoice stats:', err);
      setError('Failed to load revenue statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'Quotations',
      icon: <QuotationIcon sx={{ fontSize: 40 }} />,
      count: stats.quotations.count,
      total: stats.quotations.total,
      color: '#2196f3',
    },
    {
      title: 'Invoices',
      icon: <InvoiceIcon sx={{ fontSize: 40 }} />,
      count: stats.invoices.count,
      total: stats.invoices.total,
      color: '#4caf50',
    },
    {
      title: 'Outstanding Invoices',
      icon: <OutstandingIcon sx={{ fontSize: 40 }} />,
      count: stats.outstanding.count,
      total: stats.outstanding.total,
      color: '#ff9800',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Revenue Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Summary of quotations, invoices, and outstanding payments
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} md={4} key={card.title}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      color: 'white',
                      borderRadius: 2,
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatCurrency(card.total)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.count} {card.count === 1 ? 'item' : 'items'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

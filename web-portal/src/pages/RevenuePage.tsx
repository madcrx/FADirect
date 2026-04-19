import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Description as QuotationIcon,
  Receipt as InvoiceIcon,
  Payment as OutstandingIcon,
  AttachMoney as RevenueIcon,
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

interface RevenueAnalytics {
  monthlyRevenue: Array<{
    month: string;
    count: number;
    totalInvoiced: number;
    totalPaid: number;
  }>;
  agingReport: Array<{
    ageBracket: string;
    count: number;
    total: number;
  }>;
  thisMonth: {
    count: number;
    totalInvoiced: number;
    totalPaid: number;
  };
  lastMonth: {
    count: number;
    totalInvoiced: number;
    totalPaid: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    deceasedName: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    createdAt: string;
  }>;
}

export default function RevenuePage() {
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, analyticsData] = await Promise.all([
        invoiceApi.getStats(),
        invoiceApi.getAnalytics(),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
      setError('Failed to load revenue data');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
        return 'info';
      case 'overdue':
        return 'error';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !stats || !analytics) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load revenue data'}
        </Alert>
      </Box>
    );
  }

  const revenueChange = calculatePercentageChange(
    analytics.thisMonth.totalPaid,
    analytics.lastMonth.totalPaid
  );

  const cards = [
    {
      title: 'This Month Revenue',
      icon: <RevenueIcon sx={{ fontSize: 40 }} />,
      value: formatCurrency(analytics.thisMonth.totalPaid),
      subtitle: `${analytics.thisMonth.count} invoices`,
      comparison: revenueChange,
      color: '#4caf50',
    },
    {
      title: 'Quotations',
      icon: <QuotationIcon sx={{ fontSize: 40 }} />,
      value: formatCurrency(stats.quotations.total),
      subtitle: `${stats.quotations.count} ${stats.quotations.count === 1 ? 'draft' : 'drafts'}`,
      color: '#2196f3',
    },
    {
      title: 'Total Invoiced',
      icon: <InvoiceIcon sx={{ fontSize: 40 }} />,
      value: formatCurrency(stats.invoices.total),
      subtitle: `${stats.invoices.count} ${stats.invoices.count === 1 ? 'invoice' : 'invoices'}`,
      color: '#9c27b0',
    },
    {
      title: 'Outstanding',
      icon: <OutstandingIcon sx={{ fontSize: 40 }} />,
      value: formatCurrency(stats.outstanding.total),
      subtitle: `${stats.outstanding.count} unpaid ${stats.outstanding.count === 1 ? 'invoice' : 'invoices'}`,
      color: '#ff9800',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Revenue & Accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive overview of invoicing, revenue, and outstanding accounts
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
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
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  {card.value}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                  {card.comparison && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      {card.comparison.isPositive ? (
                        <TrendingUpIcon fontSize="small" color="success" />
                      ) : (
                        <TrendingDownIcon fontSize="small" color="error" />
                      )}
                      <Typography
                        variant="caption"
                        color={card.comparison.isPositive ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {card.comparison.value.toFixed(1)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Revenue Trend (Last 12 Months)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Month</strong></TableCell>
                      <TableCell align="right"><strong>Invoices</strong></TableCell>
                      <TableCell align="right"><strong>Total Invoiced</strong></TableCell>
                      <TableCell align="right"><strong>Total Paid</strong></TableCell>
                      <TableCell align="right"><strong>Collection Rate</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.monthlyRevenue.map((month, index) => {
                      const collectionRate = month.totalInvoiced > 0
                        ? (month.totalPaid / month.totalInvoiced) * 100
                        : 0;
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            {new Date(month.month).toLocaleDateString('en-AU', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell align="right">{month.count}</TableCell>
                          <TableCell align="right">{formatCurrency(month.totalInvoiced)}</TableCell>
                          <TableCell align="right">{formatCurrency(month.totalPaid)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${collectionRate.toFixed(0)}%`}
                              size="small"
                              color={collectionRate >= 80 ? 'success' : collectionRate >= 60 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Aging Report */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Outstanding Invoices Aging
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {analytics.agingReport.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No outstanding invoices
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analytics.agingReport.map((bracket, index) => {
                    const color =
                      bracket.ageBracket === '0-30 days'
                        ? '#4caf50'
                        : bracket.ageBracket === '31-60 days'
                        ? '#ff9800'
                        : bracket.ageBracket === '61-90 days'
                        ? '#f44336'
                        : '#9c27b0';

                    return (
                      <Box key={index}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight="medium">
                            {bracket.ageBracket}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bracket.count} {bracket.count === 1 ? 'invoice' : 'invoices'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              flexGrow: 1,
                              height: 8,
                              backgroundColor: 'grey.200',
                              borderRadius: 1,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.min((bracket.total / stats.outstanding.total) * 100, 100)}%`,
                                height: '100%',
                                backgroundColor: color,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" fontWeight="bold" minWidth={80} textAlign="right">
                            {formatCurrency(bracket.total)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Invoices */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Recent Invoices
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Invoice #</strong></TableCell>
                      <TableCell><strong>Deceased</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                      <TableCell align="right"><strong>Paid</strong></TableCell>
                      <TableCell align="right"><strong>Balance</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Due Date</strong></TableCell>
                      <TableCell><strong>Created</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.recentInvoices.map((invoice) => {
                      const balance = invoice.totalAmount - invoice.paidAmount;
                      return (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.deceasedName || '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell align="right">{formatCurrency(invoice.paidAmount)}</TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color={balance > 0 ? 'error.main' : 'text.primary'}
                              fontWeight={balance > 0 ? 'bold' : 'normal'}
                            >
                              {formatCurrency(balance)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              color={getStatusColor(invoice.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</TableCell>
                          <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

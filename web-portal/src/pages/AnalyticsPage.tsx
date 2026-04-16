import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface OverviewStats {
  arrangements: {
    total_arrangements: number;
    pending_arrangements: number;
    in_progress_arrangements: number;
    completed_arrangements: number;
  };
  invoices: {
    total_invoices: number;
    total_revenue: number;
    average_invoice_amount: number;
    paid_invoices: number;
    pending_invoices: number;
    paid_amount: number;
    pending_amount: number;
  };
  users: {
    total_users: number;
    active_users: number;
  };
  files: {
    total_documents: number;
    total_photos: number;
  };
}

interface TrendData {
  period: string;
  count?: number;
  completedCount?: number;
  revenue?: number;
  invoiceCount?: number;
}

interface TopService {
  description: string;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
}

interface MonthlyComparison {
  currentMonth: {
    arrangements: number;
    revenue: number;
  };
  previousMonth: {
    arrangements: number;
    revenue: number;
  };
  change: {
    arrangementsPercent: number;
    revenuePercent: number;
  };
}

const COLORS = ['#1976d2', '#dc004e', '#f57c00', '#388e3c', '#7b1fa2'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [arrangementTrends, setArrangementTrends] = useState<TrendData[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<TrendData[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        arrangementTrendsRes,
        revenueTrendsRes,
        topServicesRes,
        monthlyComparisonRes,
      ] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/trends/arrangements'),
        api.get('/analytics/trends/revenue'),
        api.get('/analytics/top-services'),
        api.get('/analytics/monthly-comparison'),
      ]);

      setOverview(overviewRes.data);
      setArrangementTrends(arrangementTrendsRes.data.data);
      setRevenueTrends(revenueTrendsRes.data.data);
      setTopServices(topServicesRes.data.services);
      setMonthlyComparison(monthlyComparisonRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load analytics');
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Box p={3}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!overview) return null;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Analytics & Insights
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Business performance and key metrics
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssignmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Total Arrangements
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {overview.arrangements.total_arrangements}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {overview.arrangements.completed_arrangements} completed
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MoneyIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {formatCurrency(overview.invoices.total_revenue || 0)}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {overview.invoices.paid_invoices} invoices paid
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PeopleIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {overview.users.active_users}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                of {overview.users.total_users} total users
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FolderIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Files Stored
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold">
              {overview.files.total_documents + overview.files.total_photos}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {overview.files.total_documents} docs, {overview.files.total_photos} photos
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Monthly Comparison */}
      {monthlyComparison && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Arrangements This Month
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 2 }}>
                    {monthlyComparison.currentMonth.arrangements}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {parseFloat(monthlyComparison.change.arrangementsPercent) >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography
                      variant="h6"
                      color={
                        parseFloat(monthlyComparison.change.arrangementsPercent) >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {Math.abs(parseFloat(monthlyComparison.change.arrangementsPercent))}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  vs {monthlyComparison.previousMonth.arrangements} last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                  Revenue This Month
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ mr: 2 }}>
                    {formatCurrency(monthlyComparison.currentMonth.revenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {parseFloat(monthlyComparison.change.revenuePercent) >= 0 ? (
                      <TrendingUpIcon color="success" />
                    ) : (
                      <TrendingDownIcon color="error" />
                    )}
                    <Typography
                      variant="h6"
                      color={
                        parseFloat(monthlyComparison.change.revenuePercent) >= 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {Math.abs(parseFloat(monthlyComparison.change.revenuePercent))}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  vs {formatCurrency(monthlyComparison.previousMonth.revenue)} last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Arrangements Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={arrangementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Total"
                    stroke="#1976d2"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedCount"
                    name="Completed"
                    stroke="#388e3c"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="medium" gutterBottom>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Services */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Top Services by Revenue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Invoices</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topServices.map((service, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {service.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{service.totalQuantity}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {formatCurrency(service.totalRevenue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{service.invoiceCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

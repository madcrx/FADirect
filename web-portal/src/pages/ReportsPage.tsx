import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Gavel as GavelIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format, subDays, subMonths } from 'date-fns';

interface ReportStats {
  totalRevenue: number;
  outstandingAmount: number;
  activeArrangements: number;
  completedArrangements: number;
  pendingGovernmentForms: number;
  overdueInvoices: number;
}

interface ArrangementsByType {
  funeralType: string;
  count: number;
}

interface RevenueByMonth {
  month: string;
  revenue: number;
  invoices: number;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    outstandingAmount: 0,
    activeArrangements: 0,
    completedArrangements: 0,
    pendingGovernmentForms: 0,
    overdueInvoices: 0,
  });
  const [arrangementsByType, setArrangementsByType] = useState<ArrangementsByType[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFinancialStats(),
        loadArrangementStats(),
        loadGovernmentStats(),
      ]);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialStats = async () => {
    try {
      const invoicesRes = await api.get('/invoices');
      const invoices = invoicesRes.data.invoices || [];

      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

      const outstandingAmount = invoices
        .filter((inv: any) => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum: number, inv: any) => sum + (inv.totalAmount - inv.paidAmount), 0);

      const overdueInvoices = invoices.filter((inv: any) => inv.status === 'overdue').length;

      // Calculate revenue by month (last 6 months)
      const monthlyRevenue: { [key: string]: { revenue: number; invoices: number } } = {};
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        monthlyRevenue[monthKey] = { revenue: 0, invoices: 0 };
      }

      invoices.forEach((inv: any) => {
        if (inv.status === 'paid' && inv.createdAt) {
          const monthKey = format(new Date(inv.createdAt), 'MMM yyyy');
          if (monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey].revenue += inv.totalAmount;
            monthlyRevenue[monthKey].invoices += 1;
          }
        }
      });

      setRevenueByMonth(
        Object.entries(monthlyRevenue).map(([month, data]) => ({
          month,
          revenue: data.revenue,
          invoices: data.invoices,
        }))
      );

      setStats(prev => ({
        ...prev,
        totalRevenue,
        outstandingAmount,
        overdueInvoices,
      }));
    } catch (error) {
      console.error('Failed to load financial stats:', error);
    }
  };

  const loadArrangementStats = async () => {
    try {
      const arrangementsRes = await api.get('/arrangements');
      const arrangements = arrangementsRes.data.arrangements || [];

      const activeArrangements = arrangements.filter(
        (arr: any) => arr.status === 'active' || arr.status === 'pending'
      ).length;

      const completedArrangements = arrangements.filter(
        (arr: any) => arr.status === 'completed'
      ).length;

      // Count by funeral type
      const typeCount: { [key: string]: number } = {};
      arrangements.forEach((arr: any) => {
        const type = arr.funeralType || 'unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      setArrangementsByType(
        Object.entries(typeCount).map(([funeralType, count]) => ({
          funeralType,
          count: count as number,
        }))
      );

      setStats(prev => ({
        ...prev,
        activeArrangements,
        completedArrangements,
      }));
    } catch (error) {
      console.error('Failed to load arrangement stats:', error);
    }
  };

  const loadGovernmentStats = async () => {
    try {
      const formsRes = await api.get('/government-forms');
      const forms = formsRes.data.submissions || [];

      const pendingGovernmentForms = forms.filter(
        (form: any) => form.status === 'draft' || form.status === 'submitted'
      ).length;

      setStats(prev => ({
        ...prev,
        pendingGovernmentForms,
      }));
    } catch (error) {
      console.error('Failed to load government stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {dateRange === '7days' ? 'Last 7 days' : dateRange === '30days' ? 'Last 30 days' : 'Last 12 months'}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Reports & Analytics
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Reports & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track performance, revenue, and operational metrics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            label="Date Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="7days">Last 7 days</MenuItem>
            <MenuItem value="30days">Last 30 days</MenuItem>
            <MenuItem value="12months">Last 12 months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<MoneyIcon sx={{ color: 'success.main' }} />}
            color="success"
            subtitle="From completed invoices"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Outstanding Amount"
            value={formatCurrency(stats.outstandingAmount)}
            icon={<PendingIcon sx={{ color: 'warning.main' }} />}
            color="warning"
            subtitle={`${stats.overdueInvoices} overdue invoices`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Arrangements"
            value={stats.activeArrangements}
            icon={<AssignmentIcon sx={{ color: 'primary.main' }} />}
            color="primary"
            subtitle={`${stats.completedArrangements} completed`}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Revenue by Month
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Month</strong></TableCell>
                      <TableCell align="right"><strong>Invoices</strong></TableCell>
                      <TableCell align="right"><strong>Revenue</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueByMonth.map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{row.month}</TableCell>
                        <TableCell align="right">{row.invoices}</TableCell>
                        <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Arrangements by Type
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Funeral Type</strong></TableCell>
                      <TableCell align="right"><strong>Count</strong></TableCell>
                      <TableCell align="right"><strong>%</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {arrangementsByType.map((row) => {
                      const total = arrangementsByType.reduce((sum, r) => sum + r.count, 0);
                      const percentage = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0';
                      return (
                        <TableRow key={row.funeralType}>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {row.funeralType.replace('_', ' ')}
                          </TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Government Submissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Submissions
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" color="warning.main">
                    {stats.pendingGovernmentForms}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Requires Attention
                  </Typography>
                  <Typography variant="body1">
                    Review pending BDM registrations and coroner reports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

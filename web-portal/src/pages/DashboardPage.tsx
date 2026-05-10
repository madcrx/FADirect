import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { dashboardApi, arrangementsApi, authApi } from '@/services/api';
import type { DashboardStats, Arrangement, User } from '@/types';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <CardContent sx={{ pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'text.secondary',
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 1.5,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.15,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5, color: 'text.primary' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArrangements, setRecentArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!currentUser?.role) return false;
    const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
    return roles.some(role => userRoles.includes(role));
  };

  const loadData = async () => {
    try {
      // Load recent arrangements
      const arrangements = await arrangementsApi.getAll();
      setRecentArrangements(arrangements.slice(0, 10));

      // Calculate stats from arrangements
      const now = new Date();
      const thisMonth = arrangements.filter(
        (a) => new Date(a.createdAt).getMonth() === now.getMonth()
      );

      setStats({
        totalArrangements: arrangements.length,
        activeArrangements: arrangements.filter((a) => a.status === 'active').length,
        completedThisMonth: thisMonth.filter((a) => a.status === 'completed').length,
        totalRevenue: 0, // TODO: Calculate from invoices
        pendingPayments: 0, // TODO: Calculate from invoices
        recentArrangements: arrangements.slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <Box p={3}><Typography>Loading...</Typography></Box>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Manager Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Arrangements"
            value={stats.totalArrangements}
            subtitle="All time"
            icon={<AssignmentIcon sx={{ color: 'primary.main', fontSize: 28 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Cases"
            value={stats.activeArrangements}
            subtitle="Currently in progress"
            icon={<TrendingUpIcon sx={{ color: 'success.main', fontSize: 28 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Completed This Month"
            value={stats.completedThisMonth}
            subtitle={format(new Date(), 'MMMM yyyy')}
            icon={<CheckCircleIcon sx={{ color: 'info.main', fontSize: 28 }} />}
            color="info"
          />
        </Grid>
        {hasRole(['admin', 'management']) && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Monthly Revenue"
              value="$0"
              subtitle="Coming soon"
              icon={<AttachMoneyIcon sx={{ color: 'secondary.main', fontSize: 28 }} />}
              color="secondary"
            />
          </Grid>
        )}
      </Grid>

      {/* Recent Arrangements Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
            Recent Arrangements
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 1.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Deceased Name</TableCell>
                  <TableCell>Arranger</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentArrangements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No recent arrangements
                    </TableCell>
                  </TableRow>
                ) : (
                  recentArrangements.map((arrangement) => (
                    <TableRow
                      key={arrangement.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{arrangement.deceasedName}</TableCell>
                      <TableCell>{arrangement.arrangerName || 'N/A'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {arrangement.funeralType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={arrangement.status}
                          color={getStatusColor(arrangement.status) as any}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            height: '24px',
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {format(new Date(arrangement.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

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
import { dashboardApi, arrangementsApi } from '@/services/api';
import type { DashboardStats, Arrangement } from '@/types';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArrangements, setRecentArrangements] = useState<Arrangement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Overview of your funeral arrangements and business metrics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Arrangements"
            value={stats.totalArrangements}
            icon={<AssignmentIcon sx={{ color: 'primary.main', fontSize: 32 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active"
            value={stats.activeArrangements}
            icon={<TrendingUpIcon sx={{ color: 'success.main', fontSize: 32 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed This Month"
            value={stats.completedThisMonth}
            icon={<CheckCircleIcon sx={{ color: 'info.main', fontSize: 32 }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue (Coming Soon)"
            value="$0"
            icon={<AttachMoneyIcon sx={{ color: 'secondary.main', fontSize: 32 }} />}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Recent Arrangements
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Deceased Name</strong></TableCell>
                  <TableCell><strong>Arranger</strong></TableCell>
                  <TableCell><strong>Funeral Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentArrangements.map((arrangement) => (
                  <TableRow key={arrangement.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>{arrangement.deceasedName}</TableCell>
                    <TableCell>{arrangement.arrangerName || 'N/A'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {arrangement.funeralType.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={arrangement.status}
                        color={getStatusColor(arrangement.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(arrangement.createdAt), 'dd/MM/yyyy')}
                    </TableCell>
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

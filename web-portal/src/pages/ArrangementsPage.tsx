import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { arrangementsApi } from '@/services/api';
import type { Arrangement } from '@/types';
import { format } from 'date-fns';

export default function ArrangementsPage() {
  const navigate = useNavigate();
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [filteredArrangements, setFilteredArrangements] = useState<Arrangement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);

  useEffect(() => {
    loadArrangements();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = arrangements.filter(
        (a) =>
          a.deceasedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.arrangerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.mournerPhone?.includes(searchQuery)
      );
      setFilteredArrangements(filtered);
    } else {
      setFilteredArrangements(arrangements);
    }
  }, [searchQuery, arrangements]);

  const loadArrangements = async () => {
    try {
      const data = await arrangementsApi.getAll();
      setArrangements(data);
      setFilteredArrangements(data);
    } catch (error) {
      console.error('Failed to load arrangements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, arrangement: Arrangement) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedArrangement(arrangement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedArrangement(null);
  };

  const handleEdit = () => {
    if (selectedArrangement) {
      navigate(`/arrangements/${selectedArrangement.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedArrangement && window.confirm('Are you sure you want to delete this arrangement?')) {
      try {
        await arrangementsApi.delete(selectedArrangement.id);
        loadArrangements();
      } catch (error) {
        console.error('Failed to delete arrangement:', error);
      }
    }
    handleMenuClose();
  };

  const handleRowClick = (arrangement: Arrangement) => {
    navigate(`/arrangements/${arrangement.id}`);
  };

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

  if (loading) {
    return <Box p={3}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Funeral Arrangements
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all funeral arrangements and services
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/arrangements/new')}
          size="large"
        >
          New Arrangement
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by deceased name, arranger, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Deceased Name</strong></TableCell>
                  <TableCell><strong>Arranger</strong></TableCell>
                  <TableCell><strong>Mourner Contact</strong></TableCell>
                  <TableCell><strong>Funeral Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Service Date</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredArrangements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" py={4}>
                        {searchQuery ? 'No arrangements found matching your search' : 'No arrangements yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArrangements.map((arrangement) => (
                    <TableRow
                      key={arrangement.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(arrangement)}
                    >
                      <TableCell>{arrangement.deceasedName}</TableCell>
                      <TableCell>{arrangement.arrangerName || 'N/A'}</TableCell>
                      <TableCell>{arrangement.mournerPhone || 'N/A'}</TableCell>
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
                        {arrangement.serviceDate
                          ? format(new Date(arrangement.serviceDate), 'dd/MM/yyyy')
                          : 'TBD'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(arrangement.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, arrangement)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

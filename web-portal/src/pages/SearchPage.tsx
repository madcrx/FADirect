import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  date: string;
}

interface SearchResults {
  arrangements: SearchResult[];
  invoices: SearchResult[];
  users: SearchResult[];
  governmentForms: SearchResult[];
  calendar: SearchResult[];
  priceLists: SearchResult[];
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setResults(null);
      setTotalResults(0);
      return;
    }

    setSearching(true);
    setError('');

    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data.results);
      setTotalResults(response.data.totalResults);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Search failed');
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'arrangement':
        navigate(`/arrangements/${result.id}`);
        break;
      case 'invoice':
        navigate(`/invoicing`); // Could navigate to specific invoice view
        break;
      case 'user':
        navigate(`/users`);
        break;
      case 'government':
        navigate(`/government-forms`);
        break;
      case 'calendar':
        navigate(`/calendar`);
        break;
      case 'price':
        navigate(`/price-lists`);
        break;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return '';
    }
  };

  const getTypeColor = (type: string): "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" => {
    switch (type) {
      case 'arrangement':
        return 'primary';
      case 'invoice':
        return 'success';
      case 'user':
        return 'info';
      case 'government':
        return 'warning';
      case 'calendar':
        return 'secondary';
      case 'price':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      arrangement: 'Arrangement',
      invoice: 'Invoice',
      user: 'User',
      government: 'Government Form',
      calendar: 'Event',
      price: 'Price Item',
    };
    return labels[type] || type;
  };

  const getCategoryResults = () => {
    if (!results) return [];

    switch (selectedTab) {
      case 0: // All
        return [
          ...results.arrangements,
          ...results.invoices,
          ...results.users,
          ...results.governmentForms,
          ...results.calendar,
          ...results.priceLists,
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 1:
        return results.arrangements;
      case 2:
        return results.invoices;
      case 3:
        return results.calendar;
      case 4:
        return results.governmentForms;
      case 5:
        return results.users;
      case 6:
        return results.priceLists;
      default:
        return [];
    }
  };

  const categoryResults = getCategoryResults();

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Search
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Search across arrangements, invoices, users, events, and more
      </Typography>

      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by name, phone, invoice number, etc..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searching ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
            autoFocus
          />
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {results && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)} variant="scrollable">
              <Tab label={`All (${totalResults})`} />
              <Tab label={`Arrangements (${results.arrangements.length})`} />
              <Tab label={`Invoices (${results.invoices.length})`} />
              <Tab label={`Events (${results.calendar.length})`} />
              <Tab label={`Government (${results.governmentForms.length})`} />
              <Tab label={`Users (${results.users.length})`} />
              <Tab label={`Prices (${results.priceLists.length})`} />
            </Tabs>
          </Box>

          <Card>
            <CardContent>
              {categoryResults.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No results found for "{searchQuery}"
                  </Typography>
                </Box>
              ) : (
                <List>
                  {categoryResults.map((result, index) => (
                    <ListItem key={`${result.type}-${result.id}-${index}`} disablePadding>
                      <ListItemButton onClick={() => handleResultClick(result)}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {result.title}
                              </Typography>
                              <Chip
                                label={getTypeLabel(result.type)}
                                size="small"
                                color={getTypeColor(result.type)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography variant="body2" component="span" color="text.secondary">
                                {result.subtitle}
                              </Typography>
                              {result.date && (
                                <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 2 }}>
                                  {formatDate(result.date)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!results && !searching && searchQuery.length >= 2 && (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Press Enter to search
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

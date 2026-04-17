import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  DeleteForever as DeleteIcon,
  DeleteSweep as EmptyIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

interface DeletedItem {
  id: string;
  type: string;
  name: string;
  details: string;
  deletedAt: string;
}

interface DeletedItems {
  arrangements: DeletedItem[];
  invoices: DeletedItem[];
  priceListItems: DeletedItem[];
  governmentForms: DeletedItem[];
  calendarEvents: DeletedItem[];
  documents: DeletedItem[];
  photos: DeletedItem[];
}

export default function TrashPage() {
  const [items, setItems] = useState<DeletedItems | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean; action: string; item?: DeletedItem}>({
    open: false,
    action: '',
  });

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/trash');
      setItems(response.data.items);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load deleted items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    try {
      await api.post(`/trash/restore/${item.type}/${item.id}`);
      setSuccess(`Restored ${item.name} successfully`);
      await loadDeletedItems();
      setConfirmDialog({ open: false, action: '' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to restore item');
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    try {
      await api.delete(`/trash/permanent/${item.type}/${item.id}`);
      setSuccess(`Permanently deleted ${item.name}`);
      await loadDeletedItems();
      setConfirmDialog({ open: false, action: '' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete item');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const response = await api.delete('/trash/empty');
      setSuccess(response.data.message);
      await loadDeletedItems();
      setConfirmDialog({ open: false, action: '' });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to empty trash');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: {[key: string]: string} = {
      'arrangement': 'Arrangement',
      'invoice': 'Invoice',
      'price-list': 'Price Item',
      'government-form': 'Government Form',
      'calendar-event': 'Event',
      'document': 'Document',
      'photo': 'Photo',
    };
    return labels[type] || type;
  };

  const getCategoryItems = () => {
    if (!items) return [];

    switch (selectedTab) {
      case 0: // All
        return [
          ...items.arrangements,
          ...items.invoices,
          ...items.priceListItems,
          ...items.governmentForms,
          ...items.calendarEvents,
          ...items.documents,
          ...items.photos,
        ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
      case 1:
        return items.arrangements;
      case 2:
        return items.invoices;
      case 3:
        return items.priceListItems;
      case 4:
        return items.governmentForms;
      case 5:
        return items.calendarEvents;
      case 6:
        return items.documents;
      case 7:
        return items.photos;
      default:
        return [];
    }
  };

  const categoryItems = getCategoryItems();
  const totalCount = items ?
    items.arrangements.length +
    items.invoices.length +
    items.priceListItems.length +
    items.governmentForms.length +
    items.calendarEvents.length +
    items.documents.length +
    items.photos.length : 0;

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Trash
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Restore or permanently delete items
          </Typography>
        </Box>
        {totalCount > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<EmptyIcon />}
            onClick={() => setConfirmDialog({ open: true, action: 'empty' })}
          >
            Empty Trash
          </Button>
        )}
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)} variant="scrollable">
          <Tab label={`All (${totalCount})`} />
          <Tab label={`Arrangements (${items?.arrangements.length || 0})`} />
          <Tab label={`Invoices (${items?.invoices.length || 0})`} />
          <Tab label={`Price Items (${items?.priceListItems.length || 0})`} />
          <Tab label={`Government Forms (${items?.governmentForms.length || 0})`} />
          <Tab label={`Events (${items?.calendarEvents.length || 0})`} />
          <Tab label={`Documents (${items?.documents.length || 0})`} />
          <Tab label={`Photos (${items?.photos.length || 0})`} />
        </Tabs>
      </Box>

      <Card>
        <CardContent>
          {categoryItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EmptyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Trash is empty
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deleted items will appear here and can be restored
              </Typography>
            </Box>
          ) : (
            <List>
              {categoryItems.map((item) => (
                <ListItem
                  key={`${item.type}-${item.id}`}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => setConfirmDialog({ open: true, action: 'restore', item })}
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <RestoreIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => setConfirmDialog({ open: true, action: 'delete', item })}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {item.name}
                        </Typography>
                        <Chip
                          label={getTypeLabel(item.type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span" color="text.secondary">
                          {item.details}
                        </Typography>
                        <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 2 }}>
                          • Deleted {format(new Date(item.deletedAt), 'dd MMM yyyy HH:mm')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: '' })}
      >
        <DialogTitle>
          {confirmDialog.action === 'restore' && 'Restore Item'}
          {confirmDialog.action === 'delete' && 'Permanently Delete Item'}
          {confirmDialog.action === 'empty' && 'Empty Trash'}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.action === 'restore' && (
            <Typography>
              Are you sure you want to restore "{confirmDialog.item?.name}"?
            </Typography>
          )}
          {confirmDialog.action === 'delete' && (
            <Typography>
              Are you sure you want to permanently delete "{confirmDialog.item?.name}"?
              This action cannot be undone.
            </Typography>
          )}
          {confirmDialog.action === 'empty' && (
            <Typography>
              Are you sure you want to permanently delete all {totalCount} items from trash?
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '' })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.action === 'restore' && confirmDialog.item) {
                handleRestore(confirmDialog.item);
              } else if (confirmDialog.action === 'delete' && confirmDialog.item) {
                handlePermanentDelete(confirmDialog.item);
              } else if (confirmDialog.action === 'empty') {
                handleEmptyTrash();
              }
            }}
            variant="contained"
            color={confirmDialog.action === 'restore' ? 'primary' : 'error'}
          >
            {confirmDialog.action === 'restore' && 'Restore'}
            {confirmDialog.action === 'delete' && 'Delete Permanently'}
            {confirmDialog.action === 'empty' && 'Empty Trash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Alert,
  Snackbar,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableHead,
  TableContainer,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  Description as DescriptionIcon,
  Photo as PhotoIcon,
  VideoLibrary as VideoIcon,
  Timeline as TimelineIcon,
  PlaylistAddCheck as ChecklistIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Assignment as FormIcon,
  RequestQuote as QuoteIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { arrangementsApi, messagesApi, documentsApi, photosApi, videosApi, preArrangementFormsApi } from '@/services/api';
import type { Arrangement, Message, Document, Photo } from '@/types';
import { format } from 'date-fns';
import WorkflowTracker from '@/components/WorkflowTracker';
import DocumentChecklist from '@/components/DocumentChecklist';
import api from '@/services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ArrangementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [newMessage, setNewMessage] = useState('');
  const [preArrangementForm, setPreArrangementForm] = useState<any>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [quoteDialog, setQuoteDialog] = useState(false);
  const [quoteLineItems, setQuoteLineItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [arrData, msgData, docData, photoData, videoData, quotesData, historyData] = await Promise.all([
        arrangementsApi.getById(id),
        messagesApi.getByArrangement(id).catch(() => []),
        documentsApi.getByArrangement(id).catch(() => []),
        photosApi.getByArrangement(id).catch(() => []),
        videosApi.getByArrangement(id).catch(() => []),
        api.get(`/quotes/arrangement/${id}`).then(res => res.data.quotes).catch(() => []),
        api.get(`/audit/related/arrangement/${id}`).then(res => res.data.history).catch(() => []),
      ]);

      setArrangement(arrData);
      setMessages(msgData);
      setDocuments(docData);
      setPhotos(photoData);
      setVideos(videoData);
      setQuotes(quotesData);
      setHistory(historyData);

      // Load pre-arrangement form if exists
      try {
        const formData = await preArrangementFormsApi.getByArrangement(id);
        setPreArrangementForm(formData);
      } catch (error) {
        // Form doesn't exist yet, which is fine
        setPreArrangementForm(null);
      }
    } catch (error) {
      console.error('Failed to load arrangement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflowStep = async (stepId: string, completed: boolean, notes?: string) => {
    if (!id) return;
    try {
      await api.put(`/arrangements/${id}/workflow/${stepId}`, {
        status: completed ? 'completed' : 'pending',
        notes,
      });
      await loadData();
    } catch (error) {
      console.error('Failed to update workflow step:', error);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('arrangementId', id);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to upload document',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('arrangementId', id);

      await api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSnackbar({ open: true, message: 'Photo uploaded successfully', severity: 'success' });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to upload photo',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('arrangementId', id);

      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSnackbar({ open: true, message: 'Video uploaded successfully', severity: 'success' });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to upload video',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || !arrangement) return;

    try {
      // Get mourner user ID from arrangement
      const recipientId = arrangement.userId; // Assuming the mourner is the user who created/owns the arrangement

      await messagesApi.sendMessage({
        recipientId: recipientId,
        arrangementId: id,
        encryptedContent: newMessage, // In production, this should be encrypted
        messageType: 'text',
      });

      setNewMessage('');
      setSnackbar({ open: true, message: 'Message sent successfully', severity: 'success' });
      await loadData(); // Reload messages
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to send message',
        severity: 'error'
      });
    }
  };

  const handleSendPreArrangementForm = async () => {
    if (!id) return;
    setLoadingForm(true);

    try {
      await preArrangementFormsApi.send(id);
      setSnackbar({
        open: true,
        message: 'Pre-Arrangement Form sent to mourner successfully',
        severity: 'success'
      });
      await loadData(); // Reload to get the new form
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to send Pre-Arrangement Form',
        severity: 'error'
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!id) return;
    setLoadingQuotes(true);

    try {
      await api.post('/quotes', {
        arrangementId: id,
        notes: quoteNotes,
        lineItems: quoteLineItems.filter(item => item.description.trim()),
      });

      setSnackbar({
        open: true,
        message: 'Quote created successfully',
        severity: 'success'
      });
      setQuoteDialog(false);
      setQuoteLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setQuoteNotes('');
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to create quote',
        severity: 'error'
      });
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    setLoadingQuotes(true);
    try {
      await api.post(`/quotes/${quoteId}/accept`);
      setSnackbar({
        open: true,
        message: 'Quote accepted. Job will be created automatically.',
        severity: 'success'
      });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to accept quote',
        severity: 'error'
      });
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    setLoadingQuotes(true);
    try {
      await api.post(`/quotes/${quoteId}/send`);
      setSnackbar({
        open: true,
        message: 'Quote sent to customer',
        severity: 'success'
      });
      await loadData();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || 'Failed to send quote',
        severity: 'error'
      });
    } finally {
      setLoadingQuotes(false);
    }
  };

  const addQuoteLineItem = () => {
    setQuoteLineItems([...quoteLineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateQuoteLineItem = (index: number, field: string, value: any) => {
    const updated = [...quoteLineItems];
    updated[index] = { ...updated[index], [field]: value };
    setQuoteLineItems(updated);
  };

  const removeQuoteLineItem = (index: number) => {
    setQuoteLineItems(quoteLineItems.filter((_, i) => i !== index));
  };

  const getQuoteTotalAmount = () => {
    return quoteLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  if (loading || !arrangement) {
    return (
      <Box p={3}>
        <Typography>Loading...</Typography>
      </Box>
    );
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/arrangements')}
        sx={{ mb: 2 }}
      >
        Back to Arrangements
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {arrangement.deceasedName}
          </Typography>
          <Chip
            label={arrangement.status}
            color={getStatusColor(arrangement.status) as any}
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!preArrangementForm && (
            <Button
              variant="outlined"
              startIcon={<FormIcon />}
              onClick={handleSendPreArrangementForm}
              disabled={loadingForm}
            >
              Send Pre-Arrangement Form
            </Button>
          )}
          {preArrangementForm && (
            <>
              <Button
                variant={preArrangementForm.status === 'completed' ? 'outlined' : 'contained'}
                startIcon={<FormIcon />}
                onClick={() => navigate(`/arrangements/${id}/pre-arrangement-form`)}
              >
                {preArrangementForm.status === 'completed' ? 'View Form' : 'Fill Out Form'}
              </Button>
              <Chip
                label={preArrangementForm.status}
                color={preArrangementForm.status === 'completed' ? 'success' : 'warning'}
                sx={{ textTransform: 'capitalize', alignSelf: 'center' }}
              />
            </>
          )}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/arrangements/${id}/edit`)}
          >
            Edit Arrangement
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Arrangement Details
              </Typography>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" width="40%"><strong>Deceased Name</strong></TableCell>
                    <TableCell>{arrangement.deceasedName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Funeral Type</strong></TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {arrangement.funeralType.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Status</strong></TableCell>
                    <TableCell>
                      <Chip
                        label={arrangement.status}
                        color={getStatusColor(arrangement.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Service Date</strong></TableCell>
                    <TableCell>
                      {arrangement.serviceDate
                        ? format(new Date(arrangement.serviceDate), 'dd MMMM yyyy')
                        : 'To be determined'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Service Location</strong></TableCell>
                    <TableCell>{arrangement.serviceLocation || 'Not specified'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Arranger</strong></TableCell>
                    <TableCell>{arrangement.arrangerName || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Created</strong></TableCell>
                    <TableCell>{format(new Date(arrangement.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th"><strong>Last Updated</strong></TableCell>
                    <TableCell>{format(new Date(arrangement.updatedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {arrangement.notes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {arrangement.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {preArrangementForm && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormIcon color="primary" />
                      <Typography variant="body2">Pre-Arrangement Form</Typography>
                    </Box>
                    <Chip
                      label={preArrangementForm.status}
                      size="small"
                      color={preArrangementForm.status === 'completed' ? 'success' : 'warning'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MessageIcon color="primary" />
                    <Typography variant="body2">Messages</Typography>
                  </Box>
                  <Chip label={messages.length} size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="body2">Documents</Typography>
                  </Box>
                  <Chip label={documents.length} size="small" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhotoIcon color="primary" />
                    <Typography variant="body2">Photos</Typography>
                  </Box>
                  <Chip label={photos.length} size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable">
            <Tab icon={<TimelineIcon />} iconPosition="start" label="Workflow" />
            <Tab icon={<ChecklistIcon />} iconPosition="start" label="Checklist" />
            <Tab icon={<QuoteIcon />} iconPosition="start" label={`Quotes (${quotes.length})`} />
            <Tab icon={<MessageIcon />} iconPosition="start" label={`Messages (${messages.length})`} />
            <Tab icon={<DescriptionIcon />} iconPosition="start" label={`Documents (${documents.length})`} />
            <Tab icon={<PhotoIcon />} iconPosition="start" label={`Photos (${photos.length})`} />
            <Tab icon={<VideoIcon />} iconPosition="start" label={`Videos (${videos.length})`} />
            <Tab icon={<HistoryIcon />} iconPosition="start" label={`History (${history.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <WorkflowTracker
            arrangementId={id!}
            steps={arrangement.workflowSteps || []}
            onUpdateStep={handleUpdateWorkflowStep}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DocumentChecklist arrangementId={id!} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Quotes Tab */}
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setQuoteDialog(true)}
              disabled={loadingQuotes}
            >
              Create Quote
            </Button>
          </Box>

          {quotes.length === 0 ? (
            <Typography color="text.secondary">No quotes created yet.</Typography>
          ) : (
            <List>
              {quotes.map((quote, index) => (
                <div key={quote.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box>
                          <Typography variant="h6">{quote.quoteNumber}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created {format(new Date(quote.createdAt), 'dd/MM/yyyy')} by {quote.createdByName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={quote.status.toUpperCase()}
                            color={quote.status === 'accepted' ? 'success' : quote.status === 'rejected' ? 'error' : 'default'}
                          />
                          <Typography variant="h6">${parseFloat(quote.totalAmount).toFixed(2)}</Typography>
                        </Box>
                      </Box>

                      {quote.lineItems && quote.lineItems.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {quote.lineItems.map((item: any) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.description}</TableCell>
                                  <TableCell align="right">{item.quantity}</TableCell>
                                  <TableCell align="right">${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                                  <TableCell align="right">${parseFloat(item.totalPrice).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {quote.notes && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Notes:</strong> {quote.notes}
                        </Typography>
                      )}

                      {quote.status === 'draft' && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleSendQuote(quote.id)}
                            disabled={loadingQuotes}
                          >
                            Send to Customer
                          </Button>
                        </Box>
                      )}

                      {quote.status === 'sent' && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAcceptQuote(quote.id)}
                            disabled={loadingQuotes}
                          >
                            Accept Quote
                          </Button>
                        </Box>
                      )}

                      {quote.status === 'accepted' && quote.acceptedAt && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          Quote accepted on {format(new Date(quote.acceptedAt), 'dd/MM/yyyy')} by {quote.acceptedByName}.
                          Job has been automatically created.
                        </Alert>
                      )}
                    </Box>
                  </ListItem>
                </div>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
            {/* Messages List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
              {messages.length === 0 ? (
                <Typography color="text.secondary">No messages yet. Start a conversation with the mourner.</Typography>
              ) : (
                <List>
                  {messages.map((message, index) => (
                    <div key={message.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            bgcolor: message.senderId === arrangement.userId ? 'grey.100' : 'primary.light',
                            maxWidth: '70%',
                            alignSelf: message.senderId === arrangement.userId ? 'flex-start' : 'flex-end',
                          }}
                        >
                          <Typography variant="body1" sx={{ mb: 0.5 }}>
                            {message.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.senderName} • {format(new Date(message.timestamp), 'dd/MM/yyyy HH:mm')}
                          </Typography>
                        </Paper>
                      </ListItem>
                    </div>
                  ))}
                </List>
              )}
            </Box>

            {/* Message Input */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Type a message to the mourner..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Upload Document
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
              />
            </Button>
          </Box>
          {documents.length === 0 ? (
            <Typography color="text.secondary">No documents uploaded</Typography>
          ) : (
            <List>
              {documents.map((doc, index) => (
                <div key={doc.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <IconButton edge="end" href={doc.fileUrl} target="_blank">
                        <DownloadIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={doc.fileName}
                      secondary={`Uploaded ${format(new Date(doc.createdAt), 'dd/MM/yyyy')} by ${doc.uploaderName}`}
                    />
                  </ListItem>
                </div>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Upload Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </Button>
          </Box>
          {photos.length === 0 ? (
            <Typography color="text.secondary">No photos uploaded</Typography>
          ) : (
            <Grid container spacing={2}>
              {photos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} key={photo.id}>
                  <Card>
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.caption || 'Photo'}
                      style={{ width: '100%', height: 200, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => window.open(photo.fileUrl, '_blank')}
                    />
                    {photo.caption && (
                      <CardContent>
                        <Typography variant="caption">{photo.caption}</Typography>
                      </CardContent>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={uploading}
            >
              Upload Video
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={handleVideoUpload}
              />
            </Button>
          </Box>
          {videos.length === 0 ? (
            <Typography color="text.secondary">No videos uploaded</Typography>
          ) : (
            <Grid container spacing={2}>
              {videos.map((video) => (
                <Grid item xs={12} sm={6} md={4} key={video.id}>
                  <Card>
                    <video
                      controls
                      style={{ width: '100%', height: 200 }}
                    >
                      <source src={video.fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {video.caption && (
                      <CardContent>
                        <Typography variant="caption">{video.caption}</Typography>
                      </CardContent>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={7}>
          {/* History Tab */}
          {history.length === 0 ? (
            <Typography color="text.secondary">No history available.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date/Time</strong></TableCell>
                    <TableCell><strong>Entity</strong></TableCell>
                    <TableCell><strong>Action</strong></TableCell>
                    <TableCell><strong>Details</strong></TableCell>
                    <TableCell><strong>Performed By</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.entityType.toUpperCase()}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.action.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={
                            entry.action === 'created' ? 'success' :
                            entry.action === 'deleted' ? 'error' :
                            entry.action === 'accepted' ? 'success' :
                            entry.action === 'rejected' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {entry.notes ? (
                          <Typography variant="body2">{entry.notes}</Typography>
                        ) : entry.fieldName ? (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {entry.fieldName}:
                            </Typography>
                            <Typography variant="body2">
                              {entry.oldValue && <span><del>{entry.oldValue}</del> → </span>}
                              <strong>{entry.newValue}</strong>
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.userName || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Quote Creation Dialog */}
      <Dialog open={quoteDialog} onClose={() => setQuoteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Quote</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Line Items</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell width={100}>Quantity</TableCell>
                    <TableCell width={120}>Unit Price</TableCell>
                    <TableCell width={120}>Total</TableCell>
                    <TableCell width={60}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quoteLineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={item.description}
                          onChange={(e) => updateQuoteLineItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => updateQuoteLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.unitPrice}
                          onChange={(e) => updateQuoteLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{ startAdornment: '$' }}
                        />
                      </TableCell>
                      <TableCell>
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeQuoteLineItem(index)}
                          disabled={quoteLineItems.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={addQuoteLineItem}
                      >
                        Add Line Item
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="h6">Total Amount:</Typography>
                    </TableCell>
                    <TableCell colSpan={2}>
                      <Typography variant="h6">${getQuoteTotalAmount().toFixed(2)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (optional)"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              sx={{ mt: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuoteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateQuote}
            variant="contained"
            disabled={loadingQuotes || quoteLineItems.every(item => !item.description.trim())}
          >
            Create Quote
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert
          onClose={() => setSnackbar({...snackbar, open: false})}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

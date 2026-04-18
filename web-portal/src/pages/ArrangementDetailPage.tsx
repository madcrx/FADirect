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
} from '@mui/icons-material';
import { arrangementsApi, messagesApi, documentsApi, photosApi, videosApi } from '@/services/api';
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

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [arrData, msgData, docData, photoData, videoData] = await Promise.all([
        arrangementsApi.getById(id),
        messagesApi.getByArrangement(id).catch(() => []),
        documentsApi.getByArrangement(id).catch(() => []),
        photosApi.getByArrangement(id).catch(() => []),
        videosApi.getByArrangement(id).catch(() => []),
      ]);

      setArrangement(arrData);
      setMessages(msgData);
      setDocuments(docData);
      setPhotos(photoData);
      setVideos(videoData);
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
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/arrangements/${id}/edit`)}
        >
          Edit Arrangement
        </Button>
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
            <Tab icon={<MessageIcon />} iconPosition="start" label={`Messages (${messages.length})`} />
            <Tab icon={<DescriptionIcon />} iconPosition="start" label={`Documents (${documents.length})`} />
            <Tab icon={<PhotoIcon />} iconPosition="start" label={`Photos (${photos.length})`} />
            <Tab icon={<VideoIcon />} iconPosition="start" label={`Videos (${videos.length})`} />
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
          {messages.length === 0 ? (
            <Typography color="text.secondary">No messages yet</Typography>
          ) : (
            <List>
              {messages.map((message, index) => (
                <div key={message.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemText
                      primary={message.content}
                      secondary={`${message.senderName} • ${format(new Date(message.timestamp), 'dd/MM/yyyy HH:mm')}`}
                    />
                  </ListItem>
                </div>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
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

        <TabPanel value={tabValue} index={4}>
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

        <TabPanel value={tabValue} index={5}>
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
      </Card>

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

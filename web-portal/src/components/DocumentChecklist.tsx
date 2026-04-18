import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import api from '@/services/api';

interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
  collected: boolean;
  notes?: string;
}

interface DocumentChecklistProps {
  arrangementId: string;
}

const defaultDocuments = [
  { name: 'Medical Certificate of Cause of Death', required: true },
  { name: 'Proof of Identity (Deceased)', required: true },
  { name: 'Marriage Certificate (if applicable)', required: false },
  { name: 'Birth Certificate (Deceased)', required: false },
  { name: 'Will or Testament', required: false },
  { name: 'Insurance Policies', required: false },
  { name: 'Superannuation Details', required: false },
  { name: 'Veterans Affairs Card (if applicable)', required: false },
  { name: 'Passport (Deceased)', required: false },
  { name: 'Medicare Card', required: false },
  { name: 'Driver License', required: false },
  { name: 'Power of Attorney Documents', required: false },
  { name: 'Pre-paid Funeral Plan', required: false },
  { name: 'Service Preferences Document', required: false },
];

export default function DocumentChecklist({ arrangementId }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocRequired, setNewDocRequired] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    loadUploadedDocuments();
  }, [arrangementId]);

  const loadUploadedDocuments = async () => {
    try {
      const response = await api.get(`/documents/arrangement/${arrangementId}`);
      setUploadedDocs(response.data.documents || []);
    } catch (error) {
      console.error('Failed to load uploaded documents:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      // For now, use localStorage to persist checklist
      const saved = localStorage.getItem(`checklist_${arrangementId}`);
      if (saved) {
        setDocuments(JSON.parse(saved));
      } else {
        // Initialize with default documents
        const initial = defaultDocuments.map((doc, index) => ({
          id: `default_${index}`,
          name: doc.name,
          required: doc.required,
          collected: false,
        }));
        setDocuments(initial);
      }
    } catch (error) {
      console.error('Failed to load document checklist:', error);
    }
  };

  const saveDocuments = (docs: DocumentItem[]) => {
    localStorage.setItem(`checklist_${arrangementId}`, JSON.stringify(docs));
    setDocuments(docs);
  };

  const isDocumentUploaded = (docName: string) => {
    return uploadedDocs.some(uploaded =>
      uploaded.documentType?.toLowerCase() === docName.toLowerCase() ||
      uploaded.fileName?.toLowerCase().includes(docName.toLowerCase().substring(0, 10))
    );
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(docName);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('arrangementId', arrangementId);
      formData.append('documentType', docName);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reload uploaded documents to update checkboxes
      await loadUploadedDocuments();
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      alert(error.response?.data?.error?.message || 'Failed to upload document');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;

    const newDoc: DocumentItem = {
      id: `custom_${Date.now()}`,
      name: newDocName,
      required: newDocRequired,
      collected: false,
    };

    saveDocuments([...documents, newDoc]);
    setDialogOpen(false);
    setNewDocName('');
    setNewDocRequired(false);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(doc => doc.id !== id);
    saveDocuments(updated);
  };

  const requiredDocs = documents.filter(d => d.required);
  const collectedRequired = requiredDocs.filter(d => isDocumentUploaded(d.name)).length;
  const totalCollected = documents.filter(d => isDocumentUploaded(d.name)).length;
  const progressPercentage = requiredDocs.length > 0
    ? (collectedRequired / requiredDocs.length) * 100
    : 0;

  const allRequiredCollected = requiredDocs.length > 0 && collectedRequired === requiredDocs.length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Document Checklist
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Add Document
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Required Documents
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {collectedRequired} / {requiredDocs.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 1,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: allRequiredCollected ? 'success.main' : 'primary.main',
              },
            }}
          />
        </Box>

        {allRequiredCollected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <CheckIcon color="success" />
            <Typography variant="body2" color="success.dark" fontWeight="medium">
              All required documents collected
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="body2" color="warning.dark">
              {requiredDocs.length - collectedRequired} required document(s) pending
            </Typography>
          </Box>
        )}

        <List dense>
          {documents.map((doc) => {
            const isUploaded = isDocumentUploaded(doc.name);
            return (
              <ListItem
                key={doc.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component="label"
                      size="small"
                      variant={isUploaded ? 'outlined' : 'contained'}
                      startIcon={<UploadIcon />}
                      disabled={uploading === doc.name}
                    >
                      {isUploaded ? 'Re-upload' : 'Upload'}
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleDocumentUpload(e, doc.name)}
                      />
                    </Button>
                    {doc.id.startsWith('custom_') && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={isUploaded}
                    disabled={true}
                    color={isUploaded ? 'success' : 'default'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: isUploaded ? 'line-through' : 'none',
                          color: isUploaded ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {doc.name}
                      </Typography>
                      {doc.required && !isUploaded && (
                        <Chip label="Required" size="small" color="error" sx={{ height: 20 }} />
                      )}
                    </Box>
                  }
                  secondary={doc.notes}
                />
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Total: {totalCollected} of {documents.length} documents collected
          </Typography>
        </Box>
      </CardContent>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custom Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Document Name"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="e.g., Property Deed, Bank Statements"
              autoFocus
            />
            <Box>
              <Checkbox
                checked={newDocRequired}
                onChange={(e) => setNewDocRequired(e.target.checked)}
              />
              <Typography variant="body2" component="span">
                Mark as required document
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDocument} variant="contained" disabled={!newDocName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

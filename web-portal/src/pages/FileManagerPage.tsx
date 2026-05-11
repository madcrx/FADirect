import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  Folder as FolderIcon,
  Send as SendIcon,
  Description as FormIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api, { formTemplatesApi } from '@/services/api';
import { format } from 'date-fns';
import FormTemplateEditor, { FormTemplateData } from '@/components/FormTemplateEditor';

interface FileItem {
  id: string;
  type: 'document' | 'photo';
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  arrangementId: string | null;
  deceasedName: string | null;
  uploadedBy: string | null;
  uploadedAt: string;
  url: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  formType: string;
  version: number;
  isActive: boolean;
  createdByName: string | null;
  updatedByName: string | null;
  deletedByName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export default function FileManagerPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<FileItem[]>([]);
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'document' | 'photo'>('document');
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    file?: FileItem;
  }>({ open: false });
  const [sendDialog, setSendDialog] = useState<{
    open: boolean;
    file?: FileItem;
  }>({ open: false });
  const [sendNotes, setSendNotes] = useState('');
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    template?: FormTemplate;
  }>({ open: false, mode: 'create' });

  useEffect(() => {
    loadFiles();
  }, [showDeleted]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [docsRes, photosRes, templatesRes] = await Promise.all([
        api.get('/documents'),
        api.get('/photos'),
        formTemplatesApi.getAll(showDeleted).catch(() => ({ templates: [] })),
      ]);

      const docsData = docsRes.data.documents?.map((doc: any) => ({
        id: doc.id,
        type: 'document' as const,
        fileName: doc.fileName,
        originalName: doc.originalName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        arrangementId: doc.arrangementId,
        deceasedName: doc.deceasedName,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt,
        url: doc.url,
      })) || [];

      const photosData = photosRes.data.photos?.map((photo: any) => ({
        id: photo.id,
        type: 'photo' as const,
        fileName: photo.fileName,
        originalName: photo.originalName,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        arrangementId: photo.arrangementId,
        deceasedName: photo.deceasedName,
        uploadedBy: photo.uploadedBy,
        uploadedAt: photo.uploadedAt,
        url: photo.url,
      })) || [];

      const templatesData = templatesRes.templates?.map((tmpl: any) => ({
        id: tmpl.id,
        name: tmpl.name,
        description: tmpl.description,
        formType: tmpl.formType,
        version: tmpl.version,
        isActive: tmpl.isActive,
        createdByName: tmpl.createdByName,
        updatedByName: tmpl.updatedByName,
        deletedByName: tmpl.deletedByName,
        createdAt: tmpl.createdAt,
        updatedAt: tmpl.updatedAt,
        deletedAt: tmpl.deletedAt,
      })) || [];

      setDocuments(docsData);
      setPhotos(photosData);
      setFormTemplates(templatesData);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const endpoint = uploadType === 'document' ? '/documents/upload' : '/photos/upload';
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('File uploaded successfully');
      setUploadDialog(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload file');
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await api.get(file.url, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Failed to download file');
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.originalName}?`)) return;

    try {
      const endpoint = file.type === 'document' ? `/documents/${file.id}` : `/photos/${file.id}`;
      await api.delete(endpoint);
      setSuccess('File deleted successfully');
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete file');
    }
  };

  const handleOpenSendDialog = (file: FileItem) => {
    if (!file.arrangementId) {
      setError('Cannot send file without an associated arrangement');
      return;
    }
    setSendDialog({ open: true, file });
    setSendNotes('');
  };

  const handleSendToMourner = async () => {
    if (!sendDialog.file) return;

    try {
      // Get arrangement details to find mourner user ID
      const arrangementRes = await api.get(`/arrangements/${sendDialog.file.arrangementId}`);
      const arrangement = arrangementRes.data.arrangement;

      if (!arrangement.mournerId) {
        setError('No mourner associated with this arrangement');
        return;
      }

      await api.post('/file-sends', {
        fileId: sendDialog.file.id,
        fileType: sendDialog.file.type,
        arrangementId: sendDialog.file.arrangementId,
        sentToUserId: arrangement.mournerId,
        notes: sendNotes,
      });

      setSuccess(`${sendDialog.file.type === 'document' ? 'Document' : 'Photo'} sent to mourner successfully`);
      setSendDialog({ open: false });
      setSendNotes('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    }
    return <FileIcon color="action" />;
  };

  const filterFiles = (files: FileItem[]) => {
    if (!searchTerm) return files;
    const search = searchTerm.toLowerCase();
    return files.filter(
      (file) =>
        file.originalName.toLowerCase().includes(search) ||
        file.deceasedName?.toLowerCase().includes(search)
    );
  };

  const filterTemplates = (templates: FormTemplate[]) => {
    if (!searchTerm) return templates;
    const search = searchTerm.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(search) ||
        template.description?.toLowerCase().includes(search) ||
        template.formType.toLowerCase().includes(search)
    );
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form template? This will create a new version.')) return;

    try {
      await formTemplatesApi.delete(id);
      setSuccess('Form template deleted successfully');
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete template');
    }
  };

  const handleRestoreTemplate = async (id: string) => {
    try {
      await formTemplatesApi.restore(id);
      setSuccess('Form template restored successfully');
      await loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to restore template');
    }
  };

  const handleSaveTemplate = async (templateData: FormTemplateData) => {
    try {
      if (templateDialog.mode === 'create') {
        await formTemplatesApi.create(templateData);
        setSuccess('Form template created successfully');
      } else if (templateDialog.template) {
        await formTemplatesApi.update(templateDialog.template.id, templateData);
        setSuccess('Form template updated successfully (new version created)');
      }
      setTemplateDialog({ open: false, mode: 'create' });
      await loadFiles();
    } catch (err: any) {
      throw err; // Let the dialog handle the error display
    }
  };

  const handleEditTemplate = (template: FormTemplate) => {
    // Convert template to FormTemplateData format
    const templateData: FormTemplateData = {
      name: template.name,
      description: template.description || '',
      formType: template.formType,
      templateData: { sections: [] }, // Will be loaded from backend
    };

    // Load full template data
    formTemplatesApi.getById(template.id).then((res) => {
      const fullData: FormTemplateData = {
        name: res.template.name,
        description: res.template.description || '',
        formType: res.template.formType,
        templateData: res.template.templateData,
      };
      setTemplateDialog({ open: true, mode: 'edit', template: { ...template, ...fullData } as any });
    }).catch((err) => {
      setError(err.response?.data?.error?.message || 'Failed to load template');
    });
  };

  const currentFiles = selectedTab === 0 ? documents : selectedTab === 1 ? photos : [];
  const filteredFiles = filterFiles(currentFiles);
  const filteredTemplates = filterTemplates(formTemplates);

  // Group files by arrangement
  const filesByArrangement = filteredFiles.reduce((acc, file) => {
    const key = file.arrangementId || 'unassigned';
    if (!acc[key]) {
      acc[key] = {
        arrangementId: file.arrangementId,
        deceasedName: file.deceasedName || 'Unassigned',
        files: [],
      };
    }
    acc[key].files.push(file);
    return acc;
  }, {} as Record<string, { arrangementId: string | null; deceasedName: string; files: FileItem[] }>);

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
            Files {selectedTab === 2 && '& Form Templates'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedTab === 2
              ? 'Manage form templates used throughout the system'
              : 'Manage all documents and photos'}
          </Typography>
        </Box>
        {selectedTab === 2 ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTemplateDialog({ open: true, mode: 'create' })}
          >
            Create Template
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialog(true)}
          >
            Upload File
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

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)}>
          <Tab label={`Documents (${documents.length})`} />
          <Tab label={`Photos (${photos.length})`} />
          <Tab label={`Form Templates (${formTemplates.length})`} />
        </Tabs>
      </Box>

      {selectedTab === 2 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
          </Button>
        </Box>
      )}

      {selectedTab === 2 ? (
        // Form Templates Tab
        filteredTemplates.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FormIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No form templates found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Form templates are the blank versions used throughout the system
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="40px"></TableCell>
                      <TableCell>Template Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell>Updated By</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow
                        key={template.id}
                        hover
                        sx={{
                          opacity: template.deletedAt ? 0.5 : 1,
                          bgcolor: template.deletedAt ? 'action.hover' : 'inherit',
                        }}
                      >
                        <TableCell>
                          <FormIcon color={template.isActive ? 'primary' : 'disabled'} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {template.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {template.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={template.formType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`v${template.version}`}
                            size="small"
                            color={template.isActive ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {template.deletedAt ? (
                            <Chip label="Deleted" size="small" color="error" />
                          ) : template.isActive ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip label="Inactive" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(template.updatedAt), 'dd MMM yyyy HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {template.updatedByName || template.createdByName || '-'}
                          </Typography>
                          {template.deletedAt && template.deletedByName && (
                            <Typography variant="caption" color="error">
                              Deleted by: {template.deletedByName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {template.deletedAt ? (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRestoreTemplate(template.id)}
                              title="Restore"
                            >
                              <ViewIcon />
                            </IconButton>
                          ) : (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditTemplate(template)}
                                title="Edit (Creates New Version)"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTemplate(template.id)}
                                title="Delete"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No files found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload files to get started
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        Object.values(filesByArrangement).map((group) => (
          <Card key={group.arrangementId || 'unassigned'} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="medium">
                  {group.deceasedName}
                </Typography>
                <Chip
                  label={`${group.files.length} file${group.files.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="40px"></TableCell>
                      <TableCell>File Name</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Uploaded</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.files.map((file) => (
                      <TableRow key={file.id} hover>
                        <TableCell>{getFileIcon(file.mimeType)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {file.originalName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatFileSize(file.fileSize)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={file.mimeType.split('/')[1]} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(file.uploadedAt), 'dd MMM yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {file.uploadedBy || 'Unknown'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {file.mimeType.startsWith('image/') && (
                            <IconButton
                              size="small"
                              onClick={() => setPreviewDialog({ open: true, file })}
                              title="Preview"
                            >
                              <ViewIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(file)}
                            title="Download"
                          >
                            <DownloadIcon />
                          </IconButton>
                          {file.arrangementId && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenSendDialog(file)}
                              title="Send to Mourner"
                            >
                              <SendIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(file)}
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Tabs value={uploadType} onChange={(_, val) => setUploadType(val)}>
                <Tab label="Document" value="document" />
                <Tab label="Photo" value="photo" />
              </Tabs>
            </Grid>
            <Grid item xs={12}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept={uploadType === 'photo' ? 'image/*' : '*'}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </Typography>
                {selectedFile && (
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!selectedFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewDialog.file?.originalName}</DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={previewDialog.file.url}
                alt={previewDialog.file.originalName}
                style={{ maxWidth: '100%', maxHeight: '70vh' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false })}>Close</Button>
          {previewDialog.file && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (previewDialog.file) {
                  handleDownload(previewDialog.file);
                }
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Send to Mourner Dialog */}
      <Dialog
        open={sendDialog.open}
        onClose={() => setSendDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send to Mourner</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {sendDialog.file && (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>File:</strong> {sendDialog.file.originalName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Arrangement:</strong> {sendDialog.file.deceasedName || 'Unknown'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                  The mourner will receive a notification that this file has been sent to them.
                  They can view it in the FA Direct app or via email.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (optional)"
                  value={sendNotes}
                  onChange={(e) => setSendNotes(e.target.value)}
                  placeholder="Add any notes or instructions for the mourner..."
                  sx={{ mt: 2 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialog({ open: false })}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendToMourner}
          >
            Send to Mourner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Form Template Editor Dialog */}
      <FormTemplateEditor
        open={templateDialog.open}
        onClose={() => setTemplateDialog({ open: false, mode: 'create' })}
        onSave={handleSaveTemplate}
        initialData={templateDialog.template as any}
        mode={templateDialog.mode}
      />
    </Box>
  );
}

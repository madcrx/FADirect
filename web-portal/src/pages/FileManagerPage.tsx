import { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import api from '@/services/api';
import { format } from 'date-fns';

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

export default function FileManagerPage() {
  const [documents, setDocuments] = useState<FileItem[]>([]);
  const [photos, setPhotos] = useState<FileItem[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'document' | 'photo'>('document');
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    file?: FileItem;
  }>({ open: false });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [docsRes, photosRes] = await Promise.all([
        api.get('/documents'),
        api.get('/photos'),
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

      setDocuments(docsData);
      setPhotos(photosData);
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

  const currentFiles = selectedTab === 0 ? documents : photos;
  const filteredFiles = filterFiles(currentFiles);

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
            File Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all documents and photos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialog(true)}
        >
          Upload File
        </Button>
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
        </Tabs>
      </Box>

      {filteredFiles.length === 0 ? (
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
                            >
                              <ViewIcon />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => handleDownload(file)}>
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(file)}
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
    </Box>
  );
}

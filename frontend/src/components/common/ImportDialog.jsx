import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import { handleApiError, handleSuccess } from '../../utils/errorHandler';

/**
 * Reusable CSV bulk-import dialog.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - title: string (e.g. "Import Customers")
 *  - importFn: (file) => Promise  (API import call)
 *  - templateFn: () => Promise<blob response>  (API template download, optional)
 *  - templateName: string (downloaded file name, e.g. "customers-template.csv")
 *  - onImported: () => void  (called after a successful import to refresh the list)
 */
export default function ImportDialog({
  open,
  onClose,
  title = 'Import from CSV',
  importFn,
  templateFn,
  templateName = 'template.csv',
  onImported,
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setUploading(false);
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    if (!templateFn) return;
    try {
      setDownloading(true);
      const response = await templateFn();
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      handleApiError(err, 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setResult(null);
      const response = await importFn(file);
      const data = response.data || {};
      const summary = {
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        errors: Array.isArray(data.errors) ? data.errors : [],
      };
      setResult(summary);
      handleSuccess(`Imported ${summary.created} record(s)`);
      if (onImported) onImported();
    } catch (err) {
      handleApiError(err, 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file to bulk-import records. Not sure about the format?
          {templateFn ? ' Download the template to get started.' : ''}
        </Typography>

        {templateFn && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={handleDownloadTemplate}
            disabled={downloading}
            sx={{ mb: 3 }}
          >
            {downloading ? 'Preparing...' : 'Download Template'}
          </Button>
        )}

        <Box
          sx={{
            border: '1px dashed',
            borderColor: file ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {file ? file.name : 'Choose a .csv file to upload'}
          </Typography>
          <Button component="label" variant="contained" size="small" className="gradient-button-primary">
            {file ? 'Change File' : 'Select File'}
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult(null);
                e.target.value = '';
              }}
            />
          </Button>
        </Box>

        {result && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: result.errors.length ? 2 : 0 }}>
              <Alert severity="success" icon={<CheckCircleOutline />} sx={{ flex: 1, minWidth: 140 }}>
                <strong>{result.created}</strong> created
              </Alert>
              <Alert severity="info" sx={{ flex: 1, minWidth: 140 }}>
                <strong>{result.skipped}</strong> skipped
              </Alert>
            </Box>
            {result.errors.length > 0 && (
              <Alert severity="warning" icon={<ErrorOutline />}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                  {result.errors.length} row(s) had errors
                </Typography>
                <Divider sx={{ my: 1 }} />
                <List dense disablePadding sx={{ maxHeight: 160, overflowY: 'auto' }}>
                  {result.errors.slice(0, 25).map((e, i) => (
                    <ListItem key={i} disableGutters>
                      <ListItemText
                        primary={`Row ${e.row ?? '?'}: ${e.message || 'Invalid data'}`}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="gradient-button-primary"
        >
          {uploading ? 'Importing...' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

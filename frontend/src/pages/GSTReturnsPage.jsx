import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  Description,
  FileDownload,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { gstrAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function GSTReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [generationType, setGenerationType] = useState('GSTR1');
  const [generating, setGenerating] = useState(false);
  const [returnData, setReturnData] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gstrAPI.getAll();
      setReturns(response.data.returns || []);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load GST returns');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReturn = async () => {
    try {
      setGenerating(true);
      const response = await gstrAPI.generate({
        returnType: generationType,
        month: selectedPeriod.month,
        year: selectedPeriod.year,
      });
      setReturnData(response.data);
      handleSuccess(`${generationType} generated successfully`);
      fetchReturns();
      setOpenGenerateDialog(false);
    } catch (err) {
      handleApiError(err, `Failed to generate ${generationType}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadJSON = async (returnId) => {
    try {
      const response = await gstrAPI.download(returnId);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.data.returnType}-${response.data.period}.json`;
      a.click();
      handleSuccess('Return downloaded successfully');
    } catch (err) {
      handleApiError(err, 'Failed to download return');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'filed':
        return 'success';
      case 'generated':
        return 'info';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getReturnTypeColor = (type) => {
    switch (type) {
      case 'GSTR1':
        return 'primary';
      case 'GSTR3B':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            GST Returns
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and manage GSTR-1 and GSTR-3B returns
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Description />}
          onClick={() => setOpenGenerateDialog(true)}
          className="gradient-button-primary"
        >
          Generate Return
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'primary.100', p: 1.5, borderRadius: 2 }}>
                  <Description color="primary" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Returns
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {returns.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'success.100', p: 1.5, borderRadius: 2 }}>
                  <CheckCircle color="success" />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Filed Returns
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {returns.filter(r => r.status === 'filed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'warning.100', p: 1.5, borderRadius: 2 }}>
                  <Description sx={{ color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Returns
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {returns.filter(r => r.status === 'generated').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ bgcolor: 'error.100', p: 1.5, borderRadius: 2 }}>
                  <AccountBalance sx={{ color: 'error.main' }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    Not Filed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Returns Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : returns.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Return Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Generated Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tax Liability</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returns.map((returnItem) => (
                    <TableRow key={returnItem.id} hover>
                      <TableCell>
                        <Chip
                          label={returnItem.returnType}
                          size="small"
                          color={getReturnTypeColor(returnItem.returnType)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {returnItem.period}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(returnItem.generatedDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={returnItem.status}
                          size="small"
                          color={getStatusColor(returnItem.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(returnItem.totalTaxLiability || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<FileDownload />}
                          onClick={() => handleDownloadJSON(returnItem.id)}
                        >
                          Download JSON
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box className="empty-state">
              <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No GST returns generated yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate your first GST return to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Description />}
                onClick={() => setOpenGenerateDialog(true)}
                className="gradient-button-primary"
              >
                Generate Return
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Generate Return Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate GST Return</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Return Type"
                value={generationType}
                onChange={(e) => setGenerationType(e.target.value)}
              >
                <MenuItem value="GSTR1">GSTR-1 (Outward Supplies)</MenuItem>
                <MenuItem value="GSTR3B">GSTR-3B (Summary Return)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Month"
                value={selectedPeriod.month}
                onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: e.target.value })}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Year"
                value={selectedPeriod.year}
                onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: e.target.value })}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                {generationType === 'GSTR1'
                  ? 'GSTR-1 contains details of all outward supplies (sales) made during the month.'
                  : 'GSTR-3B is a summary return with details of sales, purchases, and tax liability.'}
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateReturn}
            disabled={generating}
            className="gradient-button-primary"
          >
            {generating ? 'Generating...' : 'Generate Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

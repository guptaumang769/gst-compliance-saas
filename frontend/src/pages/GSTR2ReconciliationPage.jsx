import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Refresh,
  Search,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  HelpOutline,
  ExpandMore,
  CloudUpload,
  CompareArrows,
  Delete,
  Visibility,
  Edit,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { gstr2ReconciliationAPI } from '../services/api';

const STATUS_COLORS = {
  matched: 'success',
  mismatched: 'warning',
  unmatched: 'error',
  pending: 'default',
};

const STATUS_ICONS = {
  matched: <CheckCircle fontSize="small" />,
  mismatched: <Warning fontSize="small" />,
  unmatched: <ErrorIcon fontSize="small" />,
  pending: <HelpOutline fontSize="small" />,
};

const ACTION_OPTIONS = [
  { value: 'accept_gstr2a', label: 'Accept GSTR-2A/2B Value' },
  { value: 'accept_books', label: 'Accept Books Value' },
  { value: 'pending_clarification', label: 'Pending Clarification' },
  { value: 'follow_up_supplier', label: 'Follow Up with Supplier' },
];

const getCurrentPeriod = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Previous month for GST filing
  return `${year}-${String(month).padStart(2, '0')}`;
};

const generatePeriodOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    options.push({ value: period, label });
  }
  return options;
};

export default function GSTR2ReconciliationPage() {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [unmatchedPurchases, setUnmatchedPurchases] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 0, limit: 25, total: 0 });
  const [tabValue, setTabValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionData, setActionData] = useState({ actionTaken: '', actionNotes: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const periodOptions = generatePeriodOptions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes] = await Promise.all([
        gstr2ReconciliationAPI.getEntries({
          filingPeriod: selectedPeriod,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          page: pagination.page + 1,
          limit: pagination.limit,
        }),
        gstr2ReconciliationAPI.getSummary(selectedPeriod),
      ]);

      setEntries(entriesRes.data.entries || []);
      setPagination(prev => ({ ...prev, total: entriesRes.data.pagination?.total || 0 }));
      setSummary(summaryRes.data.summary);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch reconciliation data');
      }
      setEntries([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, statusFilter, searchQuery, pagination.page, pagination.limit]);

  const fetchUnmatchedPurchases = useCallback(async () => {
    try {
      const response = await gstr2ReconciliationAPI.getUnmatchedPurchases(selectedPeriod);
      setUnmatchedPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('Error fetching unmatched purchases:', error);
      setUnmatchedPurchases([]);
    }
  }, [selectedPeriod]);

  const fetchPeriods = useCallback(async () => {
    try {
      const response = await gstr2ReconciliationAPI.getPeriods();
      setPeriods(response.data.periods || []);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchPeriods();
  }, [fetchData, fetchPeriods]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchUnmatchedPurchases();
    }
  }, [tabValue, fetchUnmatchedPurchases]);

  const handleRunReconciliation = async () => {
    setLoading(true);
    try {
      const response = await gstr2ReconciliationAPI.runReconciliation(selectedPeriod);
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to run reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (entry) => {
    setSelectedEntry(entry);
    setDetailDialogOpen(true);
  };

  const handleOpenActionDialog = (entry) => {
    setSelectedEntry(entry);
    setActionData({
      actionTaken: entry.actionTaken || '',
      actionNotes: entry.actionNotes || '',
    });
    setActionDialogOpen(true);
  };

  const handleSaveAction = async () => {
    if (!actionData.actionTaken) {
      toast.error('Please select an action');
      return;
    }
    try {
      await gstr2ReconciliationAPI.updateAction(selectedEntry.id, actionData);
      toast.success('Action saved successfully');
      setActionDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save action');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await gstr2ReconciliationAPI.deleteEntry(id);
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete entry');
    }
  };

  const handleOpenEditDialog = (entry) => {
    setSelectedEntry(entry);
    setEditFormData({
      supplierGstin: entry.supplierGstin,
      supplierName: entry.supplierName || '',
      supplierInvoiceNumber: entry.supplierInvoiceNumber,
      supplierInvoiceDate: entry.supplierInvoiceDate ? entry.supplierInvoiceDate.split('T')[0] : '',
      taxableAmount: parseFloat(entry.taxableAmount) || '',
      cgstAmount: parseFloat(entry.cgstAmount) || '',
      sgstAmount: parseFloat(entry.sgstAmount) || '',
      igstAmount: parseFloat(entry.igstAmount) || '',
      cessAmount: parseFloat(entry.cessAmount) || '',
      itcAvailability: entry.itcAvailability || 'available',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.taxableAmount) {
      toast.error('Taxable amount is required');
      return;
    }
    try {
      await gstr2ReconciliationAPI.updateEntry(selectedEntry.id, editFormData);
      toast.success('Entry updated. Run reconciliation to re-match.');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update entry');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Matched</Typography>
              <Typography variant="h4" color="success.main">{summary.matched}</Typography>
              <Typography variant="body2" color="textSecondary">Entries reconciled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Mismatched</Typography>
              <Typography variant="h4" color="warning.main">{summary.mismatched}</Typography>
              <Typography variant="body2" color="textSecondary">Amount differences</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Unmatched</Typography>
              <Typography variant="h4" color="error.main">{summary.unmatched}</Typography>
              <Typography variant="body2" color="textSecondary">Not in books</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending</Typography>
              <Typography variant="h4" color="primary">{summary.pending}</Typography>
              <Typography variant="body2" color="textSecondary">To be processed</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Value Comparison
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">GSTR-2A/2B Total Taxable Value</Typography>
                  <Typography variant="h6">{formatCurrency(summary.totalGstr2TaxableValue)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Books Total Taxable Value</Typography>
                  <Typography variant="h6">{formatCurrency(summary.totalBooksTaxableValue)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Difference</Typography>
                  <Typography 
                    variant="h6" 
                    color={summary.taxableValueDifference > 0 ? 'error.main' : summary.taxableValueDifference < 0 ? 'warning.main' : 'success.main'}
                  >
                    {formatCurrency(summary.taxableValueDifference)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">GSTR-2A/2B ITC Available</Typography>
                  <Typography variant="h6" color="success.main">{formatCurrency(summary.totalGstr2ItcAvailable)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Books ITC Eligible</Typography>
                  <Typography variant="h6">{formatCurrency(summary.totalBooksItc)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Tax Difference</Typography>
                  <Typography 
                    variant="h6"
                    color={summary.taxDifference !== 0 ? 'warning.main' : 'success.main'}
                  >
                    {formatCurrency(summary.taxDifference)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderEntriesTable = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell>Status</TableCell>
            <TableCell>Supplier GSTIN</TableCell>
            <TableCell>Supplier Name</TableCell>
            <TableCell>Invoice No.</TableCell>
            <TableCell>Invoice Date</TableCell>
            <TableCell align="right">Taxable Value</TableCell>
            <TableCell align="right">Tax Amount</TableCell>
            <TableCell>ITC</TableCell>
            <TableCell>Action</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  No GSTR-2A/2B entries found for this period. Import data or add entries manually.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id} hover>
                <TableCell>
                  <Chip
                    icon={STATUS_ICONS[entry.reconciliationStatus]}
                    label={entry.reconciliationStatus}
                    color={STATUS_COLORS[entry.reconciliationStatus]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {entry.supplierGstin}
                  </Typography>
                </TableCell>
                <TableCell>{entry.supplierName || '-'}</TableCell>
                <TableCell>{entry.supplierInvoiceNumber}</TableCell>
                <TableCell>
                  {new Date(entry.supplierInvoiceDate).toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell align="right">{formatCurrency(entry.taxableAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.totalTaxAmount)}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.itcAvailability === 'available' ? 'Yes' : 'No'}
                    color={entry.itcAvailability === 'available' ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {entry.actionTaken ? (
                    <Chip label={entry.actionTaken.replace(/_/g, ' ')} size="small" />
                  ) : (
                    <Typography variant="body2" color="textSecondary">-</Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleViewDetail(entry)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Entry">
                    <IconButton size="small" color="primary" onClick={() => handleOpenEditDialog(entry)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDeleteEntry(entry.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page}
        onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
        rowsPerPage={pagination.limit}
        onRowsPerPageChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value, 10), page: 0 }))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
    </TableContainer>
  );

  const renderUnmatchedPurchases = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Purchases in Books but NOT in GSTR-2A/2B
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        These purchases exist in your books but the supplier has not reported them in their GSTR-1. 
        Follow up with suppliers to ensure they file their returns.
      </Typography>

      {unmatchedPurchases.length === 0 ? (
        <Alert severity="success">
          All purchases for this period are matched with GSTR-2A/2B data.
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fff3e0' }}>
                <TableCell>Supplier</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell align="right">Taxable Value</TableCell>
                <TableCell align="right">Tax Amount</TableCell>
                <TableCell align="right">ITC Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unmatchedPurchases.map((purchase) => (
                <TableRow key={purchase.id} hover>
                  <TableCell>{purchase.supplier?.supplierName || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {purchase.supplier?.gstin || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{purchase.supplierInvoiceNumber}</TableCell>
                  <TableCell>
                    {new Date(purchase.supplierInvoiceDate).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(purchase.taxableAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(purchase.totalTaxAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(purchase.itcAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );

  const renderImportDialog = () => (
    <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Import GSTR-2A/2B Data</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          You can import GSTR-2A/2B data manually or by uploading JSON from the GST Portal.
        </Alert>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Manual Entry</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ImportManualForm 
              filingPeriod={selectedPeriod} 
              onSuccess={() => { setImportDialogOpen(false); fetchData(); }}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>Bulk JSON Upload</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Upload JSON file downloaded from GST Portal (GSTR-2A or GSTR-2B format).
            </Typography>
            <BulkImportForm 
              filingPeriod={selectedPeriod}
              onSuccess={() => { setImportDialogOpen(false); fetchData(); }}
            />
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setImportDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailDialog = () => (
    <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Entry Details</DialogTitle>
      <DialogContent>
        {selectedEntry && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Chip
                icon={STATUS_ICONS[selectedEntry.reconciliationStatus]}
                label={selectedEntry.reconciliationStatus.toUpperCase()}
                color={STATUS_COLORS[selectedEntry.reconciliationStatus]}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Supplier GSTIN</Typography>
              <Typography fontFamily="monospace">{selectedEntry.supplierGstin}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Supplier Name</Typography>
              <Typography>{selectedEntry.supplierName || '-'}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Invoice Number</Typography>
              <Typography>{selectedEntry.supplierInvoiceNumber}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary">Invoice Date</Typography>
              <Typography>{new Date(selectedEntry.supplierInvoiceDate).toLocaleDateString('en-IN')}</Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>GSTR-2A/2B Values</Typography>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">Taxable Value</Typography>
              <Typography>{formatCurrency(selectedEntry.taxableAmount)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">CGST</Typography>
              <Typography>{formatCurrency(selectedEntry.cgstAmount)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">SGST</Typography>
              <Typography>{formatCurrency(selectedEntry.sgstAmount)}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" color="textSecondary">IGST</Typography>
              <Typography>{formatCurrency(selectedEntry.igstAmount)}</Typography>
            </Grid>

            {selectedEntry.matchedPurchase && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>Books Values</Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">Taxable Value</Typography>
                  <Typography>{formatCurrency(selectedEntry.matchedPurchase.taxableAmount)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">CGST</Typography>
                  <Typography>{formatCurrency(selectedEntry.matchedPurchase.cgstAmount)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">SGST</Typography>
                  <Typography>{formatCurrency(selectedEntry.matchedPurchase.sgstAmount)}</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">IGST</Typography>
                  <Typography>{formatCurrency(selectedEntry.matchedPurchase.igstAmount)}</Typography>
                </Grid>
              </>
            )}

            {selectedEntry.mismatchDetails && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} color="warning.main">Mismatch Details</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedEntry.mismatchDetails, null, 2)}
                    </pre>
                  </Alert>
                </Grid>
              </>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderActionDialog = () => (
    <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Take Action</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={actionData.actionTaken}
            onChange={(e) => setActionData(prev => ({ ...prev, actionTaken: e.target.value }))}
            label="Action"
          >
            {ACTION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={actionData.actionNotes}
          onChange={(e) => setActionData(prev => ({ ...prev, actionNotes: e.target.value }))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveAction}>Save Action</Button>
      </DialogActions>
    </Dialog>
  );

  const renderEditDialog = () => (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Edit GSTR-2A/2B Entry</DialogTitle>
      <DialogContent>
        {editFormData && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Supplier GSTIN"
                value={editFormData.supplierGstin}
                onChange={(e) => setEditFormData(prev => ({ ...prev, supplierGstin: e.target.value.toUpperCase() }))}
                inputProps={{ maxLength: 15 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Supplier Name"
                value={editFormData.supplierName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, supplierName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Invoice Number"
                value={editFormData.supplierInvoiceNumber}
                onChange={(e) => setEditFormData(prev => ({ ...prev, supplierInvoiceNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Invoice Date"
                value={editFormData.supplierInvoiceDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, supplierInvoiceDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 1 }}>
                Enter tax <strong>amounts in ₹</strong>, not rates. For 18% GST on ₹6,000: CGST=₹540, SGST=₹540 (intra-state) or IGST=₹1,080 (inter-state).
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                size="small"
                type="number"
                label="Taxable Amount (₹)"
                value={editFormData.taxableAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, taxableAmount: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="CGST (₹)"
                value={editFormData.cgstAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, cgstAmount: e.target.value }))}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="SGST (₹)"
                value={editFormData.sgstAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, sgstAmount: e.target.value }))}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="IGST (₹)"
                value={editFormData.igstAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, igstAmount: e.target.value }))}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Cess (₹)"
                value={editFormData.cessAmount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, cessAmount: e.target.value }))}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="ITC Availability"
                value={editFormData.itcAvailability}
                onChange={(e) => setEditFormData(prev => ({ ...prev, itcAvailability: e.target.value }))}
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="not_available">Not Available</MenuItem>
                <MenuItem value="ineligible">Ineligible</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveEdit}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>GSTR-2A/2B Reconciliation</Typography>
          <Typography variant="body2" color="textSecondary">
            Match supplier invoices from GSTR-2A/2B with your purchase records
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setImportDialogOpen(true)}
          >
            Import Data
          </Button>
          <Button
            variant="contained"
            startIcon={<CompareArrows />}
            onClick={handleRunReconciliation}
            disabled={loading}
          >
            Run Reconciliation
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filing Period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="matched">Matched</MenuItem>
              <MenuItem value="mismatched">Mismatched</MenuItem>
              <MenuItem value="unmatched">Unmatched</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search (GSTIN, Name, Invoice)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                endAdornment: <Search color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="GSTR-2A/2B Entries" />
          <Tab label={`Unmatched in Books (${unmatchedPurchases.length})`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderEntriesTable()}
      {tabValue === 1 && renderUnmatchedPurchases()}

      {/* Dialogs */}
      {renderImportDialog()}
      {renderDetailDialog()}
      {renderActionDialog()}
      {renderEditDialog()}
    </Box>
  );
}

// Manual Import Form Component
function ImportManualForm({ filingPeriod, onSuccess }) {
  const [formData, setFormData] = useState({
    filingPeriod,
    dataSource: 'manual',
    supplierGstin: '',
    supplierName: '',
    supplierInvoiceNumber: '',
    supplierInvoiceDate: '',
    taxableAmount: '',
    cgstAmount: '',
    sgstAmount: '',
    igstAmount: '',
    cessAmount: '',
    itcAvailability: 'available',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await gstr2ReconciliationAPI.importEntry(formData);
      toast.success('Entry imported successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            size="small"
            label="Supplier GSTIN"
            value={formData.supplierGstin}
            onChange={(e) => setFormData(prev => ({ ...prev, supplierGstin: e.target.value.toUpperCase() }))}
            inputProps={{ maxLength: 15 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Supplier Name"
            value={formData.supplierName}
            onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            size="small"
            label="Invoice Number"
            value={formData.supplierInvoiceNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, supplierInvoiceNumber: e.target.value }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            size="small"
            type="date"
            label="Invoice Date"
            value={formData.supplierInvoiceDate}
            onChange={(e) => setFormData(prev => ({ ...prev, supplierInvoiceDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ py: 0.5 }}>
            Enter tax <strong>amounts in ₹</strong>, not rates. Example: For 18% GST on ₹6,000 → CGST=₹540, SGST=₹540 (intra-state) or IGST=₹1,080 (inter-state).
          </Alert>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            required
            fullWidth
            size="small"
            type="number"
            label="Taxable Amount (₹)"
            value={formData.taxableAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, taxableAmount: e.target.value }))}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="CGST (₹)"
            value={formData.cgstAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, cgstAmount: e.target.value }))}
            placeholder="0"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="SGST (₹)"
            value={formData.sgstAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, sgstAmount: e.target.value }))}
            placeholder="0"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="IGST (₹)"
            value={formData.igstAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, igstAmount: e.target.value }))}
            placeholder="0"
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Cess (₹)"
            value={formData.cessAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, cessAmount: e.target.value }))}
            placeholder="0"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="ITC Availability"
            value={formData.itcAvailability}
            onChange={(e) => setFormData(prev => ({ ...prev, itcAvailability: e.target.value }))}
          >
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="not_available">Not Available</MenuItem>
            <MenuItem value="ineligible">Ineligible</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Import Entry'}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}

// Bulk Import Form Component
function BulkImportForm({ filingPeriod, onSuccess }) {
  const [dataSource, setDataSource] = useState('gstr2a');
  const [jsonData, setJsonData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!jsonData.trim()) {
      toast.error('Please enter or paste JSON data');
      return;
    }

    let entries;
    try {
      const parsed = JSON.parse(jsonData);
      entries = parsed.b2b || parsed.data?.b2b || parsed;
      if (!Array.isArray(entries)) {
        entries = [entries];
      }
    } catch (error) {
      toast.error('Invalid JSON format');
      return;
    }

    setLoading(true);
    try {
      const response = await gstr2ReconciliationAPI.importBulk({
        filingPeriod,
        dataSource,
        entries,
      });
      toast.success(response.data.message);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <TextField
        select
        fullWidth
        size="small"
        label="Data Source"
        value={dataSource}
        onChange={(e) => setDataSource(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="gstr2a">GSTR-2A</MenuItem>
        <MenuItem value="gstr2b">GSTR-2B</MenuItem>
      </TextField>
      <TextField
        fullWidth
        multiline
        rows={8}
        label="Paste JSON Data"
        value={jsonData}
        onChange={(e) => setJsonData(e.target.value)}
        placeholder='Paste GSTR-2A/2B JSON data here...'
        sx={{ mb: 2 }}
      />
      <Button variant="contained" onClick={handleSubmit} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Import Data'}
      </Button>
    </Box>
  );
}

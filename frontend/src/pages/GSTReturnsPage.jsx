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
  IconButton,
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
  Tabs,
  Tab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  AccountBalance,
  Description,
  FileDownload,
  Refresh,
  CheckCircle,
  Visibility,
  ExpandMore,
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

  // Detail view state
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

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
      handleSuccess(`${generationType} generated successfully`);
      fetchReturns();
      setOpenGenerateDialog(false);
    } catch (err) {
      handleApiError(err, `Failed to generate ${generationType}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewReturn = async (returnItem) => {
    try {
      setSelectedReturn(returnItem);
      setOpenDetailDialog(true);
      setDetailLoading(true);
      setDetailTab(0);

      const [year, month] = (returnItem.period || '').split('-');
      if (!year || !month) {
        handleApiError(null, 'Invalid period format');
        return;
      }

      const response = await gstrAPI.getByPeriod(returnItem.returnType, year, month);
      const data = response.data?.data?.returnData || response.data?.data || null;
      setDetailData(data);
    } catch (err) {
      handleApiError(err, 'Failed to load return details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadJSON = async (returnItem) => {
    try {
      const [year, month] = (returnItem.period || '').split('-');
      if (!year || !month) {
        handleApiError(null, 'Invalid period format for download');
        return;
      }
      const response = await gstrAPI.download(returnItem.returnType, year, month);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${returnItem.returnType}_${year}${month}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      handleSuccess('Return downloaded successfully');
    } catch (err) {
      handleApiError(err, 'Failed to download return');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'filed': return 'success';
      case 'generated': return 'info';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getReturnTypeColor = (type) => {
    switch (type) {
      case 'GSTR1': return 'primary';
      case 'GSTR3B': return 'secondary';
      default: return 'default';
    }
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // ========== Detail View Render Helpers ==========

  const renderSummary = (data) => {
    if (!data?.summary) return <Typography color="text.secondary">No summary data available</Typography>;
    const s = data.summary;
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Filing Summary</Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Total Invoices</Typography>
            <Typography variant="h5" fontWeight={700}>{s.totalInvoices || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">B2B Invoices</Typography>
            <Typography variant="h5" fontWeight={700}>{s.b2bInvoices || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">B2C Large</Typography>
            <Typography variant="h5" fontWeight={700}>{s.b2clInvoices || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">B2C Small</Typography>
            <Typography variant="h5" fontWeight={700}>{s.b2csInvoices || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

        <Grid item xs={6} md={4}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Taxable Value</Typography>
            <Typography variant="h6" fontWeight={700}>{formatCurrency(s.totalTaxableValue || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">CGST</Typography>
            <Typography variant="body1" fontWeight={700} color="primary">{formatCurrency(s.totalCGST || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">SGST</Typography>
            <Typography variant="body1" fontWeight={700} color="primary">{formatCurrency(s.totalSGST || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">IGST</Typography>
            <Typography variant="body1" fontWeight={700} color="secondary">{formatCurrency(s.totalIGST || 0)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={2}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Total Tax</Typography>
            <Typography variant="body1" fontWeight={700} color="error">{formatCurrency(s.totalTax || 0)}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
            <Typography variant="caption" color="text.secondary">Total Invoice Value</Typography>
            <Typography variant="h5" fontWeight={700} color="primary">{formatCurrency(s.totalInvoiceValue || 0)}</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderB2B = (data) => {
    const b2b = data?.b2b || [];
    if (b2b.length === 0) return <Typography color="text.secondary">No B2B invoices in this period</Typography>;

    return b2b.map((customer, idx) => (
      <Accordion key={idx} defaultExpanded={idx === 0}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
            <Typography fontWeight={700}>{customer.cname || 'Unknown'}</Typography>
            <Chip label={customer.ctin} size="small" variant="outlined" />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', mr: 2 }}>
              {customer.inv?.length || 0} invoice(s)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Place of Supply</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reverse Charge</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>GST Rate</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Taxable Value</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>CGST</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SGST</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>IGST</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(customer.inv || []).map((inv, invIdx) => (
                  (inv.itms || []).map((itm, itmIdx) => (
                    <TableRow key={`${invIdx}-${itmIdx}`}>
                      {itmIdx === 0 && (
                        <>
                          <TableCell rowSpan={inv.itms.length}>{inv.inum}</TableCell>
                          <TableCell rowSpan={inv.itms.length}>{inv.idt}</TableCell>
                          <TableCell rowSpan={inv.itms.length}>{formatCurrency(inv.val)}</TableCell>
                          <TableCell rowSpan={inv.itms.length}>{inv.pos}</TableCell>
                          <TableCell rowSpan={inv.itms.length}>{inv.rchrg}</TableCell>
                        </>
                      )}
                      <TableCell>{itm.itm_det?.rt}%</TableCell>
                      <TableCell>{formatCurrency(itm.itm_det?.txval || 0)}</TableCell>
                      <TableCell>{formatCurrency(itm.itm_det?.camt || 0)}</TableCell>
                      <TableCell>{formatCurrency(itm.itm_det?.samt || 0)}</TableCell>
                      <TableCell>{formatCurrency(itm.itm_det?.iamt || 0)}</TableCell>
                    </TableRow>
                  ))
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    ));
  };

  const renderB2CS = (data) => {
    const b2cs = data?.b2cs || [];
    if (b2cs.length === 0) return <Typography color="text.secondary">No B2C Small invoices in this period</Typography>;

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Place of Supply</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Supply Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>GST Rate</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Taxable Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CGST</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>SGST</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IGST</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cess</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {b2cs.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.pos}</TableCell>
                <TableCell><Chip label={row.sply_ty} size="small" color={row.sply_ty === 'INTRA' ? 'primary' : 'secondary'} /></TableCell>
                <TableCell>{row.rt}%</TableCell>
                <TableCell>{formatCurrency(row.txval || 0)}</TableCell>
                <TableCell>{formatCurrency(row.camt || 0)}</TableCell>
                <TableCell>{formatCurrency(row.samt || 0)}</TableCell>
                <TableCell>{formatCurrency(row.iamt || 0)}</TableCell>
                <TableCell>{formatCurrency(row.csamt || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderHSN = (data) => {
    const hsnData = data?.hsn?.data || [];
    if (hsnData.length === 0) return <Typography color="text.secondary">No HSN summary data</Typography>;

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>HSN/SAC</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>UQC</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Rate</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Taxable Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CGST</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>SGST</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>IGST</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hsnData.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.num}</TableCell>
                <TableCell><Typography variant="body2" fontFamily="monospace">{item.hsn_sc}</Typography></TableCell>
                <TableCell>{item.desc}</TableCell>
                <TableCell>{item.uqc}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{item.rt}%</TableCell>
                <TableCell>{formatCurrency(item.txval || 0)}</TableCell>
                <TableCell>{formatCurrency(item.camt || 0)}</TableCell>
                <TableCell>{formatCurrency(item.samt || 0)}</TableCell>
                <TableCell>{formatCurrency(item.iamt || 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // For GSTR-3B detail
  const renderGSTR3BSummary = (data) => {
    if (!data) return <Typography color="text.secondary">No GSTR-3B data available</Typography>;

    const sections = [
      { title: '3.1 - Tax on Outward & Reverse Charge Supplies', key: 'outwardSupplies' },
      { title: '3.2 - Inter-State Supplies', key: 'interStateSupplies' },
      { title: '4 - Eligible ITC', key: 'itcAvailed' },
      { title: '5 - Values of Exempt, Nil & Non-GST Supplies', key: 'exemptSupplies' },
      { title: '6.1 - Tax Payable', key: 'taxPayable' },
    ];

    return (
      <Box>
        {sections.map(({ title, key }) => {
          const sectionData = data[key] || data.summary?.[key];
          if (!sectionData) return null;
          return (
            <Accordion key={key} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={600}>{title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <pre style={{ margin: 0, fontSize: '0.85rem', overflow: 'auto', maxHeight: 300 }}>
                    {JSON.stringify(sectionData, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {/* Fallback: show raw JSON if no known sections found */}
        {sections.every(({ key }) => !data[key] && !data.summary?.[key]) && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Raw Return Data</Typography>
            <pre style={{ margin: 0, fontSize: '0.85rem', overflow: 'auto', maxHeight: 500 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Paper>
        )}
      </Box>
    );
  };

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
                  <Typography variant="body2" color="text.secondary">Total Returns</Typography>
                  <Typography variant="h4" fontWeight={700}>{returns.length}</Typography>
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
                  <Typography variant="body2" color="text.secondary">Filed Returns</Typography>
                  <Typography variant="h4" fontWeight={700}>{returns.filter(r => r.status === 'filed').length}</Typography>
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
                  <Typography variant="body2" color="text.secondary">Pending Returns</Typography>
                  <Typography variant="h4" fontWeight={700}>{returns.filter(r => r.status === 'generated').length}</Typography>
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
                  <Typography variant="body2" color="text.secondary">This Month</Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {returns.some(r => {
                      const now = new Date();
                      return r.period === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    }) ? 'Generated' : 'Not Filed'}
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
                    <TableRow
                      key={returnItem.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewReturn(returnItem)}
                    >
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
                        <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleViewReturn(returnItem)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download JSON">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => handleDownloadJSON(returnItem)}
                            >
                              <FileDownload fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
                  <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>
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
                  <MenuItem key={year} value={year}>{year}</MenuItem>
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

      {/* Return Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={() => { setOpenDetailDialog(false); setDetailData(null); setSelectedReturn(null); }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {selectedReturn?.returnType} — {selectedReturn?.period}
            </Typography>
            <Chip
              label={selectedReturn?.status}
              size="small"
              color={getStatusColor(selectedReturn?.status)}
            />
            <Box sx={{ ml: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                Tax Liability: <strong>{formatCurrency(selectedReturn?.totalTaxLiability || 0)}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ py: 4 }}><LinearProgress /></Box>
          ) : !detailData ? (
            <Alert severity="warning">No data available for this return</Alert>
          ) : selectedReturn?.returnType === 'GSTR1' ? (
            <Box>
              <Tabs
                value={detailTab}
                onChange={(e, v) => setDetailTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Summary" />
                <Tab label={`B2B (${detailData.b2b?.length || 0})`} />
                <Tab label={`B2C Small (${detailData.b2cs?.length || 0})`} />
                <Tab label={`B2C Large (${detailData.b2cl?.length || 0})`} />
                <Tab label="HSN Summary" />
              </Tabs>

              {detailTab === 0 && renderSummary(detailData)}
              {detailTab === 1 && renderB2B(detailData)}
              {detailTab === 2 && renderB2CS(detailData)}
              {detailTab === 3 && (
                detailData.b2cl?.length > 0 ? (
                  <Typography color="text.secondary">
                    {detailData.b2cl.length} B2C Large invoice(s) found. These are inter-state invoices with value {'>'} ₹2.5 Lakh.
                  </Typography>
                ) : (
                  <Typography color="text.secondary">No B2C Large invoices in this period</Typography>
                )
              )}
              {detailTab === 4 && renderHSN(detailData)}
            </Box>
          ) : (
            /* GSTR-3B */
            renderGSTR3BSummary(detailData)
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<FileDownload />}
            onClick={() => selectedReturn && handleDownloadJSON(selectedReturn)}
          >
            Download JSON
          </Button>
          <Button onClick={() => { setOpenDetailDialog(false); setDetailData(null); setSelectedReturn(null); }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

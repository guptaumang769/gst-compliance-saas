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
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  PictureAsPdf,
  Email,
  Receipt,
  Close,
  AddCircleOutline,
  RemoveCircleOutline,
  InfoOutlined,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { invoiceAPI, customerAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { INVOICE_STATUS_COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';

// Line Item Schema
const lineItemSchema = Yup.object({
  description: Yup.string().required('Description is required'),
  hsnCode: Yup.string().required('HSN code is required'),
  quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
  unitPrice: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  gstRate: Yup.number().min(0).max(100).required('GST rate is required'),
  cessRate: Yup.number().min(0).max(100),
  discount: Yup.number().min(0).max(100),
});

// Invoice Schema
const invoiceSchema = Yup.object({
  customerId: Yup.string().required('Customer is required'),
  invoiceDate: Yup.date().required('Invoice date is required'),
  dueDate: Yup.date().min(Yup.ref('invoiceDate'), 'Due date must be after invoice date').nullable(),
  items: Yup.array().of(lineItemSchema).min(1, 'At least one item is required'),
});

// Compute invoice status from available fields
const getInvoiceStatus = (invoice) => {
  if (invoice.filedInGstr1) return 'Filed';
  if (invoice.emailSent) return 'Sent';
  if (invoice.pdfGenerated) return 'Generated';
  return 'Draft';
};

// Determine supply type from state codes
const getSupplyType = (invoice) => {
  if (invoice.sellerStateCode && invoice.buyerStateCode) {
    return invoice.sellerStateCode === invoice.buyerStateCode ? 'Intra-State' : 'Inter-State';
  }
  return 'N/A';
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null); // track which invoice PDF is loading

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
      };

      const response = await invoiceAPI.getAll(params);
      setInvoices(response.data.invoices || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load invoices');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll({ limit: 1000 });
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
      items: [
        {
          description: '',
          hsnCode: '',
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
          cessRate: 0,
          discount: 0,
        },
      ],
    },
    validationSchema: invoiceSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const invoiceData = {
          ...values,
          items: values.items.map(item => ({
            ...item,
            itemName: item.description,
            discount: parseFloat(item.discount) || 0,
            cessRate: parseFloat(item.cessRate) || 0,
          })),
        };

        if (editingInvoice) {
          await invoiceAPI.update(editingInvoice.id, invoiceData);
          handleSuccess('Invoice updated successfully');
        } else {
          await invoiceAPI.create(invoiceData);
          handleSuccess('Invoice created successfully');
        }

        handleCloseDialog();
        resetForm();
        fetchInvoices();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (invoice = null) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setSelectedCustomer(customers.find(c => c.id === invoice.customerId) || null);
      formik.setValues({
        customerId: invoice.customerId || '',
        invoiceDate: invoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate?.split('T')[0] || '',
        notes: invoice.notes || '',
        items: (invoice.items || []).map(item => ({
          description: item.itemName || item.description || '',
          hsnCode: item.hsnCode || '',
          quantity: item.quantity || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          gstRate: parseFloat(item.gstRate) || 18,
          cessRate: parseFloat(item.cessRate) || 0,
          discount: parseFloat(item.discountPercent) || parseFloat(item.discount) || 0,
        })),
      });
    } else {
      setEditingInvoice(null);
      setSelectedCustomer(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingInvoice(null);
    setSelectedCustomer(null);
    formik.resetForm();
  };

  const handleOpenDeleteDialog = (invoice) => {
    setDeletingInvoice(invoice);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingInvoice(null);
  };

  const handleDeleteInvoice = async () => {
    try {
      await invoiceAPI.delete(deletingInvoice.id);
      handleSuccess('Invoice deleted successfully');
      handleCloseDeleteDialog();
      fetchInvoices();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDownloadPDF = async (e, invoiceId) => {
    e.stopPropagation();
    try {
      setPdfLoading(invoiceId);
      const response = await invoiceAPI.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      handleSuccess('PDF downloaded successfully');
      // Refresh to update status (pdfGenerated flag)
      fetchInvoices();
    } catch (err) {
      handleApiError(err, 'Failed to download PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  const handleSendEmail = async (e, invoiceId) => {
    e.stopPropagation();
    try {
      await invoiceAPI.sendEmail(invoiceId);
      handleSuccess('Invoice sent via email successfully');
    } catch (err) {
      handleApiError(err, 'Failed to send email');
    }
  };

  const addLineItem = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      {
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        cessRate: 0,
        discount: 0,
      },
    ]);
  };

  const removeLineItem = (index) => {
    const items = [...formik.values.items];
    items.splice(index, 1);
    formik.setFieldValue('items', items);
  };

  const calculateItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const discountAmount = (subtotal * (item.discount || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = (taxableAmount * (item.gstRate || 0)) / 100;
    const cessAmount = (taxableAmount * (item.cessRate || 0)) / 100;
    return taxableAmount + gstAmount + cessAmount;
  };

  const calculateInvoiceSubtotal = () => {
    return formik.values.items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = (subtotal * (item.discount || 0)) / 100;
      return sum + subtotal - discountAmount;
    }, 0);
  };

  const calculateInvoiceGST = () => {
    return formik.values.items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = (subtotal * (item.discount || 0)) / 100;
      const taxableAmount = subtotal - discountAmount;
      return sum + (taxableAmount * (item.gstRate || 0)) / 100;
    }, 0);
  };

  const calculateInvoiceTotal = () => {
    return formik.values.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getStatusColor = (status) => {
    return INVOICE_STATUS_COLORS[status] || 'default';
  };

  // Get customer info for display in the form
  const getCustomerStateInfo = () => {
    if (!selectedCustomer) return null;
    const isSameState = selectedCustomer.stateCode && selectedCustomer.stateCode === customers[0]?.stateCode; // Approximation
    return {
      gstin: selectedCustomer.gstin,
      state: selectedCustomer.state,
      stateCode: selectedCustomer.stateCode,
      customerType: selectedCustomer.customerType,
    };
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Invoices
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your sales invoices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          className="gradient-button-primary"
        >
          Create Invoice
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by invoice number, customer name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="generated">Generated (PDF)</MenuItem>
                  <MenuItem value="sent">Sent (Email)</MenuItem>
                  <MenuItem value="filed">Filed in GSTR-1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Invoices Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : invoices.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>GSTIN</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Taxable Amt</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>GST</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => {
                      const supplyType = getSupplyType(invoice);
                      const gstLabel = supplyType === 'Intra-State' 
                        ? `CGST: ${formatCurrency(invoice.cgstAmount || 0)} + SGST: ${formatCurrency(invoice.sgstAmount || 0)}`
                        : `IGST: ${formatCurrency(invoice.igstAmount || 0)}`;
                      
                      return (
                        <TableRow key={invoice.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                              {invoice.invoiceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {invoice.customer?.customerName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.customer?.customerType?.toUpperCase()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                              {invoice.customer?.gstin || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(invoice.taxableAmount || invoice.subtotal || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={gstLabel} arrow>
                              <Box>
                                <Typography variant="body2" fontWeight={600} color="primary">
                                  {formatCurrency(invoice.totalTaxAmount || 0)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {supplyType === 'Intra-State' ? 'CGST+SGST' : supplyType === 'Inter-State' ? 'IGST' : ''}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(invoice.totalAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={supplyType}
                              size="small"
                              variant="outlined"
                              color={supplyType === 'Intra-State' ? 'info' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getInvoiceStatus(invoice)}
                              size="small"
                              color={getStatusColor(getInvoiceStatus(invoice))}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Download PDF">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDownloadPDF(e, invoice.id)}
                                  color="primary"
                                  disabled={pdfLoading === invoice.id}
                                >
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(invoice)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDeleteDialog(invoice)}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          ) : (
            <Box className="empty-state">
              <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No invoices yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first invoice to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                className="gradient-button-primary"
              >
                Create Invoice
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Customer & Dates */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  value={selectedCustomer}
                  onChange={(e, newValue) => {
                    setSelectedCustomer(newValue);
                    formik.setFieldValue('customerId', newValue?.id || '');
                  }}
                  options={customers}
                  getOptionLabel={(option) => {
                    const gstin = option.gstin ? ` (${option.gstin})` : '';
                    const type = option.customerType ? ` [${option.customerType.toUpperCase()}]` : '';
                    return `${option.customerName}${gstin}${type}`;
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.gstin || 'No GSTIN'} | {option.state} | {option.customerType?.toUpperCase()}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Customer *"
                      error={formik.touched.customerId && Boolean(formik.errors.customerId)}
                      helperText={formik.touched.customerId && formik.errors.customerId}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="invoiceDate"
                  name="invoiceDate"
                  label="Invoice Date *"
                  type="date"
                  value={formik.values.invoiceDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.invoiceDate && Boolean(formik.errors.invoiceDate)}
                  helperText={formik.touched.invoiceDate && formik.errors.invoiceDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="dueDate"
                  name="dueDate"
                  label="Due Date"
                  type="date"
                  value={formik.values.dueDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.dueDate && Boolean(formik.errors.dueDate)}
                  helperText={formik.touched.dueDate && formik.errors.dueDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Customer Info Banner */}
              {selectedCustomer && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<InfoOutlined />}>
                    <Typography variant="body2">
                      <strong>Customer:</strong> {selectedCustomer.customerName} |{' '}
                      <strong>GSTIN:</strong> {selectedCustomer.gstin || 'N/A (B2C)'} |{' '}
                      <strong>State:</strong> {selectedCustomer.state} |{' '}
                      <strong>Type:</strong> {selectedCustomer.customerType?.toUpperCase()} |{' '}
                      <strong>GST:</strong>{' '}
                      {selectedCustomer.stateCode
                        ? 'Auto-calculated based on state (CGST+SGST for same state, IGST for different state)'
                        : 'State code not available - will use your business state'}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {/* Line Items */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Line Items</Typography>
                  <Button
                    startIcon={<AddCircleOutline />}
                    onClick={addLineItem}
                    variant="outlined"
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>

                {formik.values.items.map((item, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Description *"
                          value={item.description}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.description`, e.target.value)
                          }
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          label="HSN Code *"
                          value={item.hsnCode}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.hsnCode`, e.target.value)
                          }
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="Qty *"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.quantity`, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ min: 1 }}
                        />
                      </Grid>

                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          label="Price *"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.unitPrice`, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ min: 0 }}
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="Disc%"
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.discount`, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="GST%"
                          type="number"
                          value={item.gstRate}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.gstRate`, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="Cess%"
                          type="number"
                          value={item.cessRate}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.cessRate`, parseFloat(e.target.value) || 0)
                          }
                          size="small"
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>

                      <Grid item xs={10} md={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {formatCurrency(calculateItemTotal(item))}
                        </Typography>
                      </Grid>

                      <Grid item xs={2} md={0.5}>
                        {formik.values.items.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeLineItem(index)}
                          >
                            <RemoveCircleOutline />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Grid>

              {/* Notes & Total */}
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <Card sx={{ bgcolor: '#f0f7ff', p: 2, border: '1px solid #bbd6f7' }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Invoice Summary
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Taxable Amount:</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatCurrency(calculateInvoiceSubtotal())}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">GST Amount:</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">{formatCurrency(calculateInvoiceGST())}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary" fontWeight={700}>
                      {formatCurrency(calculateInvoiceTotal())}
                    </Typography>
                  </Box>
                  {selectedCustomer && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      GST will be split as {selectedCustomer.stateCode ? 'CGST+SGST (Intra-State) or IGST (Inter-State)' : 'per state rules'} based on customer state.
                    </Typography>
                  )}
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              className="gradient-button-primary"
            >
              {formik.isSubmitting ? 'Saving...' : editingInvoice ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice <strong>{deletingInvoice?.invoiceNumber}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteInvoice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

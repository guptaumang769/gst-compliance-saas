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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Receipt,
  AddCircleOutline,
  RemoveCircleOutline,
  InfoOutlined,
  Visibility,
  NoteAdd,
  CreditCard,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { creditDebitNoteAPI, customerAPI, invoiceAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';

const COMMON_HSN_CODES = [
  { code: '0401', desc: 'Milk and cream', rate: '5%' },
  { code: '1001', desc: 'Wheat and meslin', rate: '5%' },
  { code: '1006', desc: 'Rice', rate: '5%' },
  { code: '1905', desc: 'Bread, pastry, cakes', rate: '18%' },
  { code: '2201', desc: 'Mineral water', rate: '18%' },
  { code: '3004', desc: 'Medicaments', rate: '12%' },
  { code: '3304', desc: 'Beauty/cosmetic preparations', rate: '28%' },
  { code: '3401', desc: 'Soap', rate: '18%' },
  { code: '8471', desc: 'Computers and peripherals', rate: '18%' },
  { code: '8517', desc: 'Telephone sets, smartphones', rate: '18%' },
  { code: '9401', desc: 'Seats and chairs', rate: '18%' },
  { code: '9403', desc: 'Furniture', rate: '18%' },
  { code: '997321', desc: 'Accounting/auditing services (SAC)', rate: '18%' },
  { code: '998311', desc: 'IT consulting services (SAC)', rate: '18%' },
  { code: '998312', desc: 'IT design & development (SAC)', rate: '18%' },
];

const REASON_OPTIONS = [
  { value: 'goods_return', label: 'Goods Return' },
  { value: 'price_reduction', label: 'Price Reduction / Discount' },
  { value: 'deficiency_in_service', label: 'Deficiency in Service' },
  { value: 'change_in_value', label: 'Change in Value' },
  { value: 'post_sale_discount', label: 'Post-Sale Discount' },
  { value: 'correction', label: 'Correction / Amendment' },
  { value: 'other', label: 'Other' },
];

const lineItemSchema = Yup.object({
  description: Yup.string().required('Description is required'),
  hsnCode: Yup.string().required('HSN code is required'),
  quantity: Yup.number().min(1, 'Qty must be at least 1').required('Qty is required'),
  unitPrice: Yup.number().min(0, 'Price must be positive').required('Price is required'),
  gstRate: Yup.number().min(0).max(100).required('GST rate is required'),
  cessRate: Yup.number().min(0).max(100),
  discount: Yup.number().min(0).max(100),
});

const noteSchema = Yup.object({
  customerId: Yup.string().required('Customer is required'),
  noteType: Yup.string().oneOf(['credit', 'debit']).required('Note type is required'),
  noteDate: Yup.date().required('Note date is required').max(new Date(), 'Date cannot be in the future'),
  reason: Yup.string().required('Reason is required'),
  reasonDescription: Yup.string().when('reason', {
    is: 'other',
    then: (schema) => schema.required('Please specify the reason'),
    otherwise: (schema) => schema.nullable(),
  }),
  items: Yup.array().of(lineItemSchema).min(1, 'At least one item is required'),
});

export default function CreditDebitNotesPage() {
  const [notes, setNotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNoteType, setFilterNoteType] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchNotes();
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm, filterNoteType]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        noteType: filterNoteType || undefined,
      };
      const response = await creditDebitNoteAPI.getAll(params);
      setNotes(response.data.notes || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load credit/debit notes');
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

  const fetchCustomerInvoices = async (customerId) => {
    if (!customerId) {
      setCustomerInvoices([]);
      return;
    }
    try {
      const response = await invoiceAPI.getAll({ customerId, limit: 500 });
      setCustomerInvoices(response.data.invoices || []);
    } catch (err) {
      console.error('Failed to load customer invoices:', err);
      setCustomerInvoices([]);
    }
  };

  const getItemError = (index, field) => {
    const errors = formik.errors.items;
    if (Array.isArray(errors) && errors[index] && typeof errors[index] === 'object') {
      return errors[index][field] || '';
    }
    return '';
  };

  const isItemTouched = (index, field) => {
    const touched = formik.touched.items;
    if (Array.isArray(touched) && touched[index] && typeof touched[index] === 'object') {
      return !!touched[index][field];
    }
    return false;
  };

  const showItemError = (index, field) => {
    return (isItemTouched(index, field) || formik.submitCount > 0) && !!getItemError(index, field);
  };

  const formik = useFormik({
    initialValues: {
      customerId: '',
      noteType: 'credit',
      noteDate: new Date().toISOString().split('T')[0],
      originalInvoiceId: '',
      reason: '',
      reasonDescription: '',
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
    validationSchema: noteSchema,
    validateOnMount: false,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setFormError('');
        if (!values.items || values.items.length === 0) {
          setFormError('At least one line item is required');
          handleApiError({ message: 'At least one line item is required' });
          setSubmitting(false);
          return;
        }

        const hasEmptyItems = values.items.some(
          (item) => !item.description?.trim() || !item.hsnCode?.trim() || !item.unitPrice
        );
        if (hasEmptyItems) {
          setFormError('Please fill in all required fields for each line item');
          handleApiError({ message: 'Please fill in all required fields for each line item' });
          setSubmitting(false);
          return;
        }

        const noteData = {
          ...values,
          originalInvoiceId: values.originalInvoiceId || null,
          items: values.items.map((item) => ({
            ...item,
            itemName: item.description,
            discount: parseFloat(item.discount) || 0,
            cessRate: parseFloat(item.cessRate) || 0,
          })),
        };

        if (editingNote) {
          await creditDebitNoteAPI.update(editingNote.id, noteData);
          handleSuccess('Credit/debit note updated successfully');
        } else {
          await creditDebitNoteAPI.create(noteData);
          handleSuccess('Credit/debit note created successfully');
        }

        handleCloseDialog();
        resetForm();
        setFormError('');
        fetchNotes();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (note = null) => {
    if (note) {
      setEditingNote(note);
      setSelectedCustomer(customers.find((c) => c.id === note.customerId) || null);
      fetchCustomerInvoices(note.customerId);
      setSelectedInvoice(note.originalInvoiceId ? { id: note.originalInvoiceId, invoiceNumber: note.originalInvoiceNumber } : null);
      formik.setValues({
        customerId: note.customerId || '',
        noteType: note.noteType || 'credit',
        noteDate: note.noteDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        originalInvoiceId: note.originalInvoiceId || '',
        reason: note.reason || '',
        reasonDescription: note.reasonDescription || '',
        notes: note.notes || '',
        items: (note.items || []).map((item) => ({
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
      setEditingNote(null);
      setSelectedCustomer(null);
      setSelectedInvoice(null);
      setCustomerInvoices([]);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNote(null);
    setSelectedCustomer(null);
    setSelectedInvoice(null);
    setCustomerInvoices([]);
    setFormError('');
    formik.resetForm();
  };

  const handleOpenDeleteDialog = (note) => {
    setDeletingNote(note);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingNote(null);
  };

  const handleDeleteNote = async () => {
    try {
      await creditDebitNoteAPI.delete(deletingNote.id);
      handleSuccess('Credit/debit note deleted successfully');
      handleCloseDeleteDialog();
      fetchNotes();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleViewNote = async (note) => {
    try {
      const response = await creditDebitNoteAPI.getById(note.id);
      setViewingNote(response.data.data);
      setOpenViewDialog(true);
    } catch (err) {
      handleApiError(err, 'Failed to load note details');
    }
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingNote(null);
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

  const calculateNoteSubtotal = () => {
    return formik.values.items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = (subtotal * (item.discount || 0)) / 100;
      return sum + subtotal - discountAmount;
    }, 0);
  };

  const calculateNoteGST = () => {
    return formik.values.items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = (subtotal * (item.discount || 0)) / 100;
      const taxableAmount = subtotal - discountAmount;
      return sum + (taxableAmount * (item.gstRate || 0)) / 100;
    }, 0);
  };

  const calculateNoteTotal = () => {
    return formik.values.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleCustomerChange = (newValue) => {
    setSelectedCustomer(newValue);
    setSelectedInvoice(null);
    formik.setFieldValue('customerId', newValue?.id || '');
    formik.setFieldValue('originalInvoiceId', '');
    if (newValue?.id) {
      fetchCustomerInvoices(newValue.id);
    } else {
      setCustomerInvoices([]);
    }
  };

  const populateFromInvoice = (invoice) => {
    if (!invoice || !invoice.items) return;
    formik.setFieldValue(
      'items',
      invoice.items.map((item) => ({
        description: item.itemName || item.description || '',
        hsnCode: item.hsnCode || item.sacCode || '',
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        gstRate: parseFloat(item.gstRate) || 18,
        cessRate: parseFloat(item.cessRate) || 0,
        discount: parseFloat(item.discountPercent) || 0,
      }))
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Credit / Debit Notes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage credit and debit notes for adjustments
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} className="gradient-button-primary" size="small">
          Create Note
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by note number, customer name..."
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
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterNoteType}
                  label="Filter by Type"
                  onChange={(e) => {
                    setFilterNoteType(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="credit">Credit Notes</MenuItem>
                  <MenuItem value="debit">Debit Notes</MenuItem>
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

      {/* Notes Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : notes.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Note #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Original Invoice</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Taxable</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>GST</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notes.map((note) => (
                      <TableRow key={note.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            fontFamily="monospace"
                            sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => handleViewNote(note)}
                          >
                            {note.noteNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={note.noteType === 'credit' ? 'Credit' : 'Debit'}
                            size="small"
                            color={note.noteType === 'credit' ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{note.customer?.customerName || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {note.customer?.gstin || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(note.noteDate)}</TableCell>
                        <TableCell>
                          {note.originalInvoiceNumber ? (
                            <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                              {note.originalInvoiceNumber}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={note.reasonDescription || ''}>
                            <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {REASON_OPTIONS.find((r) => r.value === note.reason)?.label || note.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatCurrency(note.taxableAmount || 0)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {formatCurrency(note.totalTaxAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {formatCurrency(note.totalAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={note.filedInGstr1 ? 'Filed' : 'Draft'} size="small" color={note.filedInGstr1 ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => handleViewNote(note)} color="info">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!note.filedInGstr1 && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => handleOpenDialog(note)} color="primary">
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={() => handleOpenDeleteDialog(note)} color="error">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
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
              <NoteAdd sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No credit/debit notes yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first credit or debit note to adjust invoices
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} className="gradient-button-primary">
                Create Note
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Note Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editingNote ? 'Edit Credit/Debit Note' : 'Create Credit/Debit Note'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Note Type Toggle */}
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Note Type *
                  </Typography>
                  <ToggleButtonGroup
                    value={formik.values.noteType}
                    exclusive
                    onChange={(e, newType) => {
                      if (newType) formik.setFieldValue('noteType', newType);
                    }}
                    color="primary"
                  >
                    <ToggleButton value="credit" sx={{ px: 4 }}>
                      <CreditCard sx={{ mr: 1 }} /> Credit Note
                    </ToggleButton>
                    <ToggleButton value="debit" sx={{ px: 4 }}>
                      <Receipt sx={{ mr: 1 }} /> Debit Note
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {formik.values.noteType === 'credit' ? (
                    <Typography variant="body2">
                      <strong>Credit Note:</strong> Issued when you need to reduce the value of an invoice (e.g., goods return, price
                      reduction, discount). This reduces your GST liability.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      <strong>Debit Note:</strong> Issued when you need to increase the value of an invoice (e.g., additional charges,
                      price increase). This increases your GST liability.
                    </Typography>
                  )}
                </Alert>
              </Grid>

              {/* Customer Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  value={selectedCustomer}
                  onChange={(e, newValue) => handleCustomerChange(newValue)}
                  options={customers}
                  getOptionLabel={(option) => {
                    const gstin = option.gstin ? ` (${option.gstin})` : '';
                    return `${option.customerName}${gstin}`;
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.gstin || 'No GSTIN'} | {option.state}
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

              {/* Note Date */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="noteDate"
                  name="noteDate"
                  label="Note Date *"
                  type="date"
                  value={formik.values.noteDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.noteDate && Boolean(formik.errors.noteDate)}
                  helperText={formik.touched.noteDate && formik.errors.noteDate}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                />
              </Grid>

              {/* Original Invoice (Optional) */}
              <Grid item xs={12} md={3}>
                <Autocomplete
                  value={selectedInvoice}
                  onChange={(e, newValue) => {
                    setSelectedInvoice(newValue);
                    formik.setFieldValue('originalInvoiceId', newValue?.id || '');
                    if (newValue && newValue.items) {
                      populateFromInvoice(newValue);
                    }
                  }}
                  options={customerInvoices}
                  getOptionLabel={(option) => option.invoiceNumber || ''}
                  disabled={!selectedCustomer}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.invoiceNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(option.invoiceDate)} | {formatCurrency(option.totalAmount)}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Original Invoice (Optional)" helperText="Select to auto-populate items" />
                  )}
                />
              </Grid>

              {/* Reason */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={formik.touched.reason && Boolean(formik.errors.reason)}>
                  <InputLabel>Reason *</InputLabel>
                  <Select
                    id="reason"
                    name="reason"
                    value={formik.values.reason}
                    label="Reason *"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {REASON_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.reason && formik.errors.reason && (
                    <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                      {formik.errors.reason}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Reason Description (when Other) */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="reasonDescription"
                  name="reasonDescription"
                  label={formik.values.reason === 'other' ? 'Reason Description *' : 'Reason Description (Optional)'}
                  value={formik.values.reasonDescription}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reasonDescription && Boolean(formik.errors.reasonDescription)}
                  helperText={formik.touched.reasonDescription && formik.errors.reasonDescription}
                />
              </Grid>

              {/* Line Items */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Line Items</Typography>
                  <Button startIcon={<AddCircleOutline />} onClick={addLineItem} variant="outlined" size="small">
                    Add Item
                  </Button>
                </Box>

                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                    {formError}
                  </Alert>
                )}

                {formik.submitCount > 0 && typeof formik.errors.items === 'string' && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formik.errors.items}
                  </Alert>
                )}

                {formik.values.items.map((item, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Description *"
                          value={item.description}
                          onChange={(e) => formik.setFieldValue(`items.${index}.description`, e.target.value)}
                          onBlur={() => formik.setFieldTouched(`items.${index}.description`, true)}
                          error={showItemError(index, 'description')}
                          helperText={showItemError(index, 'description') ? getItemError(index, 'description') : ''}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6} md={1.5}>
                        <Autocomplete
                          freeSolo
                          value={item.hsnCode || ''}
                          onChange={(e, newValue) => {
                            const code = typeof newValue === 'object' ? newValue?.code : newValue;
                            formik.setFieldValue(`items.${index}.hsnCode`, code || '');
                          }}
                          onInputChange={(e, inputValue) => {
                            formik.setFieldValue(`items.${index}.hsnCode`, inputValue || '');
                          }}
                          options={COMMON_HSN_CODES}
                          getOptionLabel={(option) => (typeof option === 'string' ? option : `${option.code} - ${option.desc}`)}
                          filterOptions={(options, { inputValue }) =>
                            options.filter((o) => o.code.includes(inputValue) || o.desc.toLowerCase().includes(inputValue.toLowerCase()))
                          }
                          renderOption={(props, option) => (
                            <li {...props} key={option.code}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {option.code}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.desc} ({option.rate})
                                </Typography>
                              </Box>
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="HSN Code *"
                              size="small"
                              error={showItemError(index, 'hsnCode')}
                              helperText={showItemError(index, 'hsnCode') ? getItemError(index, 'hsnCode') : ''}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="Qty *"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => formik.setFieldValue(`items.${index}.quantity`, parseFloat(e.target.value) || 0)}
                          onBlur={() => formik.setFieldTouched(`items.${index}.quantity`, true)}
                          error={showItemError(index, 'quantity')}
                          helperText={showItemError(index, 'quantity') ? getItemError(index, 'quantity') : ''}
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
                          onChange={(e) => formik.setFieldValue(`items.${index}.unitPrice`, parseFloat(e.target.value) || 0)}
                          onBlur={() => formik.setFieldTouched(`items.${index}.unitPrice`, true)}
                          error={showItemError(index, 'unitPrice')}
                          helperText={showItemError(index, 'unitPrice') ? getItemError(index, 'unitPrice') : ''}
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
                          onChange={(e) => formik.setFieldValue(`items.${index}.discount`, parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => formik.setFieldValue(`items.${index}.gstRate`, parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => formik.setFieldValue(`items.${index}.cessRate`, parseFloat(e.target.value) || 0)}
                          size="small"
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {formatCurrency(calculateItemTotal(item))}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.disabled" fontSize="0.6rem">
                          Total
                        </Typography>
                      </Grid>

                      <Grid item xs={2} md={0.5}>
                        {formik.values.items.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => removeLineItem(index)}>
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
                <Card sx={{ bgcolor: formik.values.noteType === 'credit' ? '#e8f5e9' : '#ffebee', p: 2, border: '1px solid' }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    {formik.values.noteType === 'credit' ? 'Credit Note' : 'Debit Note'} Summary
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Taxable Amount:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(calculateNoteSubtotal())}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">GST Amount:</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(calculateNoteGST())}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color={formik.values.noteType === 'credit' ? 'success.main' : 'error.main'} fontWeight={700}>
                      {formik.values.noteType === 'credit' ? '-' : '+'} {formatCurrency(calculateNoteTotal())}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {formik.values.noteType === 'credit'
                      ? 'This amount will reduce your GST liability.'
                      : 'This amount will increase your GST liability.'}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting} className="gradient-button-primary">
              {formik.isSubmitting ? 'Saving...' : editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Credit/Debit Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete note <strong>{deletingNote?.noteNumber}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteNote} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Note Detail Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {viewingNote?.noteType === 'credit' ? 'Credit Note' : 'Debit Note'}: {viewingNote?.noteNumber}
            </Typography>
            <Chip
              label={viewingNote?.noteType === 'credit' ? 'Credit' : 'Debit'}
              size="small"
              color={viewingNote?.noteType === 'credit' ? 'success' : 'error'}
            />
            <Chip label={viewingNote?.filedInGstr1 ? 'Filed' : 'Draft'} size="small" color={viewingNote?.filedInGstr1 ? 'success' : 'default'} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {viewingNote && (
            <Grid container spacing={3}>
              {/* Header Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {viewingNote.customer?.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  {viewingNote.customer?.gstin || 'No GSTIN'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Note Date
                </Typography>
                <Typography variant="body1">{formatDate(viewingNote.noteDate)}</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Original Invoice
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {viewingNote.originalInvoiceNumber || '-'}
                </Typography>
                {viewingNote.originalInvoiceDate && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(viewingNote.originalInvoiceDate)}
                  </Typography>
                )}
              </Grid>

              {/* Reason */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reason
                </Typography>
                <Typography variant="body1">
                  {REASON_OPTIONS.find((r) => r.value === viewingNote.reason)?.label || viewingNote.reason}
                  {viewingNote.reasonDescription && ` - ${viewingNote.reasonDescription}`}
                </Typography>
              </Grid>

              {/* Line Items */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Line Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>HSN/SAC</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">GST%</TableCell>
                        <TableCell align="right">GST Amt</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewingNote.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.itemName || item.description}</TableCell>
                          <TableCell fontFamily="monospace">{item.hsnCode || item.sacCode}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">{item.gstRate}%</TableCell>
                          <TableCell align="right">
                            {formatCurrency(
                              parseFloat(item.cgstAmount || 0) + parseFloat(item.sgstAmount || 0) + parseFloat(item.igstAmount || 0)
                            )}
                          </TableCell>
                          <TableCell align="right" fontWeight={600}>
                            {formatCurrency(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Totals */}
              <Grid item xs={12} md={6}>
                {viewingNote.notes && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">{viewingNote.notes}</Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: viewingNote.noteType === 'credit' ? '#e8f5e9' : '#ffebee', p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Taxable Amount:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(viewingNote.taxableAmount)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">CGST:</Typography>
                    <Typography variant="body2">{formatCurrency(viewingNote.cgstAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">SGST:</Typography>
                    <Typography variant="body2">{formatCurrency(viewingNote.sgstAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">IGST:</Typography>
                    <Typography variant="body2">{formatCurrency(viewingNote.igstAmount)}</Typography>
                  </Box>
                  {parseFloat(viewingNote.cessAmount) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Cess:</Typography>
                      <Typography variant="body2">{formatCurrency(viewingNote.cessAmount)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color={viewingNote.noteType === 'credit' ? 'success.main' : 'error.main'} fontWeight={700}>
                      {viewingNote.noteType === 'credit' ? '-' : '+'} {formatCurrency(viewingNote.totalAmount)}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Receipt,
  AddCircleOutline,
  RemoveCircleOutline,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { purchaseAPI, supplierAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';

const purchaseSchema = Yup.object({
  supplierId: Yup.string().required('Supplier is required'),
  supplierInvoiceNumber: Yup.string().required('Supplier invoice number is required'),
  supplierInvoiceDate: Yup.date().required('Invoice date is required'),
  items: Yup.array().min(1, 'At least one item is required'),
});

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deletingPurchase, setDeletingPurchase] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, [page, rowsPerPage, searchTerm, filterStatus]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
      };

      const response = await purchaseAPI.getAll(params);
      setPurchases(response.data.purchases || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load purchases');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll({ limit: 1000 });
      setSuppliers(response.data.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      supplierId: '',
      supplierInvoiceNumber: '',
      supplierInvoiceDate: new Date().toISOString().split('T')[0],
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
    validationSchema: purchaseSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const purchaseData = {
          ...values,
          items: values.items.map(item => ({
            ...item,
            discount: parseFloat(item.discount) || 0,
            cessRate: parseFloat(item.cessRate) || 0,
          })),
        };

        if (editingPurchase) {
          await purchaseAPI.update(editingPurchase.id, purchaseData);
          handleSuccess('Purchase updated successfully');
        } else {
          await purchaseAPI.create(purchaseData);
          handleSuccess('Purchase created successfully');
        }

        handleCloseDialog();
        resetForm();
        fetchPurchases();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (purchase = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setSelectedSupplier(suppliers.find(s => s.id === purchase.supplierId));
      formik.setValues({
        supplierId: purchase.supplierId || '',
        supplierInvoiceNumber: purchase.supplierInvoiceNumber || '',
        supplierInvoiceDate: purchase.supplierInvoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        dueDate: purchase.dueDate?.split('T')[0] || '',
        notes: purchase.notes || '',
        items: purchase.PurchaseItem?.map(item => ({
          description: item.description || '',
          hsnCode: item.hsnCode || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          gstRate: item.gstRate || 18,
          cessRate: item.cessRate || 0,
          discount: item.discount || 0,
        })) || [],
      });
    } else {
      setEditingPurchase(null);
      setSelectedSupplier(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPurchase(null);
    setSelectedSupplier(null);
    formik.resetForm();
  };

  const handleOpenDeleteDialog = (purchase) => {
    setDeletingPurchase(purchase);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingPurchase(null);
  };

  const handleDeletePurchase = async () => {
    try {
      await purchaseAPI.delete(deletingPurchase.id);
      handleSuccess('Purchase deleted successfully');
      handleCloseDeleteDialog();
      fetchPurchases();
    } catch (err) {
      handleApiError(err);
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
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * (item.discount || 0)) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = (taxableAmount * item.gstRate) / 100;
    const cessAmount = (taxableAmount * (item.cessRate || 0)) / 100;
    return taxableAmount + gstAmount + cessAmount;
  };

  const calculatePurchaseTotal = () => {
    return formik.values.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Purchases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your purchase invoices and ITC
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          className="gradient-button-primary"
        >
          Add Purchase
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by supplier name, invoice number..."
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
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
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

      {/* Purchases Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : purchases.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ITC</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                            {purchase.supplierInvoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {purchase.Supplier?.supplierName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(purchase.supplierInvoiceDate)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(purchase.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            {formatCurrency(purchase.itcAmount || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={purchase.status || 'pending'}
                            size="small"
                            color={purchase.status === 'paid' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(purchase)}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(purchase)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
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
              <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No purchases yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start recording your purchases to track ITC
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                className="gradient-button-primary"
              >
                Add Purchase
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Purchase Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Supplier & Dates */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  value={selectedSupplier}
                  onChange={(e, newValue) => {
                    setSelectedSupplier(newValue);
                    formik.setFieldValue('supplierId', newValue?.id || '');
                  }}
                  options={suppliers}
                  getOptionLabel={(option) => option.supplierName || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier *"
                      error={formik.touched.supplierId && Boolean(formik.errors.supplierId)}
                      helperText={formik.touched.supplierId && formik.errors.supplierId}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="supplierInvoiceNumber"
                  name="supplierInvoiceNumber"
                  label="Supplier Invoice # *"
                  value={formik.values.supplierInvoiceNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.supplierInvoiceNumber && Boolean(formik.errors.supplierInvoiceNumber)}
                  helperText={formik.touched.supplierInvoiceNumber && formik.errors.supplierInvoiceNumber}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  id="supplierInvoiceDate"
                  name="supplierInvoiceDate"
                  label="Invoice Date *"
                  type="date"
                  value={formik.values.supplierInvoiceDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.supplierInvoiceDate && Boolean(formik.errors.supplierInvoiceDate)}
                  helperText={formik.touched.supplierInvoiceDate && formik.errors.supplierInvoiceDate}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Line Items */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Items</Typography>
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
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
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

                      <Grid item xs={6} md={2}>
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

                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          label="Qty *"
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.quantity`, parseFloat(e.target.value))
                          }
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6} md={1.5}>
                        <TextField
                          fullWidth
                          label="Price *"
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.unitPrice`, parseFloat(e.target.value))
                          }
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <TextField
                          fullWidth
                          label="GST%"
                          type="number"
                          value={item.gstRate}
                          onChange={(e) =>
                            formik.setFieldValue(`items.${index}.gstRate`, parseFloat(e.target.value))
                          }
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={10} md={1.5}>
                        <Typography variant="caption" color="text.secondary">
                          Total: {formatCurrency(calculateItemTotal(item))}
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
              <Grid item xs={12} md={8}>
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

              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.50', p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Purchase Total
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    {formatCurrency(calculatePurchaseTotal())}
                  </Typography>
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
              {formik.isSubmitting ? 'Saving...' : editingPurchase ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Purchase</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete purchase invoice <strong>{deletingPurchase?.supplierInvoiceNumber}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeletePurchase} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

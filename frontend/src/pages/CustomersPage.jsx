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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  FileDownload,
  Person,
  Business,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { customerAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { MESSAGES, INDIAN_STATES, VALIDATION_MESSAGES } from '../utils/constants';
import { formatDate } from '../utils/formatters';

// Validation schema
const customerSchema = Yup.object({
  customerName: Yup.string().required(VALIDATION_MESSAGES.BUSINESS_NAME_REQUIRED),
  gstin: Yup.string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, VALIDATION_MESSAGES.GSTIN_INVALID)
    .nullable(),
  pan: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, VALIDATION_MESSAGES.PAN_INVALID)
    .nullable(),
  billingAddress: Yup.string().required(VALIDATION_MESSAGES.ADDRESS_REQUIRED),
  city: Yup.string().required(VALIDATION_MESSAGES.CITY_REQUIRED),
  state: Yup.string().required(VALIDATION_MESSAGES.STATE_REQUIRED),
  pincode: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, VALIDATION_MESSAGES.PINCODE_INVALID)
    .required(VALIDATION_MESSAGES.PINCODE_REQUIRED),
  email: Yup.string().email(VALIDATION_MESSAGES.EMAIL_INVALID).nullable(),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, VALIDATION_MESSAGES.PHONE_INVALID)
    .nullable(),
});

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      };

      const response = await customerAPI.getAll(params);
      setCustomers(response.data.customers || []);
      setTotalCount(response.data.total || 0);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to load customers');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      customerName: '',
      gstin: '',
      pan: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state: '',
      pincode: '',
      email: '',
      phone: '',
      contactPerson: '',
    },
    validationSchema: customerSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const customerData = {
          ...values,
          gstin: values.gstin || null,
          pan: values.pan || null,
          email: values.email || null,
          phone: values.phone || null,
          contactPerson: values.contactPerson || null,
          shippingAddress: values.shippingAddress || values.billingAddress,
        };

        if (editingCustomer) {
          await customerAPI.update(editingCustomer.id, customerData);
          handleSuccess('Customer updated successfully');
        } else {
          await customerAPI.create(customerData);
          handleSuccess('Customer created successfully');
        }

        handleCloseDialog();
        resetForm();
        fetchCustomers();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      formik.setValues({
        customerName: customer.customerName || '',
        gstin: customer.gstin || '',
        pan: customer.pan || '',
        billingAddress: customer.billingAddress || '',
        shippingAddress: customer.shippingAddress || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        email: customer.email || '',
        phone: customer.phone || '',
        contactPerson: customer.contactPerson || '',
      });
    } else {
      setEditingCustomer(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    formik.resetForm();
  };

  const handleOpenDeleteDialog = (customer) => {
    setDeletingCustomer(customer);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingCustomer(null);
  };

  const handleDeleteCustomer = async () => {
    try {
      await customerAPI.delete(deletingCustomer.id);
      handleSuccess('Customer deleted successfully');
      handleCloseDeleteDialog();
      fetchCustomers();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'GSTIN', 'PAN', 'City', 'State', 'Phone', 'Email'];
    const rows = customers.map(c => [
      c.customerName,
      c.gstin || 'N/A',
      c.pan || 'N/A',
      c.city,
      c.state,
      c.phone || 'N/A',
      c.email || 'N/A',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getCustomerType = (customer) => {
    return customer.gstin ? 'B2B' : 'B2C';
  };

  const filteredCustomers = customers;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Customers
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your customer database
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
            disabled={customers.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            className="gradient-button-primary"
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search customers by name, GSTIN, PAN, or email..."
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
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Customers Table */}
      <Card>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : filteredCustomers.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>GSTIN</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {customer.gstin ? <Business fontSize="small" color="primary" /> : <Person fontSize="small" color="action" />}
                            <Typography variant="body2" fontWeight={600}>
                              {customer.customerName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getCustomerType(customer)}
                            size="small"
                            color={customer.gstin ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {customer.gstin || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{customer.city}</TableCell>
                        <TableCell>{customer.state}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{customer.phone || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(customer)}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteDialog(customer)}
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
              <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No customers yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by adding your first customer
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                className="gradient-button-primary"
              >
                Add Customer
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="customerName"
                  name="customerName"
                  label="Customer Name *"
                  value={formik.values.customerName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.customerName && Boolean(formik.errors.customerName)}
                  helperText={formik.touched.customerName && formik.errors.customerName}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="gstin"
                  name="gstin"
                  label="GSTIN (Optional)"
                  value={formik.values.gstin}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.gstin && Boolean(formik.errors.gstin)}
                  helperText={formik.touched.gstin && formik.errors.gstin}
                  placeholder="27AABCT1332L1ZM"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="pan"
                  name="pan"
                  label="PAN (Optional)"
                  value={formik.values.pan}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.pan && Boolean(formik.errors.pan)}
                  helperText={formik.touched.pan && formik.errors.pan}
                  placeholder="AABCT1332L"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="billingAddress"
                  name="billingAddress"
                  label="Billing Address *"
                  multiline
                  rows={2}
                  value={formik.values.billingAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.billingAddress && Boolean(formik.errors.billingAddress)}
                  helperText={formik.touched.billingAddress && formik.errors.billingAddress}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="shippingAddress"
                  name="shippingAddress"
                  label="Shipping Address (Optional, defaults to billing)"
                  multiline
                  rows={2}
                  value={formik.values.shippingAddress}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="city"
                  name="city"
                  label="City *"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="state"
                  name="state"
                  label="State *"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.state && Boolean(formik.errors.state)}
                  helperText={formik.touched.state && formik.errors.state}
                >
                  {INDIAN_STATES.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="pincode"
                  name="pincode"
                  label="Pincode *"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.pincode && Boolean(formik.errors.pincode)}
                  helperText={formik.touched.pincode && formik.errors.pincode}
                  placeholder="400001"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone (Optional)"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  placeholder="9876543210"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email (Optional)"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactPerson"
                  name="contactPerson"
                  label="Contact Person (Optional)"
                  value={formik.values.contactPerson}
                  onChange={formik.handleChange}
                />
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
              {formik.isSubmitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingCustomer?.customerName}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

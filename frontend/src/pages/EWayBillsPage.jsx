import { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocalShipping,
  PlayArrow,
  Cancel,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ewayBillAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';
import { INDIAN_STATES } from '../utils/constants';
import { PageHeader, EmptyState, LoadingState, ConfirmDialog, SectionCard } from '../components/common';

const TRANSPORT_MODES = ['ROAD', 'RAIL', 'AIR', 'SHIP'];

const STATUS_COLORS = {
  DRAFT: 'default',
  GENERATED: 'success',
  CANCELLED: 'error',
};

const ewayBillSchema = Yup.object({
  docNumber: Yup.string().required('Document number is required'),
  docDate: Yup.date().required('Document date is required'),
  fromPlace: Yup.string().required('From place is required'),
  fromState: Yup.string().required('From state is required'),
  toPlace: Yup.string().required('To place is required'),
  toState: Yup.string().required('To state is required'),
  distanceKm: Yup.number().min(0, 'Distance must be positive').required('Distance is required'),
  value: Yup.number().min(0, 'Value must be positive').required('Value is required'),
  transportMode: Yup.string().oneOf(TRANSPORT_MODES).required('Transport mode is required'),
});

const today = () => new Date().toISOString().split('T')[0];

export default function EWayBillsPage() {
  const [ewayBills, setEwayBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchEwayBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const fetchEwayBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ewayBillAPI.getAll({ page: page + 1, limit: rowsPerPage });
      const data = response.data || {};
      setEwayBills(data.ewayBills || data.data || []);
      setTotalCount(data.pagination?.total ?? data.total ?? 0);
    } catch (err) {
      setEwayBills([]);
      setError(handleApiError(err, 'Failed to load e-way bills'));
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      docNumber: '',
      docDate: today(),
      fromPlace: '',
      fromState: '',
      toPlace: '',
      toState: '',
      distanceKm: 0,
      transporterName: '',
      transporterId: '',
      vehicleNumber: '',
      transportMode: 'ROAD',
      value: 0,
    },
    validationSchema: ewayBillSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          ...values,
          distanceKm: parseFloat(values.distanceKm) || 0,
          value: parseFloat(values.value) || 0,
        };
        if (editing) {
          await ewayBillAPI.update(editing.id, payload);
          handleSuccess('E-way bill updated');
        } else {
          await ewayBillAPI.create(payload);
          handleSuccess('E-way bill created');
        }
        handleClose();
        resetForm();
        fetchEwayBills();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpen = (bill = null) => {
    if (bill) {
      setEditing(bill);
      formik.setValues({
        docNumber: bill.docNumber || '',
        docDate: bill.docDate?.split('T')[0] || today(),
        fromPlace: bill.fromPlace || '',
        fromState: bill.fromState || '',
        toPlace: bill.toPlace || '',
        toState: bill.toState || '',
        distanceKm: bill.distanceKm ?? 0,
        transporterName: bill.transporterName || '',
        transporterId: bill.transporterId || '',
        vehicleNumber: bill.vehicleNumber || '',
        transportMode: bill.transportMode || 'ROAD',
        value: bill.value ?? 0,
      });
    } else {
      setEditing(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditing(null);
    formik.resetForm();
  };

  const handleGenerate = async (bill) => {
    try {
      setActionId(bill.id);
      await ewayBillAPI.generate(bill.id);
      handleSuccess('E-way bill number generated');
      fetchEwayBills();
    } catch (err) {
      handleApiError(err, 'Failed to generate e-way bill');
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bill) => {
    try {
      setActionId(bill.id);
      await ewayBillAPI.cancel(bill.id, { reason: 'Cancelled by user' });
      handleSuccess('E-way bill cancelled');
      fetchEwayBills();
    } catch (err) {
      handleApiError(err, 'Failed to cancel e-way bill');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      setDeletingBusy(true);
      await ewayBillAPI.delete(deleting.id);
      handleSuccess('E-way bill deleted');
      setDeleting(null);
      if (ewayBills.length === 1 && page > 0) setPage((p) => p - 1);
      else fetchEwayBills();
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="E-Way Bills"
        subtitle="Generate and manage e-way bills for the movement of goods"
        icon={<LocalShipping />}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            className="gradient-button-primary"
          >
            New E-Way Bill
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={6} columns={7} />
          </Box>
        ) : ewayBills.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>EWB / Doc No.</TableCell>
                    <TableCell>From → To</TableCell>
                    <TableCell align="right">Distance</TableCell>
                    <TableCell>Transport</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Valid Upto</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ewayBills.map((bill) => {
                    const status = (bill.status || 'DRAFT').toUpperCase();
                    return (
                      <TableRow key={bill.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                            {bill.ewbNumber || bill.docNumber || '-'}
                          </Typography>
                          {bill.ewbNumber && (
                            <Typography variant="caption" color="text.secondary">
                              Doc: {bill.docNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {bill.fromPlace}, {bill.fromState}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            → {bill.toPlace}, {bill.toState}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{bill.distanceKm ? `${bill.distanceKm} km` : '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{bill.transportMode || '-'}</Typography>
                          {bill.vehicleNumber && (
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                              {bill.vehicleNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(bill.value || 0)}</TableCell>
                        <TableCell>
                          {bill.validUpto ? formatDate(bill.validUpto) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip label={status} size="small" color={STATUS_COLORS[status] || 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            {status === 'DRAFT' && (
                              <Tooltip title="Generate EWB Number">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleGenerate(bill)}
                                  disabled={actionId === bill.id}
                                >
                                  <PlayArrow fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {status === 'GENERATED' && (
                              <Tooltip title="Cancel EWB">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleCancel(bill)}
                                  disabled={actionId === bill.id}
                                >
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {status === 'DRAFT' && (
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary" onClick={() => handleOpen(bill)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => setDeleting(bill)}>
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
              onPageChange={(e, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        ) : (
          <EmptyState
            icon={<LocalShipping />}
            title="No e-way bills yet"
            message="Create an e-way bill for the movement of goods, or generate one directly from an invoice."
            action={
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} className="gradient-button-primary">
                New E-Way Bill
              </Button>
            }
          />
        )}
      </SectionCard>

      {/* Create / Edit dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit E-Way Bill' : 'New E-Way Bill'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="docNumber"
                  name="docNumber"
                  label="Document Number *"
                  value={formik.values.docNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.docNumber && Boolean(formik.errors.docNumber)}
                  helperText={formik.touched.docNumber && formik.errors.docNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="docDate"
                  name="docDate"
                  label="Document Date *"
                  type="date"
                  value={formik.values.docDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={formik.touched.docDate && Boolean(formik.errors.docDate)}
                  helperText={formik.touched.docDate && formik.errors.docDate}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="fromPlace"
                  name="fromPlace"
                  label="From Place *"
                  value={formik.values.fromPlace}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fromPlace && Boolean(formik.errors.fromPlace)}
                  helperText={formik.touched.fromPlace && formik.errors.fromPlace}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="fromState"
                  name="fromState"
                  label="From State *"
                  value={formik.values.fromState}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fromState && Boolean(formik.errors.fromState)}
                  helperText={formik.touched.fromState && formik.errors.fromState}
                >
                  {INDIAN_STATES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="toPlace"
                  name="toPlace"
                  label="To Place *"
                  value={formik.values.toPlace}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.toPlace && Boolean(formik.errors.toPlace)}
                  helperText={formik.touched.toPlace && formik.errors.toPlace}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="toState"
                  name="toState"
                  label="To State *"
                  value={formik.values.toState}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.toState && Boolean(formik.errors.toState)}
                  helperText={formik.touched.toState && formik.errors.toState}
                >
                  {INDIAN_STATES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="distanceKm"
                  name="distanceKm"
                  label="Distance (km) *"
                  type="number"
                  value={formik.values.distanceKm}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.distanceKm && Boolean(formik.errors.distanceKm)}
                  helperText={formik.touched.distanceKm && formik.errors.distanceKm}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  id="transportMode"
                  name="transportMode"
                  label="Transport Mode *"
                  value={formik.values.transportMode}
                  onChange={formik.handleChange}
                >
                  {TRANSPORT_MODES.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="value"
                  name="value"
                  label="Consignment Value (₹) *"
                  type="number"
                  value={formik.values.value}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.value && Boolean(formik.errors.value)}
                  helperText={formik.touched.value && formik.errors.value}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="transporterName"
                  name="transporterName"
                  label="Transporter Name"
                  value={formik.values.transporterName}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="transporterId"
                  name="transporterId"
                  label="Transporter ID"
                  value={formik.values.transporterId}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="vehicleNumber"
                  name="vehicleNumber"
                  label="Vehicle Number"
                  value={formik.values.vehicleNumber}
                  onChange={formik.handleChange}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              className="gradient-button-primary"
            >
              {formik.isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete E-Way Bill"
        message={
          <>
            Delete e-way bill <strong>{deleting?.ewbNumber || deleting?.docNumber}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deletingBusy}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}

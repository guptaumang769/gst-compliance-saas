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
  AccountBalanceWallet,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { tdsTcsAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency } from '../utils/formatters';
import { PageHeader, StatCard, EmptyState, LoadingState, ConfirmDialog, SectionCard } from '../components/common';

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const schema = Yup.object({
  type: Yup.string().oneOf(['TDS', 'TCS']).required('Type is required'),
  section: Yup.string().required('Section is required'),
  partyName: Yup.string().required('Party name is required'),
  taxableAmount: Yup.number().min(0).required('Taxable amount is required'),
  rate: Yup.number().min(0).max(100).required('Rate is required'),
  period: Yup.string().required('Period is required'),
});

export default function TdsTcsPage() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filterMonth, filterYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: page + 1, limit: rowsPerPage, year: filterYear, month: filterMonth };
      const [listRes, summaryRes] = await Promise.all([
        tdsTcsAPI.getAll(params),
        tdsTcsAPI.getSummary({ year: filterYear, month: filterMonth }).catch(() => null),
      ]);
      const data = listRes.data || {};
      setEntries(data.entries || data.tdsTcs || data.data || []);
      setTotalCount(data.pagination?.total ?? data.total ?? 0);
      setSummary(summaryRes?.data?.summary || summaryRes?.data || null);
    } catch (err) {
      setEntries([]);
      setError(handleApiError(err, 'Failed to load TDS/TCS entries'));
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      type: 'TDS',
      section: '',
      partyName: '',
      taxableAmount: 0,
      rate: 0,
      period: `${filterYear}-${filterMonth}`,
      note: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const taxable = parseFloat(values.taxableAmount) || 0;
        const rate = parseFloat(values.rate) || 0;
        const payload = {
          ...values,
          taxableAmount: taxable,
          rate,
          amount: Math.round(taxable * rate) / 100,
        };
        if (editing) {
          await tdsTcsAPI.update(editing.id, payload);
          handleSuccess('Entry updated');
        } else {
          await tdsTcsAPI.create(payload);
          handleSuccess('Entry created');
        }
        handleClose();
        resetForm();
        fetchData();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const computedAmount = () => {
    const taxable = parseFloat(formik.values.taxableAmount) || 0;
    const rate = parseFloat(formik.values.rate) || 0;
    return (taxable * rate) / 100;
  };

  const handleOpen = (entry = null) => {
    if (entry) {
      setEditing(entry);
      formik.setValues({
        type: entry.type || 'TDS',
        section: entry.section || '',
        partyName: entry.partyName || '',
        taxableAmount: entry.taxableAmount ?? 0,
        rate: entry.rate ?? 0,
        period: entry.period || `${filterYear}-${filterMonth}`,
        note: entry.note || '',
      });
    } else {
      setEditing(null);
      formik.resetForm();
      formik.setFieldValue('period', `${filterYear}-${filterMonth}`);
    }
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditing(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      setDeletingBusy(true);
      await tdsTcsAPI.delete(deleting.id);
      handleSuccess('Entry deleted');
      setDeleting(null);
      if (entries.length === 1 && page > 0) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeletingBusy(false);
    }
  };

  const tdsTotal = summary?.tdsTotal ?? summary?.tds ?? 0;
  const tcsTotal = summary?.tcsTotal ?? summary?.tcs ?? 0;
  const grandTotal = summary?.total ?? tdsTotal + tcsTotal;

  return (
    <Box>
      <PageHeader
        title="TDS / TCS"
        subtitle="Track tax deducted and collected at source by period"
        icon={<AccountBalanceWallet />}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            className="gradient-button-primary"
          >
            Add Entry
          </Button>
        }
      />

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="TDS (Deducted)" value={formatCurrency(tdsTotal)} icon={<TrendingDown />} color="#6366F1" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="TCS (Collected)" value={formatCurrency(tcsTotal)} icon={<TrendingUp />} color="#8B5CF6" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total" value={formatCurrency(grandTotal)} icon={<AccountBalanceWallet />} color="#10B981" loading={loading} />
        </Grid>
      </Grid>

      {/* Period filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <TextField select fullWidth size="small" label="Month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(0); }}>
                {MONTHS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField select fullWidth size="small" label="Year" value={filterYear} onChange={(e) => { setFilterYear(parseInt(e.target.value, 10)); setPage(0); }}>
                {YEARS.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={6} columns={6} />
          </Box>
        ) : entries.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell align="right">Taxable Amount</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Tax Amount</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Chip label={entry.type} size="small" color={entry.type === 'TDS' ? 'primary' : 'secondary'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{entry.section || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{entry.partyName}</Typography>
                        {entry.note && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 240, display: 'block' }}>
                            {entry.note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(entry.taxableAmount || 0)}</TableCell>
                      <TableCell align="right">{entry.rate ?? 0}%</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(entry.amount || 0)}</Typography>
                      </TableCell>
                      <TableCell>{entry.period || '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleOpen(entry)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleting(entry)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
            icon={<AccountBalanceWallet />}
            title="No TDS/TCS entries for this period"
            message="Record tax deducted or collected at source to keep your compliance up to date."
            action={
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} className="gradient-button-primary">
                Add Entry
              </Button>
            }
          />
        )}
      </SectionCard>

      {/* Create / Edit dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Entry' : 'Add TDS/TCS Entry'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth id="type" name="type" label="Type *" value={formik.values.type} onChange={formik.handleChange}>
                  <MenuItem value="TDS">TDS (Deducted)</MenuItem>
                  <MenuItem value="TCS">TCS (Collected)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="section"
                  name="section"
                  label="Section *"
                  placeholder="e.g. 194J"
                  value={formik.values.section}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.section && Boolean(formik.errors.section)}
                  helperText={formik.touched.section && formik.errors.section}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="partyName"
                  name="partyName"
                  label="Party Name *"
                  value={formik.values.partyName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.partyName && Boolean(formik.errors.partyName)}
                  helperText={formik.touched.partyName && formik.errors.partyName}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="taxableAmount"
                  name="taxableAmount"
                  label="Taxable Amount (₹) *"
                  type="number"
                  value={formik.values.taxableAmount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.taxableAmount && Boolean(formik.errors.taxableAmount)}
                  helperText={formik.touched.taxableAmount && formik.errors.taxableAmount}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="rate"
                  name="rate"
                  label="Rate (%) *"
                  type="number"
                  value={formik.values.rate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.rate && Boolean(formik.errors.rate)}
                  helperText={formik.touched.rate && formik.errors.rate}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tax Amount (₹)"
                  value={formatCurrency(computedAmount())}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="period"
                  name="period"
                  label="Period (YYYY-MM) *"
                  placeholder="2026-07"
                  value={formik.values.period}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.period && Boolean(formik.errors.period)}
                  helperText={formik.touched.period && formik.errors.period}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="note"
                  name="note"
                  label="Note (Optional)"
                  multiline
                  rows={2}
                  value={formik.values.note}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting} className="gradient-button-primary">
              {formik.isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Entry"
        message={
          <>
            Delete this <strong>{deleting?.type}</strong> entry for <strong>{deleting?.partyName}</strong>? This action cannot be undone.
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

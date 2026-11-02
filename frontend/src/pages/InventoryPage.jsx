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
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
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
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search,
  Inventory2,
  Tune,
  History,
  Close,
  Warning,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { inventoryAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PageHeader, StatCard, EmptyState, LoadingState, SectionCard } from '../components/common';

const ADJUST_TYPES = [
  { value: 'IN', label: 'Stock In' },
  { value: 'OUT', label: 'Stock Out' },
  { value: 'ADJUST', label: 'Set / Adjust' },
];

const adjustSchema = Yup.object({
  type: Yup.string().oneOf(['IN', 'OUT', 'ADJUST']).required('Type is required'),
  qty: Yup.number().min(0, 'Quantity must be positive').required('Quantity is required'),
  reason: Yup.string().required('Reason is required'),
});

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [movementsItem, setMovementsItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getAll();
      const data = response.data || {};
      setItems(data.items || data.data || []);
    } catch (err) {
      setItems([]);
      setError(handleApiError(err, 'Failed to load inventory'));
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (item) =>
    item.reorderLevel != null && item.stockQty != null && item.stockQty <= item.reorderLevel;

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.hsnSac || '').toLowerCase().includes(q)
    );
  });

  const totalStockValue = items.reduce(
    (sum, item) => sum + (item.stockQty || 0) * (item.sellingPrice || 0),
    0
  );
  const lowStockCount = items.filter(isLowStock).length;

  const formik = useFormik({
    initialValues: { type: 'IN', qty: 0, reason: '' },
    validationSchema: adjustSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await inventoryAPI.adjust({
          productId: adjustingItem.id,
          type: values.type,
          qty: parseFloat(values.qty) || 0,
          reason: values.reason,
        });
        handleSuccess('Stock adjusted successfully');
        setAdjustingItem(null);
        resetForm();
        fetchInventory();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openAdjust = (item) => {
    setAdjustingItem(item);
    formik.resetForm();
  };

  const openMovements = async (item) => {
    setMovementsItem(item);
    setMovements([]);
    try {
      setMovementsLoading(true);
      const response = await inventoryAPI.getMovements({ productId: item.id });
      const data = response.data || {};
      setMovements(data.movements || data.data || []);
    } catch (err) {
      handleApiError(err, 'Failed to load stock movements');
    } finally {
      setMovementsLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, adjust quantities and monitor low-stock items"
        icon={<Inventory2 />}
      />

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Products Tracked" value={items.length} icon={<Inventory2 />} color="#6366F1" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Stock Value" value={formatCurrency(totalStockValue)} icon={<Inventory2 />} color="#10B981" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Low Stock Items" value={lowStockCount} icon={<Warning />} color="#F59E0B" loading={loading} />
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search inventory by name or HSN/SAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        ) : filteredItems.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>HSN/SAC</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="right">Selling Price</TableCell>
                  <TableCell align="right">Stock Qty</TableCell>
                  <TableCell align="right">Reorder Level</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const low = isLowStock(item);
                  return (
                    <TableRow key={item.id} hover sx={low ? { bgcolor: 'rgba(245, 158, 11, 0.08)' } : undefined}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                          {low && <Chip label="Low" size="small" color="warning" icon={<Warning />} />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{item.hsnSac || '-'}</Typography>
                      </TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(item.sellingPrice || 0)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color={low ? 'warning.main' : 'text.primary'}>
                          {item.stockQty ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.reorderLevel ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Adjust stock">
                            <IconButton size="small" color="primary" onClick={() => openAdjust(item)}>
                              <Tune fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View movements">
                            <IconButton size="small" onClick={() => openMovements(item)}>
                              <History fontSize="small" />
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
        ) : (
          <EmptyState
            icon={<Inventory2 />}
            title={searchTerm ? 'No matching items' : 'No inventory yet'}
            message={
              searchTerm
                ? 'Try a different search term.'
                : 'Products with stock tracking enabled will appear here. Add products in the catalog to get started.'
            }
          />
        )}
      </SectionCard>

      {/* Adjust stock dialog */}
      <Dialog open={Boolean(adjustingItem)} onClose={() => setAdjustingItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {adjustingItem?.name}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current stock: <strong>{adjustingItem?.stockQty ?? 0}</strong> {adjustingItem?.unit || ''}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth id="type" name="type" label="Type *" value={formik.values.type} onChange={formik.handleChange}>
                  {ADJUST_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="qty"
                  name="qty"
                  label="Quantity *"
                  type="number"
                  value={formik.values.qty}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.qty && Boolean(formik.errors.qty)}
                  helperText={formik.touched.qty && formik.errors.qty}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="reason"
                  name="reason"
                  label="Reason *"
                  placeholder="e.g. Purchase received, damaged goods, stock count"
                  value={formik.values.reason}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.reason && Boolean(formik.errors.reason)}
                  helperText={formik.touched.reason && formik.errors.reason}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustingItem(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting} className="gradient-button-primary">
              {formik.isSubmitting ? 'Saving...' : 'Adjust'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Movements drawer */}
      <Drawer
        anchor="right"
        open={Boolean(movementsItem)}
        onClose={() => setMovementsItem(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Stock Movements</Typography>
            <Typography variant="body2" color="text.secondary">{movementsItem?.name}</Typography>
          </Box>
          <IconButton onClick={() => setMovementsItem(null)}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          {movementsLoading ? (
            <LoadingState variant="spinner" label="Loading movements..." />
          ) : movements.length > 0 ? (
            movements.map((m, i) => (
              <Box key={m.id || i} sx={{ display: 'flex', gap: 1.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Chip
                  label={m.type || '-'}
                  size="small"
                  color={m.type === 'IN' ? 'success' : m.type === 'OUT' ? 'error' : 'default'}
                  sx={{ flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {m.qty != null ? `${m.type === 'OUT' ? '-' : '+'}${m.qty}` : ''} {m.reason || ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(m.createdAt || m.date, 'dd MMM yyyy, HH:mm')}
                    {m.balance != null ? ` · Balance: ${m.balance}` : ''}
                  </Typography>
                </Box>
              </Box>
            ))
          ) : (
            <EmptyState dense icon={<History />} title="No movements" message="Stock adjustments for this item will appear here." />
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

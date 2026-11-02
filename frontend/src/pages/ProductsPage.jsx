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
  Search,
  Edit,
  Delete,
  Inventory2,
  Category,
  Handyman,
  UploadFile,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { productAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency } from '../utils/formatters';
import { PageHeader, EmptyState, LoadingState, ConfirmDialog, SectionCard, ImportDialog } from '../components/common';

const UNITS = ['NOS', 'PCS', 'KG', 'GM', 'LTR', 'MTR', 'BOX', 'SET', 'HRS', 'DAY', 'UNIT'];
const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28];

const productSchema = Yup.object({
  name: Yup.string().required('Product name is required'),
  type: Yup.string().oneOf(['GOODS', 'SERVICE']).required('Type is required'),
  hsnSac: Yup.string()
    .required('HSN/SAC code is required')
    .matches(/^[0-9]{4,8}$/, 'HSN/SAC must be 4-8 digits'),
  gstRate: Yup.number().min(0).max(100).required('GST rate is required'),
  cess: Yup.number().min(0).max(100),
  unit: Yup.string().required('Unit is required'),
  sellingPrice: Yup.number().min(0, 'Price must be positive').required('Selling price is required'),
  description: Yup.string().nullable(),
});

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      };
      const response = await productAPI.getAll(params);
      setProducts(response.data.products || []);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load products'));
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      type: 'GOODS',
      hsnSac: '',
      gstRate: 18,
      cess: 0,
      unit: 'NOS',
      sellingPrice: 0,
      description: '',
    },
    validationSchema: productSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          ...values,
          cess: parseFloat(values.cess) || 0,
          gstRate: parseFloat(values.gstRate) || 0,
          sellingPrice: parseFloat(values.sellingPrice) || 0,
          description: values.description || null,
        };
        if (editingProduct) {
          await productAPI.update(editingProduct.id, payload);
          handleSuccess('Product updated successfully');
        } else {
          await productAPI.create(payload);
          handleSuccess('Product created successfully');
        }
        handleCloseDialog();
        resetForm();
        fetchProducts();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      formik.setValues({
        name: product.name || '',
        type: product.type || 'GOODS',
        hsnSac: product.hsnSac || product.hsnCode || '',
        gstRate: product.gstRate ?? 18,
        cess: product.cess ?? 0,
        unit: product.unit || 'NOS',
        sellingPrice: product.sellingPrice ?? 0,
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    formik.resetForm();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setDeleting(true);
      await productAPI.delete(deletingProduct.id);
      handleSuccess('Product deleted successfully');
      setDeletingProduct(null);
      // If we deleted the last item on a page, step back a page.
      if (products.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Products & Services"
        subtitle="Manage your catalog of goods and services for faster invoicing"
        icon={<Inventory2 />}
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<UploadFile />}
              onClick={() => setOpenImport(true)}
            >
              Import CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              className="gradient-button-primary"
            >
              Add Product
            </Button>
          </>
        }
      />

      {/* Sticky search toolbar */}
      <Card
        sx={{
          mb: 3,
          position: 'sticky',
          top: { xs: 72, md: 82 },
          zIndex: 2,
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products by name, HSN/SAC code..."
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={rowsPerPage > 8 ? 8 : rowsPerPage} columns={7} />
          </Box>
        ) : products.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>HSN/SAC</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">GST %</TableCell>
                    <TableCell align="right">Selling Price</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {product.type === 'SERVICE' ? (
                            <Handyman fontSize="small" color="secondary" />
                          ) : (
                            <Category fontSize="small" color="primary" />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {product.name}
                            </Typography>
                            {product.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>
                                {product.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.type === 'SERVICE' ? 'Service' : 'Goods'}
                          size="small"
                          color={product.type === 'SERVICE' ? 'secondary' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {product.hsnSac || product.hsnCode || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.unit || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {product.gstRate ?? 0}%
                        </Typography>
                        {product.cess > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            +{product.cess}% cess
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(product.sellingPrice || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleOpenDialog(product)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeletingProduct(product)}>
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
          <EmptyState
            icon={<Inventory2 />}
            title={searchTerm ? 'No matching products' : 'No products yet'}
            message={
              searchTerm
                ? 'Try a different search term.'
                : 'Add products and services to auto-fill HSN codes and GST rates on your invoices.'
            }
            action={
              !searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  className="gradient-button-primary"
                >
                  Add Product
                </Button>
              )
            }
          />
        )}
      </SectionCard>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Product / Service Name *"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  id="type"
                  name="type"
                  label="Type *"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="GOODS">Goods</MenuItem>
                  <MenuItem value="SERVICE">Service</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="hsnSac"
                  name="hsnSac"
                  label={formik.values.type === 'SERVICE' ? 'SAC Code *' : 'HSN Code *'}
                  value={formik.values.hsnSac}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.hsnSac && Boolean(formik.errors.hsnSac)}
                  helperText={formik.touched.hsnSac && formik.errors.hsnSac}
                  placeholder={formik.values.type === 'SERVICE' ? '998314' : '8471'}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  id="gstRate"
                  name="gstRate"
                  label="GST Rate % *"
                  value={formik.values.gstRate}
                  onChange={formik.handleChange}
                  error={formik.touched.gstRate && Boolean(formik.errors.gstRate)}
                  helperText={formik.touched.gstRate && formik.errors.gstRate}
                >
                  {GST_RATES.map((rate) => (
                    <MenuItem key={rate} value={rate}>
                      {rate}%
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="cess"
                  name="cess"
                  label="Cess %"
                  type="number"
                  value={formik.values.cess}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.cess && Boolean(formik.errors.cess)}
                  helperText={formik.touched.cess && formik.errors.cess}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  id="unit"
                  name="unit"
                  label="Unit *"
                  value={formik.values.unit}
                  onChange={formik.handleChange}
                  error={formik.touched.unit && Boolean(formik.errors.unit)}
                  helperText={formik.touched.unit && formik.errors.unit}
                >
                  {UNITS.map((u) => (
                    <MenuItem key={u} value={u}>
                      {u}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="sellingPrice"
                  name="sellingPrice"
                  label="Selling Price (₹) *"
                  type="number"
                  value={formik.values.sellingPrice}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.sellingPrice && Boolean(formik.errors.sellingPrice)}
                  helperText={formik.touched.sellingPrice && formik.errors.sellingPrice}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description (Optional)"
                  multiline
                  rows={2}
                  value={formik.values.description}
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
              {formik.isSubmitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ImportDialog
        open={openImport}
        onClose={() => setOpenImport(false)}
        title="Import Products"
        importFn={productAPI.import}
        templateFn={productAPI.importTemplate}
        templateName="products-template.csv"
        onImported={() => {
          setPage(0);
          fetchProducts();
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        title="Delete Product"
        message={
          <>
            Are you sure you want to delete <strong>{deletingProduct?.name}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteProduct}
        onClose={() => setDeletingProduct(null)}
      />
    </Box>
  );
}

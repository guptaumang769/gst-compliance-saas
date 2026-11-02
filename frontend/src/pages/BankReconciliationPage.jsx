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
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AccountBalance,
  CloudUpload,
  AutoFixHigh,
  CheckCircle,
  Block,
  UploadFile,
} from '@mui/icons-material';
import { bankAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PageHeader, StatCard, EmptyState, LoadingState, SectionCard } from '../components/common';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'UNMATCHED', label: 'Unmatched' },
  { value: 'MATCHED', label: 'Matched' },
  { value: 'IGNORED', label: 'Ignored' },
];

const STATUS_COLORS = {
  MATCHED: 'success',
  UNMATCHED: 'warning',
  IGNORED: 'default',
};

export default function BankReconciliationPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState(0);
  const [file, setFile] = useState(null);
  const [pasteName, setPasteName] = useState('');
  const [pasteRows, setPasteRows] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txnRes, summaryRes] = await Promise.all([
        bankAPI.getTransactions({ status: statusFilter || undefined }),
        bankAPI.getSummary().catch(() => null),
      ]);
      const data = txnRes.data || {};
      setTransactions(data.transactions || data.data || []);
      setSummary(summaryRes?.data?.summary || summaryRes?.data || null);
    } catch (err) {
      setTransactions([]);
      setError(handleApiError(err, 'Failed to load bank transactions'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      if (uploadTab === 0) {
        if (!file) return;
        await bankAPI.uploadStatement(file);
      } else {
        const rows = pasteRows
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        await bankAPI.uploadStatement({ name: pasteName || 'Pasted statement', rows });
      }
      handleSuccess('Statement uploaded');
      setUploadOpen(false);
      setFile(null);
      setPasteName('');
      setPasteRows('');
      fetchData();
    } catch (err) {
      handleApiError(err, 'Failed to upload statement');
    } finally {
      setUploading(false);
    }
  };

  const handleAutoReconcile = async () => {
    try {
      setReconciling(true);
      await bankAPI.reconcile({});
      handleSuccess('Auto-reconciliation complete');
      fetchData();
    } catch (err) {
      handleApiError(err, 'Auto-reconcile failed');
    } finally {
      setReconciling(false);
    }
  };

  const updateTransaction = async (txn, status) => {
    try {
      setActionId(txn.id);
      await bankAPI.updateTransaction(txn.id, { status });
      handleSuccess(status === 'MATCHED' ? 'Transaction matched' : 'Transaction ignored');
      fetchData();
    } catch (err) {
      handleApiError(err, 'Failed to update transaction');
    } finally {
      setActionId(null);
    }
  };

  const matchedCount = summary?.matched ?? summary?.matchedCount ?? 0;
  const unmatchedCount = summary?.unmatched ?? summary?.unmatchedCount ?? 0;
  const matchedValue = summary?.matchedValue ?? summary?.totalMatched ?? 0;

  return (
    <Box>
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Import bank statements and reconcile transactions against your records"
        icon={<AccountBalance />}
        actions={
          <>
            <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setUploadOpen(true)}>
              Import Statement
            </Button>
            <Button
              variant="contained"
              startIcon={<AutoFixHigh />}
              onClick={handleAutoReconcile}
              disabled={reconciling}
              className="gradient-button-primary"
            >
              {reconciling ? 'Reconciling...' : 'Auto-reconcile'}
            </Button>
          </>
        }
      />

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Matched" value={matchedCount} icon={<CheckCircle />} color="#10B981" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Unmatched" value={unmatchedCount} icon={<Block />} color="#F59E0B" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Matched Value" value={formatCurrency(matchedValue)} icon={<AccountBalance />} color="#6366F1" loading={loading} />
        </Grid>
      </Grid>

      {/* Status filter */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={statusFilter}
          onChange={(e, v) => setStatusFilter(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {STATUS_FILTERS.map((f) => (
            <Tab key={f.value} value={f.value} label={f.label} />
          ))}
        </Tabs>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={6} columns={5} />
          </Box>
        ) : transactions.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((txn, i) => {
                  const status = (txn.status || 'UNMATCHED').toUpperCase();
                  return (
                    <TableRow key={txn.id || i} hover>
                      <TableCell>{txn.date ? formatDate(txn.date) : '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{txn.description || txn.narration || '-'}</Typography>
                        {txn.matchedType && (
                          <Typography variant="caption" color="text.secondary">
                            Matched to {txn.matchedType} {txn.matchedId ? `#${txn.matchedId}` : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color={(txn.amount || 0) < 0 ? 'error.main' : 'success.main'}>
                          {formatCurrency(txn.amount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={status} size="small" color={STATUS_COLORS[status] || 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {status !== 'MATCHED' && (
                            <Tooltip title="Mark matched">
                              <IconButton size="small" color="success" onClick={() => updateTransaction(txn, 'MATCHED')} disabled={actionId === txn.id}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {status !== 'IGNORED' && (
                            <Tooltip title="Ignore">
                              <IconButton size="small" onClick={() => updateTransaction(txn, 'IGNORED')} disabled={actionId === txn.id}>
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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
            icon={<AccountBalance />}
            title="No transactions yet"
            message="Import a bank statement (CSV) to start reconciling transactions against your invoices and purchases."
            action={
              <Button variant="contained" startIcon={<UploadFile />} onClick={() => setUploadOpen(true)} className="gradient-button-primary">
                Import Statement
              </Button>
            }
          />
        )}
      </SectionCard>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Bank Statement</DialogTitle>
        <DialogContent dividers>
          <Tabs value={uploadTab} onChange={(e, v) => setUploadTab(v)} sx={{ mb: 2 }}>
            <Tab label="Upload CSV" />
            <Tab label="Paste rows" />
          </Tabs>
          {uploadTab === 0 ? (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {file ? file.name : 'Choose a .csv bank statement'}
              </Typography>
              <Button component="label" variant="contained" size="small" className="gradient-button-primary">
                {file ? 'Change File' : 'Select File'}
                <input
                  hidden
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Statement name"
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  placeholder="e.g. HDFC July 2026"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Rows (one per line: date,description,amount)"
                  value={pasteRows}
                  onChange={(e) => setPasteRows(e.target.value)}
                  placeholder={'2026-07-01,NEFT ABC Corp,15000\n2026-07-03,UPI payment,-2500'}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || (uploadTab === 0 ? !file : !pasteRows.trim())}
            className="gradient-button-primary"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Assessment,
  FileDownload,
  ReceiptLong,
  ShoppingCartCheckout,
  Percent,
  Category,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { reportsAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { formatCurrency } from '../utils/formatters';
import { PageHeader, EmptyState, LoadingState, SectionCard } from '../components/common';

const REPORTS = [
  { label: 'Sales Register', slug: 'sales-register', method: 'salesRegister', icon: <ReceiptLong /> },
  { label: 'Purchase Register', slug: 'purchase-register', method: 'purchaseRegister', icon: <ShoppingCartCheckout /> },
  { label: 'Tax Rate Summary', slug: 'tax-rate-summary', method: 'taxRateSummary', icon: <Percent /> },
  { label: 'HSN Summary', slug: 'hsn-summary', method: 'hsnSummary', icon: <Category /> },
  { label: 'ITC Analysis', slug: 'itc-analysis', method: 'itcAnalysis', icon: <AccountBalanceWallet /> },
];

// Field name heuristics for formatting/aggregation
const CURRENCY_HINTS = [
  'amount', 'value', 'total', 'tax', 'taxable', 'cgst', 'sgst', 'igst', 'cess',
  'itc', 'revenue', 'price', 'paid', 'payable', 'credit', 'debit',
];
const PERCENT_HINTS = ['rate', 'percent', 'percentage'];
const SKIP_SUM_HINTS = ['rate', 'percent', 'percentage', 'count', 'qty', 'quantity', 'id', 'no', 'number'];

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

function humanize(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const isCurrencyCol = (key) => CURRENCY_HINTS.some((h) => key.toLowerCase().includes(h)) &&
  !PERCENT_HINTS.some((h) => key.toLowerCase().includes(h));
const isPercentCol = (key) => PERCENT_HINTS.some((h) => key.toLowerCase().includes(h));
const shouldSum = (key) => !SKIP_SUM_HINTS.some((h) => key.toLowerCase() === h || key.toLowerCase().includes(h));

function formatCell(key, value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') {
    if (isCurrencyCol(key)) return formatCurrency(value);
    if (isPercentCol(key)) return `${value}%`;
    return value.toLocaleString('en-IN');
  }
  return String(value);
}

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [serverTotals, setServerTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const activeReport = REPORTS[tab];

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, startDate, endDate]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI[activeReport.method]({ startDate, endDate });
      const data = response.data || {};
      // Be flexible about the response shape.
      const list =
        data.rows ||
        data.data ||
        data.report ||
        data[activeReport.method] ||
        (Array.isArray(data) ? data : []);
      setRows(Array.isArray(list) ? list : []);
      setServerTotals(data.totals || null);
    } catch (err) {
      setRows([]);
      setServerTotals(null);
      setError(handleApiError(err, `Failed to load ${activeReport.label}`));
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => (rows.length > 0 ? Object.keys(rows[0]) : []), [rows]);

  const computedTotals = useMemo(() => {
    if (rows.length === 0) return null;
    const totals = {};
    columns.forEach((col) => {
      if (rows.some((r) => typeof r[col] === 'number') && shouldSum(col)) {
        totals[col] = rows.reduce((sum, r) => sum + (Number(r[col]) || 0), 0);
      }
    });
    return Object.keys(totals).length > 0 ? totals : null;
  }, [rows, columns]);

  const totals = serverTotals || computedTotals;

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await reportsAPI.exportCSV(activeReport.slug, { startDate, endDate });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReport.slug}_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      handleSuccess('Report exported successfully');
    } catch (err) {
      handleApiError(err, 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Analyse sales, purchases, tax and input tax credit across any date range"
        icon={<Assessment />}
        actions={
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExport}
            disabled={exporting || rows.length === 0}
            className="gradient-button-primary"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        }
      />

      {/* Date range toolbar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: endDate }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: startDate, max: today() }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Showing <strong>{activeReport.label}</strong> from{' '}
                <strong>{startDate}</strong> to <strong>{endDate}</strong>.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {REPORTS.map((r) => (
            <Tab key={r.slug} icon={r.icon} label={r.label} iconPosition="start" />
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
            <LoadingState variant="table" rows={8} columns={6} />
          </Box>
        ) : rows.length > 0 ? (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      align={typeof rows[0][col] === 'number' ? 'right' : 'left'}
                    >
                      {humanize(col)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i} hover>
                    {columns.map((col) => (
                      <TableCell key={col} align={typeof row[col] === 'number' ? 'right' : 'left'}>
                        {formatCell(col, row[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {totals && (
                  <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider', bgcolor: 'action.hover' } }}>
                    {columns.map((col, idx) => (
                      <TableCell key={col} align={typeof rows[0][col] === 'number' ? 'right' : 'left'}>
                        {idx === 0 && totals[col] === undefined
                          ? 'Total'
                          : totals[col] !== undefined
                          ? formatCell(col, totals[col])
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState
            icon={<Assessment />}
            title="No data for this period"
            message="No records were found for the selected report and date range. Try widening the date range or recording some transactions."
          />
        )}
      </SectionCard>
    </Box>
  );
}

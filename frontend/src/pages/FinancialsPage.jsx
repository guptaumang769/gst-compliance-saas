import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AssessmentOutlined,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import { financialsAPI } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { formatCurrency } from '../utils/formatters';
import { PageHeader, StatCard, EmptyState, LoadingState, SectionCard } from '../components/common';

const firstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

function AmountRow({ label, value, bold, indent }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 1,
        pl: indent ? 2 : 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" fontWeight={bold ? 700 : 400} color={bold ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 600}>
        {formatCurrency(value || 0)}
      </Typography>
    </Box>
  );
}

export default function FinancialsPage() {
  const [tab, setTab] = useState(0);
  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [asOf, setAsOf] = useState(today());
  const [pnl, setPnl] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (tab === 0) fetchPnl();
    else fetchBalanceSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, startDate, endDate, asOf]);

  const fetchPnl = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financialsAPI.getPnl({ startDate, endDate });
      setPnl(response.data || null);
    } catch (err) {
      setPnl(null);
      setError(handleApiError(err, 'Failed to load Profit & Loss'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await financialsAPI.getBalanceSheet({ asOf });
      setBalanceSheet(response.data || null);
    } catch (err) {
      setBalanceSheet(null);
      setError(handleApiError(err, 'Failed to load Balance Sheet'));
    } finally {
      setLoading(false);
    }
  };

  const renderPnl = () => {
    if (loading) return <Box sx={{ p: 2 }}><LoadingState variant="table" rows={6} columns={2} /></Box>;
    if (!pnl) {
      return <EmptyState icon={<AssessmentOutlined />} title="No data for this period" message="No profit & loss data was found for the selected date range." />;
    }
    const rows = Array.isArray(pnl.rows) ? pnl.rows : [];
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard label="Revenue" value={formatCurrency(pnl.revenue)} icon={<TrendingUp />} color="#10B981" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard label="Gross Profit" value={formatCurrency(pnl.grossProfit)} icon={<AssessmentOutlined />} color="#6366F1" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard label="Net Profit" value={formatCurrency(pnl.netProfit)} icon={<AccountBalance />} color="#8B5CF6" />
          </Grid>
        </Grid>

        <Box sx={{ maxWidth: 560 }}>
          <AmountRow label="Revenue" value={pnl.revenue} bold />
          <AmountRow label="Cost of Goods Sold (COGS)" value={pnl.cogs} indent />
          <AmountRow label="Gross Profit" value={pnl.grossProfit} bold />
          <AmountRow label="Operating Expenses" value={pnl.expenses} indent />
          <AmountRow label="Net Profit" value={pnl.netProfit} bold />
        </Box>

        {rows.length > 0 && (
          <TableContainer sx={{ mt: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Line Item</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{r.label || r.name || r.category || '-'}</TableCell>
                    <TableCell align="right">{formatCurrency(r.amount ?? r.value ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  };

  const renderBalanceSheet = () => {
    if (loading) return <Box sx={{ p: 2 }}><LoadingState variant="table" rows={6} columns={2} /></Box>;
    if (!balanceSheet) {
      return <EmptyState icon={<AccountBalance />} title="No data available" message="No balance sheet data was found as of the selected date." />;
    }
    const section = (title, data) => (
      <Grid item xs={12} md={6}>
        <SectionCard title={title}>
          {data && typeof data === 'object' && !Array.isArray(data) ? (
            Object.entries(data).map(([k, v]) =>
              typeof v === 'number' ? (
                <AmountRow key={k} label={k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase())} value={v} />
              ) : null
            )
          ) : (
            <Typography variant="body2" color="text.secondary">No data</Typography>
          )}
        </SectionCard>
      </Grid>
    );
    return (
      <Box sx={{ p: 3 }}>
        {balanceSheet.disclaimer && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {balanceSheet.disclaimer}
          </Alert>
        )}
        <Grid container spacing={3}>
          {section('Assets', balanceSheet.assets)}
          {section('Liabilities', balanceSheet.liabilities)}
          {section('Equity', balanceSheet.equity)}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Financials"
        subtitle="Profit & Loss and Balance Sheet based on your recorded transactions"
        icon={<AssessmentOutlined />}
      />

      {/* Date controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          {tab === 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={3}>
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
              <Grid item xs={12} sm={4} md={3}>
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
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="As of Date"
                  type="date"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: today() }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<AssessmentOutlined />} label="Profit & Loss" iconPosition="start" />
          <Tab icon={<AccountBalance />} label="Balance Sheet" iconPosition="start" />
        </Tabs>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {tab === 0 ? renderPnl() : renderBalanceSheet()}
      </SectionCard>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Avatar,
  LinearProgress,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  People,
  ShoppingCart,
  AccountBalance,
  MoreVert,
  Add,
  ArrowForward,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, invoiceAPI } from '../services/api';
import { formatCurrency, formatDate, calculateTrend } from '../utils/formatters';
import { handleApiError } from '../utils/errorHandler';
import { MESSAGES, INVOICE_STATUS_COLORS, STAT_COLORS } from '../utils/constants';
import '../styles/dashboard.css';

// Stat Card Component
function StatCard({ title, value, change, icon, color, trend, loading }) {
  const isPositive = trend === 'up';
  
  return (
    <Card className="stat-card">
      <CardContent>
        {loading ? (
          <Box sx={{ py: 3 }}>
            <LinearProgress />
          </Box>
        ) : (
          <Box className="stat-card-content">
            <Box className="stat-card-info">
              <Typography className="stat-card-title">
                {title}
              </Typography>
              <Typography className="stat-card-value">
                {value}
              </Typography>
              {change && (
                <Box className="stat-card-trend">
                  {isPositive ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 600 }}
                  >
                    {change}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {MESSAGES.VS_LAST_MONTH}
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar
              className="stat-card-avatar"
              sx={{
                background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
                color: color,
              }}
            >
              {icon}
            </Avatar>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

const monthsList = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);

  // Period selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, invoicesRes, trendRes] = await Promise.all([
        dashboardAPI.getSummary({ month: selectedMonth, year: selectedYear }),
        invoiceAPI.getAll({ limit: 5, sortBy: 'invoiceDate', order: 'desc' }),
        dashboardAPI.getSummary({ month: selectedMonth, year: selectedYear })
          .then(() => fetchRevenueTrend())
          .catch(() => []),
      ]);

      setDashboardData(summaryRes.data);
      setRecentInvoices(invoicesRes.data.invoices || []);
    } catch (err) {
      console.error('Dashboard API Error:', err);
      const errorMessage = handleApiError(err, MESSAGES.ERROR_LOADING_DATA);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueTrend = async () => {
    try {
      // Fetch data for the last 6 months relative to the selected period
      const trendMonths = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
        trendMonths.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }

      const trendResults = await Promise.all(
        trendMonths.map(({ month, year }) =>
          dashboardAPI.getSummary({ month, year })
            .then(res => ({
              month: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
              year,
              monthNum: month,
              revenue: res.data?.data?.sales?.totalRevenue || 0,
              tax: res.data?.data?.sales?.totalTax || 0,
            }))
            .catch(() => ({
              month: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
              year,
              monthNum: month,
              revenue: 0,
              tax: 0,
            }))
        )
      );

      setRevenueTrendData(trendResults);
    } catch (err) {
      console.error('Revenue trend error:', err);
      setRevenueTrendData([]);
    }
  };

  // Derive invoice status from available fields
  const getInvoiceStatus = (invoice) => {
    if (invoice.isPaid) return 'Paid';
    if (invoice.filedInGstr1) return 'Filed';
    if (invoice.pdfGenerated) return 'Generated';
    if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) return 'Overdue';
    return 'Draft';
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
    return INVOICE_STATUS_COLORS[statusUpper] || 'default';
  };

  const getGSTBreakdownData = () => {
    const salesData = dashboardData?.data?.sales;
    if (!salesData) return [];

    const totalCGST = salesData.cgst || 0;
    const totalSGST = salesData.sgst || 0;
    const totalIGST = salesData.igst || 0;

    if (totalCGST === 0 && totalSGST === 0 && totalIGST === 0) return [];
    
    return [
      { type: 'CGST', amount: totalCGST },
      { type: 'SGST', amount: totalSGST },
      { type: 'IGST', amount: totalIGST },
    ];
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchDashboardData} className="gradient-button-primary">
          {MESSAGES.BTN_RETRY}
        </Button>
      </Box>
    );
  }

  // Backend returns data in { data: { sales, purchases, counts, tax } } format
  const data = dashboardData?.data || {};
  const sales = data.sales || {};
  const counts = data.counts || {};
  const tax = data.tax || {};
  
  const summary = {
    totalRevenue: sales.totalRevenue || 0,
    totalInvoices: sales.invoiceCount || 0,
    totalCustomers: counts.totalCustomers || 0,
    totalTax: sales.totalTax || 0,
    totalCGST: sales.cgst || 0,
    totalSGST: sales.sgst || 0,
    totalIGST: sales.igst || 0,
  };
  
  const revenueTrend = calculateTrend(summary.totalRevenue, summary.previousMonthRevenue || 0);
  const invoiceTrend = calculateTrend(summary.totalInvoices, summary.previousMonthInvoices || 0);
  const customerTrend = calculateTrend(summary.totalCustomers, summary.previousMonthCustomers || 0);
  const taxTrend = calculateTrend(summary.totalTax, summary.previousMonthTax || 0);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const selectedMonthName = monthsList.find(m => m.value === selectedMonth)?.label || '';

  return (
    <Box>
      {/* Header with Period Selector */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {MESSAGES.DASHBOARD_WELCOME}, {displayName}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {MESSAGES.DASHBOARD_SUBTITLE}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            size="small"
            label="Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            sx={{ minWidth: 140 }}
          >
            {monthsList.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            sx={{ minWidth: 100 }}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Period Indicator */}
      <Alert severity="info" sx={{ mb: 3 }} icon={<AccountBalance />}>
        Showing data for <strong>{selectedMonthName} {selectedYear}</strong>. Use the dropdowns above to view data for other months (e.g., back-dated invoices).
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={MESSAGES.TOTAL_REVENUE}
            value={formatCurrency(summary.totalRevenue)}
            change={revenueTrend?.value}
            trend={revenueTrend?.trend}
            icon={<AccountBalance />}
            color={STAT_COLORS.REVENUE}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={MESSAGES.TOTAL_INVOICES}
            value={summary.totalInvoices || 0}
            change={invoiceTrend?.value}
            trend={invoiceTrend?.trend}
            icon={<Receipt />}
            color={STAT_COLORS.INVOICES}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={MESSAGES.TOTAL_CUSTOMERS}
            value={summary.totalCustomers || 0}
            change={customerTrend?.value}
            trend={customerTrend?.trend}
            icon={<People />}
            color={STAT_COLORS.CUSTOMERS}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={MESSAGES.GST_TAX_COLLECTED}
            value={formatCurrency(summary.totalTax)}
            change={taxTrend?.value}
            trend={taxTrend?.trend}
            icon={<ShoppingCart />}
            color={STAT_COLORS.TAX}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trend Chart (6 months) */}
        <Grid item xs={12} lg={8}>
          <Card className="chart-card">
            <CardContent>
              <Box className="chart-header">
                <Box>
                  <Typography className="chart-title">
                    {MESSAGES.REVENUE_OVERVIEW}
                  </Typography>
                  <Typography className="chart-subtitle">
                    Last 6 months revenue and tax collection
                  </Typography>
                </Box>
              </Box>
              {loading ? (
                <Box className="chart-container">
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : revenueTrendData.length > 0 && revenueTrendData.some(d => d.revenue > 0 || d.tax > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tax"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTax)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box className="chart-container">
                  <Typography color="text.secondary">
                    {MESSAGES.NO_DATA_AVAILABLE}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* GST Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography className="chart-title">
                {MESSAGES.GST_BREAKDOWN}
              </Typography>
              <Typography className="chart-subtitle" sx={{ mb: 3 }}>
                {selectedMonthName} {selectedYear} tax collection
              </Typography>
              {loading ? (
                <Box className="chart-container" sx={{ height: 250 }}>
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : getGSTBreakdownData().some(item => item.amount > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getGSTBreakdownData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="type" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box className="chart-container" sx={{ height: 250 }}>
                  <Typography color="text.secondary" align="center">
                    {MESSAGES.NO_GST_DATA}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Invoices */}
      <Card>
        <CardContent>
          <Box className="chart-header">
            <Box>
              <Typography className="chart-title">
                {MESSAGES.RECENT_INVOICES}
              </Typography>
              <Typography className="chart-subtitle">
                {MESSAGES.RECENT_INVOICES_SUBTITLE}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/invoices')}
              className="gradient-button-primary"
            >
              {MESSAGES.BTN_NEW_INVOICE}
            </Button>
          </Box>
          {loading ? (
            <LinearProgress />
          ) : recentInvoices.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.INVOICE_ID}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.CUSTOMER}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.AMOUNT}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.STATUS}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.DATE}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{MESSAGES.ACTIONS}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="invoice-table-row"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{invoice.customer?.customerName || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(invoice.totalAmount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getInvoiceStatus(invoice)}
                          color={getStatusColor(getInvoiceStatus(invoice))}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(invoice.invoiceDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${invoice.id}`);
                          }}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box className="empty-state">
              <Receipt className="empty-state-icon" />
              <Typography className="empty-state-title">
                {MESSAGES.NO_INVOICES_YET}
              </Typography>
              <Typography className="empty-state-message">
                {MESSAGES.NO_INVOICES_MESSAGE}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/invoices')}
                className="gradient-button-primary"
              >
                {MESSAGES.BTN_CREATE_INVOICE}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

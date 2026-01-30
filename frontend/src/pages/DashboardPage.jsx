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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [summaryRes, invoicesRes] = await Promise.all([
        dashboardAPI.getSummary({ month: currentMonth, year: currentYear }),
        invoiceAPI.getAll({ limit: 5, sortBy: 'invoiceDate', order: 'desc' }),
      ]);

      setDashboardData(summaryRes.data);
      setRecentInvoices(invoicesRes.data.invoices || []);
    } catch (err) {
      const errorMessage = handleApiError(err, MESSAGES.ERROR_LOADING_DATA);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
    return INVOICE_STATUS_COLORS[statusUpper] || 'default';
  };

  const getRevenueChartData = () => {
    if (!dashboardData?.monthlyData) return [];
    
    return dashboardData.monthlyData.map((item) => ({
      month: formatDate(new Date(item.year, item.month - 1), 'MMM'),
      revenue: item.totalRevenue || 0,
      tax: item.totalTax || 0,
    }));
  };

  const getGSTBreakdownData = () => {
    if (!dashboardData?.summary) return [];

    const { totalCGST = 0, totalSGST = 0, totalIGST = 0 } = dashboardData.summary;
    
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

  const summary = dashboardData?.summary || {};
  const revenueTrend = calculateTrend(summary.totalRevenue, summary.previousMonthRevenue);
  const invoiceTrend = calculateTrend(summary.totalInvoices, summary.previousMonthInvoices);
  const customerTrend = calculateTrend(summary.totalCustomers, summary.previousMonthCustomers);
  const taxTrend = calculateTrend(summary.totalTax, summary.previousMonthTax);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {MESSAGES.DASHBOARD_WELCOME}, {displayName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {MESSAGES.DASHBOARD_SUBTITLE}
        </Typography>
      </Box>

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
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card className="chart-card">
            <CardContent>
              <Box className="chart-header">
                <Box>
                  <Typography className="chart-title">
                    {MESSAGES.REVENUE_OVERVIEW}
                  </Typography>
                  <Typography className="chart-subtitle">
                    {MESSAGES.REVENUE_OVERVIEW_SUBTITLE}
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              {loading ? (
                <Box className="chart-container">
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : getRevenueChartData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getRevenueChartData()}>
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
                {MESSAGES.GST_BREAKDOWN_SUBTITLE}
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
                          {formatCurrency(invoice.grandTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status || 'Pending'}
                          color={getStatusColor(invoice.status)}
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

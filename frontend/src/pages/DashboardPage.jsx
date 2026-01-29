import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
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
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, invoiceAPI, customerAPI } from '../services/api';

// Stat Card Component
function StatCard({ title, value, change, icon, color, trend, loading }) {
  const isPositive = trend === 'up';
  
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent>
        {loading ? (
          <Box sx={{ py: 3 }}>
            <LinearProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {value}
              </Typography>
              {change && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                    vs last month
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
                color: color,
                width: 56,
                height: 56,
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
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current date for filtering
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Fetch all data in parallel
      const [summaryRes, invoicesRes, customersRes] = await Promise.all([
        dashboardAPI.getSummary({ month: currentMonth, year: currentYear }),
        invoiceAPI.getAll({ limit: 5, sortBy: 'invoiceDate', order: 'desc' }),
        dashboardAPI.getTopCustomers({ limit: 5 }),
      ]);

      setDashboardData(summaryRes.data);
      setRecentInvoices(invoicesRes.data.invoices || []);
      setTopCustomers(customersRes.data.customers || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'paid') return 'success';
    if (statusLower === 'pending') return 'warning';
    if (statusLower === 'overdue') return 'error';
    return 'default';
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend: change >= 0 ? 'up' : 'down',
    };
  };

  // Prepare chart data from dashboard summary
  const getRevenueChartData = () => {
    if (!dashboardData?.monthlyData) return [];
    
    return dashboardData.monthlyData.map((item) => ({
      month: format(new Date(item.year, item.month - 1), 'MMM'),
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
        <Button variant="contained" onClick={fetchDashboardData}>
          Retry
        </Button>
      </Box>
    );
  }

  const summary = dashboardData?.summary || {};
  const revenueTrend = calculateTrend(summary.totalRevenue, summary.previousMonthRevenue);
  const invoiceTrend = calculateTrend(summary.totalInvoices, summary.previousMonthInvoices);
  const customerTrend = calculateTrend(summary.totalCustomers, summary.previousMonthCustomers);
  const taxTrend = calculateTrend(summary.totalTax, summary.previousMonthTax);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your business today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            change={revenueTrend?.value}
            trend={revenueTrend?.trend}
            icon={<AccountBalance />}
            color="#6366F1"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={summary.totalInvoices || 0}
            change={invoiceTrend?.value}
            trend={invoiceTrend?.trend}
            icon={<Receipt />}
            color="#8B5CF6"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={summary.totalCustomers || 0}
            change={customerTrend?.value}
            trend={customerTrend?.trend}
            icon={<People />}
            color="#10B981"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="GST Tax Collected"
            value={formatCurrency(summary.totalTax)}
            change={taxTrend?.value}
            trend={taxTrend?.trend}
            icon={<ShoppingCart />}
            color="#F59E0B"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Revenue Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly revenue and tax collection
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              {loading ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">
                    No data available. Create your first invoice to see the chart!
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
              <Typography variant="h6" fontWeight={600} gutterBottom>
                GST Breakdown
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current month tax collection
              </Typography>
              {loading ? (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" align="center">
                    No GST data available yet
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Recent Invoices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Latest invoices from your business
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/invoices')}
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              New Invoice
            </Button>
          </Box>
          {loading ? (
            <LinearProgress />
          ) : recentInvoices.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Invoice Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#F9FAFB',
                          cursor: 'pointer',
                        },
                      }}
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
                          {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMM yyyy') : 'N/A'}
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
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No invoices yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first invoice to start tracking revenue
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/invoices')}
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Create Invoice
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

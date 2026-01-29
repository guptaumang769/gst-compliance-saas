import { useState, useEffect } from 'react';
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
import { dashboardAPI } from '../services/api';

// Stat Card Component
function StatCard({ title, value, change, icon, color, trend }) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
              {value}
            </Typography>
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
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        revenue: '₹2,45,680',
        invoices: 45,
        customers: 28,
        gstTax: '₹44,223',
      });
      setLoading(false);
    }, 500);
  }, []);

  // Sample data for charts
  const revenueData = [
    { month: 'Jul', revenue: 180000, tax: 32400 },
    { month: 'Aug', revenue: 210000, tax: 37800 },
    { month: 'Sep', revenue: 195000, tax: 35100 },
    { month: 'Oct', revenue: 225000, tax: 40500 },
    { month: 'Nov', revenue: 240000, tax: 43200 },
    { month: 'Dec', revenue: 245680, tax: 44223 },
  ];

  const gstBreakdown = [
    { type: 'CGST', amount: 20000 },
    { type: 'SGST', amount: 20000 },
    { type: 'IGST', amount: 4223 },
  ];

  const recentInvoices = [
    { id: 'INV-045', customer: 'Acme Corp', amount: '₹45,000', status: 'Paid', date: '2026-01-28' },
    { id: 'INV-044', customer: 'Tech Solutions', amount: '₹32,500', status: 'Pending', date: '2026-01-27' },
    { id: 'INV-043', customer: 'Global Traders', amount: '₹67,800', status: 'Paid', date: '2026-01-26' },
    { id: 'INV-042', customer: 'XYZ Industries', amount: '₹28,900', status: 'Overdue', date: '2026-01-20' },
    { id: 'INV-041', customer: 'Prime Enterprises', amount: '₹54,300', status: 'Paid', date: '2026-01-19' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome back, {user?.name || 'User'}! 👋
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
            value={stats?.revenue}
            change="+12.5%"
            trend="up"
            icon={<AccountBalance />}
            color="#6366F1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Invoices"
            value={stats?.invoices}
            change="+8.2%"
            trend="up"
            icon={<Receipt />}
            color="#8B5CF6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats?.customers}
            change="+4.3%"
            trend="up"
            icon={<People />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="GST Tax Collected"
            value={stats?.gstTax}
            change="+15.8%"
            trend="up"
            icon={<ShoppingCart />}
            color="#F59E0B"
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
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
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
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gstBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="type" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              sx={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              New Invoice
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Invoice ID</TableCell>
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
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {invoice.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {invoice.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {invoice.date}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <ArrowForward fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  Receipt,
  Business,
  MonitorHeart,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { adminAPI } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { formatDate } from '../utils/formatters';
import { PageHeader, StatCard, EmptyState, LoadingState, SectionCard } from '../components/common';

const humanize = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const STAT_ICONS = [<People />, <Receipt />, <Business />, <AdminPanelSettings />];
const STAT_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B'];

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, activityRes, healthRes] = await Promise.all([
        adminAPI.getOverview().catch(() => null),
        adminAPI.getActivity().catch(() => null),
        adminAPI.getHealth().catch(() => null),
      ]);
      setOverview(overviewRes?.data?.overview || overviewRes?.data || null);
      const activityData = activityRes?.data || {};
      setActivity(activityData.activity || activityData.logs || activityData.data || []);
      setHealth(healthRes?.data?.health || healthRes?.data || null);
      if (!overviewRes && !activityRes && !healthRes) {
        setError('Admin data is currently unavailable.');
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  };

  // Turn the overview object into displayable stat cards (numbers only).
  const overviewStats = overview
    ? Object.entries(overview)
        .filter(([, v]) => typeof v === 'number')
        .slice(0, 4)
    : [];

  const renderHealthValue = (value) => {
    if (typeof value === 'boolean') {
      return (
        <Chip
          size="small"
          label={value ? 'Healthy' : 'Down'}
          color={value ? 'success' : 'error'}
          icon={value ? <CheckCircle /> : <ErrorIcon />}
        />
      );
    }
    const str = String(value).toLowerCase();
    if (['ok', 'up', 'healthy', 'connected', 'online'].includes(str)) {
      return <Chip size="small" label={String(value)} color="success" icon={<CheckCircle />} />;
    }
    if (['down', 'error', 'offline', 'disconnected'].includes(str)) {
      return <Chip size="small" label={String(value)} color="error" icon={<ErrorIcon />} />;
    }
    return <Typography variant="body2" fontWeight={600}>{String(value)}</Typography>;
  };

  return (
    <Box>
      <PageHeader
        title="Admin"
        subtitle="System overview, recent activity and service health"
        icon={<AdminPanelSettings />}
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overview stat cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatCard label="Loading" value="" loading />
            </Grid>
          ))
        ) : overviewStats.length > 0 ? (
          overviewStats.map(([key, value], i) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <StatCard
                label={humanize(key)}
                value={typeof value === 'number' ? value.toLocaleString('en-IN') : value}
                icon={STAT_ICONS[i % STAT_ICONS.length]}
                color={STAT_COLORS[i % STAT_COLORS.length]}
              />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <SectionCard>
              <EmptyState dense icon={<AdminPanelSettings />} title="No overview data" message="System overview metrics are not available." />
            </SectionCard>
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent activity */}
        <Grid item xs={12} md={7}>
          <SectionCard title="Recent Activity" icon={<Receipt />} noPadding>
            {loading ? (
              <Box sx={{ p: 2 }}>
                <LoadingState variant="table" rows={6} columns={3} />
              </Box>
            ) : activity.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date &amp; Time</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activity.map((a, i) => (
                      <TableRow key={a.id || i} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(a.createdAt || a.timestamp || a.date, 'dd MMM yyyy, HH:mm')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {a.userName || a.user?.name || a.user?.email || a.userEmail || 'System'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {a.action || a.event || a.description || a.message || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyState dense icon={<Receipt />} title="No recent activity" message="System activity will appear here." />
            )}
          </SectionCard>
        </Grid>

        {/* System health */}
        <Grid item xs={12} md={5}>
          <SectionCard title="System Health" icon={<MonitorHeart />}>
            {loading ? (
              <LoadingState variant="spinner" label="Checking services..." />
            ) : health && typeof health === 'object' ? (
              <Box>
                {Object.entries(health).map(([key, value]) => (
                  <Box
                    key={key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.25,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {humanize(key)}
                    </Typography>
                    {renderHealthValue(value)}
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState dense icon={<MonitorHeart />} title="No health data" message="Service health information is not available." />
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}

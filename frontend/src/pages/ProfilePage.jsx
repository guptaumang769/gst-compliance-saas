import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Business,
  Person,
  Email,
  Phone,
  LocationOn,
  Badge,
  CalendarToday,
  Settings,
  AccountBalance,
} from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../utils/errorHandler';
import { formatDate } from '../utils/formatters';

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
      <Box sx={{ color: 'primary.main', mt: 0.3 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={500}>{value || '—'}</Typography>
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getProfile();
      setProfileData(response.data?.user || response.data);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load profile');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} align="center">
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchProfile}>Retry</Button>
      </Box>
    );
  }

  const business = profileData?.businesses?.[0] || {};
  const displayName = profileData?.email?.split('@')[0] || 'User';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your account and business information
        </Typography>
      </Box>

      {/* Profile Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              {displayName[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>{displayName}</Typography>
              <Typography variant="body1" color="text.secondary">{profileData?.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip label={profileData?.role || 'Owner'} color="primary" size="small" />
                <Chip
                  label={profileData?.isActive ? 'Active' : 'Inactive'}
                  color={profileData?.isActive ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
                {profileData?.emailVerified && (
                  <Chip label="Email Verified" color="info" size="small" variant="outlined" />
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => navigate('/settings')}
            >
              Edit Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* User Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight={700}>User Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <InfoRow icon={<Email fontSize="small" />} label="Email" value={profileData?.email} />
              <InfoRow icon={<Phone fontSize="small" />} label="Phone" value={business?.phone} />
              <InfoRow icon={<Badge fontSize="small" />} label="Role" value={profileData?.role} />
              <InfoRow
                icon={<CalendarToday fontSize="small" />}
                label="Member Since"
                value={formatDate(profileData?.createdAt)}
              />
              <InfoRow
                icon={<CalendarToday fontSize="small" />}
                label="Last Login"
                value={formatDate(profileData?.lastLogin)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Business Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                <Typography variant="h6" fontWeight={700}>Business Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <InfoRow icon={<Business fontSize="small" />} label="Business Name" value={business?.businessName} />
              <InfoRow icon={<Badge fontSize="small" />} label="Business Type" value={business?.businessType} />
              <InfoRow icon={<Badge fontSize="small" />} label="GSTIN" value={business?.gstin} />
              <InfoRow icon={<Badge fontSize="small" />} label="PAN" value={business?.pan} />
              <InfoRow icon={<Email fontSize="small" />} label="Business Email" value={business?.email} />
              <InfoRow icon={<Phone fontSize="small" />} label="Business Phone" value={business?.phone} />
            </CardContent>
          </Card>
        </Grid>

        {/* Address */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOn color="primary" />
                <Typography variant="h6" fontWeight={700}>Business Address</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <InfoRow icon={<LocationOn fontSize="small" />} label="Address Line 1" value={business?.addressLine1} />
              {business?.addressLine2 && (
                <InfoRow icon={<LocationOn fontSize="small" />} label="Address Line 2" value={business?.addressLine2} />
              )}
              <InfoRow icon={<LocationOn fontSize="small" />} label="City" value={business?.city} />
              <InfoRow icon={<LocationOn fontSize="small" />} label="State" value={business?.state} />
              <InfoRow icon={<LocationOn fontSize="small" />} label="Pincode" value={business?.pincode} />
              <InfoRow icon={<Badge fontSize="small" />} label="State Code" value={business?.stateCode} />
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AccountBalance color="primary" />
                <Typography variant="h6" fontWeight={700}>Subscription & Filing</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <InfoRow icon={<Badge fontSize="small" />} label="Plan" value={business?.subscriptionPlan?.replace('_', ' ')} />
              <InfoRow
                icon={<Badge fontSize="small" />}
                label="Status"
                value={
                  <Chip
                    label={business?.subscriptionStatus || 'Active'}
                    color={business?.subscriptionStatus === 'active' ? 'success' : 'warning'}
                    size="small"
                  />
                }
              />
              <InfoRow icon={<Badge fontSize="small" />} label="Filing Frequency" value={business?.filingFrequency} />
              <InfoRow
                icon={<Badge fontSize="small" />}
                label="Invoice Usage"
                value={`${business?.invoiceCountCurrentMonth || 0} / ${business?.invoiceLimit || 100} this month`}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

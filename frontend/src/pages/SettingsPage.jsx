import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Alert,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Business,
  Security,
  Notifications,
  Save,
  Person,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../services/api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import { INDIAN_STATES, BUSINESS_TYPES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

// Business Profile Schema
const businessSchema = Yup.object({
  businessName: Yup.string().required('Business name is required'),
  gstin: Yup.string().required('GSTIN is required'),
  pan: Yup.string().required('PAN is required'),
  state: Yup.string().required('State is required'),
  addressLine1: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  pincode: Yup.string().required('Pincode is required'),
});

// User Profile Schema
const userProfileSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

// Password Schema
const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function SettingsPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    gstReturnReminders: true,
    paymentAlerts: true,
  });

  const businessFormik = useFormik({
    initialValues: {
      businessName: '',
      gstin: '',
      pan: '',
      state: '',
      businessType: 'Proprietorship',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      phone: '',
      email: '',
    },
    validationSchema: businessSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authAPI.updateProfile({
          businessName: values.businessName,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          businessType: values.businessType,
          phone: values.phone,
          email: values.email,
        });
        handleSuccess('Business profile updated successfully');
      } catch (err) {
        handleApiError(err, 'Failed to update business profile');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const userFormik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: userProfileSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authAPI.updateProfile({
          userEmail: values.email,
        });
        handleSuccess('User profile updated successfully');
      } catch (err) {
        handleApiError(err, 'Failed to update user profile');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // Backend expects { oldPassword, newPassword }
        await authAPI.changePassword({
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        handleSuccess('Password changed successfully! Please log in with your new password next time.');
        resetForm();
      } catch (err) {
        handleApiError(err, 'Failed to change password');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getProfile();
      const userData = response.data?.user || response.data;
      const business = userData?.businesses?.[0] || {};

      // Populate user profile form
      userFormik.setValues({
        email: userData?.email || '',
      });

      // Populate business form
      businessFormik.setValues({
        businessName: business.businessName || '',
        gstin: business.gstin || '',
        pan: business.pan || '',
        state: business.state || '',
        businessType: business.businessType || 'Proprietorship',
        addressLine1: business.addressLine1 || '',
        addressLine2: business.addressLine2 || '',
        city: business.city || '',
        pincode: business.pincode || '',
        phone: business.phone || '',
        email: business.email || '',
      });
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load profile data');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const handleSaveNotifications = () => {
    handleSuccess('Notification preferences saved');
  };

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} align="center">
          Loading settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your business preferences, security, and notifications
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Business />} label="Business Profile" iconPosition="start" />
          <Tab icon={<Person />} label="User Profile" iconPosition="start" />
          <Tab icon={<Security />} label="Change Password" iconPosition="start" />
          <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
        </Tabs>
      </Card>

      {/* Business Profile Tab */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <form onSubmit={businessFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Business Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="businessName"
                    name="businessName"
                    label="Business Name *"
                    value={businessFormik.values.businessName}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.businessName && Boolean(businessFormik.errors.businessName)}
                    helperText={businessFormik.touched.businessName && businessFormik.errors.businessName}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    id="businessType"
                    name="businessType"
                    label="Business Type *"
                    value={businessFormik.values.businessType}
                    onChange={businessFormik.handleChange}
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="gstin"
                    name="gstin"
                    label="GSTIN *"
                    value={businessFormik.values.gstin}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.gstin && Boolean(businessFormik.errors.gstin)}
                    helperText={businessFormik.touched.gstin && businessFormik.errors.gstin}
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="pan"
                    name="pan"
                    label="PAN *"
                    value={businessFormik.values.pan}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.pan && Boolean(businessFormik.errors.pan)}
                    helperText={businessFormik.touched.pan && businessFormik.errors.pan}
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="addressLine1"
                    name="addressLine1"
                    label="Address Line 1 *"
                    value={businessFormik.values.addressLine1}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.addressLine1 && Boolean(businessFormik.errors.addressLine1)}
                    helperText={businessFormik.touched.addressLine1 && businessFormik.errors.addressLine1}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="addressLine2"
                    name="addressLine2"
                    label="Address Line 2"
                    value={businessFormik.values.addressLine2}
                    onChange={businessFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="city"
                    name="city"
                    label="City *"
                    value={businessFormik.values.city}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.city && Boolean(businessFormik.errors.city)}
                    helperText={businessFormik.touched.city && businessFormik.errors.city}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    id="state"
                    name="state"
                    label="State *"
                    value={businessFormik.values.state}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.state && Boolean(businessFormik.errors.state)}
                    helperText={businessFormik.touched.state && businessFormik.errors.state}
                  >
                    {INDIAN_STATES.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="pincode"
                    name="pincode"
                    label="Pincode *"
                    value={businessFormik.values.pincode}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.pincode && Boolean(businessFormik.errors.pincode)}
                    helperText={businessFormik.touched.pincode && businessFormik.errors.pincode}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label="Business Phone"
                    value={businessFormik.values.phone}
                    onChange={businessFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Business Email"
                    type="email"
                    value={businessFormik.values.email}
                    onChange={businessFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    GSTIN and PAN cannot be changed. Contact support if you need to update these.
                  </Alert>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={businessFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    {businessFormik.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User Profile Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <form onSubmit={userFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    User Profile
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="userEmail"
                    name="email"
                    label="Login Email *"
                    type="email"
                    value={userFormik.values.email}
                    onChange={userFormik.handleChange}
                    onBlur={userFormik.handleBlur}
                    error={userFormik.touched.email && Boolean(userFormik.errors.email)}
                    helperText={userFormik.touched.email && userFormik.errors.email}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This is the email you use to log in. Changing it will require you to use the new email for future logins. Your phone number is stored under Business Profile.
                  </Alert>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={userFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    {userFormik.isSubmitting ? 'Saving...' : 'Update Email'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change Password Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <form onSubmit={passwordFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="currentPassword"
                    name="currentPassword"
                    label="Current Password *"
                    type="password"
                    value={passwordFormik.values.currentPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                    helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                  />
                </Grid>

                <Grid item xs={12} md={6} />

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="New Password *"
                    type="password"
                    value={passwordFormik.values.newPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                    helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password *"
                    type="password"
                    value={passwordFormik.values.confirmPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                    helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    Password must be at least 8 characters and contain uppercase, lowercase, and numbers.
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={passwordFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    {passwordFormik.isSubmitting ? 'Changing...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Receive general email notifications
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.invoiceReminders}
                      onChange={() => handleNotificationChange('invoiceReminders')}
                    />
                  }
                  label="Invoice Reminders"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Get reminded about overdue invoices
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.gstReturnReminders}
                      onChange={() => handleNotificationChange('gstReturnReminders')}
                    />
                  }
                  label="GST Return Reminders"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Get reminded before GST filing deadlines
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.paymentAlerts}
                      onChange={() => handleNotificationChange('paymentAlerts')}
                    />
                  }
                  label="Payment Alerts"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Receive alerts for received payments
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveNotifications}
                  className="gradient-button-primary"
                >
                  Save Preferences
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

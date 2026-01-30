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
} from '@mui/material';
import {
  Business,
  Person,
  Security,
  Notifications,
  Save,
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
const userSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().matches(/^[6-9]\d{9}$/, 'Invalid phone number'),
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
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // await businessAPI.update(values);
        handleSuccess('Business profile updated successfully');
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const userFormik = useFormik({
    initialValues: {
      email: user?.email || '',
      phone: '',
    },
    validationSchema: userSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // await userAPI.update(values);
        handleSuccess('User profile updated successfully');
      } catch (err) {
        handleApiError(err);
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
        // await authAPI.changePassword(values);
        handleSuccess('Password changed successfully');
        resetForm();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };

  const handleSaveNotifications = () => {
    // Save notification settings
    handleSuccess('Notification preferences saved');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account and business preferences
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
          <Tab icon={<Security />} label="Security" iconPosition="start" />
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
                    label="Phone"
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
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={businessFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    Save Changes
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
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email *"
                    type="email"
                    value={userFormik.values.email}
                    onChange={userFormik.handleChange}
                    onBlur={userFormik.handleBlur}
                    error={userFormik.touched.email && Boolean(userFormik.errors.email)}
                    helperText={userFormik.touched.email && userFormik.errors.email}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label="Phone"
                    value={userFormik.values.phone}
                    onChange={userFormik.handleChange}
                    onBlur={userFormik.handleBlur}
                    error={userFormik.touched.phone && Boolean(userFormik.errors.phone)}
                    helperText={userFormik.touched.phone && userFormik.errors.phone}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={userFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
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
                    Change Password
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

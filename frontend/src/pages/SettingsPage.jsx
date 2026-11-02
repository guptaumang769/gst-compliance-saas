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
  AccountBalance,
  ReceiptLong,
  CloudUpload,
  Image as ImageIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Avatar, InputAdornment } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI, businessAPI } from '../services/api';
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
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Invalid phone number. Must be 10 digits starting with 6-9')
    .nullable(),
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
  const { user, updateUser } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    gstReturnReminders: true,
    paymentAlerts: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  const bankFormik = useFormik({
    initialValues: {
      bankName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankBranch: '',
      filingFrequency: 'monthly',
    },
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authAPI.updateSettings(values);
        handleSuccess('Bank details and filing settings saved successfully');
      } catch (err) {
        handleApiError(err, 'Failed to save settings');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const invoiceFormik = useFormik({
    initialValues: {
      invoicePrefix: '',
      invoiceNumberFormat: '',
      invoiceNextNumber: 1,
      defaultTerms: '',
    },
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await authAPI.updateSettings({
          invoicePrefix: values.invoicePrefix,
          invoiceNumberFormat: values.invoiceNumberFormat,
          invoiceNextNumber: parseInt(values.invoiceNextNumber, 10) || 1,
          defaultTerms: values.defaultTerms,
        });
        handleSuccess('Invoice settings saved');
      } catch (err) {
        handleApiError(err, 'Failed to save invoice settings');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleLogoSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      handleApiError({ message: 'Please select a valid image file' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      handleApiError({ message: 'Logo must be smaller than 2 MB' });
      return;
    }
    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    try {
      setUploadingLogo(true);
      const response = await businessAPI.uploadLogo(file);
      const url = response.data?.logoUrl || response.data?.url || response.data?.logo;
      if (url) {
        setLogoPreview(url);
        updateUser({ logoUrl: url });
      }
      handleSuccess('Logo uploaded successfully');
    } catch (err) {
      handleApiError(err, 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  // Preview the invoice number that would be generated
  const previewInvoiceNumber = () => {
    const prefix = invoiceFormik.values.invoicePrefix || '';
    const next = String(invoiceFormik.values.invoiceNextNumber || 1);
    const format = invoiceFormik.values.invoiceNumberFormat;
    if (format) {
      const now = new Date();
      return format
        .replace(/\{PREFIX\}/gi, prefix)
        .replace(/\{YYYY\}/g, now.getFullYear())
        .replace(/\{YY\}/g, String(now.getFullYear()).slice(-2))
        .replace(/\{MM\}/g, String(now.getMonth() + 1).padStart(2, '0'))
        .replace(/\{FY\}/gi, `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(-2)}`)
        .replace(/\{SEQ(\d*)\}/gi, (m, len) => next.padStart(parseInt(len, 10) || 4, '0'))
        .replace(/\{NUMBER\}/gi, next);
    }
    return `${prefix}${next.padStart(4, '0')}`;
  };

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

      // Populate bank details form
      bankFormik.setValues({
        bankName: business.bankName || '',
        bankAccountNumber: business.bankAccountNumber || '',
        bankIfsc: business.bankIfsc || '',
        bankBranch: business.bankBranch || '',
        filingFrequency: business.filingFrequency || 'monthly',
      });

      // Populate invoice numbering form
      invoiceFormik.setValues({
        invoicePrefix: business.invoicePrefix || '',
        invoiceNumberFormat: business.invoiceNumberFormat || '',
        invoiceNextNumber: business.invoiceNextNumber || 1,
        defaultTerms: business.defaultTerms || '',
      });

      // Existing business logo (if any)
      if (business.logoUrl || business.logo) {
        setLogoPreview(business.logoUrl || business.logo);
      }
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

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      handleSuccess('Notification preferences saved');
    } catch (err) {
      handleApiError(err, 'Failed to save notification preferences');
    } finally {
      setSavingNotifications(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try { setNotificationSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

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
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Business />} label="Business Profile" iconPosition="start" />
          <Tab icon={<Person />} label="User Profile" iconPosition="start" />
          <Tab icon={<AccountBalance />} label="Bank & Filing" iconPosition="start" />
          <Tab icon={<ReceiptLong />} label="Branding & Invoicing" iconPosition="start" />
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
                    placeholder="e.g. 9876543210"
                    value={businessFormik.values.phone}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.phone && Boolean(businessFormik.errors.phone)}
                    helperText={businessFormik.touched.phone && businessFormik.errors.phone}
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

      {/* Bank Details & Filing Frequency Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <form onSubmit={bankFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Bank Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Bank details will appear on your invoice PDFs
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="bankName"
                    name="bankName"
                    label="Bank Name"
                    value={bankFormik.values.bankName}
                    onChange={bankFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    label="Account Number"
                    value={bankFormik.values.bankAccountNumber}
                    onChange={bankFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="bankIfsc"
                    name="bankIfsc"
                    label="IFSC Code"
                    value={bankFormik.values.bankIfsc}
                    onChange={bankFormik.handleChange}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="bankBranch"
                    name="bankBranch"
                    label="Branch Name"
                    value={bankFormik.values.bankBranch}
                    onChange={bankFormik.handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    GST Filing Frequency
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    id="filingFrequency"
                    name="filingFrequency"
                    label="Filing Frequency"
                    value={bankFormik.values.filingFrequency}
                    onChange={bankFormik.handleChange}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly (QRMP Scheme)</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Quarterly filing (QRMP) is available for businesses with annual turnover up to Rs. 5 crore.
                  </Alert>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={bankFormik.isSubmitting}
                    className="gradient-button-primary"
                  >
                    {bankFormik.isSubmitting ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Branding & Invoicing Tab */}
      {currentTab === 3 && (
        <Grid container spacing={3}>
          {/* Business Logo */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Business Logo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Appears on your invoice PDFs. PNG or JPG, up to 2 MB.
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    variant="rounded"
                    src={logoPreview || undefined}
                    sx={{
                      width: 140,
                      height: 140,
                      bgcolor: 'action.hover',
                      color: 'text.disabled',
                      border: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    {!logoPreview && <ImageIcon sx={{ fontSize: 48 }} />}
                  </Avatar>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component="label"
                      variant="contained"
                      startIcon={<CloudUpload />}
                      disabled={uploadingLogo}
                      className="gradient-button-primary"
                    >
                      {uploadingLogo ? 'Uploading...' : logoPreview ? 'Replace Logo' : 'Upload Logo'}
                      <input hidden type="file" accept="image/*" onChange={handleLogoSelect} />
                    </Button>
                    {logoPreview && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        disabled={uploadingLogo}
                        onClick={() => setLogoPreview(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice Numbering */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <form onSubmit={invoiceFormik.handleSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Invoice Numbering
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Control how invoice numbers are generated for new invoices.
                  </Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="invoicePrefix"
                        name="invoicePrefix"
                        label="Invoice Prefix"
                        placeholder="INV-"
                        value={invoiceFormik.values.invoicePrefix}
                        onChange={invoiceFormik.handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="invoiceNextNumber"
                        name="invoiceNextNumber"
                        label="Next Number"
                        type="number"
                        value={invoiceFormik.values.invoiceNextNumber}
                        onChange={invoiceFormik.handleChange}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="invoiceNumberFormat"
                        name="invoiceNumberFormat"
                        label="Number Format (optional)"
                        placeholder="{PREFIX}{FY}/{SEQ4}"
                        value={invoiceFormik.values.invoiceNumberFormat}
                        onChange={invoiceFormik.handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ReceiptLong fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          Available tokens:
                        </Typography>
                        <Typography variant="caption" component="div" color="text.secondary">
                          <code>{'{PREFIX}'}</code> prefix &nbsp;•&nbsp;
                          <code>{'{FY}'}</code> financial year &nbsp;•&nbsp;
                          <code>{'{YYYY}'}</code> / <code>{'{YY}'}</code> year &nbsp;•&nbsp;
                          <code>{'{MM}'}</code> month &nbsp;•&nbsp;
                          <code>{'{SEQ4}'}</code> zero-padded sequence &nbsp;•&nbsp;
                          <code>{'{NUMBER}'}</code> raw number
                        </Typography>
                      </Alert>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Preview:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={700}>
                          {previewInvoiceNumber()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Default Terms &amp; Conditions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        These terms are pre-filled on new invoices. You can still override them per invoice.
                      </Typography>
                      <TextField
                        fullWidth
                        id="defaultTerms"
                        name="defaultTerms"
                        label="Default Terms & Conditions"
                        placeholder="e.g. Payment due within 30 days. Goods once sold will not be taken back."
                        multiline
                        rows={4}
                        value={invoiceFormik.values.defaultTerms}
                        onChange={invoiceFormik.handleChange}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={invoiceFormik.isSubmitting}
                        className="gradient-button-primary"
                      >
                        {invoiceFormik.isSubmitting ? 'Saving...' : 'Save Invoice Settings'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Change Password Tab */}
      {currentTab === 4 && (
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
      {currentTab === 5 && (
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
                  disabled={savingNotifications}
                  className="gradient-button-primary"
                >
                  {savingNotifications ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

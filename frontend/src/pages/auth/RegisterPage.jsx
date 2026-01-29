import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  MenuItem,
  Link,
  Container,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const businessTypes = ['Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP'];

const userSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const businessSchema = Yup.object({
  businessName: Yup.string().required('Business name is required'),
  gstin: Yup.string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .required('GSTIN is required'),
  pan: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .required('PAN is required'),
  addressLine1: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  pincode: Yup.string()
    .matches(/^[1-9][0-9]{5}$/, 'Invalid pincode')
    .required('Pincode is required'),
  businessType: Yup.string().required('Business type is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Invalid phone number')
    .required('Phone number is required'),
  email: Yup.string().email('Invalid email address'),
});

const steps = ['Account Details', 'Business Information'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const userFormik = useFormik({
    initialValues: userData,
    validationSchema: userSchema,
    onSubmit: (values) => {
      setUserData(values);
      setActiveStep(1);
    },
  });

  const businessFormik = useFormik({
    initialValues: {
      businessName: '',
      businessType: '',
      gstin: '',
      pan: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
    },
    validationSchema: businessSchema,
    onSubmit: async (values) => {
      setLoading(true);

      const registrationData = {
        email: userData.email,
        password: userData.password,
        businessName: values.businessName,
        businessType: values.businessType,
        gstin: values.gstin,
        pan: values.pan,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        phone: values.phone,
        businessEmail: values.email,
      };

      // DEBUG: Log registration data
      console.log('=== FRONTEND: Sending Registration Data ===');
      console.log(JSON.stringify(registrationData, null, 2));
      console.log('=== END ===');

      const result = await register(registrationData);
      setLoading(false);

      if (result.success) {
        navigate('/dashboard');
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-250px',
          right: '-250px',
          animation: 'float 7s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(30px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          bottom: '-180px',
          left: '-180px',
          animation: 'float 9s ease-in-out infinite',
        }}
      />

      <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Logo/Brand Section */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                mb: 2,
              }}
            >
              <RegisterIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Create Your Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start managing your GST compliance effortlessly
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: User Credentials */}
          {activeStep === 0 && (
            <Box component="form" onSubmit={userFormik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={userFormik.values.email}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.email && Boolean(userFormik.errors.email)}
                helperText={userFormik.touched.email && userFormik.errors.email}
                margin="normal"
                autoComplete="email"
                autoFocus
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={userFormik.values.password}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.password && Boolean(userFormik.errors.password)}
                helperText={userFormik.touched.password && userFormik.errors.password}
                margin="normal"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
              />

              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={userFormik.values.confirmPassword}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.confirmPassword && Boolean(userFormik.errors.confirmPassword)}
                helperText={userFormik.touched.confirmPassword && userFormik.errors.confirmPassword}
                margin="normal"
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
                  },
                }}
              >
                Continue
              </Button>
            </Box>
          )}

          {/* Step 2: Business Details */}
          {activeStep === 1 && (
            <Box component="form" onSubmit={businessFormik.handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="businessName"
                    name="businessName"
                    label="Business Name"
                    value={businessFormik.values.businessName}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.businessName && Boolean(businessFormik.errors.businessName)}
                    helperText={businessFormik.touched.businessName && businessFormik.errors.businessName}
                    margin="normal"
                    autoFocus
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    id="businessType"
                    name="businessType"
                    label="Business Type"
                    value={businessFormik.values.businessType}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.businessType && Boolean(businessFormik.errors.businessType)}
                    helperText={businessFormik.touched.businessType && businessFormik.errors.businessType}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  >
                    {businessTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="phone"
                    name="phone"
                    label="Phone Number"
                    value={businessFormik.values.phone}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.phone && Boolean(businessFormik.errors.phone)}
                    helperText={businessFormik.touched.phone && businessFormik.errors.phone}
                    margin="normal"
                    placeholder="9876543210"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="gstin"
                    name="gstin"
                    label="GSTIN"
                    value={businessFormik.values.gstin}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.gstin && Boolean(businessFormik.errors.gstin)}
                    helperText={businessFormik.touched.gstin && businessFormik.errors.gstin}
                    margin="normal"
                    placeholder="27AABCT1332L1ZM"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="pan"
                    name="pan"
                    label="PAN"
                    value={businessFormik.values.pan}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.pan && Boolean(businessFormik.errors.pan)}
                    helperText={businessFormik.touched.pan && businessFormik.errors.pan}
                    margin="normal"
                    placeholder="AABCT1332L"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="addressLine1"
                    name="addressLine1"
                    label="Address Line 1"
                    value={businessFormik.values.addressLine1}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.addressLine1 && Boolean(businessFormik.errors.addressLine1)}
                    helperText={businessFormik.touched.addressLine1 && businessFormik.errors.addressLine1}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="addressLine2"
                    name="addressLine2"
                    label="Address Line 2 (Optional)"
                    value={businessFormik.values.addressLine2}
                    onChange={businessFormik.handleChange}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="city"
                    name="city"
                    label="City"
                    value={businessFormik.values.city}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.city && Boolean(businessFormik.errors.city)}
                    helperText={businessFormik.touched.city && businessFormik.errors.city}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="pincode"
                    name="pincode"
                    label="Pincode"
                    value={businessFormik.values.pincode}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.pincode && Boolean(businessFormik.errors.pincode)}
                    helperText={businessFormik.touched.pincode && businessFormik.errors.pincode}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    id="state"
                    name="state"
                    label="State"
                    value={businessFormik.values.state}
                    onChange={businessFormik.handleChange}
                    onBlur={businessFormik.handleBlur}
                    error={businessFormik.touched.state && Boolean(businessFormik.errors.state)}
                    helperText={businessFormik.touched.state && businessFormik.errors.state}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  >
                    {indianStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Business Email (Optional)"
                    type="email"
                    value={businessFormik.values.email}
                    onChange={businessFormik.handleChange}
                    margin="normal"
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={() => setActiveStep(0)}
                  sx={{ py: 1.5 }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      boxShadow: '0 6px 16px rgba(99, 102, 241, 0.5)',
                    },
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

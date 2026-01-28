import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const steps = ['User Details', 'Business Details'];

const userSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const businessSchema = yup.object({
  businessName: yup.string().required('Business name is required'),
  businessType: yup.string().required('Business type is required'),
  gstin: yup
    .string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .required('GSTIN is required'),
  pan: yup
    .string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .required('PAN is required'),
  addressLine1: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pincode: yup
    .string()
    .matches(/^[0-9]{6}$/, 'Invalid pincode')
    .required('Pincode is required'),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Invalid phone number')
    .required('Phone is required'),
  email: yup.string().email('Enter a valid email').required('Business email is required'),
});

const businessTypes = [
  'Proprietorship',
  'Partnership',
  'Private Limited',
  'Public Limited',
  'LLP',
  'Others',
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

function RegisterPage() {
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

      const result = await register(registrationData);
      setLoading(false);

      if (result.success) {
        navigate('/dashboard');
      }
    },
  });

  const handleBack = () => {
    setActiveStep(0);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h5">
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Register your business for GST compliance
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box component="form" onSubmit={userFormik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                value={userFormik.values.email}
                onChange={userFormik.handleChange}
                onBlur={userFormik.handleBlur}
                error={userFormik.touched.email && Boolean(userFormik.errors.email)}
                helperText={userFormik.touched.email && userFormik.errors.email}
                margin="normal"
                autoComplete="email"
                autoFocus
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
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Next
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box component="form" onSubmit={businessFormik.handleSubmit}>
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
              />

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
              >
                {businessTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>

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
              />

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
              />

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
              />

              <TextField
                fullWidth
                id="addressLine2"
                name="addressLine2"
                label="Address Line 2 (Optional)"
                value={businessFormik.values.addressLine2}
                onChange={businessFormik.handleChange}
                margin="normal"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
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
                />

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
                />
              </Box>

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
              >
                {indianStates.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </TextField>

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
              />

              <TextField
                fullWidth
                id="email"
                name="email"
                label="Business Email"
                value={businessFormik.values.email}
                onChange={businessFormik.handleChange}
                onBlur={businessFormik.handleBlur}
                error={businessFormik.touched.email && Boolean(businessFormik.errors.email)}
                helperText={businessFormik.touched.email && businessFormik.errors.email}
                margin="normal"
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </Button>
              </Box>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiLink component={Link} to="/login" variant="body2">
                Sign in here
              </MuiLink>
            </Typography>
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          {'© '}
          GST Compliance SaaS {new Date().getFullYear()}
        </Typography>
      </Box>
    </Container>
  );
}

export default RegisterPage;

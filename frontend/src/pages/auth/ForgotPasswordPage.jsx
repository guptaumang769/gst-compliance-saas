import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Link,
  Container,
  Alert,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { handleApiError, handleSuccess } from '../../utils/errorHandler';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notRegistered, setNotRegistered] = useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setSuccess(false);
      setNotRegistered(false);
      try {
        await api.post('/auth/forgot-password', { email: values.email });
        handleSuccess('Password reset link sent. Check your email.');
        setSuccess(true);
      } catch (error) {
        const errData = error.response?.data;
        if (errData?.notRegistered) {
          setNotRegistered(true);
        } else {
          handleApiError(error);
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-200px',
          left: '-200px',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(20px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          bottom: '-150px',
          right: '-150px',
          animation: 'float 8s ease-in-out infinite',
        }}
      />

      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', py: 4 }}>
        <Card
          elevation={0}
          sx={{
            width: '100%',
            borderRadius: 4,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
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
                <EmailIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Forgot Password?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your email and we'll send you a reset link
              </Typography>
            </Box>

            {notRegistered && (
              <Alert severity="error" sx={{ mb: 3 }}>
                No account found with this email address.{' '}
                <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
                  Register here
                </Link>
              </Alert>
            )}

            {success ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Check your email for the password reset link.
              </Alert>
            ) : (
              <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                  autoComplete="email"
                  autoFocus
                  sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Remember your password?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Back to login
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

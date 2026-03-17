import { useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { handleApiError, handleSuccess } from '../../utils/errorHandler';

const validationSchema = Yup.object({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(!token);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setTokenError(false);
      try {
        await api.post('/auth/reset-password', {
          token,
          newPassword: values.newPassword,
        });
        handleSuccess('Password reset successfully.');
        setSuccess(true);
      } catch (error) {
        handleApiError(error);
        if (error.response?.status === 400 || error.response?.status === 401) {
          setTokenError(true);
        }
      } finally {
        setLoading(false);
      }
    },
  });

  if (!token) {
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
              <Alert severity="error" sx={{ mb: 3 }}>
                Invalid or expired reset link. Please request a new password reset.
              </Alert>
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    textDecoration: 'none',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Request new reset link
                </Link>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  or{' '}
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
                <LockIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Reset Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your new password below
              </Typography>
            </Box>

            {tokenError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Invalid or expired reset link. Please request a new password reset.
              </Alert>
            )}

            {success ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </Alert>
            ) : (
              <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                  fullWidth
                  id="newPassword"
                  name="newPassword"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                  helperText={formik.touched.newPassword && formik.errors.newPassword}
                  margin="normal"
                  autoComplete="new-password"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  margin="normal"
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
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
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Box>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
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

import { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { MarkEmailRead as VerifyIcon } from '@mui/icons-material';
import api from '../../services/api';
import { handleApiError, handleSuccess } from '../../utils/errorHandler';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Invalid verification link. Token is missing.');
      return;
    }

    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        handleSuccess('Email verified successfully.');
        setVerified(true);
      } catch (err) {
        handleApiError(err);
        setError(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      handleSuccess('Verification email sent. Check your inbox.');
      setResendSuccess(true);
    } catch (err) {
      handleApiError(err);
    } finally {
      setResendLoading(false);
    }
  };

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
                <VerifyIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Verify Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loading ? 'Verifying your email...' : verified ? 'Your email has been verified.' : 'Email verification'}
              </Typography>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
              </Box>
            )}

            {!loading && verified && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your email has been verified successfully. You can now sign in to your account.
              </Alert>
            )}

            {!loading && error && (
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
                <Box component="form" onSubmit={handleResend} sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Didn't receive the email? Enter your email to resend the verification link.
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    label="Email Address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    margin="normal"
                    required
                    sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                  />
                  {resendSuccess && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Verification email sent. Check your inbox.
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={resendLoading}
                    sx={{
                      mt: 2,
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
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                </Box>
              </>
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

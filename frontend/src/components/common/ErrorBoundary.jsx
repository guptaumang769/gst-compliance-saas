import { Component } from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 2,
          }}
        >
          <Container maxWidth="sm">
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  mb: 3,
                }}
              >
                <ErrorIcon sx={{ fontSize: 48, color: 'white' }} />
              </Box>

              <Typography variant="h4" fontWeight={700} gutterBottom>
                Oops! Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We encountered an unexpected error. Don't worry, we're on it!
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    textAlign: 'left',
                    bgcolor: '#f5f5f5',
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontSize: '0.75rem', margin: 0 }}
                  >
                    {this.state.error.toString()}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                  sx={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                  }}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Reload Page
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

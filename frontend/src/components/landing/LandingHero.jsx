import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
  Fade,
  Grow,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LoginIcon from '@mui/icons-material/Login';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

function GradientBlob({ sx }) {
  return (
    <Box
      className="landing-blob"
      sx={{
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(60px)',
        opacity: 0.55,
        pointerEvents: 'none',
        ...sx,
      }}
    />
  );
}

function MockDashboardCard() {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 4,
        p: { xs: 2.5, sm: 3 },
        background: 'rgba(255,255,255,0.98)',
        boxShadow: '0 30px 60px -15px rgba(17,24,39,0.45)',
        border: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            GST Summary · This Quarter
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            ₹ 4,82,300
          </Typography>
        </Box>
        <Chip
          size="small"
          icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
          label="+18.4%"
          sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#059669', fontWeight: 700 }}
        />
      </Stack>

      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: 'GSTR-1', value: 'Filed', color: '#10B981' },
          { label: 'GSTR-3B', value: 'Ready', color: '#6366F1' },
          { label: 'ITC', value: '₹ 92,140', color: '#8B5CF6' },
        ].map((item) => (
          <Grid item xs={4} key={item.label}>
            <Box
              sx={{
                borderRadius: 3,
                p: 1.5,
                bgcolor: '#F9FAFB',
                border: '1px solid #E5E7EB',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: item.color }}>{item.value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          borderRadius: 3,
          p: 2,
          bgcolor: '#F5F3FF',
          border: '1px solid #EDE9FE',
        }}
      >
        <Stack direction="row" alignItems="flex-end" spacing={1.25} sx={{ height: 96 }}>
          {[42, 58, 35, 72, 61, 88, 54].map((h, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: `${h}%`,
                borderRadius: 1.5,
                background: 'linear-gradient(180deg, #8B5CF6 0%, #6366F1 100%)',
                opacity: 0.35 + (h / 100) * 0.65,
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: -18,
          right: -14,
          bgcolor: '#fff',
          borderRadius: 2.5,
          px: 1.75,
          py: 1,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 1,
          boxShadow: '0 12px 24px -8px rgba(17,24,39,0.35)',
          border: '1px solid #E5E7EB',
        }}
      >
        <VerifiedIcon sx={{ color: '#10B981', fontSize: 20 }} />
        <Box>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1 }}>
            GSTIN
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Validated
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <Box
      id="home"
      className="landing-anchor"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 14, md: 18 },
        pb: { xs: 10, md: 16 },
        color: '#fff',
        background:
          'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 45%, #7C3AED 100%)',
      }}
    >
      <GradientBlob
        sx={{ width: 460, height: 460, top: -120, left: -100, background: '#8B5CF6' }}
      />
      <GradientBlob
        sx={{ width: 420, height: 420, bottom: -140, right: -80, background: '#10B981', opacity: 0.35 }}
      />
      <GradientBlob
        sx={{ width: 360, height: 360, top: '30%', right: '20%', background: '#6366F1' }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid container spacing={{ xs: 6, md: 4 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in timeout={700}>
              <Box>
                <Chip
                  label="Built for Indian SMEs"
                  size="small"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    color: '#fff',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                    fontWeight: 800,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    mb: 2.5,
                  }}
                >
                  GST compliance,{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(90deg, #34D399 0%, #A78BFA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    simplified.
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.82)',
                    maxWidth: 520,
                    mb: 4,
                    lineHeight: 1.6,
                  }}
                >
                  Automate GST invoicing, file GSTR-1 &amp; 3B with confidence, and
                  reconcile input tax credit — all in one place. Purpose-built for
                  growing Indian businesses.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    size="large"
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/register')}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      fontSize: '1rem',
                      bgcolor: '#fff',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: '#F5F3FF',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="large"
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/login')}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      fontSize: '1rem',
                      color: '#fff',
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: '#fff',
                        backgroundColor: 'rgba(255,255,255,0.10)',
                      },
                    }}
                  >
                    Login
                  </Button>
                </Stack>

                <Stack
                  direction="row"
                  spacing={3}
                  sx={{ mt: 5, color: 'rgba(255,255,255,0.72)', flexWrap: 'wrap' }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedIcon sx={{ fontSize: 18, color: '#34D399' }} />
                    <Typography variant="body2">No credit card required</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptLongIcon sx={{ fontSize: 18, color: '#A78BFA' }} />
                    <Typography variant="body2">GST-ready invoices</Typography>
                  </Stack>
                </Stack>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grow in timeout={900}>
              <Box sx={{ position: 'relative', px: { xs: 1, sm: 3, md: 0 } }}>
                <MockDashboardCard />
              </Box>
            </Grow>
          </Grid>
        </Grid>
      </Container>

      <Box
        sx={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          right: 0,
          height: 64,
          background: 'linear-gradient(180deg, transparent 0%, #F9FAFB 100%)',
        }}
      />
    </Box>
  );
}

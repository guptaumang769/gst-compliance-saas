import { useNavigate } from 'react-router-dom';
import { Box, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const QUICK_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Services', id: 'services' },
  { label: 'Contact', id: 'contact' },
];

export default function LandingFooter({ onNavigate }) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ bgcolor: '#111827', color: 'rgba(255,255,255,0.75)', pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                <ReceiptLongIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                GST Compliance
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ maxWidth: 360, lineHeight: 1.7 }}>
              GST invoicing, returns, input tax credit and reconciliation — simplified
              for growing Indian businesses.
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={1.25}>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.id}
                  component="button"
                  type="button"
                  onClick={() => onNavigate?.(link.id)}
                  underline="none"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    textAlign: 'left',
                    width: 'fit-content',
                    '&:hover': { color: '#fff' },
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={6} md={4}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
              Account
            </Typography>
            <Stack spacing={1.25}>
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/login')}
                underline="none"
                sx={{ color: 'rgba(255,255,255,0.75)', textAlign: 'left', width: 'fit-content', '&:hover': { color: '#fff' } }}
              >
                Login
              </Link>
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/register')}
                underline="none"
                sx={{ color: 'rgba(255,255,255,0.75)', textAlign: 'left', width: 'fit-content', '&:hover': { color: '#fff' } }}
              >
                Get Started
              </Link>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.12)' }} />

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          © {year} GST Compliance. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

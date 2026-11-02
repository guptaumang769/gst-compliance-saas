import { Box, Container, Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const STATS = [
  { value: '5', label: 'GST rate slabs supported' },
  { value: 'GSTR-1/3B', label: 'Return filing ready' },
  { value: '100%', label: 'GSTIN validation' },
  { value: '2A/2B', label: 'Reconciliation built-in' },
];

const VALUE_POINTS = [
  'Designed around the way Indian SMEs actually run their books',
  'Accurate CGST / SGST / IGST computation on every line item',
  'Export-ready reports your CA and auditor will love',
];

export default function LandingAbout() {
  return (
    <Box
      id="about"
      className="landing-anchor"
      component="section"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
              WHY GST COMPLIANCE
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 2.5 }}>
              Compliance that keeps up with your business
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.05rem', lineHeight: 1.7 }}>
              We built GST Compliance so founders and finance teams can spend less time
              wrestling with tax rules and more time growing. Every invoice, purchase and
              return flows through one connected system — reducing errors, saving hours,
              and keeping you audit-ready all year round.
            </Typography>
            <Stack spacing={1.5}>
              {VALUE_POINTS.map((point) => (
                <Stack key={point} direction="row" spacing={1.5} alignItems="flex-start">
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22, mt: '2px' }} />
                  <Typography variant="body1" sx={{ color: 'text.primary' }}>
                    {point}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Grid container spacing={2.5}>
              {STATS.map((stat) => (
                <Grid item xs={6} key={stat.label}>
                  <Box
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid #E5E7EB',
                      background: 'linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 100%)',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 16px 26px -7px rgba(17,24,39,0.12)',
                      },
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 0.5,
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

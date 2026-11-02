import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ScheduleIcon from '@mui/icons-material/Schedule';

const INITIAL_FORM = { name: '', email: '', message: '' };

const INFO_ITEMS = [
  { icon: EmailIcon, title: 'Email us', detail: 'support@gstcompliance.app' },
  { icon: SupportAgentIcon, title: 'Talk to sales', detail: 'Guided onboarding for your team' },
  { icon: ScheduleIcon, title: 'Response time', detail: 'We typically reply within 1 business day' },
];

export default function LandingContact() {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Thanks! We'll get back to you shortly.");
    setForm(INITIAL_FORM);
  };

  return (
    <Box
      id="contact"
      className="landing-anchor"
      component="section"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
              GET IN TOUCH
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 2 }}>
              Let&apos;s simplify your GST
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
              Have a question about invoicing, returns or reconciliation? Send us a
              note and our team will reach out.
            </Typography>

            <Stack spacing={2.5}>
              {INFO_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Stack key={item.title} direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 2.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(99,102,241,0.10)',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ color: 'primary.main' }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.detail}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid #E5E7EB',
                boxShadow: '0 12px 18px -5px rgba(17,24,39,0.10)',
              }}
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={4}
                    label="Message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    size="large"
                    variant="contained"
                    endIcon={<SendIcon />}
                    sx={{
                      py: 1.4,
                      px: 4,
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      },
                    }}
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

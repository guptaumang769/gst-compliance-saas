import { Box, Card, CardContent, Chip, Container, Grid, Grow, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InsightsIcon from '@mui/icons-material/Insights';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import GroupsIcon from '@mui/icons-material/Groups';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

const SERVICES = [
  {
    icon: ReceiptLongIcon,
    title: 'GST Invoicing',
    blurb: 'Create compliant tax invoices with auto CGST/SGST/IGST splits and all 5 GST rate slabs.',
    color: '#6366F1',
  },
  {
    icon: DescriptionIcon,
    title: 'GST Returns',
    blurb: 'Generate GSTR-1 and GSTR-3B summaries from your data — ready to review and file.',
    color: '#8B5CF6',
  },
  {
    icon: AccountBalanceWalletIcon,
    title: 'Purchases & ITC',
    blurb: 'Track purchases and claim accurate Input Tax Credit without spreadsheet headaches.',
    color: '#10B981',
  },
  {
    icon: InsightsIcon,
    title: 'Reports & Analytics',
    blurb: 'Actionable dashboards with one-click CSV export for your accountant or auditor.',
    color: '#3B82F6',
  },
  {
    icon: CompareArrowsIcon,
    title: 'GSTR-2A / 2B Reconciliation',
    blurb: 'Match purchase records against portal data to catch mismatches before you file.',
    color: '#F59E0B',
  },
  {
    icon: GroupsIcon,
    title: 'Multi-user & Roles',
    blurb: 'Invite your team with granular role-based access for owners, staff and accountants.',
    color: '#EC4899',
  },
  {
    icon: SwapHorizIcon,
    title: 'Credit / Debit Notes',
    blurb: 'Issue and link credit and debit notes to invoices with full GST treatment.',
    color: '#0EA5E9',
  },
  {
    icon: EventAvailableIcon,
    title: 'Compliance Calendar',
    blurb: 'Never miss a due date with reminders for GSTR-1, 3B and other GST deadlines.',
    color: '#7C3AED',
  },
];

export default function LandingServices() {
  return (
    <Box
      id="services"
      className="landing-anchor"
      component="section"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: { xs: 5, md: 7 } }}>
          <Chip
            label="Everything GST, in one workspace"
            size="small"
            sx={{ mb: 2, bgcolor: 'rgba(99,102,241,0.10)', color: 'primary.main', fontWeight: 600 }}
          />
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1.5 }}>
            Services built for real GST workflows
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, color: 'text.secondary' }}>
            From the first invoice to your monthly filing, GST Compliance handles the
            end-to-end compliance journey for your business.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={service.title}>
                <Grow in timeout={500 + index * 120}>
                  <Card
                    sx={{
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 20px 34px -9px rgba(17,24,39,0.14)',
                        borderColor: 'rgba(99,102,241,0.35)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          bgcolor: `${service.color}1A`,
                        }}
                      >
                        <Icon sx={{ color: service.color, fontSize: 26 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {service.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {service.blurb}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

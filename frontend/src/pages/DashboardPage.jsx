import { Typography, Box, Paper } from '@mui/material';

function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Welcome to GST Compliance SaaS! This is your dashboard.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Dashboard features coming soon in Week 15-16...
        </Typography>
      </Paper>
    </Box>
  );
}

export default DashboardPage;

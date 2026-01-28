import { Typography, Box, Paper } from '@mui/material';

function InvoicesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Invoices
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Invoice management features coming soon in Week 17-18...
        </Typography>
      </Paper>
    </Box>
  );
}

export default InvoicesPage;

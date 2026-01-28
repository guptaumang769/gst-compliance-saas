import { Typography, Box, Paper } from '@mui/material';

function PurchasesPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Purchases
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Purchase management features coming soon in Week 19-20...
        </Typography>
      </Paper>
    </Box>
  );
}

export default PurchasesPage;

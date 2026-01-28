import { Typography, Box, Paper } from '@mui/material';

function CustomersPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Customers
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Customer management features coming soon in Week 17-18...
        </Typography>
      </Paper>
    </Box>
  );
}

export default CustomersPage;

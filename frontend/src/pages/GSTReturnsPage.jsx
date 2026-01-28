import { Typography, Box, Paper } from '@mui/material';

function GSTReturnsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        GST Returns
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          GST Returns (GSTR-1, GSTR-3B) features coming soon in Week 21-22...
        </Typography>
      </Paper>
    </Box>
  );
}

export default GSTReturnsPage;

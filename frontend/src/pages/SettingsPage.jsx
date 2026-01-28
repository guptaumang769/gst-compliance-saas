import { Typography, Box, Paper } from '@mui/material';

function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          Settings and profile management features coming soon in Week 23-24...
        </Typography>
      </Paper>
    </Box>
  );
}

export default SettingsPage;

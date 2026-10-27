import { Box, Typography, Fade } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

/**
 * Friendly empty state with icon, title, message and optional action.
 *
 * Props:
 *  - icon: ReactNode (defaults to an inbox icon)
 *  - title: string
 *  - message: string
 *  - action: ReactNode (e.g. an "Add" button)
 *  - dense: boolean (reduced vertical padding)
 */
export default function EmptyState({ icon, title, message, action, dense = false }) {
  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: dense ? 4 : 8,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            color: 'primary.main',
            mb: 2.5,
            '& svg': { fontSize: 44 },
          }}
        >
          {icon || <InboxOutlined />}
        </Box>
        <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {message && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 3 : 0, maxWidth: 420 }}>
            {message}
          </Typography>
        )}
        {action}
      </Box>
    </Fade>
  );
}

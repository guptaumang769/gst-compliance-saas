import { Box, Typography, Fade } from '@mui/material';

/**
 * Consistent page header with title, optional subtitle and action buttons.
 *
 * Props:
 *  - title: string (required)
 *  - subtitle: string
 *  - actions: ReactNode (buttons rendered on the right)
 *  - icon: ReactNode (optional leading icon badge)
 */
export default function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {actions}
          </Box>
        )}
      </Box>
    </Fade>
  );
}

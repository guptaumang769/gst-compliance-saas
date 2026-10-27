import { Card, CardContent, Box, Typography, Divider } from '@mui/material';

/**
 * A titled content card used to group related content/sections.
 *
 * Props:
 *  - title: string
 *  - subtitle: string
 *  - icon: ReactNode
 *  - actions: ReactNode (rendered on the right of the header)
 *  - divider: boolean (show divider under header, default true)
 *  - noPadding: boolean (remove inner content padding, e.g. for tables)
 *  - sx: card style overrides
 *  - children
 */
export default function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  divider = true,
  noPadding = false,
  sx,
  children,
}) {
  const hasHeader = title || subtitle || actions || icon;

  return (
    <Card sx={{ height: '100%', ...sx }}>
      {hasHeader && (
        <Box
          sx={{
            px: 3,
            py: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {icon && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  flexShrink: 0,
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              {title && (
                <Typography variant="h6" fontWeight={600} noWrap>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
      )}
      {hasHeader && divider && <Divider />}
      {noPadding ? (
        <Box>{children}</Box>
      ) : (
        <CardContent sx={hasHeader ? { pt: 2.5 } : undefined}>{children}</CardContent>
      )}
    </Card>
  );
}

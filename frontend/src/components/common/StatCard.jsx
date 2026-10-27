import { Box, Card, CardContent, Typography, Avatar, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

/**
 * Gradient-accented statistic card with icon, label, value and optional trend.
 *
 * Props:
 *  - label: string
 *  - value: string | number
 *  - icon: ReactNode
 *  - color: hex string (accent color, defaults to primary indigo)
 *  - trend: { value: string, trend: 'up' | 'down' } | null
 *  - trendLabel: string (e.g. "vs last month")
 *  - loading: boolean
 */
export default function StatCard({
  label,
  value,
  icon,
  color = '#6366F1',
  trend,
  trendLabel = 'vs last month',
  loading = false,
}) {
  const isPositive = trend?.trend === 'up';

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 30px -12px rgba(17, 24, 39, 0.18)',
        },
        // Gradient accent strip on the left edge
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
        },
      }}
    >
      <CardContent>
        {loading ? (
          <Box>
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="45%" height={40} sx={{ my: 1 }} />
            <Skeleton variant="text" width="50%" height={18} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 600, mb: 1 }}
                noWrap
              >
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1, wordBreak: 'break-word' }}>
                {value}
              </Typography>
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  {isPositive ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ color: isPositive ? 'success.main' : 'error.main', fontWeight: 700 }}
                  >
                    {trend.value}
                  </Typography>
                  {trendLabel && (
                    <Typography variant="caption" color="text.secondary">
                      {trendLabel}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                background: `linear-gradient(135deg, ${color}33 0%, ${color}1a 100%)`,
                color: color,
                ml: 1.5,
                flexShrink: 0,
              }}
            >
              {icon}
            </Avatar>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

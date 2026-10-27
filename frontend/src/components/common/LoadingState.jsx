import { Box, Skeleton, Table, TableBody, TableCell, TableRow, CircularProgress, Typography } from '@mui/material';

/**
 * Flexible loading placeholder.
 *
 * Variants:
 *  - "table": renders shimmering table rows (use inside a TableContainer/Card)
 *  - "cards": grid of card skeletons
 *  - "spinner": centered circular progress with optional label
 *
 * Props:
 *  - variant: 'table' | 'cards' | 'spinner'
 *  - rows: number (table rows / card count)
 *  - columns: number (table columns)
 *  - label: string (spinner label)
 */
export default function LoadingState({ variant = 'spinner', rows = 5, columns = 5, label = 'Loading...' }) {
  if (variant === 'table') {
    return (
      <Table>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <TableCell key={c}>
                  <Skeleton variant="text" width={c === 0 ? '80%' : '60%'} height={24} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (variant === 'cards') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: 4 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
      }}
    >
      <CircularProgress />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { WarningAmberRounded } from '@mui/icons-material';

/**
 * Reusable confirmation dialog.
 *
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string | ReactNode
 *  - confirmLabel: string (default "Confirm")
 *  - cancelLabel: string (default "Cancel")
 *  - confirmColor: MUI color (default "error")
 *  - loading: boolean (disables buttons while an async action runs)
 *  - onConfirm: () => void
 *  - onClose: () => void
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${confirmColor}.light`,
              color: `${confirmColor}.dark`,
              opacity: 0.9,
            }}
          >
            <WarningAmberRounded />
          </Box>
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div" sx={{ color: 'text.secondary' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}>
          {loading ? 'Working...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

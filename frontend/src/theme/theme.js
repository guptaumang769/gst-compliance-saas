import { createTheme } from '@mui/material/styles';

// Modern color palette - Purple/Indigo gradient theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1', // Indigo
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6', // Purple
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981', // Emerald
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B', // Amber
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444', // Red
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  // Refined, softer elevation scale (indigo-tinted subtle shadows)
  shadows: [
    'none',
    '0 1px 2px 0 rgb(17 24 39 / 0.05)',
    '0 1px 3px 0 rgb(17 24 39 / 0.08), 0 1px 2px -1px rgb(17 24 39 / 0.06)',
    '0 4px 6px -1px rgb(17 24 39 / 0.08), 0 2px 4px -2px rgb(17 24 39 / 0.06)',
    '0 8px 12px -3px rgb(17 24 39 / 0.09), 0 3px 6px -4px rgb(17 24 39 / 0.06)',
    '0 12px 18px -5px rgb(17 24 39 / 0.10), 0 5px 8px -6px rgb(17 24 39 / 0.07)',
    '0 14px 22px -6px rgb(17 24 39 / 0.11), 0 6px 10px -6px rgb(17 24 39 / 0.07)',
    '0 16px 26px -7px rgb(17 24 39 / 0.12), 0 7px 11px -7px rgb(17 24 39 / 0.08)',
    '0 18px 30px -8px rgb(17 24 39 / 0.13), 0 8px 12px -8px rgb(17 24 39 / 0.08)',
    '0 20px 34px -9px rgb(17 24 39 / 0.14), 0 9px 14px -9px rgb(17 24 39 / 0.09)',
    '0 22px 38px -10px rgb(17 24 39 / 0.15), 0 10px 16px -10px rgb(17 24 39 / 0.09)',
    '0 24px 42px -11px rgb(17 24 39 / 0.16)',
    '0 25px 46px -12px rgb(17 24 39 / 0.17)',
    '0 25px 48px -12px rgb(17 24 39 / 0.18)',
    '0 25px 50px -12px rgb(17 24 39 / 0.19)',
    '0 25px 50px -12px rgb(17 24 39 / 0.20)',
    '0 25px 50px -12px rgb(17 24 39 / 0.21)',
    '0 25px 50px -12px rgb(17 24 39 / 0.22)',
    '0 25px 50px -12px rgb(17 24 39 / 0.23)',
    '0 25px 50px -12px rgb(17 24 39 / 0.24)',
    '0 25px 50px -12px rgb(17 24 39 / 0.25)',
    '0 25px 50px -12px rgb(17 24 39 / 0.25)',
    '0 25px 50px -12px rgb(17 24 39 / 0.25)',
    '0 25px 50px -12px rgb(17 24 39 / 0.25)',
    '0 25px 50px -12px rgb(17 24 39 / 0.25)',
  ],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(99 102 241 / 0.18), 0 2px 4px -2px rgb(99 102 241 / 0.12)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(99 102 241 / 0.25), 0 4px 6px -4px rgb(99 102 241 / 0.18)',
            transform: 'translateY(-1px)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(17 24 39 / 0.08), 0 1px 2px -1px rgb(17 24 39 / 0.06)',
          border: '1px solid #E5E7EB',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 14,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#D1D5DB',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6366F1',
              borderWidth: 2,
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 4px rgb(99 102 241 / 0.10)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F9FAFB',
            color: '#6B7280',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #E5E7EB',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F3F4F6',
          padding: '14px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
          '&.MuiTableRow-hover:hover': {
            backgroundColor: '#F5F3FF',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: '0 25px 50px -12px rgb(17 24 39 / 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1.25rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          minHeight: 52,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#111827',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 10px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export default theme;

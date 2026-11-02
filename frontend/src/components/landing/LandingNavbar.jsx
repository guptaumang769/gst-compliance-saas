import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Services', id: 'services' },
  { label: 'Contact', id: 'contact' },
];

function BrandMark({ dense = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: dense ? 34 : 38,
          height: dense ? 34 : 38,
          borderRadius: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          boxShadow: '0 6px 16px rgba(99, 102, 241, 0.35)',
        }}
      >
        <ReceiptLongIcon sx={{ color: '#fff', fontSize: dense ? 20 : 22 }} />
      </Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'inherit' }}
      >
        GST Compliance
      </Typography>
    </Box>
  );
}

export default function LandingNavbar({ onNavigate }) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 24 });

  useEffect(() => {
    if (drawerOpen) setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolled]);

  const handleLinkClick = (id) => {
    setDrawerOpen(false);
    onNavigate?.(id);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid #E5E7EB' : '1px solid transparent',
          color: scrolled ? 'text.primary' : '#fff',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 72, gap: 2 }}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => handleLinkClick('home')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleLinkClick('home');
              }}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <BrandMark />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  sx={{
                    color: 'inherit',
                    fontWeight: 600,
                    px: 1.75,
                    '&:hover': { backgroundColor: 'rgba(127,127,127,0.10)' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.25,
                ml: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  color: scrolled ? 'primary.main' : '#fff',
                  borderColor: scrolled ? 'primary.main' : 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    borderColor: scrolled ? 'primary.dark' : '#fff',
                    backgroundColor: scrolled
                      ? 'rgba(99,102,241,0.06)'
                      : 'rgba(255,255,255,0.12)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>

            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'inherit' }}
              aria-label="Open navigation menu"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <BrandMark dense />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {NAV_LINKS.map((link) => (
            <ListItem key={link.id} disablePadding>
              <ListItemButton onClick={() => handleLinkClick(link.id)}>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/login');
            }}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/register');
            }}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              },
            }}
          >
            Get Started
          </Button>
        </Box>
      </Drawer>
    </>
  );
}

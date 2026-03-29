import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  Drawer,
  List,
  ListItem,
  ListItemButton,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  People,
  ShoppingCart,
  Assessment,
  CalendarMonth,
  Settings,
  Notifications,
  Logout,
  AccountCircle,
  Menu as MenuIcon,
  LocalShipping,
  CardMembership,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Invoices', path: '/invoices', icon: <Receipt /> },
  { label: 'Customers', path: '/customers', icon: <People /> },
  { label: 'Suppliers', path: '/suppliers', icon: <LocalShipping /> },
  { label: 'Purchases', path: '/purchases', icon: <ShoppingCart /> },
  { label: 'GST Returns', path: '/gst-returns', icon: <Assessment /> },
  { label: 'Compliance Calendar', path: '/compliance-calendar', icon: <CalendarMonth /> },
  { label: 'Pricing', path: '/pricing', icon: <CardMembership /> },
];

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifications = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePath = (path) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 70 } }}>
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 4,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/dashboard')}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                }}
              >
                <Typography variant="h6" fontWeight={700} color="white">
                  G
                </Typography>
              </Box>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                GST Compliance
              </Typography>
            </Box>

            {/* Navigation Items (Desktop) */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  startIcon={item.icon}
                  sx={{
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.9375rem',
                    fontWeight: isActivePath(item.path) ? 600 : 500,
                    backgroundColor: isActivePath(item.path)
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Spacer for mobile */}
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />

            {/* Right Side Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  onClick={handleOpenNotifications}
                  sx={{ color: 'white' }}
                >
                  <Badge badgeContent={3} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User Menu (Desktop only) */}
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleOpenUserMenu}
                  sx={{ p: 0, ml: 1, display: { xs: 'none', md: 'flex' } }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* Mobile Menu Button */}
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                sx={{ color: 'white', display: { xs: 'flex', md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: 'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)',
            color: 'white',
          },
        }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ px: 2, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 600,
                width: 36,
                height: 36,
              }}
            >
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <List sx={{ px: 1, py: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileDrawerOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActivePath(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: isActivePath(item.path) ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />
        <List sx={{ px: 1, py: 1 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => { navigate('/profile'); setMobileDrawerOpen(false); }}
              sx={{ borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}><AccountCircle /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => { navigate('/settings'); setMobileDrawerOpen(false); }}
              sx={{ borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}><Settings /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => { handleLogout(); setMobileDrawerOpen(false); }}
              sx={{ borderRadius: 2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
            >
              <ListItemIcon sx={{ color: '#fca5a5', minWidth: 40 }}><Logout /></ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ color: '#fca5a5' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorElNotifications}
        open={Boolean(anchorElNotifications)}
        onClose={handleCloseNotifications}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 320,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 1.5 }}>
          <ListItemText
            primary="GST Return due in 3 days"
            secondary="GSTR-1 for December 2025"
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 1.5 }}>
          <ListItemText
            primary="Invoice #INV-001 is overdue"
            secondary="Payment pending from ABC Corp"
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 1.5 }}>
          <ListItemText
            primary="New purchase recorded"
            secondary="Purchase from XYZ Suppliers"
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.8rem' }}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleCloseNotifications}
          sx={{ justifyContent: 'center', py: 1.5 }}
        >
          <Typography variant="body2" color="primary" fontWeight={600}>
            View all notifications
          </Typography>
        </MenuItem>
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 240,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            navigate('/profile');
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            navigate('/settings');
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#F9FAFB',
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

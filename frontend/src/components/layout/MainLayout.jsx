import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Drawer,
  List,
  ListSubheader,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Notifications,
  Logout,
  AccountCircle,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  MenuOpen,
  ChevronLeft,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';
import { NAV_GROUPS, getPageTitle } from './navConfig';
import { insightsAPI } from '../../services/api';
import ChatbotFab from './ChatbotFab';

// Severity levels that should count toward the notification badge.
const ALERT_SEVERITIES = ['warning', 'critical', 'high', 'error'];

const DRAWER_WIDTH = 264;
const MINI_WIDTH = 76;

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Pull real insights to power the notifications menu. Resilient: on any
  // failure we simply show an empty, "all caught up" state and never crash.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await insightsAPI.getAll();
        const data = response?.data || {};
        const list = Array.isArray(data.insights)
          ? data.insights
          : Array.isArray(data)
          ? data
          : [];
        if (active) setNotifications(list);
      } catch {
        if (active) setNotifications([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const alertCount = notifications.filter((n) =>
    ALERT_SEVERITIES.includes((n.severity || '').toLowerCase())
  ).length;

  const mini = isDesktop && collapsed;
  const currentWidth = mini ? MINI_WIDTH : DRAWER_WIDTH;

  const isActivePath = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    setAnchorElUser(null);
    logout();
    navigate('/login');
  };

  const pageTitle = getPageTitle(location.pathname);
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  // ---- Drawer contents (shared between permanent & temporary variants) ----
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand / Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: mini ? 0 : 2.5,
          justifyContent: mini ? 'center' : 'flex-start',
          minHeight: 70,
          cursor: 'pointer',
        }}
        onClick={() => handleNavigate('/dashboard')}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 14px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Typography variant="h6" fontWeight={800} color="white">
            G
          </Typography>
        </Box>
        {!mini && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.2 }}>
              GST Compliance
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Filing made simple
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />

      {/* Navigation groups */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {NAV_GROUPS.map((group) => (
          <List
            key={group.section}
            dense
            subheader={
              !mini ? (
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: 'transparent',
                    color: 'text.secondary',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: '32px',
                  }}
                >
                  {group.section}
                </ListSubheader>
              ) : null
            }
            sx={{ px: 1.25 }}
          >
            {group.items.map((item) => {
              const active = isActivePath(item.path);
              const button = (
                <ListItemButton
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  selected={active}
                  sx={{
                    mb: 0.25,
                    borderRadius: 2,
                    minHeight: 44,
                    justifyContent: mini ? 'center' : 'flex-start',
                    px: mini ? 1 : 1.5,
                    color: active ? 'primary.main' : 'text.secondary',
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.18) 100%)',
                      },
                    },
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: mini ? 0 : 38,
                      color: active ? 'primary.main' : 'text.secondary',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!mini && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                        noWrap: true,
                      }}
                    />
                  )}
                </ListItemButton>
              );

              return mini ? (
                <Tooltip key={item.path} title={item.label} placement="right" arrow>
                  {button}
                </Tooltip>
              ) : (
                button
              );
            })}
          </List>
        ))}
      </Box>

      {/* User footer */}
      <Divider />
      <Box
        sx={{
          p: mini ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          justifyContent: mini ? 'center' : 'flex-start',
        }}
      >
        <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontWeight: 600, fontSize: '0.9rem' }}>
          {getInitials(user?.name || user?.email)}
        </Avatar>
        {!mini && (
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {user?.email}
            </Typography>
          </Box>
        )}
        {!mini && (
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Slim top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, gap: 1 }}>
          {/* Mobile hamburger */}
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Desktop collapse toggle */}
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              edge="start"
              onClick={() => setCollapsed((v) => !v)}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              {collapsed ? <MenuIcon /> : <MenuOpen />}
            </IconButton>
          </Tooltip>

          <Typography variant="h6" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
            {pageTitle}
          </Typography>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setAnchorElNotifications(e.currentTarget)}>
              <Badge badgeContent={alertCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar menu */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorElUser(e.currentTarget)} sx={{ p: 0.5, ml: 0.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 600, fontSize: '0.9rem' }}>
                {getInitials(user?.name || user?.email)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Permanent drawer (desktop) */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          width: currentWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Temporary drawer (mobile) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 1 }}>
          <IconButton onClick={() => setMobileOpen(false)}>
            <ChevronLeft />
          </IconButton>
        </Box>
        {drawerContent}
      </Drawer>

      {/* Notifications menu */}
      <Menu
        anchorEl={anchorElNotifications}
        open={Boolean(anchorElNotifications)}
        onClose={() => setAnchorElNotifications(null)}
        PaperProps={{ sx: { mt: 1.5, minWidth: 320, borderRadius: 3 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {notifications.length} total
            </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length > 0 ? (
          notifications.slice(0, 8).map((n, i) => {
            const severity = (n.severity || '').toLowerCase();
            const color = ALERT_SEVERITIES.includes(severity)
              ? severity === 'warning'
                ? 'warning.main'
                : 'error.main'
              : 'info.main';
            return (
              <MenuItem
                key={n.id || i}
                onClick={() => setAnchorElNotifications(null)}
                sx={{ py: 1.5, whiteSpace: 'normal', alignItems: 'flex-start', gap: 1 }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, mt: 0.75, flexShrink: 0 }} />
                <ListItemText
                  primary={n.title || 'Notification'}
                  secondary={n.message}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: '0.8rem' }}
                />
              </MenuItem>
            );
          })
        ) : (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              You're all caught up
            </Typography>
            <Typography variant="caption" color="text.secondary">
              No new notifications right now.
            </Typography>
          </Box>
        )}
      </Menu>

      {/* User menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={() => setAnchorElUser(null)}
        PaperProps={{ sx: { mt: 1.5, minWidth: 240, borderRadius: 3 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem" noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorElUser(null);
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
            setAnchorElUser(null);
            navigate('/settings');
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
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

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 70 } }} />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1600, mx: 'auto' }}>{children}</Box>
      </Box>

      {/* Global help assistant */}
      <ChatbotFab />
    </Box>
  );
}

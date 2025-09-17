import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Dashboard,
  CalendarToday,
  Assessment,
  People,
  LocalHospital,
  Settings,
  ExitToApp,
  SelfImprovement,
  Psychology,
  MonitorHeart,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from 'react-query';
import { apiService } from '../services/apiService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch unread notifications
  const { data: notifications } = useQuery(
    ['notifications'],
    () => apiService.getNotifications({ unreadOnly: true, limit: 5 }),
    { refetchInterval: 30000 }
  );

  const unreadCount = notifications?.data?.unreadCount || 0;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
  };

  // Role-based navigation items
  const getNavigationItems = () => {
    const baseItems = [
      {
        text: 'Dashboard',
        icon: <Dashboard />,
        path: '/',
        roles: ['patient', 'therapist', 'doctor', 'admin']
      },
    ];

    const roleSpecificItems = {
      patient: [
        { text: 'Book Appointment', icon: <CalendarToday />, path: '/appointments/book' },
        { text: 'My Progress', icon: <Assessment />, path: '/analytics' },
        { text: 'AI Recommendations', icon: <Psychology />, path: '/recommendations' },
      ],
      therapist: [
        { text: 'Live Sessions', icon: <MonitorHeart />, path: '/sessions/live' },
        { text: 'My Schedule', icon: <CalendarToday />, path: '/schedule' },
        { text: 'Patient Records', icon: <People />, path: '/patients' },
        { text: 'Performance', icon: <Assessment />, path: '/analytics' },
      ],
      doctor: [
        { text: 'Patients', icon: <People />, path: '/patients' },
        { text: 'Therapies', icon: <LocalHospital />, path: '/therapies' },
        { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
      ],
      admin: [
        { text: 'System Monitor', icon: <MonitorHeart />, path: '/admin/monitor' },
        { text: 'Users', icon: <People />, path: '/admin/users' },
        { text: 'Therapies', icon: <LocalHospital />, path: '/admin/therapies' },
        { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics' },
      ],
    };

    return [...baseItems, ...(roleSpecificItems[user?.role] || [])];
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'white' }}>
        🧘‍♀️ AyurSutra
      </Typography>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                color: 'white',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const profileMenuId = 'primary-account-menu';
  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      id={profileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleProfileMenuClose}
    >
      <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
        <AccountCircle sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
        <Settings sx={{ mr: 1 }} />
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ExitToApp sx={{ mr: 1 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: isMobile ? 1 : 0, 
              mr: 2,
              cursor: 'pointer',
              fontWeight: 600
            }}
            onClick={() => navigate('/')}
          >
            🧘‍♀️ AyurSutra
          </Typography>

          {/* Desktop navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', ml: 3 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: 'inherit',
                    mx: 1,
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* Right side items */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Role badge */}
            <Box
              sx={{
                px: 1,
                py: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'capitalize',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {user?.role}
            </Box>

            {/* Notifications */}
            <IconButton
              size="large"
              color="inherit"
              onClick={() => navigate('/notifications')}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* User profile */}
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={profileMenuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                alt={user?.firstName}
              >
                {user?.firstName?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        {drawer}
      </Drawer>

      {profileMenu}
    </Box>
  );
};

export default Navbar;
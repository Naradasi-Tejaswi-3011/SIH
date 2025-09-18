import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  Drawer,
  List,
  ListItemButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Settings,
  Logout,
  Dashboard,
  CalendarToday,
  SelfImprovement,
  Analytics,
  People,
  LocalHospital,
  Feedback,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { apiService } from '../services/apiService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Socket connection for real-time notifications
  const socket = useSocket();
  
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      socket.on('notification_read', ({ notificationId }) => {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId 
              ? { ...n, channels: { ...n.channels, inApp: { ...n.channels.inApp, status: 'read' } } }
              : n
          )
        );
      });
      
      return () => {
        socket.off('new_notification');
        socket.off('notification_read');
      };
    }
  }, [socket]);
  
  // Load notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiService.getNotifications({ limit: 10, unreadOnly: false });
        setNotifications(response.data.data || []);
        const unread = response.data.data?.filter(n => 
          n.channels?.inApp?.status !== 'read'
        ).length || 0;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    
    if (user) {
      loadNotifications();
    }
  }, [user]);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };
  
  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const getNavigationItems = () => {
    const baseItems = [
      { 
        text: 'Dashboard', 
        icon: Dashboard, 
        path: user?.role === 'patient' ? '/patient/dashboard' : 
              user?.role === 'therapist' ? '/therapist/dashboard' : '/admin/dashboard' 
      },
      { text: 'Analytics', icon: Analytics, path: '/analytics' },
    ];
    
    const roleSpecificItems = {
      patient: [
        { text: 'Book Appointment', icon: CalendarToday, path: '/appointments/book' },
        { text: 'My Therapies', icon: SelfImprovement, path: '/patient/therapies' },
        { text: 'Feedback', icon: Feedback, path: '/feedback' },
        { text: 'Notifications', icon: Notifications, path: '/notifications' },
      ],
      therapist: [
        { text: 'My Appointments', icon: CalendarToday, path: '/therapist/appointments' },
        { text: 'Track Sessions', icon: SelfImprovement, path: '/therapist/sessions' },
        { text: 'Therapy Management', icon: LocalHospital, path: '/therapy/manage' },
        { text: 'Data Visualization', icon: Analytics, path: '/data-visualization' },
        { text: 'Feedback', icon: Feedback, path: '/feedback' },
        { text: 'Notifications', icon: Notifications, path: '/notifications' },
      ],
      doctor: [
        { text: 'Patients', icon: People, path: '/doctor/patients' },
        { text: 'Therapies', icon: LocalHospital, path: '/doctor/therapies' },
        { text: 'Appointments', icon: CalendarToday, path: '/doctor/appointments' },
        { text: 'Feedback', icon: Feedback, path: '/feedback' },
        { text: 'Notifications', icon: Notifications, path: '/notifications' },
      ],
      admin: [
        { text: 'Users', icon: People, path: '/admin/users' },
        { text: 'Therapy Management', icon: LocalHospital, path: '/therapy/manage' },
        { text: 'Data Visualization', icon: Analytics, path: '/data-visualization' },
        { text: 'Appointments', icon: CalendarToday, path: '/admin/appointments' },
        { text: 'Feedback', icon: Feedback, path: '/feedback' },
        { text: 'Notifications', icon: Notifications, path: '/notifications' },
        { text: 'System', icon: AdminPanelSettings, path: '/admin/system' },
      ],
    };
    
    return [...baseItems, ...(roleSpecificItems[user?.role] || [])];
  };
  
  const navigationItems = getNavigationItems();
  
  const getRoleColor = (role) => {
    const colors = {
      patient: theme.palette.success.main,
      therapist: theme.palette.secondary.main,
      doctor: theme.palette.info.main,
      admin: theme.palette.warning.main,
    };
    return colors[role] || theme.palette.primary.main;
  };
  
  const DrawerContent = () => (
    <Box sx={{ width: 250, mt: 2 }}>
      <Box sx={{ p: 2, textAlign: 'center', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          🧘‍♀️ AyurSutra
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Smart Panchakarma Management
        </Typography>
      </Box>
      
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.2)', mx: 2 }} />
      
      <List sx={{ mt: 2 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <ListItemButton
              key={item.text}
              selected={isActive}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
              sx={{
                color: 'white',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
  
  if (!user) return null;
  
  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: isMobile ? 1 : 0,
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
              🧘‍♀️ AyurSutra
            </Typography>
          </motion.div>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, ml: 4 }}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.text}
                    startIcon={<Icon />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      color: isActive ? theme.palette.primary.main : 'text.primary',
                      fontWeight: isActive ? 600 : 400,
                      mx: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(46, 139, 87, 0.1)',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>
          )}
          
          <Box sx={{ flexGrow: isMobile ? 0 : 1 }} />
          
          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Role chip */}
            <Chip
              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              size="small"
              sx={{
                backgroundColor: getRoleColor(user.role),
                color: 'white',
                fontWeight: 600,
                display: { xs: 'none', sm: 'inline-flex' }
              }}
            />
            
            {/* Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationMenuOpen}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            {/* Profile Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: getRoleColor(user.role)
                }}
              >
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
          }
        }}
      >
        <DrawerContent />
      </Drawer>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { mt: 1, minWidth: 200 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon><AccountCircle /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon><Settings /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}><Logout /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { mt: 1, maxWidth: 400, minWidth: 300, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 5).map((notification) => {
            const isRead = notification.channels?.inApp?.status === 'read';
            
            return (
              <MenuItem
                key={notification._id}
                onClick={() => {
                  if (!isRead) {
                    markNotificationAsRead(notification._id);
                  }
                  handleMenuClose();
                }}
                sx={{
                  backgroundColor: isRead ? 'transparent' : 'action.hover',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  whiteSpace: 'normal',
                  py: 1.5,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: isRead ? 400 : 600 }}>
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {new Date(notification.createdAt).toLocaleDateString()}
                </Typography>
              </MenuItem>
            );
          })
        )}
        
        {notifications.length > 5 && (
          <>
            <Divider />
            <MenuItem onClick={() => {
              navigate('/notifications');
              handleMenuClose();
            }}>
              <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
                View all notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  Badge,
  Alert,
  Divider,
  TextField,
  Collapse,
  Menu,
  MenuList,
  ClickAwayListener,
  Popper,
  ButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  MarkEmailUnread,
  Delete,
  Settings,
  FilterList,
  Search,
  Schedule,
  Event,
  LocalHospital,
  Person,
  Star,
  Warning,
  Info,
  CheckCircle,
  Cancel,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Clear,
  ExpandMore,
  Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const NotificationCenter = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('notifications_sound') !== 'false'
  );

  // Queries
  const { data: notifications, isLoading, refetch } = useQuery(
    ['notifications', filterType, searchTerm, tabValue],
    () => apiService.getNotifications({
      type: filterType !== 'all' ? filterType : undefined,
      search: searchTerm || undefined,
      unreadOnly: tabValue === 1,
      limit: 100
    }),
    { 
      keepPreviousData: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: notificationSettings } = useQuery(
    'notification-settings',
    apiService.getNotificationSettings
  );

  // Mutations
  const markAsReadMutation = useMutation(
    (notificationIds) => {
      if (Array.isArray(notificationIds)) {
        return Promise.all(notificationIds.map(id => 
          apiService.markNotificationAsRead(id)
        ));
      }
      return apiService.markNotificationAsRead(notificationIds);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        setSelectedNotifications([]);
        toast.success('Notifications marked as read');
      },
    }
  );

  const updateSettingsMutation = useMutation(
    (settings) => apiService.updateNotificationSettings(settings),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
        queryClient.invalidateQueries('notification-settings');
        setSettingsDialog(false);
      },
    }
  );

  const notificationList = notifications?.data?.notifications || [];
  const unreadCount = notificationList.filter(n => !n.read).length;

  // Real-time notifications via socket
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification) => {
        queryClient.invalidateQueries(['notifications']);
        
        // Play sound if enabled
        if (soundEnabled) {
          try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Could not play sound:', e));
          } catch (e) {
            console.log('Audio not supported:', e);
          }
        }

        // Show toast notification
        toast.success(
          `New ${notification.type}: ${notification.title}`,
          {
            duration: 4000,
            icon: getNotificationIcon(notification.type),
          }
        );
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket, queryClient, soundEnabled]);

  const getNotificationIcon = (type, priority = 'medium') => {
    const iconProps = { 
      color: priority === 'high' ? 'error' : priority === 'low' ? 'action' : 'primary',
      fontSize: 'small'
    };

    switch (type) {
      case 'appointment':
        return <Schedule {...iconProps} />;
      case 'therapy_session':
        return <PlayArrow {...iconProps} />;
      case 'feedback':
        return <Star {...iconProps} />;
      case 'system':
        return <Settings {...iconProps} />;
      case 'reminder':
        return <Event {...iconProps} />;
      case 'alert':
        return <Warning color="warning" fontSize="small" />;
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getNotificationColor = (type, priority = 'medium') => {
    if (priority === 'high') return 'error';
    switch (type) {
      case 'appointment':
        return 'primary';
      case 'therapy_session':
        return 'success';
      case 'feedback':
        return 'warning';
      case 'alert':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  const handleMarkAsRead = (notificationIds) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const unreadIds = notificationList
      .filter(n => !n.read)
      .map(n => n._id);
    setSelectedNotifications(
      selectedNotifications.length === unreadIds.length ? [] : unreadIds
    );
  };

  const notificationTypes = [
    { value: 'all', label: 'All Notifications' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'therapy_session', label: 'Therapy Sessions' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'system', label: 'System' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'alert', label: 'Alerts' },
  ];

  const filteredNotifications = notificationList.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = tabValue === 0 || (tabValue === 1 && !notification.read);
    
    return matchesSearch && matchesTab;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Notification Center 🔔
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Stay updated with real-time notifications
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsActive color="primary" />
            </Badge>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refetch}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setSettingsDialog(true)}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {notificationList.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Notifications
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MarkEmailUnread sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {unreadCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {notificationList.filter(n => n.type === 'appointment').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Appointments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Warning sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                <Typography variant="h4" color="error.main">
                  {notificationList.filter(n => n.priority === 'high').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  High Priority
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Notifications"
                placeholder="Search by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filter by Type"
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  {notificationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={soundEnabled}
                      onChange={(e) => {
                        setSoundEnabled(e.target.checked);
                        localStorage.setItem('notifications_sound', e.target.checked);
                      }}
                    />
                  }
                  label="Sound"
                />
                {selectedNotifications.length > 0 && (
                  <>
                    <Button
                      size="small"
                      startIcon={<MarkEmailRead />}
                      onClick={() => handleMarkAsRead(selectedNotifications)}
                    >
                      Mark Read ({selectedNotifications.length})
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Clear />}
                      onClick={() => setSelectedNotifications([])}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  All
                  <Badge badgeContent={notificationList.length} color="primary" sx={{ ml: 1 }} />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Unread
                  <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Quick Actions */}
        {unreadCount > 0 && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <ButtonGroup size="small">
                <Button onClick={handleSelectAll}>
                  {selectedNotifications.length === unreadCount ? 'Deselect All' : 'Select All Unread'}
                </Button>
                <Button 
                  onClick={() => handleMarkAsRead(notificationList.filter(n => !n.read).map(n => n._id))}
                  variant="contained"
                >
                  Mark All as Read
                </Button>
              </ButtonGroup>
            }
          >
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Alert>
        )}

        {/* Notification List */}
        <TabPanel value={tabValue} index={tabValue}>
          {isLoading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading notifications...</Typography>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Alert severity="info">
              {tabValue === 1 
                ? 'No unread notifications found' 
                : 'No notifications found'
              }
            </Alert>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    sx={{ 
                      mb: 2, 
                      border: !notification.read ? '2px solid' : '1px solid',
                      borderColor: !notification.read 
                        ? `${getNotificationColor(notification.type, notification.priority)}.main`
                        : 'divider',
                      opacity: notification.read ? 0.7 : 1,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: 3,
                        opacity: 1,
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                          <Box sx={{ mr: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: `${getNotificationColor(notification.type, notification.priority)}.main`,
                              width: 40,
                              height: 40
                            }}>
                              {getNotificationIcon(notification.type, notification.priority)}
                            </Avatar>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: !notification.read ? 600 : 400 }}>
                                {notification.title}
                              </Typography>
                              {!notification.read && (
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: 1 }} />
                              )}
                              {notification.priority === 'high' && (
                                <Chip label="High Priority" color="error" size="small" sx={{ ml: 1 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {notification.message}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Chip 
                                label={notification.type.replace('_', ' ')} 
                                color={getNotificationColor(notification.type)}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatNotificationTime(notification.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!notification.read && (
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification._id)}
                              title="Mark as read"
                            >
                              <MarkEmailRead />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleSelectNotification(notification._id)}
                            color={selectedNotifications.includes(notification._id) ? 'primary' : 'default'}
                          >
                            <CheckCircle />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabPanel>
      </motion.div>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notification Types
            </Typography>
            <Grid container spacing={2}>
              {notificationTypes.slice(1).map((type) => (
                <Grid item xs={12} sm={6} key={type.value}>
                  <FormControlLabel
                    control={
                      <Switch 
                        defaultChecked={notificationSettings?.data?.[type.value] !== false}
                        // Add onChange to update settings
                      />
                    }
                    label={type.label}
                  />
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Sound & Alerts
            </Typography>
            <FormControlLabel
              control={<Switch checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />}
              label="Play notification sounds"
            />
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Email Notifications
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Send email notifications"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => updateSettingsMutation.mutate({})}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationCenter;
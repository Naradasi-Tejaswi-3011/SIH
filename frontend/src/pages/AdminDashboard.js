import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  People,
  LocalHospital,
  TrendingUp,
  Assessment,
  MonitorHeart,
  Warning,
  CheckCircle,
  Schedule,
  Notifications,
  Settings,
  Refresh,
  CloudDone,
  Security,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Fetch admin data
  const { data: dashboardData, refetch } = useQuery(
    ['dashboard-analytics'],
    () => apiService.getDashboardAnalytics(),
    { refetchInterval: 30000 }
  );

  const { data: realtimeData } = useQuery(
    ['realtime-analytics'],
    () => apiService.getRealtimeAnalytics(),
    { refetchInterval: 10000 }
  );

  const { data: users } = useQuery(
    ['users'],
    () => apiService.getUsers({ limit: 10, sort: '-createdAt' })
  );

  // Process data
  const overview = dashboardData?.data?.overview || {};
  const userDistribution = dashboardData?.data?.userDistribution || {};
  const appointmentDistribution = dashboardData?.data?.appointmentDistribution || {};
  const systemHealth = dashboardData?.data?.systemHealth || {};
  const trends = dashboardData?.data?.trends || {};

  const stats = {
    totalUsers: overview.totalUsers || 0,
    totalAppointments: overview.totalAppointments || 0,
    recentAppointments: overview.recentAppointments || 0,
    activeUsers: systemHealth.activeUsers || 0,
    activeSessions: realtimeData?.data?.activeSessions || 0,
    pendingNotifications: realtimeData?.data?.pendingNotifications || 0,
  };

  // Chart data
  const userGrowthData = {
    labels: trends.userGrowth?.map(item => format(new Date(item._id), 'MMM dd')) || [],
    datasets: [{
      label: 'New Users',
      data: trends.userGrowth?.map(item => item.count) || [],
      borderColor: '#2E8B57',
      backgroundColor: 'rgba(46, 139, 87, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const appointmentTrendsData = {
    labels: trends.dailyAppointments?.map(item => format(new Date(item._id), 'MMM dd')) || [],
    datasets: [{
      label: 'Daily Appointments',
      data: trends.dailyAppointments?.map(item => item.count) || [],
      backgroundColor: '#FF8A65',
      borderRadius: 4,
    }]
  };

  const userDistributionData = {
    labels: Object.keys(userDistribution),
    datasets: [{
      data: Object.values(userDistribution),
      backgroundColor: ['#2E8B57', '#FF8A65', '#42A5F5', '#9C27B0'],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  };

  const systemMetrics = [
    {
      label: 'Server Uptime',
      value: Math.round((systemHealth.systemUptime || 0) / 3600),
      unit: ' hours',
      color: '#4CAF50',
      icon: <CloudDone />
    },
    {
      label: 'Avg Session Duration',
      value: Math.round(systemHealth.averageSessionDuration || 0),
      unit: ' min',
      color: '#FF8A65',
      icon: <Speed />
    },
    {
      label: 'Notification Rate',
      value: Math.round(systemHealth.notificationDeliveryRate || 0),
      unit: '%',
      color: '#42A5F5',
      icon: <Notifications />
    },
    {
      label: 'System Health',
      value: 98,
      unit: '%',
      color: '#2E8B57',
      icon: <Security />
    }
  ];

  const recentUsers = users?.data?.users || [];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage system users and roles',
      icon: People,
      color: '#2E8B57',
      action: () => navigate('/admin/users')
    },
    {
      title: 'System Monitor',
      description: 'Monitor system performance',
      icon: MonitorHeart,
      color: '#FF8A65',
      action: () => navigate('/admin/monitor')
    },
    {
      title: 'Therapy Management',
      description: 'Manage therapy configurations',
      icon: LocalHospital,
      color: '#42A5F5',
      action: () => navigate('/admin/therapies')
    },
    {
      title: 'Analytics',
      description: 'View detailed system analytics',
      icon: Assessment,
      color: '#9C27B0',
      action: () => navigate('/admin/analytics')
    }
  ];

  const systemAlerts = [
    {
      type: 'warning',
      message: 'High server load detected (85%)',
      timestamp: new Date(),
    },
    {
      type: 'info',
      message: 'Database maintenance scheduled for tonight',
      timestamp: new Date(),
    },
    {
      type: 'success',
      message: 'System backup completed successfully',
      timestamp: new Date(Date.now() - 3600000),
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              System Administration 🛡️
            </Typography>
            <Typography variant="h6" color="text.secondary">
              AyurSutra Platform Overview - {format(new Date(), 'MMMM dd, yyyy')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => refetch()}
          >
            Refresh Data
          </Button>
        </Box>
      </motion.div>

      {/* System Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: '#2E8B57', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
                <Chip 
                  label={`${stats.activeUsers} active`} 
                  size="small" 
                  color="success" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: '#FF8A65', mb: 1 }} />
                <Typography variant="h4" color="secondary">
                  {stats.totalAppointments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
                <Chip 
                  label={`${stats.recentAppointments} recent`} 
                  size="small" 
                  color="primary" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MonitorHeart sx={{ fontSize: 40, color: '#42A5F5', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {stats.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Live Sessions
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={75} 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#9C27B0' }}>
                  98%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System Health
                </Typography>
                <Chip 
                  label="Excellent" 
                  size="small" 
                  color="success" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* System Analytics Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab label="User Analytics" />
                  <Tab label="Appointment Trends" />
                  <Tab label="System Metrics" />
                </Tabs>
              </Box>

              {/* User Analytics Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>User Growth & Distribution</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Box sx={{ height: 300 }}>
                      <Line 
                        data={userGrowthData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>User Distribution</Typography>
                    <Box sx={{ height: 200 }}>
                      <Doughnut 
                        data={userDistributionData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { position: 'bottom' } }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Appointment Trends Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>Daily Appointment Volume</Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={appointmentTrendsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }}
                  />
                </Box>
              </TabPanel>

              {/* System Metrics Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>System Performance Metrics</Typography>
                <Grid container spacing={3}>
                  {systemMetrics.map((metric, index) => (
                    <Grid item xs={6} md={3} key={index}>
                      <Paper sx={{ p: 3, textAlign: 'center', background: `${metric.color}10` }}>
                        <Box sx={{ color: metric.color, mb: 1 }}>
                          {metric.icon}
                        </Box>
                        <Typography variant="h5" sx={{ color: metric.color }}>
                          {metric.value}{metric.unit}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </TabPanel>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}
                    onClick={action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <action.icon sx={{ color: action.color, mr: 1 }} />
                        <Typography variant="h6">{action.title}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Alerts</Typography>
                <List>
                  {systemAlerts.map((alert, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {alert.type === 'warning' && <Warning color="warning" />}
                        {alert.type === 'info' && <Notifications color="info" />}
                        {alert.type === 'success' && <CheckCircle color="success" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={format(alert.timestamp, 'MMM dd, h:mm a')}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Users</Typography>
                <List>
                  {recentUsers.slice(0, 5).map((user, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {user.firstName?.[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={`${user.firstName} ${user.lastName}`}
                        secondary={
                          <Box>
                            <Chip 
                              label={user.role} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                              sx={{ mr: 1, fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(user.createdAt), 'MMM dd')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Status</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Database</Typography>
                    <Chip label="Healthy" size="small" color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">API Services</Typography>
                    <Chip label="Running" size="small" color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Background Jobs</Typography>
                    <Chip label="Active" size="small" color="success" />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  All systems operational. Last checked: {format(new Date(), 'h:mm a')}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
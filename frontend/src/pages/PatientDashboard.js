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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
  IconButton,
  Fab,
} from '@mui/material';
import {
  CalendarToday,
  TrendingUp,
  LocalHospital,
  Schedule,
  Notifications,
  Add,
  SelfImprovement,
  Favorite,
  Assessment,
  MonitorHeart,
  Restaurant,
  Psychology,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, addDays } from 'date-fns';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Fetch patient data
  const { data: appointments } = useQuery(
    ['appointments', user?.id],
    () => apiService.getAppointments({ patientId: user.id, limit: 10 }),
    { enabled: !!user?.id }
  );

  const { data: progressData } = useQuery(
    ['patient-progress', user?.id],
    () => apiService.getPatientProgress(user.id, { timeframe: '3months' }),
    { enabled: !!user?.id }
  );

  const { data: notifications } = useQuery(
    ['notifications'],
    () => apiService.getNotifications({ unreadOnly: true, limit: 5 })
  );

  // Mock data for demonstration
  const upcomingAppointments = appointments?.data?.appointments?.filter(apt => 
    new Date(apt.scheduledDateTime) > new Date()
  ).slice(0, 3) || [];

  const recentAppointments = appointments?.data?.appointments?.filter(apt => 
    apt.status === 'completed'
  ).slice(0, 3) || [];

  const wellnessScore = progressData?.data?.summary?.improvementScore || 75;
  const totalSessions = progressData?.data?.summary?.totalSessions || 0;

  // Wellness trend data
  const wellnessTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Wellness Score',
        data: [65, 70, 72, 75],
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const therapyDistribution = {
    labels: Object.keys(progressData?.data?.therapyDistribution || { 'Abhyanga': 5, 'Shirodhara': 3, 'Meditation': 2 }),
    datasets: [
      {
        data: Object.values(progressData?.data?.therapyDistribution || { 'Abhyanga': 5, 'Shirodhara': 3, 'Meditation': 2 }),
        backgroundColor: ['#2E8B57', '#FF8A65', '#42A5F5', '#9C27B0'],
        borderWidth: 2,
        borderColor: '#fff',
      }
    ]
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      description: 'Schedule your next therapy session',
      icon: CalendarToday,
      color: '#2E8B57',
      action: () => navigate('/appointments/book')
    },
    {
      title: 'View Progress',
      description: 'Track your wellness journey',
      icon: TrendingUp,
      color: '#FF8A65',
      action: () => navigate('/analytics')
    },
    {
      title: 'AI Recommendations',
      description: 'Get personalized therapy suggestions',
      icon: Psychology,
      color: '#42A5F5',
      action: () => navigate('/recommendations')
    }
  ];

  const healthMetrics = [
    { label: 'Sleep Quality', value: 8.2, unit: '/10', color: '#2E8B57' },
    { label: 'Stress Level', value: 3.1, unit: '/10', color: '#FF8A65' },
    { label: 'Energy Level', value: 7.8, unit: '/10', color: '#42A5F5' },
    { label: 'Overall Mood', value: 8.5, unit: '/10', color: '#9C27B0' }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.firstName}! 🧘‍♀️
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your wellness journey continues today
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Favorite sx={{ fontSize: 40, color: '#2E8B57', mb: 1 }} />
                    <Typography variant="h4" color="primary">
                      {wellnessScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Wellness Score
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={wellnessScore} 
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <SelfImprovement sx={{ fontSize: 40, color: '#FF8A65', mb: 1 }} />
                    <Typography variant="h4" color="secondary">
                      {totalSessions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CalendarToday sx={{ fontSize: 40, color: '#42A5F5', mb: 1 }} />
                    <Typography variant="h4" color="info.main">
                      {upcomingAppointments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#9C27B0' }}>
                      +12%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Improvement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>

          {/* Wellness Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Wellness Trend</Typography>
                  <Box>
                    {['week', 'month', '3months'].map((period) => (
                      <Button
                        key={period}
                        size="small"
                        variant={selectedPeriod === period ? 'contained' : 'outlined'}
                        onClick={() => setSelectedPeriod(period)}
                        sx={{ mr: 1 }}
                      >
                        {period === '3months' ? '3M' : period}
                      </Button>
                    ))}
                  </Box>
                </Box>
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={wellnessTrendData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true, max: 100 }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Health Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Health Metrics</Typography>
                <Grid container spacing={2}>
                  {healthMetrics.map((metric, index) => (
                    <Grid item xs={6} md={3} key={index}>
                      <Paper sx={{ p: 2, textAlign: 'center', background: `${metric.color}10` }}>
                        <Typography variant="h5" sx={{ color: metric.color }}>
                          {metric.value}{metric.unit}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {metric.label}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={metric.value * 10} 
                          sx={{ mt: 1, '& .MuiLinearProgress-bar': { backgroundColor: metric.color } }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} md={4} key={index}>
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
          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Upcoming Sessions</Typography>
                  <IconButton onClick={() => navigate('/appointments/book')}>
                    <Add />
                  </IconButton>
                </Box>
                
                {upcomingAppointments.length > 0 ? (
                  <List>
                    {upcomingAppointments.map((appointment, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <LocalHospital color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={appointment.therapy?.name || 'Therapy Session'}
                          secondary={`${format(new Date(appointment.scheduledDateTime), 'MMM dd, yyyy')} at ${format(new Date(appointment.scheduledDateTime), 'h:mm a')}`}
                        />
                        <Chip 
                          label={appointment.status} 
                          size="small"
                          color={appointment.status === 'confirmed' ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No upcoming appointments. Book your next session!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Therapy Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Therapy Distribution</Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut 
                    data={therapyDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Notifications</Typography>
                
                {notifications?.data?.notifications?.length > 0 ? (
                  <List>
                    {notifications.data.notifications.map((notification, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Notifications color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.title}
                          secondary={notification.message}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Wellness Tip */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Today's Wellness Tip</Typography>
                <Typography variant="body2">
                  🌅 Start your day with pranayama (breathing exercises) to balance your doshas 
                  and enhance mental clarity. Even 5 minutes can make a significant difference 
                  in your overall well-being.
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <SelfImprovement sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Ayurvedic Wisdom
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="book appointment"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/appointments/book')}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default PatientDashboard;
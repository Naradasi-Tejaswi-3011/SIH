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
  IconButton,
  Paper,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Schedule,
  Person,
  TrendingUp,
  Star,
  PlayArrow,
  Pause,
  Stop,
  MonitorHeart,
  Assignment,
  Notifications,
  CalendarToday,
  Assessment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { Line, Bar } from 'react-chartjs-2';
import { format, startOfDay, endOfDay } from 'date-fns';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const TherapistDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Fetch therapist data
  const { data: appointments } = useQuery(
    ['therapist-appointments', user?.id],
    () => apiService.getAppointments({ 
      therapistId: user.id, 
      date: format(new Date(), 'yyyy-MM-dd'),
      limit: 20 
    }),
    { enabled: !!user?.id, refetchInterval: 30000 }
  );

  const { data: performanceData } = useQuery(
    ['therapist-performance', user?.id],
    () => apiService.getTherapistPerformance(user.id, { timeframe: '1month' }),
    { enabled: !!user?.id }
  );

  const { data: realtimeData } = useQuery(
    ['realtime-analytics'],
    () => apiService.getRealtimeAnalytics(),
    { refetchInterval: 10000 }
  );

  // Process data
  const todayAppointments = appointments?.data?.appointments || [];
  const activeAppointments = todayAppointments.filter(apt => apt.status === 'in_progress');
  const upcomingAppointments = todayAppointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'confirmed'
  );
  const completedToday = todayAppointments.filter(apt => 
    apt.status === 'completed' && 
    startOfDay(new Date(apt.actualEndTime || apt.scheduledDateTime)).getTime() === startOfDay(new Date()).getTime()
  );

  const stats = {
    totalSessions: performanceData?.data?.summary?.totalAppointments || 0,
    completionRate: performanceData?.data?.summary?.completionRate || 0,
    averageRating: performanceData?.data?.summary?.averageRating || 0,
    activeSessions: activeAppointments.length,
    todayCompleted: completedToday.length,
    upcomingToday: upcomingAppointments.length,
  };

  // Performance chart data
  const performanceChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Sessions Completed',
        data: [12, 15, 18, 16],
        backgroundColor: '#2E8B57',
        borderRadius: 4,
      },
      {
        label: 'Patient Satisfaction',
        data: [4.2, 4.5, 4.7, 4.6],
        backgroundColor: '#FF8A65',
        borderRadius: 4,
        yAxisID: 'y1',
      }
    ]
  };

  const ratingDistribution = {
    labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
    datasets: [{
      data: [1, 2, 8, 15, 24],
      backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#4CAF50', '#2E8B57'],
    }]
  };

  const handleStartSession = (appointmentId) => {
    navigate(`/therapy/${appointmentId}/track`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'success';
      case 'scheduled': return 'primary';
      case 'confirmed': return 'info';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return <PlayArrow />;
      case 'scheduled': return <Schedule />;
      case 'confirmed': return <Assignment />;
      case 'completed': return <Stop />;
      default: return <Schedule />;
    }
  };

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
              Welcome, Dr. {user?.firstName}! 🩺
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Your therapy sessions for {format(new Date(), 'MMMM dd, yyyy')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MonitorHeart />}
            onClick={() => navigate('/analytics/realtime')}
          >
            Live Monitor
          </Button>
        </Box>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={stats.activeSessions} color="error">
                  <PlayArrow sx={{ fontSize: 40, color: '#2E8B57', mb: 1 }} />
                </Badge>
                <Typography variant="h4" color="primary">
                  {stats.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assignment sx={{ fontSize: 40, color: '#FF8A65', mb: 1 }} />
                <Typography variant="h4" color="secondary">
                  {stats.upcomingToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: '#42A5F5', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {stats.completionRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: '#9C27B0', mb: 1 }} />
                <Typography variant="h4" sx={{ color: '#9C27B0' }}>
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Session Management Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                  <Tab 
                    label={
                      <Badge badgeContent={stats.activeSessions} color="error">
                        Active Sessions
                      </Badge>
                    } 
                  />
                  <Tab 
                    label={
                      <Badge badgeContent={stats.upcomingToday} color="primary">
                        Upcoming
                      </Badge>
                    } 
                  />
                  <Tab label="Completed Today" />
                </Tabs>
              </Box>

              {/* Active Sessions Tab */}
              <TabPanel value={tabValue} index={0}>
                {activeAppointments.length > 0 ? (
                  <List>
                    {activeAppointments.map((appointment) => (
                      <ListItem
                        key={appointment._id}
                        sx={{
                          border: '2px solid #2E8B57',
                          borderRadius: 2,
                          mb: 2,
                          bgcolor: '#f8fff8'
                        }}
                      >
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: '#2E8B57' }}>
                            <PlayArrow />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">
                                {appointment.patient?.firstName} {appointment.patient?.lastName}
                              </Typography>
                              <Chip label="LIVE" color="success" size="small" />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {appointment.therapy?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Started: {format(new Date(appointment.actualStartTime), 'h:mm a')}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleStartSession(appointment._id)}
                            startIcon={<MonitorHeart />}
                          >
                            Monitor
                          </Button>
                          <LinearProgress
                            variant="determinate"
                            value={appointment.sessionProgress?.completionPercentage || 0}
                            sx={{ width: 100 }}
                          />
                          <Typography variant="caption">
                            {appointment.sessionProgress?.completionPercentage || 0}% Complete
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No active sessions at the moment
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              {/* Upcoming Sessions Tab */}
              <TabPanel value={tabValue} index={1}>
                {upcomingAppointments.length > 0 ? (
                  <List>
                    {upcomingAppointments.map((appointment) => (
                      <ListItem key={appointment._id}>
                        <ListItemIcon>
                          {getStatusIcon(appointment.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {appointment.therapy?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(appointment.scheduledDateTime), 'h:mm a')}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={appointment.status} 
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleStartSession(appointment._id)}
                            disabled={appointment.status !== 'confirmed'}
                          >
                            {appointment.status === 'confirmed' ? 'Start' : 'View'}
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No upcoming appointments today
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              {/* Completed Sessions Tab */}
              <TabPanel value={tabValue} index={2}>
                {completedToday.length > 0 ? (
                  <List>
                    {completedToday.map((appointment) => (
                      <ListItem key={appointment._id}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: '#4CAF50' }}>
                            <Stop />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {appointment.therapy?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Completed: {format(new Date(appointment.actualEndTime), 'h:mm a')} 
                                ({appointment.actualDuration || appointment.estimatedDuration}min)
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip label="Completed" color="success" size="small" />
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                            Rating: {appointment.qualityMetrics?.satisfaction?.patientSatisfaction || 'N/A'} ⭐
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No sessions completed today yet
                    </Typography>
                  </Box>
                )}
              </TabPanel>
            </Card>
          </motion.div>

          {/* Performance Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Monthly Performance</Typography>
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={performanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, position: 'left' },
                        y1: { 
                          beginAtZero: true, 
                          position: 'right',
                          grid: { drawOnChartArea: false },
                          max: 5
                        }
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Real-time System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Status</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Active System Users</Typography>
                  <Chip label={realtimeData?.data?.activeSessions || 0} color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Today's Appointments</Typography>
                  <Chip label={realtimeData?.data?.todayAppointments || 0} color="primary" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Pending Notifications</Typography>
                  <Badge badgeContent={realtimeData?.data?.pendingNotifications || 0} color="error">
                    <Notifications />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Patient Satisfaction */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Patient Ratings</Typography>
                <Box sx={{ height: 200 }}>
                  <Bar 
                    data={ratingDistribution}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="h4" color="primary">
                    {stats.averageRating.toFixed(1)} ⭐
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating (50 reviews)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CalendarToday />}
                    onClick={() => navigate('/schedule')}
                    fullWidth
                  >
                    View Schedule
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={() => navigate('/analytics')}
                    fullWidth
                  >
                    View Analytics
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Person />}
                    onClick={() => navigate('/patients')}
                    fullWidth
                  >
                    Patient Records
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #FF8A65 0%, #FF7043 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Today's Highlights</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  🎯 You've completed {stats.todayCompleted} sessions today with an average satisfaction of 4.7/5
                </Typography>
                <Typography variant="body2">
                  💡 Remember to maintain proper room temperature for Abhyanga sessions to enhance oil absorption
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TherapistDashboard;
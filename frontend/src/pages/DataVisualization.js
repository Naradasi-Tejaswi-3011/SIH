import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
  TextField,
  Tabs,
  Tab,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  ShowChart,
  PieChart,
  BarChart,
  Timeline,
  Analytics,
  Insights,
  CalendarToday,
  Person,
  LocalHospital,
  Star,
  Schedule,
  MonitorHeart,
  Psychology,
  SelfImprovement,
  Download,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const DataVisualization = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedTherapy, setSelectedTherapy] = useState('all');
  const [selectedTherapist, setSelectedTherapist] = useState('all');

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case 'last7days':
        return { start: subDays(now, 7), end: now };
      case 'last30days':
        return { start: subDays(now, 30), end: now };
      case 'last3months':
        return { start: subMonths(now, 3), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Queries
  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard-analytics', dateRange, selectedTherapy, selectedTherapist],
    () => apiService.getDashboardAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      therapy: selectedTherapy !== 'all' ? selectedTherapy : undefined,
      therapist: selectedTherapist !== 'all' ? selectedTherapist : undefined,
    }),
    { keepPreviousData: true }
  );

  const { data: therapies } = useQuery('therapies', () => 
    apiService.getTherapies({ limit: 100 })
  );

  const { data: therapists } = useQuery('therapists', () => 
    apiService.getUsers({ role: 'therapist', limit: 100 })
  );

  const { data: realtimeData } = useQuery(
    'realtime-analytics',
    apiService.getRealtimeAnalytics,
    { refetchInterval: 10000 } // Refetch every 10 seconds
  );

  const analytics = dashboardData?.data || {};
  const therapyList = therapies?.data?.therapies || [];
  const therapistList = therapists?.data?.users || [];
  const realtime = realtimeData?.data || {};

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Prepare chart data
  const appointmentTrends = useMemo(() => {
    if (!analytics.appointmentTrends) return [];
    return analytics.appointmentTrends.map(item => ({
      ...item,
      date: format(new Date(item.date), 'MMM dd'),
    }));
  }, [analytics.appointmentTrends]);

  const therapyPopularity = useMemo(() => {
    if (!analytics.therapyStats) return [];
    return Object.entries(analytics.therapyStats).map(([name, data]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value: data.count,
      revenue: data.revenue || 0,
      avgRating: data.avgRating || 0,
    }));
  }, [analytics.therapyStats]);

  const performanceMetrics = useMemo(() => {
    if (!analytics.performanceData) return [];
    return analytics.performanceData.map(item => ({
      therapist: item.name,
      appointments: item.totalAppointments,
      rating: item.averageRating,
      completionRate: item.completionRate,
      revenue: item.revenue || 0,
    }));
  }, [analytics.performanceData]);

  const satisfactionData = useMemo(() => {
    if (!analytics.satisfactionBreakdown) return [];
    return Object.entries(analytics.satisfactionBreakdown).map(([rating, count]) => ({
      rating: `${rating} Stars`,
      count,
      percentage: ((count / analytics.totalFeedback) * 100).toFixed(1),
    }));
  }, [analytics.satisfactionBreakdown, analytics.totalFeedback]);

  const healthOutcomesData = useMemo(() => {
    if (!analytics.healthOutcomes) return [];
    return [
      { outcome: 'Much Better', value: analytics.healthOutcomes.muchBetter || 0 },
      { outcome: 'Better', value: analytics.healthOutcomes.better || 0 },
      { outcome: 'No Change', value: analytics.healthOutcomes.noChange || 0 },
      { outcome: 'Worse', value: analytics.healthOutcomes.worse || 0 },
    ];
  }, [analytics.healthOutcomes]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Data Visualization 📊
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Analytics dashboard with comprehensive insights
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
            <Button variant="outlined" startIcon={<Refresh />}>
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                  startAdornment={<CalendarToday sx={{ mr: 1 }} />}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="last7days">Last 7 Days</MenuItem>
                  <MenuItem value="last30days">Last 30 Days</MenuItem>
                  <MenuItem value="thisMonth">This Month</MenuItem>
                  <MenuItem value="last3months">Last 3 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Therapy Type</InputLabel>
                <Select
                  value={selectedTherapy}
                  onChange={(e) => setSelectedTherapy(e.target.value)}
                  label="Therapy Type"
                  startAdornment={<SelfImprovement sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Therapies</MenuItem>
                  {therapyList.map((therapy) => (
                    <MenuItem key={therapy._id} value={therapy._id}>
                      {therapy.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Therapist</InputLabel>
                <Select
                  value={selectedTherapist}
                  onChange={(e) => setSelectedTherapist(e.target.value)}
                  label="Therapist"
                  startAdornment={<Person sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Therapists</MenuItem>
                  {therapistList.map((therapist) => (
                    <MenuItem key={therapist._id} value={therapist._id}>
                      {therapist.firstName} {therapist.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Data from {format(startDate, 'MMM dd')} to {format(endDate, 'MMM dd, yyyy')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Real-time Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <MonitorHeart sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {realtime.activeSessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Sessions
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Chip 
                    label="Live" 
                    color="success" 
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {analytics.totalAppointments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
                <Typography variant="caption" color="success.main">
                  +{analytics.appointmentGrowth || 0}% from last period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {analytics.averageRating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  From {analytics.totalFeedback || 0} reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  ₹{(analytics.totalRevenue || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="caption" color="success.main">
                  +{analytics.revenueGrowth || 0}% from last period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Appointment Trends" icon={<Timeline />} />
            <Tab label="Therapy Analytics" icon={<BarChart />} />
            <Tab label="Performance" icon={<Assessment />} />
            <Tab label="Satisfaction" icon={<Star />} />
            <Tab label="Health Outcomes" icon={<MonitorHeart />} />
          </Tabs>
        </Box>

        {/* Charts */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Appointment Trends */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Appointment Trends Over Time
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={appointmentTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="scheduled" 
                            stackId="1" 
                            stroke="#8884d8" 
                            fill="#8884d8" 
                            name="Scheduled"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="completed" 
                            stackId="1" 
                            stroke="#82ca9d" 
                            fill="#82ca9d" 
                            name="Completed"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="cancelled" 
                            stackId="1" 
                            stroke="#ffc658" 
                            fill="#ffc658" 
                            name="Cancelled"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Therapy Analytics */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Therapy Popularity & Revenue
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <RechartsBarChart data={therapyPopularity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Sessions" />
                          <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (₹)" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Therapy Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <RechartsPieChart>
                          <Pie
                            data={therapyPopularity}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {therapyPopularity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Performance */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Therapist Performance Metrics
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart data={performanceMetrics}>
                          <CartesianGrid />
                          <XAxis dataKey="appointments" name="Appointments" />
                          <YAxis dataKey="rating" name="Rating" domain={[0, 5]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter 
                            name="Therapists" 
                            data={performanceMetrics} 
                            fill="#8884d8"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Performing Therapists
                      </Typography>
                      <List>
                        {performanceMetrics
                          .sort((a, b) => b.rating - a.rating)
                          .slice(0, 5)
                          .map((therapist, index) => (
                            <ListItem key={index}>
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                                  {therapist.therapist.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={therapist.therapist}
                                secondary={
                                  <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Chip label={`${therapist.rating.toFixed(1)} ⭐`} size="small" />
                                    <Chip label={`${therapist.appointments} sessions`} size="small" />
                                    <Chip label={`₹${therapist.revenue.toLocaleString()}`} size="small" />
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Satisfaction */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Rating Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsBarChart data={satisfactionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#ffc658" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Satisfaction Breakdown
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={satisfactionData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {satisfactionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Health Outcomes */}
            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Patient Health Outcomes
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <RechartsBarChart data={healthOutcomesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="outcome" />
                          <YAxis />
                          <Tooltip />
                          <Bar 
                            dataKey="value" 
                            fill="#82ca9d"
                            name="Number of Patients"
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Outcome Summary
                      </Typography>
                      <Box sx={{ p: 2 }}>
                        {healthOutcomesData.map((item, index) => (
                          <Box key={item.outcome} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{item.outcome}</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {item.value}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 8,
                                backgroundColor: 'grey.200',
                                borderRadius: 1,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${(item.value / Math.max(...healthOutcomesData.map(d => d.value))) * 100}%`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                  borderRadius: 1,
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default DataVisualization;
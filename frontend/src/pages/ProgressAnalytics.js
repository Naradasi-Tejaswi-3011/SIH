import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Timeline,
  Assessment,
  EmojiEmotions,
  LocalHospital,
  SelfImprovement,
  CheckCircle,
  Psychology,
  Healing,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ProgressAnalytics = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30');

  // Mock data for progress analytics
  const wellnessData = {
    labels: ['Jan 01', 'Jan 08', 'Jan 15', 'Jan 22', 'Jan 29'],
    datasets: [
      {
        label: 'Overall Wellness',
        data: [75, 78, 82, 85, 88],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Physical Health',
        data: [80, 82, 85, 88, 90],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Mental Well-being',
        data: [70, 74, 79, 82, 86],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Stress Level',
        data: [30, 28, 25, 22, 20],
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const therapyProgress = [
    { name: 'Abhyanga', completed: 8, total: 10, progress: 80 },
    { name: 'Shirodhara', completed: 6, total: 8, progress: 75 },
    { name: 'Panchakarma', completed: 4, total: 21, progress: 19 },
    { name: 'Pranayama', completed: 15, total: 20, progress: 75 },
  ];

  const symptoms = [
    { name: 'Stress', current: 20, baseline: 80, improvement: 75 },
    { name: 'Joint Pain', current: 25, baseline: 70, improvement: 64 },
    { name: 'Sleep Quality', current: 85, baseline: 40, improvement: 112 },
    { name: 'Digestion', current: 80, baseline: 50, improvement: 60 },
  ];

  const doshaBalance = {
    labels: ['Vata', 'Pitta', 'Kapha'],
    datasets: [
      {
        data: [30, 40, 30],
        backgroundColor: ['#8884d8', '#82ca9d', '#ffc658'],
        borderColor: ['#8884d8', '#82ca9d', '#ffc658'],
        borderWidth: 1,
      },
    ],
  };

  const doshaBalanceArray = [
    { name: 'Vata', value: 30, color: '#8884d8' },
    { name: 'Pitta', value: 40, color: '#82ca9d' },
    { name: 'Kapha', value: 30, color: '#ffc658' },
  ];

  const milestones = [
    {
      title: 'First Week Complete',
      description: 'Successfully completed your first week of treatments',
      date: '2024-01-08',
      achieved: true,
      icon: <CheckCircle color="success" />,
    },
    {
      title: 'Stress Reduction Goal',
      description: 'Achieved 50% reduction in stress levels',
      date: '2024-01-15',
      achieved: true,
      icon: <EmojiEmotions color="success" />,
    },
    {
      title: 'Halfway Point',
      description: 'Reached 50% completion of treatment plan',
      date: '2024-01-22',
      achieved: false,
      icon: <Timeline color="primary" />,
    },
    {
      title: 'Sleep Quality Improvement',
      description: 'Improved sleep quality by 100%',
      date: '2024-01-29',
      achieved: false,
      icon: <Healing color="primary" />,
    },
  ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Progress Analytics
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Track your wellness journey and treatment progress
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7">7 Days</MenuItem>
              <MenuItem value="30">30 Days</MenuItem>
              <MenuItem value="90">90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" color="primary">88%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Wellness
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={88} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" color="success.main">33</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sessions Completed
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">Out of 59 planned</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <Psychology />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" color="warning.main">75%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stress Reduction
                    </Typography>
                  </Box>
                </Box>
                <Chip label="Excellent Progress" size="small" color="success" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <SelfImprovement />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" color="info.main">4</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Therapies
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">Next: Tomorrow 10:00 AM</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Wellness Trends" icon={<Timeline />} />
            <Tab label="Therapy Progress" icon={<LocalHospital />} />
            <Tab label="Symptom Tracking" icon={<Assessment />} />
            <Tab label="Dosha Balance" icon={<SelfImprovement />} />
            <Tab label="Milestones" icon={<EmojiEmotions />} />
          </Tabs>

          <TabPanel value={selectedTab} index={0}>
            <Typography variant="h6" gutterBottom>Wellness Trends Over Time</Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              <Line
                data={wellnessData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Wellness Progress Over Time',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </Box>
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <Typography variant="h6" gutterBottom>Therapy Progress</Typography>
            <Grid container spacing={3}>
              {therapyProgress.map((therapy) => (
                <Grid item xs={12} sm={6} key={therapy.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{therapy.name}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">{therapy.completed}/{therapy.total}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={therapy.progress} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {therapy.progress}% Complete
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            <Typography variant="h6" gutterBottom>Symptom Improvement</Typography>
            <Grid container spacing={3}>
              {symptoms.map((symptom) => (
                <Grid item xs={12} sm={6} key={symptom.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{symptom.name}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="h5" color="primary">{symptom.current}%</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Baseline</Typography>
                          <Typography variant="h5">{symptom.baseline}%</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Improvement</Typography>
                          <Typography variant="h5" color="success.main">
                            +{symptom.improvement}%
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={symptom.current} 
                        color={symptom.current > symptom.baseline ? 'success' : 'primary'}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={selectedTab} index={3}>
            <Typography variant="h6" gutterBottom>Dosha Balance Analysis</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ height: 300, width: '100%' }}>
                  <Pie
                    data={doshaBalance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        title: {
                          display: true,
                          text: 'Current Dosha Balance',
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Current Balance</Typography>
                {doshaBalanceArray.map((dosha) => (
                  <Box key={dosha.name} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">{dosha.name}</Typography>
                      <Typography variant="body2">{dosha.value}%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={dosha.value} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: dosha.color,
                        },
                      }}
                    />
                  </Box>
                ))}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Your dosha balance shows good harmony with slight Pitta dominance, 
                  which aligns with your current treatment plan.
                </Typography>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={selectedTab} index={4}>
            <Typography variant="h6" gutterBottom>Treatment Milestones</Typography>
            <List>
              {milestones.map((milestone, index) => (
                <ListItem key={index} sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <ListItemIcon>
                    {milestone.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={milestone.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Target: {format(new Date(milestone.date), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip 
                    label={milestone.achieved ? 'Achieved' : 'In Progress'} 
                    color={milestone.achieved ? 'success' : 'primary'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </Paper>

        {/* Action Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" size="large" startIcon={<Assessment />}>
            Download Detailed Report
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
};

export default ProgressAnalytics;
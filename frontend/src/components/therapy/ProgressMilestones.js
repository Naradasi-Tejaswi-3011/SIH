import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  EmojiEvents,
  Timeline,
  Star,
  LocalHospital,
  Psychology,
  Healing,
  TrendingUp,
  Assignment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

const ProgressMilestones = ({ patientId, treatmentPlan }) => {
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock milestones data - in real app, this would come from props or API
  const milestones = [
    {
      id: 1,
      title: 'Treatment Initiation',
      description: 'Successfully started your Ayurvedic treatment journey',
      type: 'treatment',
      targetDate: '2024-01-01',
      achievedDate: '2024-01-01',
      status: 'completed',
      progress: 100,
      icon: <LocalHospital />,
      color: 'success',
      requirements: [
        'Initial consultation completed',
        'Treatment plan created',
        'First therapy session scheduled'
      ],
      rewards: ['Welcome gift', 'Treatment guidebook']
    },
    {
      id: 2,
      title: 'First Week Completion',
      description: 'Successfully completed your first week of treatments',
      type: 'duration',
      targetDate: '2024-01-08',
      achievedDate: '2024-01-08',
      status: 'completed',
      progress: 100,
      icon: <CheckCircle />,
      color: 'success',
      requirements: [
        'Complete 3 therapy sessions',
        'Daily yoga practice',
        'Follow dietary guidelines'
      ],
      rewards: ['Progress badge', '5% discount on next package']
    },
    {
      id: 3,
      title: 'Stress Reduction Goal',
      description: 'Achieved 50% reduction in stress levels',
      type: 'wellness',
      targetDate: '2024-01-15',
      achievedDate: '2024-01-15',
      status: 'completed',
      progress: 100,
      icon: <Psychology />,
      color: 'success',
      requirements: [
        'Stress level below 40%',
        'Complete meditation sessions',
        'Regular sleep schedule'
      ],
      rewards: ['Wellness certificate', 'Personalized meditation guide']
    },
    {
      id: 4,
      title: 'Halfway Point',
      description: 'Reached 50% completion of treatment plan',
      type: 'treatment',
      targetDate: '2024-01-22',
      achievedDate: null,
      status: 'in_progress',
      progress: 75,
      icon: <Timeline />,
      color: 'primary',
      requirements: [
        'Complete 15 therapy sessions',
        'Maintain consistent attendance',
        'Show measurable health improvements'
      ],
      rewards: ['Mid-treatment assessment', 'Ayurveda cookbook']
    },
    {
      id: 5,
      title: 'Sleep Quality Improvement',
      description: 'Improved sleep quality by 100%',
      type: 'wellness',
      targetDate: '2024-01-25',
      achievedDate: null,
      status: 'pending',
      progress: 60,
      icon: <Healing />,
      color: 'warning',
      requirements: [
        'Sleep quality score above 80%',
        'Consistent sleep schedule',
        'Complete Shirodhara sessions'
      ],
      rewards: ['Sleep wellness kit', 'Personalized bedtime routine']
    },
    {
      id: 6,
      title: 'Energy Level Boost',
      description: 'Achieve 90%+ energy levels consistently',
      type: 'wellness',
      targetDate: '2024-02-01',
      achievedDate: null,
      status: 'pending',
      progress: 40,
      icon: <TrendingUp />,
      color: 'info',
      requirements: [
        'Energy level above 90%',
        'Complete Panchakarma series',
        'Regular exercise routine'
      ],
      rewards: ['Energy booster herbs', 'Fitness consultation']
    },
    {
      id: 7,
      title: 'Treatment Completion',
      description: 'Successfully completed your full treatment plan',
      type: 'treatment',
      targetDate: '2024-02-15',
      achievedDate: null,
      status: 'pending',
      progress: 0,
      icon: <EmojiEvents />,
      color: 'primary',
      requirements: [
        'Complete all scheduled sessions',
        'Achieve wellness goals',
        'Final assessment passed'
      ],
      rewards: ['Completion certificate', '20% discount on next treatment', 'Wellness maintenance plan']
    },
  ];

  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status, icon) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'in_progress':
        return <RadioButtonUnchecked color="primary" />;
      case 'pending':
        return <RadioButtonUnchecked color="disabled" />;
      default:
        return icon;
    }
  };

  const calculateDaysRemaining = (targetDate) => {
    const days = differenceInDays(new Date(targetDate), new Date());
    return days > 0 ? days : 0;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
        Treatment Milestones
      </Typography>

      <Grid container spacing={3}>
        {milestones.map((milestone, index) => (
          <Grid item xs={12} md={6} key={milestone.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                  border: milestone.status === 'completed' ? 2 : 1,
                  borderColor: milestone.status === 'completed' ? 'success.main' : 'grey.300',
                }}
                onClick={() => handleMilestoneClick(milestone)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${milestone.color}.main`, 
                        mr: 2,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getStatusIcon(milestone.status, milestone.icon)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {milestone.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.description}
                      </Typography>
                    </Box>
                    <Chip
                      label={milestone.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(milestone.status)}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={milestone.progress}
                      color={milestone.status === 'completed' ? 'success' : 'primary'}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Target: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                    </Typography>
                    {milestone.status !== 'completed' && (
                      <Chip
                        label={`${calculateDaysRemaining(milestone.targetDate)} days left`}
                        size="small"
                        variant="outlined"
                        color={calculateDaysRemaining(milestone.targetDate) < 3 ? 'warning' : 'default'}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Milestone Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedMilestone && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: `${selectedMilestone.color}.main`, mr: 2 }}>
                  {selectedMilestone.icon}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedMilestone.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMilestone.description}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Requirements
                    </Typography>
                    <List dense>
                      {selectedMilestone.requirements.map((req, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Assignment fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={req} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Rewards
                    </Typography>
                    <List dense>
                      {selectedMilestone.rewards.map((reward, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star fontSize="small" color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={reward} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Progress Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedMilestone.progress}
                        color={selectedMilestone.status === 'completed' ? 'success' : 'primary'}
                        sx={{ height: 12, borderRadius: 6 }}
                      />
                      <Typography variant="h4" align="center" color="primary" sx={{ mt: 1 }}>
                        {selectedMilestone.progress}%
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Target Date
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(selectedMilestone.targetDate), 'EEEE, MMM dd, yyyy')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={selectedMilestone.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(selectedMilestone.status)}
                          size="small"
                        />
                      </Grid>
                      {selectedMilestone.achievedDate && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Achieved On
                          </Typography>
                          <Typography variant="body1" color="success.main">
                            {format(new Date(selectedMilestone.achievedDate), 'EEEE, MMM dd, yyyy')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="primary">
                Close
              </Button>
              {selectedMilestone.status === 'in_progress' && (
                <Button variant="contained" color="primary">
                  View Action Plan
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ProgressMilestones;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Update,
  Add,
  Timeline,
  MonitorHeart,
  AccessTime,
  Person,
  LocalHospital,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { apiService } from '../services/apiService';
import { useSocket } from '../hooks/useSocket';
import VitalSignsChart from '../components/charts/VitalSignsChart';
import ProgressMilestones from '../components/therapy/ProgressMilestones';
import SessionTimer from '../components/therapy/SessionTimer';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TherapyTracking = () => {
  const { appointmentId } = useParams();
  const queryClient = useQueryClient();
  const socket = useSocket();

  // State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [progressDialog, setProgressDialog] = useState(false);
  const [vitalDialog, setVitalDialog] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [currentObservations, setCurrentObservations] = useState('');
  const [complications, setComplications] = useState('');
  const [patientResponse, setPatientResponse] = useState('good');
  const [newMilestone, setNewMilestone] = useState({ description: '', notes: '' });
  const [vitalParameters, setVitalParameters] = useState([]);

  // Queries
  const { data: sessionData, isLoading, refetch } = useQuery(
    ['session-status', appointmentId],
    () => apiService.getSessionStatus(appointmentId),
    {
      refetchInterval: isSessionActive ? 5000 : 30000,
      enabled: !!appointmentId,
    }
  );

  const { data: liveData } = useQuery(
    ['live-session-data', appointmentId],
    () => apiService.getLiveSessionData(appointmentId),
    {
      refetchInterval: isSessionActive ? 2000 : 10000,
      enabled: !!appointmentId && isSessionActive,
    }
  );

  // Mutations
  const startSessionMutation = useMutation(
    (sessionData) => apiService.startTherapySession(appointmentId, sessionData),
    {
      onSuccess: () => {
        toast.success('Therapy session started successfully!');
        setIsSessionActive(true);
        queryClient.invalidateQueries(['session-status', appointmentId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start session');
      },
    }
  );

  const updateProgressMutation = useMutation(
    (progressData) => apiService.updateSessionProgress(appointmentId, progressData),
    {
      onSuccess: () => {
        toast.success('Progress updated successfully!');
        setProgressDialog(false);
        queryClient.invalidateQueries(['session-status', appointmentId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update progress');
      },
    }
  );

  const completeSessionMutation = useMutation(
    (completionData) => apiService.completeTherapySession(appointmentId, completionData),
    {
      onSuccess: () => {
        toast.success('Session completed successfully!');
        setIsSessionActive(false);
        queryClient.invalidateQueries(['session-status', appointmentId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to complete session');
      },
    }
  );

  // Socket listeners
  useEffect(() => {
    if (socket && appointmentId) {
      socket.emit('join_session', appointmentId);

      socket.on('therapy_session_started', (data) => {
        if (data.appointmentId === appointmentId) {
          setIsSessionActive(true);
          queryClient.invalidateQueries(['session-status', appointmentId]);
        }
      });

      socket.on('therapy_progress_updated', (data) => {
        if (data.appointmentId === appointmentId) {
          queryClient.invalidateQueries(['session-status', appointmentId]);
          queryClient.invalidateQueries(['live-session-data', appointmentId]);
        }
      });

      socket.on('therapy_session_completed', (data) => {
        if (data.appointmentId === appointmentId) {
          setIsSessionActive(false);
          queryClient.invalidateQueries(['session-status', appointmentId]);
        }
      });

      return () => {
        socket.emit('leave_session', appointmentId);
        socket.off('therapy_session_started');
        socket.off('therapy_progress_updated');
        socket.off('therapy_session_completed');
      };
    }
  }, [socket, appointmentId, queryClient]);

  // Set session active state based on data
  useEffect(() => {
    if (sessionData?.data?.status === 'in_progress') {
      setIsSessionActive(true);
      setSessionProgress(sessionData.data.progress?.completionPercentage || 0);
    } else {
      setIsSessionActive(false);
    }
  }, [sessionData]);

  const handleStartSession = () => {
    const initialData = {
      vitalParameters: vitalParameters.length > 0 ? vitalParameters : undefined,
      initialObservations: currentObservations || 'Session initiated',
      roomAssigned: { number: 'Room 1', type: 'Standard' },
    };
    startSessionMutation.mutate(initialData);
  };

  const handleUpdateProgress = () => {
    const progressData = {
      completionPercentage: sessionProgress,
      observations: currentObservations,
      complications: complications || undefined,
      patientResponse,
      milestone: newMilestone.description
        ? {
            description: newMilestone.description,
            notes: newMilestone.notes,
          }
        : undefined,
      vitalParameters: vitalParameters.length > 0 ? vitalParameters : undefined,
    };
    updateProgressMutation.mutate(progressData);
  };

  const handleCompleteSession = () => {
    const completionData = {
      finalObservations: currentObservations,
      postTherapyInstructions: 'Rest for 30 minutes, avoid heavy meals for 2 hours',
      nextSessionRecommendations: 'Continue with current therapy plan',
      patientSatisfaction: 4,
      therapistNotes: 'Session completed successfully without complications',
      vitalParameters: vitalParameters.length > 0 ? vitalParameters : undefined,
    };
    completeSessionMutation.mutate(completionData);
  };

  const addVitalParameter = () => {
    setVitalParameters([
      ...vitalParameters,
      {
        parameter: 'pulse',
        value: 0,
        unit: 'bpm',
        isNormal: true,
        notes: '',
      },
    ]);
  };

  const updateVitalParameter = (index, field, value) => {
    const updated = [...vitalParameters];
    updated[index][field] = value;
    setVitalParameters(updated);
  };

  const removeVitalParameter = (index) => {
    setVitalParameters(vitalParameters.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Container>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading session data...</Typography>
      </Container>
    );
  }

  const session = sessionData?.data;
  const live = liveData?.data;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          Real-Time Therapy Tracking
        </Typography>

        {session && (
          <>
            {/* Session Header */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocalHospital color="primary" />
                    <Typography variant="h6">
                      {session.therapy || 'Therapy Session'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Session ID: {session.sessionId}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    <Typography variant="body1">
                      Patient: {session.participants?.patient}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Therapist: {session.participants?.therapist}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box textAlign="right">
                    <Chip
                      label={session.status.toUpperCase()}
                      color={
                        session.status === 'in_progress'
                          ? 'primary'
                          : session.status === 'completed'
                          ? 'success'
                          : 'default'
                      }
                      size="large"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3}>
              {/* Left Column - Session Controls and Progress */}
              <Grid item xs={12} lg={6}>
                {/* Session Controls */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Session Controls
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {!isSessionActive && session.status !== 'completed' && (
                        <Button
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={handleStartSession}
                          disabled={startSessionMutation.isLoading}
                          color="success"
                        >
                          Start Session
                        </Button>
                      )}

                      {isSessionActive && (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<Update />}
                            onClick={() => setProgressDialog(true)}
                            disabled={updateProgressMutation.isLoading}
                          >
                            Update Progress
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<Stop />}
                            onClick={handleCompleteSession}
                            disabled={completeSessionMutation.isLoading}
                            color="error"
                          >
                            Complete Session
                          </Button>
                        </>
                      )}

                      <Button
                        variant="outlined"
                        startIcon={<MonitorHeart />}
                        onClick={() => setVitalDialog(true)}
                      >
                        Record Vitals
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Progress Overview */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Session Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={session.progress?.completionPercentage || 0}
                      sx={{ height: 10, borderRadius: 5, mb: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {session.progress?.completionPercentage || 0}% Complete
                    </Typography>

                    {session.timing && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Duration: {session.timing.actualDuration || 0} minutes
                        </Typography>
                        {session.timing.timeRemaining > 0 && (
                          <Typography variant="body2" color="warning.main">
                            Estimated time remaining: {session.timing.timeRemaining} minutes
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Session Timer */}
                {isSessionActive && session.timing?.startTime && (
                  <SessionTimer startTime={session.timing.startTime} />
                )}
              </Grid>

              {/* Right Column - Live Data and Charts */}
              <Grid item xs={12} lg={6}>
                {/* Live Vital Signs */}
                {live && live.vitalParameters?.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Live Vital Signs
                      </Typography>
                      <VitalSignsChart data={live.vitalParameters} />
                    </CardContent>
                  </Card>
                )}

                {/* Progress Milestones */}
                {session.progress?.milestones && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Session Milestones
                      </Typography>
                      <ProgressMilestones milestones={session.progress.milestones} />
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Full Width - Current Observations */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Current Observations
                    </Typography>
                    <Typography variant="body1">
                      {session.progress?.observations || 'No observations recorded yet.'}
                    </Typography>
                    
                    {session.progress?.patientResponse && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Patient Response: {session.progress.patientResponse}
                      </Alert>
                    )}

                    {session.progress?.complications && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Complications: {session.progress.complications}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </motion.div>

      {/* Progress Update Dialog */}
      <Dialog
        open={progressDialog}
        onClose={() => setProgressDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Session Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Completion Percentage</Typography>
            <LinearProgress
              variant="determinate"
              value={sessionProgress}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <TextField
              type="number"
              label="Progress %"
              value={sessionProgress}
              onChange={(e) => setSessionProgress(Number(e.target.value))}
              fullWidth
              sx={{ mb: 3 }}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />

            <TextField
              label="Current Observations"
              value={currentObservations}
              onChange={(e) => setCurrentObservations(e.target.value)}
              multiline
              rows={3}
              fullWidth
              sx={{ mb: 3 }}
            />

            <TextField
              label="Patient Response"
              select
              value={patientResponse}
              onChange={(e) => setPatientResponse(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
              SelectProps={{ native: true }}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </TextField>

            <TextField
              label="Complications (if any)"
              value={complications}
              onChange={(e) => setComplications(e.target.value)}
              multiline
              rows={2}
              fullWidth
              sx={{ mb: 3 }}
            />

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Add Milestone
            </Typography>
            <TextField
              label="Milestone Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Notes"
              value={newMilestone.notes}
              onChange={(e) => setNewMilestone({ ...newMilestone, notes: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateProgress}
            variant="contained"
            disabled={updateProgressMutation.isLoading}
          >
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vital Signs Dialog */}
      <Dialog
        open={vitalDialog}
        onClose={() => setVitalDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Record Vital Parameters</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {vitalParameters.map((vital, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <TextField
                      select
                      label="Parameter"
                      value={vital.parameter}
                      onChange={(e) => updateVitalParameter(index, 'parameter', e.target.value)}
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      <option value="pulse">Pulse</option>
                      <option value="blood_pressure_systolic">BP Systolic</option>
                      <option value="blood_pressure_diastolic">BP Diastolic</option>
                      <option value="temperature">Temperature</option>
                      <option value="respiratory_rate">Respiratory Rate</option>
                      <option value="oxygen_saturation">Oxygen Saturation</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      type="number"
                      label="Value"
                      value={vital.value}
                      onChange={(e) => updateVitalParameter(index, 'value', Number(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      label="Unit"
                      value={vital.unit}
                      onChange={(e) => updateVitalParameter(index, 'unit', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      label="Notes"
                      value={vital.notes}
                      onChange={(e) => updateVitalParameter(index, 'notes', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      onClick={() => removeVitalParameter(index)}
                      color="error"
                      fullWidth
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              startIcon={<Add />}
              onClick={addVitalParameter}
              variant="outlined"
              fullWidth
            >
              Add Vital Parameter
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVitalDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TherapyTracking;
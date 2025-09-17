import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  FormControl,
  Avatar,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Refresh,
  Timer,
  Notifications,
  VolumeUp,
  VolumeOff,
  Settings,
  CheckCircle,
  Warning,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SessionTimer = ({ 
  sessionData = {
    therapy: 'Abhyanga',
    duration: 60,
    phases: [
      { name: 'Preparation', duration: 5 },
      { name: 'Oil Application', duration: 20 },
      { name: 'Main Massage', duration: 30 },
      { name: 'Rest Period', duration: 5 }
    ]
  },
  onSessionComplete,
  onSessionSave
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAdvancePhases, setAutoAdvancePhases] = useState(true);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  const totalDuration = sessionData.duration * 60; // Convert to seconds
  const phases = sessionData.phases || [];
  
  // Calculate phase start times
  const phaseStartTimes = phases.reduce((acc, phase, index) => {
    if (index === 0) {
      acc.push(0);
    } else {
      acc.push(acc[index - 1] + phases[index - 1].duration * 60);
    }
    return acc;
  }, []);

  const getPhaseProgress = (currentTime, phaseIndex) => {
    const phaseStart = phaseStartTimes[phaseIndex];
    const phaseDuration = phases[phaseIndex].duration * 60;
    const phaseElapsed = currentTime - phaseStart;
    return Math.min(100, Math.max(0, (phaseElapsed / phaseDuration) * 100));
  };

  const getCurrentPhaseCallback = useCallback((currentTime) => {
    for (let i = phases.length - 1; i >= 0; i--) {
      if (currentTime >= phaseStartTimes[i]) {
        return i;
      }
    }
    return 0;
  }, [phases.length, phaseStartTimes]);

  const handleSessionCompleteCallback = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (soundEnabled) {
      playNotificationSound();
    }
    if (onSessionComplete) {
      onSessionComplete({
        therapy: sessionData.therapy,
        duration: totalDuration,
        completed: true,
        timestamp: new Date().toISOString()
      });
    }
  }, [soundEnabled, onSessionComplete, sessionData.therapy, totalDuration]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          
          // Check for phase changes
          const newPhase = getCurrentPhaseCallback(newTime);
          if (newPhase !== currentPhase && autoAdvancePhases) {
            setCurrentPhase(newPhase);
            if (notificationsEnabled && soundEnabled) {
              playNotificationSound();
            }
          }
          
          // Check if session is complete
          if (newTime >= totalDuration) {
            handleSessionCompleteCallback();
            return totalDuration;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, currentPhase, totalDuration, autoAdvancePhases, notificationsEnabled, soundEnabled, getCurrentPhaseCallback, handleSessionCompleteCallback]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (onSessionSave) {
      onSessionSave({
        therapy: sessionData.therapy,
        duration: time,
        completed: false,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setCurrentPhase(0);
  };

  const progress = (time / totalDuration) * 100;
  const remainingTime = totalDuration - time;
  const currentPhaseData = phases[currentPhase] || { name: 'Session', duration: sessionData.duration };
  const phaseProgress = getPhaseProgress(time, currentPhase);

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <Timer />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">
                {sessionData.therapy} Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sessionData.duration} minutes • {phases.length} phases
              </Typography>
            </Box>
            <IconButton onClick={() => setShowSettings(true)}>
              <Settings />
            </IconButton>
          </Box>

          {/* Main Timer Display */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
              <CircularProgress
                variant="determinate"
                value={progress}
                size={120}
                thickness={4}
                sx={{
                  color: isRunning ? 'primary.main' : 'grey.300',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h5" component="div" color="text.primary">
                  {formatTime(time)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  -{formatTime(remainingTime)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" color="primary" gutterBottom>
              {currentPhaseData.name}
            </Typography>
            
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={phaseProgress}
                sx={{ height: 8, borderRadius: 4 }}
                color={phaseProgress === 100 ? 'success' : 'primary'}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Phase Progress: {Math.round(phaseProgress)}%
              </Typography>
            </Box>
          </Box>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            {!isRunning ? (
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                size="large"
                color="success"
              >
                Start Session
              </Button>
            ) : isPaused ? (
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleResume}
                size="large"
                color="primary"
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Pause />}
                onClick={handlePause}
                size="large"
                color="warning"
              >
                Pause
              </Button>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Stop />}
              onClick={handleStop}
              size="large"
              disabled={!isRunning && time === 0}
            >
              Stop
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleReset}
              size="large"
            >
              Reset
            </Button>
          </Box>

          {/* Session Status */}
          {isRunning && (
            <Alert 
              severity={isPaused ? 'warning' : 'info'} 
              sx={{ mb: 2 }}
              icon={isPaused ? <Warning /> : <AccessTime />}
            >
              {isPaused 
                ? 'Session paused. Click Resume to continue.'
                : `Session in progress. Current phase: ${currentPhaseData.name}`
              }
            </Alert>
          )}

          {time >= totalDuration && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
              Session completed successfully! Well done.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Phase Breakdown */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Session Phases
          </Typography>
          <Grid container spacing={2}>
            {phases.map((phase, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0.6 }}
                  animate={{ 
                    opacity: index === currentPhase ? 1 : 0.6,
                    scale: index === currentPhase ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    variant={index === currentPhase ? 'elevation' : 'outlined'}
                    sx={{
                      borderColor: index === currentPhase ? 'primary.main' : 'grey.300',
                      bgcolor: index < currentPhase ? 'success.light' : 'background.paper',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {phase.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {phase.duration} min
                      </Typography>
                      {index === currentPhase && (
                        <LinearProgress
                          variant="determinate"
                          value={phaseProgress}
                          sx={{ mt: 1, height: 4, borderRadius: 2 }}
                        />
                      )}
                      {index < currentPhase && (
                        <Chip
                          label="Complete"
                          size="small"
                          color="success"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Timer Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography gutterBottom>Sound Notifications</Typography>
                <Button
                  variant={soundEnabled ? 'contained' : 'outlined'}
                  startIcon={soundEnabled ? <VolumeUp /> : <VolumeOff />}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography gutterBottom>Phase Notifications</Typography>
                <Button
                  variant={notificationsEnabled ? 'contained' : 'outlined'}
                  startIcon={<Notifications />}
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography gutterBottom>Auto-Advance Phases</Typography>
                <Button
                  variant={autoAdvancePhases ? 'contained' : 'outlined'}
                  onClick={() => setAutoAdvancePhases(!autoAdvancePhases)}
                >
                  {autoAdvancePhases ? 'Automatic' : 'Manual'}
                </Button>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.wav" type="audio/wav" />
      </audio>
    </Box>
  );
};

export default SessionTimer;
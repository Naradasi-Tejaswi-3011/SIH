import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Divider,
  Link,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  LocalHospital,
  SelfImprovement,
  AdminPanelSettings,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const LoginPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm();
  const registerForm = useForm();

  const handleLogin = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/');
    }
  };

  const handleRegister = async (data) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match'
      });
      return;
    }

    const { confirmPassword, ...userData } = data;
    const result = await register(userData);
    if (result.success) {
      navigate('/');
    }
  };

  const roleOptions = [
    { value: 'patient', label: 'Patient', icon: Person, color: '#2E8B57' },
    { value: 'therapist', label: 'Therapist', icon: SelfImprovement, color: '#FF8A65' },
    { value: 'doctor', label: 'Doctor', icon: LocalHospital, color: '#42A5F5' },
    { value: 'admin', label: 'Admin', icon: AdminPanelSettings, color: '#9C27B0' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 50%, #81C784 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Welcome Content */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ color: 'white', textAlign: { xs: 'center', md: 'left' } }}>
                <Typography variant="h2" component="h1" gutterBottom>
                  🧘‍♀️ AyurSutra
                </Typography>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
                  Smart Panchakarma Management
                </Typography>
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                  Experience the future of Ayurvedic healthcare with our intelligent 
                  therapy management system
                </Typography>
                
                {/* Feature Highlights */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Grid container spacing={2}>
                    {[
                      { icon: '📊', title: 'Real-time Progress Tracking' },
                      { icon: '🤖', title: 'AI-powered Recommendations' },
                      { icon: '📅', title: 'Smart Scheduling' },
                      { icon: '💊', title: 'Personalized Therapies' }
                    ].map((feature, index) => (
                      <Grid item xs={6} key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ mr: 1, fontSize: '1.2rem' }}>{feature.icon}</Box>
                          <Typography variant="body2">{feature.title}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </motion.div>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Paper
                elevation={24}
                sx={{
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Header */}
                <Box sx={{ p: 3, textAlign: 'center', background: 'rgba(46, 139, 87, 0.1)' }}>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Welcome to AyurSutra
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your journey to wellness begins here
                  </Typography>
                </Box>

                {/* Tabs */}
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  centered
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Sign In" />
                  <Tab label="Sign Up" />
                </Tabs>

                {/* Login Form */}
                <TabPanel value={tabValue} index={0}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      margin="normal"
                      {...loginForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email format'
                        }
                      })}
                      error={!!loginForm.formState.errors.email}
                      helperText={loginForm.formState.errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      margin="normal"
                      {...loginForm.register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      error={!!loginForm.formState.errors.password}
                      helperText={loginForm.formState.errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                    </Button>

                    <Box sx={{ textAlign: 'center' }}>
                      <Link href="#" variant="body2">
                        Forgot your password?
                      </Link>
                    </Box>
                  </form>
                </TabPanel>

                {/* Register Form */}
                <TabPanel value={tabValue} index={1}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          {...registerForm.register('firstName', {
                            required: 'First name is required'
                          })}
                          error={!!registerForm.formState.errors.firstName}
                          helperText={registerForm.formState.errors.firstName?.message}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          {...registerForm.register('lastName', {
                            required: 'Last name is required'
                          })}
                          error={!!registerForm.formState.errors.lastName}
                          helperText={registerForm.formState.errors.lastName?.message}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      margin="normal"
                      {...registerForm.register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email format'
                        }
                      })}
                      error={!!registerForm.formState.errors.email}
                      helperText={registerForm.formState.errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Phone Number"
                      margin="normal"
                      {...registerForm.register('phone', {
                        required: 'Phone number is required'
                      })}
                      error={!!registerForm.formState.errors.phone}
                      helperText={registerForm.formState.errors.phone?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Role Selection */}
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Select Your Role
                    </Typography>
                    <Grid container spacing={1}>
                      {roleOptions.map((role) => (
                        <Grid item xs={6} key={role.value}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: 'pointer',
                              border: registerForm.watch('role') === role.value ? `2px solid ${role.color}` : '1px solid #e0e0e0',
                              '&:hover': {
                                borderColor: role.color,
                                backgroundColor: `${role.color}10`
                              }
                            }}
                            onClick={() => registerForm.setValue('role', role.value)}
                          >
                            <CardContent sx={{ p: 1, textAlign: 'center' }}>
                              <role.icon sx={{ color: role.color, mb: 0.5 }} />
                              <Typography variant="body2">{role.label}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <input
                      type="hidden"
                      {...registerForm.register('role', { required: 'Please select a role' })}
                    />
                    {registerForm.formState.errors.role && (
                      <Typography color="error" variant="caption">
                        {registerForm.formState.errors.role.message}
                      </Typography>
                    )}

                    {/* Patient-specific fields */}
                    {registerForm.watch('role') === 'patient' && (
                      <>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          {...registerForm.register('dateOfBirth', {
                            required: 'Date of birth is required for patients'
                          })}
                          error={!!registerForm.formState.errors.dateOfBirth}
                          helperText={registerForm.formState.errors.dateOfBirth?.message}
                        />
                        
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Gender</InputLabel>
                          <Select
                            label="Gender"
                            {...registerForm.register('gender', {
                              required: 'Gender is required for patients'
                            })}
                            error={!!registerForm.formState.errors.gender}
                          >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                          {registerForm.formState.errors.gender && (
                            <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                              {registerForm.formState.errors.gender.message}
                            </Typography>
                          )}
                        </FormControl>
                      </>
                    )}

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      margin="normal"
                      {...registerForm.register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      error={!!registerForm.formState.errors.password}
                      helperText={registerForm.formState.errors.password?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      margin="normal"
                      {...registerForm.register('confirmPassword', {
                        required: 'Please confirm your password'
                      })}
                      error={!!registerForm.formState.errors.confirmPassword}
                      helperText={registerForm.formState.errors.confirmPassword?.message}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      sx={{ mt: 3, mb: 2, py: 1.5 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
                    </Button>

                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </Typography>
                  </form>
                </TabPanel>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage;
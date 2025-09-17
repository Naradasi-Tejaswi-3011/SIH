import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Alert,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  SelfImprovement,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';

import { useNavigate } from 'react-router-dom';

const steps = ['Select Therapy', 'Choose Date & Time', 'Confirm Booking'];

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleBooking = () => {
    // Handle booking submission
    console.log('Booking submitted:', {
      therapy: selectedTherapy,
      date: selectedDate,
      time: selectedTime
    });
    navigate('/patient/dashboard');
  };

  const therapyList = [
    { _id: '1', name: 'Abhyanga', sanskritName: 'अभ्यंग', description: 'Full body oil massage', duration: { perSession: 60 }, pricing: { basePrice: 2500 } },
    { _id: '2', name: 'Shirodhara', sanskritName: 'शिरोधारा', description: 'Continuous oil pouring on forehead', duration: { perSession: 45 }, pricing: { basePrice: 3500 } },
    { _id: '3', name: 'Panchakarma', sanskritName: 'पंचकर्म', description: 'Complete detoxification therapy', duration: { perSession: 120 }, pricing: { basePrice: 8500 } },
  ];

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Your Therapy
            </Typography>
            <Grid container spacing={2}>
              {therapyList.map((therapy) => (
                <Grid item xs={12} md={6} key={therapy._id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTherapy?._id === therapy._id ? 2 : 1,
                      borderColor: selectedTherapy?._id === therapy._id ? 'primary.main' : 'grey.300',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => setSelectedTherapy(therapy)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SelfImprovement sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">{therapy.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {therapy.sanskritName}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {therapy.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={`${therapy.duration?.perSession || 60} min`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Typography variant="h6" color="primary">
                          ₹{therapy.pricing?.basePrice || 0}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Date & Time
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Preferred Date</FormLabel>
                  <RadioGroup
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((days) => {
                      const date = addDays(new Date(), days);
                      return (
                        <FormControlLabel
                          key={days}
                          value={format(date, 'yyyy-MM-dd')}
                          control={<Radio />}
                          label={format(date, 'EEEE, MMMM dd')}
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Available Time Slots</FormLabel>
                  <RadioGroup
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    {timeSlots.map((time) => (
                      <FormControlLabel
                        key={time}
                        value={time}
                        control={<Radio />}
                        label={time}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Booking
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Booking Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Therapy</Typography>
                  <Typography variant="h6">{selectedTherapy?.name}</Typography>
                  <Typography variant="body2">{selectedTherapy?.description}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date & Time</Typography>
                  <Typography variant="h6">
                    {selectedDate && format(new Date(selectedDate), 'EEEE, MMMM dd')}
                  </Typography>
                  <Typography variant="body2">{selectedTime}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="h6">{selectedTherapy?.duration?.perSession || 60} minutes</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{selectedTherapy?.pricing?.basePrice || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Alert severity="info" sx={{ mt: 2 }}>
              Your appointment will be confirmed once you complete the booking. 
              You will receive confirmation via email and SMS.
            </Alert>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          Book Your Ayurvedic Therapy Session
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Experience the healing power of authentic Panchakarma treatments
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3 }}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleBooking}
                    disabled={!selectedTherapy || !selectedDate || !selectedTime}
                    size="large"
                  >
                    Confirm Booking
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                      (activeStep === 0 && !selectedTherapy) ||
                      (activeStep === 1 && (!selectedDate || !selectedTime))
                    }
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default AppointmentBooking;
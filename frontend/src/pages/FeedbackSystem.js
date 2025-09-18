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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Avatar,
  Rating,
  Alert,
  Slider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Fab,
} from '@mui/material';
import {
  Add,
  Feedback,
  Star,
  TrendingUp,
  ThumbUp,
  FilterList,
  Search,
  Visibility,
  CheckCircle,
  Warning,
  Info,
  Person,
  LocalHospital,
  SelfImprovement,
  EmojiEvents,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';


const FeedbackSystem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [viewFeedbackDialog, setViewFeedbackDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  // Queries
  const { data: feedbackData, isLoading, refetch } = useQuery(
    ['feedback', filterType, filterRating, searchTerm],
    () => apiService.getFeedback({
      type: filterType !== 'all' ? filterType : undefined,
      rating: filterRating !== 'all' ? parseInt(filterRating) : undefined,
      search: searchTerm || undefined,
      limit: 50
    }),
    { keepPreviousData: true }
  );

  const { data: myAppointments } = useQuery(
    ['my-appointments'],
    () => apiService.getAppointments({ 
      patientId: user._id, 
      status: 'completed',
      limit: 20 
    }),
    { enabled: user?.role === 'patient' }
  );

  // Mutations
  const createFeedbackMutation = useMutation(
    (feedbackData) => apiService.createFeedback(feedbackData),
    {
      onSuccess: () => {
        toast.success('Feedback submitted successfully!');
        setFeedbackDialog(false);
        reset();
        queryClient.invalidateQueries(['feedback']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit feedback');
      },
    }
  );

  const feedbackList = feedbackData?.data?.data || [];
  const feedbackStats = feedbackData?.data?.stats || {};
  const completedAppointments = myAppointments?.data?.appointments || [];

  const feedbackTypes = [
    { value: 'session_feedback', label: 'Session Feedback', icon: <SelfImprovement /> },
    { value: 'therapy_completion', label: 'Therapy Completion', icon: <CheckCircle /> },
    { value: 'service_quality', label: 'Service Quality', icon: <Star /> },
    { value: 'facility_feedback', label: 'Facility Feedback', icon: <LocalHospital /> },
    { value: 'staff_feedback', label: 'Staff Feedback', icon: <Person /> },
    { value: 'complaint', label: 'Complaint', icon: <Warning /> },
    { value: 'suggestion', label: 'Suggestion', icon: <Info /> },
    { value: 'testimonial', label: 'Testimonial', icon: <EmojiEvents /> },
  ];

  const ratingCategories = [
    { key: 'effectiveness', label: 'Treatment Effectiveness' },
    { key: 'comfort', label: 'Comfort Level' },
    { key: 'professionalism', label: 'Staff Professionalism' },
    { key: 'cleanliness', label: 'Facility Cleanliness' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'communication', label: 'Communication' },
    { key: 'valueForMoney', label: 'Value for Money' },
  ];


  const handleSubmitFeedback = (data) => {
    
    const feedbackData = {
      appointment: data.appointment,
      rating: parseInt(data.overallRating),
      comment: data.feedback,
      type: data.feedbackType || 'session_feedback',
      categories: ratingCategories.reduce((acc, cat) => {
        if (data[cat.key]) {
          acc[cat.key] = parseInt(data[cat.key]);
        }
        return acc;
      }, {}),
      healthOutcomes: {
        overallImprovement: data.overallImprovement,
        symptomsAfterTherapy: data.symptomsImprovement ? [
          {
            symptom: 'General wellness',
            improvement: data.overallImprovement
          }
        ] : [],
        wouldRecommend: data.wouldRecommend === 'true',
        recommendationScore: parseInt(data.recommendationScore) || 7
      },
      isAnonymous: data.isAnonymous || false
    };

    createFeedbackMutation.mutate(feedbackData);
  };

  const openFeedbackDialog = () => {
    if (completedAppointments.length === 0) {
      toast.error('You need to have completed appointments to leave feedback.');
      return;
    }
    setFeedbackDialog(true);
  };


  const getImprovementColor = (improvement) => {
    switch (improvement) {
      case 'much_better': return 'success';
      case 'better': return 'info';
      case 'no_change': return 'warning';
      case 'worse': case 'much_worse': return 'error';
      default: return 'default';
    }
  };

  const canLeaveFeedback = user?.role === 'patient' && completedAppointments.length > 0;

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
              Feedback & Reviews 💫
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Share your experience and help us improve our services
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Search />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            {canLeaveFeedback && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={openFeedbackDialog}
              >
                Leave Feedback
              </Button>
            )}
          </Box>
        </Box>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Feedback sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {feedbackStats.totalFeedback || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {feedbackStats.averageRating?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ThumbUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {feedbackStats.positiveCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Positive Reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {Math.round(((feedbackStats.positiveCount || 0) / (feedbackStats.totalFeedback || 1)) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Satisfaction Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Reviews"
                placeholder="Search by therapy, therapist, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Feedback Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Feedback Type"
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  {feedbackTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <span style={{ marginLeft: 8 }}>{type.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Rating</InputLabel>
                <Select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  label="Rating"
                >
                  <MenuItem value="all">All Ratings</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                  <MenuItem value="4">4 Stars</MenuItem>
                  <MenuItem value="3">3 Stars</MenuItem>
                  <MenuItem value="2">2 Stars</MenuItem>
                  <MenuItem value="1">1 Star</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {feedbackList.length} reviews found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Feedback List */}
        <Grid container spacing={3}>
          {isLoading ? (
            <Grid item xs={12}>
              <Box sx={{ p: 3 }}>Loading reviews...</Box>
            </Grid>
          ) : feedbackList.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No feedback found. {canLeaveFeedback && 'Be the first to leave a review!'}
              </Alert>
            </Grid>
          ) : (
            feedbackList.map((feedback) => (
              <Grid item xs={12} key={feedback._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {feedback.isAnonymous ? '?' : feedback.submittedBy?.firstName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {feedback.isAnonymous ? 'Anonymous Patient' : 
                             `${feedback.submittedBy?.firstName} ${feedback.submittedBy?.lastName}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(feedback.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={feedbackTypes.find(t => t.value === feedback.feedbackType)?.label || feedback.feedbackType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Rating value={feedback.ratings?.overall || 0} readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Overall Rating: {feedback.ratings?.overall}/5
                      </Typography>
                    </Box>

                    <Typography variant="body1" paragraph>
                      {feedback.feedback?.description}
                    </Typography>

                    {/* Detailed Ratings */}
                    {feedback.ratings && Object.keys(feedback.ratings).length > 1 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Detailed Ratings:
                        </Typography>
                        <Grid container spacing={1}>
                          {Object.entries(feedback.ratings).map(([key, value]) => {
                            if (key === 'overall' || !value) return null;
                            const category = ratingCategories.find(c => c.key === key);
                            return (
                              <Grid item xs={6} md={4} key={key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography variant="caption">
                                    {category?.label || key}
                                  </Typography>
                                  <Rating value={value} readOnly size="small" />
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      </Box>
                    )}

                    {/* Health Outcomes */}
                    {feedback.healthOutcomes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Health Improvement:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={`Overall: ${feedback.healthOutcomes.overallImprovement || 'Not specified'}`}
                            color={getImprovementColor(feedback.healthOutcomes.overallImprovement)}
                            size="small"
                          />
                          {feedback.healthOutcomes.wouldRecommend !== undefined && (
                            <Chip
                              label={`Would recommend: ${feedback.healthOutcomes.wouldRecommend ? 'Yes' : 'No'}`}
                              color={feedback.healthOutcomes.wouldRecommend ? 'success' : 'default'}
                              size="small"
                            />
                          )}
                          {feedback.healthOutcomes.recommendationScore && (
                            <Chip
                              label={`NPS: ${feedback.healthOutcomes.recommendationScore}/10`}
                              color={feedback.healthOutcomes.recommendationScore >= 7 ? 'success' : 'warning'}
                              size="small"
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => {
                            setSelectedFeedback(feedback);
                            setViewFeedbackDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                        {feedback.response && (
                          <Chip label="Staff Responded" color="info" size="small" />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </motion.div>

      {/* Feedback Submission Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(handleSubmitFeedback)}>
          <DialogTitle>Share Your Experience</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Appointment Selection */}
              <Grid item xs={12}>
                <Controller
                  name="appointment"
                  control={control}
                  rules={{ required: 'Please select an appointment' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.appointment}>
                      <InputLabel>Select Appointment</InputLabel>
                      <Select {...field} label="Select Appointment">
                        {completedAppointments.map((appointment) => (
                          <MenuItem key={appointment._id} value={appointment._id}>
                            {appointment.therapy?.name || 'Therapy Session'} - {' '}
                            {format(new Date(appointment.scheduledDateTime), 'MMM dd, yyyy')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Feedback Type */}
              <Grid item xs={12}>
                <Controller
                  name="feedbackType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Feedback Type</InputLabel>
                      <Select {...field} label="Feedback Type">
                        {feedbackTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {type.icon}
                              <span style={{ marginLeft: 8 }}>{type.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Overall Rating */}
              <Grid item xs={12}>
                <FormLabel>Overall Rating *</FormLabel>
                <Controller
                  name="overallRating"
                  control={control}
                  rules={{ required: 'Please provide an overall rating' }}
                  render={({ field }) => (
                    <Box>
                      <Rating
                        {...field}
                        size="large"
                        onChange={(e, value) => field.onChange(value)}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {field.value ? `${field.value} out of 5 stars` : 'Click to rate'}
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>

              {/* Detailed Ratings */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Detailed Ratings</Typography>
                <Grid container spacing={2}>
                  {ratingCategories.map((category) => (
                    <Grid item xs={12} sm={6} key={category.key}>
                      <FormLabel>{category.label}</FormLabel>
                      <Controller
                        name={category.key}
                        control={control}
                        render={({ field }) => (
                          <Rating
                            {...field}
                            onChange={(e, value) => field.onChange(value)}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Health Outcomes */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Health Outcomes</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Controller
                      name="overallImprovement"
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <FormLabel>Overall Health Improvement</FormLabel>
                          <RadioGroup {...field} row>
                            <FormControlLabel value="much_better" control={<Radio />} label="Much Better" />
                            <FormControlLabel value="better" control={<Radio />} label="Better" />
                            <FormControlLabel value="no_change" control={<Radio />} label="No Change" />
                            <FormControlLabel value="worse" control={<Radio />} label="Worse" />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="wouldRecommend"
                      control={control}
                      render={({ field }) => (
                        <FormControl>
                          <FormLabel>Would you recommend this therapy?</FormLabel>
                          <RadioGroup {...field} row>
                            <FormControlLabel value="true" control={<Radio />} label="Yes" />
                            <FormControlLabel value="false" control={<Radio />} label="No" />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormLabel>Recommendation Score (0-10)</FormLabel>
                    <Controller
                      name="recommendationScore"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          {...field}
                          min={0}
                          max={10}
                          marks
                          step={1}
                          valueLabelDisplay="on"
                          sx={{ mt: 2 }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Feedback Text */}
              <Grid item xs={12}>
                <Controller
                  name="feedback"
                  control={control}
                  rules={{ required: 'Please provide your feedback' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Your Feedback *"
                      multiline
                      rows={4}
                      fullWidth
                      placeholder="Please share your detailed experience..."
                      error={!!errors.feedback}
                      helperText={errors.feedback?.message}
                    />
                  )}
                />
              </Grid>

              {/* Anonymous Option */}
              <Grid item xs={12}>
                <Controller
                  name="isAnonymous"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} />}
                      label="Submit anonymously"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createFeedbackMutation.isLoading}
            >
              Submit Feedback
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Feedback Dialog */}
      <Dialog
        open={viewFeedbackDialog}
        onClose={() => setViewFeedbackDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedFeedback && (
          <>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedFeedback.feedback?.description}
              </Typography>
              {/* Add more detailed view content here */}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewFeedbackDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Floating Action Button */}
      {canLeaveFeedback && (
        <Fab
          color="primary"
          aria-label="add feedback"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={openFeedbackDialog}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
};

export default FeedbackSystem;
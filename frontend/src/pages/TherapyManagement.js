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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Avatar,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  SelfImprovement,
  LocalHospital,
  Schedule,
  MonitorHeart,
  Star,
  ExpandMore,
  Search,
  FilterList,
  Refresh,
  Visibility,
  AccessTime,
  Payment,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const TabPanel = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const TherapyManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [addTherapyDialog, setAddTherapyDialog] = useState(false);
  const [editTherapyDialog, setEditTherapyDialog] = useState(false);
  const [viewTherapyDialog, setViewTherapyDialog] = useState(false);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  // Queries
  const { data: therapiesData, isLoading, refetch } = useQuery(
    ['therapies', searchTerm, categoryFilter],
    () => apiService.getTherapies({
      search: searchTerm || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      limit: 50
    }),
    { keepPreviousData: true }
  );

  const { data: popularTherapies } = useQuery(
    ['popular-therapies'],
    () => apiService.getTherapies({ sort: '-popularityScore', limit: 5 })
  );

  // Mutations
  const createTherapyMutation = useMutation(
    (therapyData) => apiService.createTherapy(therapyData),
    {
      onSuccess: () => {
        toast.success('Therapy created successfully!');
        setAddTherapyDialog(false);
        reset();
        queryClient.invalidateQueries(['therapies']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create therapy');
      },
    }
  );

  const updateTherapyMutation = useMutation(
    ({ id, data }) => apiService.updateTherapy(id, data),
    {
      onSuccess: () => {
        toast.success('Therapy updated successfully!');
        setEditTherapyDialog(false);
        editForm.reset();
        queryClient.invalidateQueries(['therapies']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update therapy');
      },
    }
  );

  const deleteTherapyMutation = useMutation(
    (therapyId) => apiService.deleteTherapy(therapyId),
    {
      onSuccess: () => {
        toast.success('Therapy deleted successfully!');
        queryClient.invalidateQueries(['therapies']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete therapy');
      },
    }
  );

  const therapies = therapiesData?.data?.therapies || [];
  const popular = popularTherapies?.data?.therapies || [];

  const therapyCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'shodhana', label: 'Shodhana (Detoxification)' },
    { value: 'shamana', label: 'Shamana (Palliative)' },
    { value: 'rasayana', label: 'Rasayana (Rejuvenation)' },
    { value: 'satvavajaya', label: 'Satvavajaya (Psychotherapy)' },
    { value: 'daivavyapashraya', label: 'Daivavyapashraya (Spiritual)' },
  ];

  const handleCreateTherapy = (data) => {
    const therapyData = {
      ...data,
      duration: {
        perSession: parseInt(data.perSessionDuration),
        totalCourse: parseInt(data.totalCourse),
        frequency: data.frequency
      },
      pricing: {
        basePrice: parseFloat(data.basePrice),
        currency: 'INR',
        packageDiscount: parseFloat(data.packageDiscount) || 0
      },
      requirements: {
        room: {
          type: data.roomType,
          temperature: data.temperatureRange ? {
            min: parseInt(data.tempMin),
            max: parseInt(data.tempMax)
          } : undefined
        },
        equipment: data.equipment ? data.equipment.split(',').map(e => e.trim()) : [],
        staffRequired: {
          therapists: parseInt(data.therapistsRequired) || 1,
          assistants: parseInt(data.assistantsRequired) || 0
        }
      },
      preparation: {
        preTherapy: {
          dietary: data.preDietary ? data.preDietary.split(',').map(d => d.trim()) : [],
          lifestyle: data.preLifestyle ? data.preLifestyle.split(',').map(l => l.trim()) : [],
          duration: parseInt(data.preDuration) || 0
        },
        postTherapy: {
          dietary: data.postDietary ? data.postDietary.split(',').map(d => d.trim()) : [],
          lifestyle: data.postLifestyle ? data.postLifestyle.split(',').map(l => l.trim()) : [],
          duration: parseInt(data.postDuration) || 0
        }
      },
      createdBy: user._id
    };

    createTherapyMutation.mutate(therapyData);
  };

  const handleEditTherapy = (data) => {
    if (!selectedTherapy) return;
    
    const updatedData = {
      ...data,
      updatedBy: user._id
    };

    updateTherapyMutation.mutate({
      id: selectedTherapy._id,
      data: updatedData
    });
  };

  const handleDeleteTherapy = (therapyId) => {
    if (window.confirm('Are you sure you want to delete this therapy?')) {
      deleteTherapyMutation.mutate(therapyId);
    }
  };

  const openEditDialog = (therapy) => {
    setSelectedTherapy(therapy);
    editForm.reset({
      name: therapy.name,
      sanskritName: therapy.sanskritName,
      category: therapy.category,
      description: therapy.description,
      basePrice: therapy.pricing?.basePrice,
      isActive: therapy.isActive
    });
    setEditTherapyDialog(true);
  };

  const openViewDialog = (therapy) => {
    setSelectedTherapy(therapy);
    setViewTherapyDialog(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      shodhana: 'primary',
      shamana: 'secondary',
      rasayana: 'success',
      satvavajaya: 'info',
      daivavyapashraya: 'warning'
    };
    return colors[category] || 'default';
  };

  const canManageTherapies = ['admin', 'doctor'].includes(user?.role);

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
              Therapy Management 🌿
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Manage Ayurvedic therapy configurations and protocols
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            {canManageTherapies && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddTherapyDialog(true)}
              >
                Add Therapy
              </Button>
            )}
          </Box>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Therapies"
                placeholder="Search by name, description, or Sanskrit name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  {therapyCategories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {therapies.length} therapies found
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Content Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Therapies" />
            <Tab label="Popular Therapies" />
            <Tab label="Analytics" />
          </Tabs>

          {/* All Therapies Tab */}
          <TabPanel value={tabValue} index={0}>
            {isLoading ? (
              <Box sx={{ p: 3 }}>Loading therapies...</Box>
            ) : therapies.length === 0 ? (
              <Alert severity="info" sx={{ m: 3 }}>
                No therapies found. {canManageTherapies && 'Click "Add Therapy" to create the first one.'}
              </Alert>
            ) : (
              <Grid container spacing={3} sx={{ p: 3 }}>
                {therapies.map((therapy) => (
                  <Grid item xs={12} md={6} lg={4} key={therapy._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <SelfImprovement />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" noWrap>
                              {therapy.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {therapy.sanskritName}
                            </Typography>
                          </Box>
                          {!therapy.isActive && (
                            <Chip label="Inactive" color="error" size="small" />
                          )}
                        </Box>

                        <Chip
                          label={therapy.category}
                          color={getCategoryColor(therapy.category)}
                          size="small"
                          sx={{ mb: 2 }}
                        />

                        <Typography variant="body2" color="text.secondary" paragraph>
                          {therapy.description?.length > 100
                            ? `${therapy.description.substring(0, 100)}...`
                            : therapy.description}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Duration
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {therapy.duration?.perSession || 60} min
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                              Price
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              ₹{therapy.pricing?.basePrice || 0}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Rating
                            value={therapy.averageRating || 0}
                            readOnly
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({therapy.totalRatings || 0} reviews)
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={`${therapy.popularityScore || 0}% popularity`}
                            size="small"
                            variant="outlined"
                          />
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => openViewDialog(therapy)}
                            >
                              <Visibility />
                            </IconButton>
                            {canManageTherapies && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => openEditDialog(therapy)}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTherapy(therapy._id)}
                                >
                                  <Delete />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Popular Therapies Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Most Popular Therapies
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Therapy</TableCell>
                      <TableCell align="center">Category</TableCell>
                      <TableCell align="center">Popularity Score</TableCell>
                      <TableCell align="center">Rating</TableCell>
                      <TableCell align="center">Price</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {popular.map((therapy) => (
                      <TableRow key={therapy._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                              <SelfImprovement fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {therapy.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {therapy.sanskritName}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={therapy.category}
                            color={getCategoryColor(therapy.category)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                            {therapy.popularityScore || 0}%
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Rating value={therapy.averageRating || 0} readOnly size="small" />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({therapy.totalRatings || 0})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body1" fontWeight="medium" color="primary">
                            ₹{therapy.pricing?.basePrice || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => openViewDialog(therapy)}>
                            <Visibility />
                          </IconButton>
                          {canManageTherapies && (
                            <IconButton size="small" onClick={() => openEditDialog(therapy)}>
                              <Edit />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Therapy Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <LocalHospital sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" color="primary">
                        {therapies.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Therapies
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" color="warning.main">
                        {therapies.filter(t => t.averageRating >= 4).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High Rated (4+ ⭐)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" color="success.main">
                        {therapies.filter(t => t.popularityScore >= 50).length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Popular Therapies
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Payment sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" color="info.main">
                        ₹{Math.round(therapies.reduce((sum, t) => sum + (t.pricing?.basePrice || 0), 0) / therapies.length) || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Price
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Add Therapy Dialog */}
      <Dialog
        open={addTherapyDialog}
        onClose={() => setAddTherapyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateTherapy)}>
          <DialogTitle>Add New Therapy</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Therapy name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Therapy Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="sanskritName"
                  control={control}
                  rules={{ required: 'Sanskrit name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sanskrit Name"
                      fullWidth
                      error={!!errors.sanskritName}
                      helperText={errors.sanskritName?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.category}>
                      <InputLabel>Category</InputLabel>
                      <Select {...field} label="Category">
                        {therapyCategories.slice(1).map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: 'Description is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      multiline
                      rows={3}
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="perSessionDuration"
                  control={control}
                  rules={{ required: 'Duration is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Duration (minutes)"
                      type="number"
                      fullWidth
                      error={!!errors.perSessionDuration}
                      helperText={errors.perSessionDuration?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="basePrice"
                  control={control}
                  rules={{ required: 'Price is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Base Price (₹)"
                      type="number"
                      fullWidth
                      error={!!errors.basePrice}
                      helperText={errors.basePrice?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddTherapyDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createTherapyMutation.isLoading}
            >
              Create Therapy
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Therapy Dialog */}
      <Dialog
        open={editTherapyDialog}
        onClose={() => setEditTherapyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={editForm.handleSubmit(handleEditTherapy)}>
          <DialogTitle>Edit Therapy</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField {...field} label="Therapy Name" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      multiline
                      rows={3}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="basePrice"
                  control={editForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Base Price (₹)"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTherapyDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateTherapyMutation.isLoading}
            >
              Update Therapy
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Therapy Dialog */}
      <Dialog
        open={viewTherapyDialog}
        onClose={() => setViewTherapyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTherapy?.name} ({selectedTherapy?.sanskritName})
        </DialogTitle>
        <DialogContent>
          {selectedTherapy && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                {selectedTherapy.description}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Chip 
                    label={selectedTherapy.category} 
                    color={getCategoryColor(selectedTherapy.category)} 
                    size="small" 
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {selectedTherapy.duration?.perSession || 60} minutes
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ₹{selectedTherapy.pricing?.basePrice || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating
                      value={selectedTherapy.averageRating || 0}
                      readOnly
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2">
                      ({selectedTherapy.totalRatings || 0} reviews)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Additional details can be added here */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTherapyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      {canManageTherapies && (
        <Fab
          color="primary"
          aria-label="add therapy"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setAddTherapyDialog(true)}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
};

export default TherapyManagement;
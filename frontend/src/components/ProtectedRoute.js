import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './LoadingScreen';
import { Alert, Box, Button, Container, Typography } from '@mui/material';
import { Lock } from '@mui/icons-material';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verifying your access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Access Restricted
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph>
            You don't have permission to access this page
          </Typography>

          <Alert severity="warning" sx={{ mb: 3, width: '100%' }}>
            This page is only accessible to: {allowedRoles.join(', ')}
            <br />
            Your current role: {user?.role}
          </Alert>

          <Button
            variant="contained"
            onClick={() => window.history.back()}
            sx={{ mr: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return children;
};

export default ProtectedRoute;
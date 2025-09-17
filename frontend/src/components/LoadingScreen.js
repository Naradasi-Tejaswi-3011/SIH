import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = 'Loading your wellness journey...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2E8B57 0%, #4CAF50 50%, #81C784 100%)',
        color: 'white',
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          duration: 0.8,
          type: "spring",
          stiffness: 100
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}
        >
          🧘‍♀️ AyurSutra
        </Typography>
        
        <Typography
          variant="h6"
          sx={{ mb: 4, opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}
        >
          {message}
        </Typography>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            sx={{ color: 'white' }}
          />
        </motion.div>
        
        <Typography
          variant="body2"
          sx={{ mt: 3, opacity: 0.7, fontSize: '0.875rem' }}
        >
          Preparing your personalized Ayurvedic experience
        </Typography>
      </motion.div>
      
      {/* Floating elements for decoration */}
      <motion.div
        animate={{ 
          y: [-20, 20, -20],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          fontSize: '2rem',
        }}
      >
        🌿
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [20, -20, 20],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          fontSize: '2rem',
        }}
      >
        ✨
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [-15, 15, -15],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          fontSize: '2rem',
        }}
      >
        🕉️
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
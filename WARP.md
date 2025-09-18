# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AyurSutra is a comprehensive Panchakarma Patient Management and Therapy Scheduling Software built for the Smart India Hackathon 2024. It's a Node.js/Express backend with a planned React frontend, designed to digitize and optimize Panchakarma center operations.

### Key Capabilities
- **Automated therapy scheduling** with conflict resolution and resource allocation
- **Real-time therapy tracking** via Socket.io for live session monitoring
- **Multi-channel notification system** (email, SMS, push, in-app) with user preferences
- **Role-based access control** supporting patients, doctors, therapists, and admins
- **Comprehensive appointment lifecycle management** with preparation tracking
- **AI-powered recommendations** (planned) for treatment optimization

## Common Development Commands

### Backend Development
```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run API health and functionality tests
node test-api.js

# Test specific functionality
node backend/simple_test.js
node backend/test_therapy_tracking.js

# Install backend dependencies
npm install

# Seed database with sample data
node seed-data.js
```

### Frontend Development (React)
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start React development server
npm start

# Build for production
npm run build

# Run frontend tests
npm test
```

### Database and Testing
```bash
# Test MongoDB connection and basic API endpoints
node test-api.js

# Debug database operations
node backend/debug_test.js

# Check server health
curl http://localhost:5000/api/health
```

### Testing Individual Components
```bash
# Test therapy tracking functionality
node backend/test_therapy_tracking.js

# Test basic API operations
node backend/simple_test.js
```

## Architecture Overview

### Backend Structure (Node.js/Express)
- **Models**: Mongoose schemas with complex validation and middleware
  - `User`: Multi-role system (patient/doctor/therapist/admin) with role-specific fields
  - `Appointment`: Comprehensive lifecycle tracking with real-time progress updates
  - `Therapy`: Panchakarma therapy definitions with Sanskrit names and requirements
  - `Notification`: Multi-channel delivery system with user preferences
  - `Feedback`: Patient feedback collection with sentiment analysis

- **Services**: Business logic layer
  - `notificationService`: Handles email, SMS, push notifications with quiet hours
  - `advancedSchedulingService`: Conflict resolution and resource optimization
  - `aiRecommendationService`: AI-powered therapy recommendations (planned)

- **Controllers**: Request handling with comprehensive error management
- **Middleware**: Authentication, rate limiting, error handling, activity logging
- **Utils**: Winston logging, Joi validation schemas

### Real-time Features (Socket.io)
- **Session Management**: Join/leave therapy sessions for real-time updates
- **Progress Tracking**: Live therapy progress updates between therapists and patients
- **Notification Delivery**: Real-time in-app notifications

### Database Design Patterns
- **Complex subdocuments**: Appointment model has nested objects for preparation status, session progress, quality metrics
- **Role-based field requirements**: User model conditionally requires fields based on role
- **Audit trails**: All major models include createdBy/updatedBy tracking
- **Performance indexes**: Strategic indexing on commonly queried fields

### Authentication & Security
- **JWT-based authentication** with role-based access control
- **Account locking mechanism**: Progressive delays after failed login attempts
- **Rate limiting**: Different limits for sensitive vs regular endpoints
- **Security headers**: Helmet.js for security hardening
- **Password hashing**: bcryptjs with salt rounds
- **Input validation**: Comprehensive Joi schemas

## Development Patterns & Conventions

### API Response Format
All API responses follow this structure:
```javascript
{
  "success": boolean,
  "message": string,
  "data": object, // optional
  "token": string // for auth endpoints
}
```

### Error Handling
- Centralized error handling middleware in `backend/middleware/errorHandler.js`
- Winston logging with file rotation (logs stored in `/logs` directory)
- Structured error responses with appropriate HTTP status codes

### Database Queries
- Use population for referenced models: `.populate('patient doctor therapist therapy')`
- Implement proper indexing for performance-critical queries
- Use virtual fields for computed properties (e.g., appointment duration)
- Static methods for complex queries (e.g., conflict detection)

### Real-time Updates
When implementing real-time features:
```javascript
// Server side - emit to specific session
io.to(sessionId).emit('therapy_progress', progressData);

// Client side - listen for updates
socket.on('therapy_progress', handleProgressUpdate);
```

### Notification System Integration
Use the notification service for any user communications:
```javascript
await notificationService.createNotification({
  recipient: userId,
  title: "Appointment Reminder",
  message: "Your therapy session starts in 30 minutes",
  type: "appointment_reminder",
  channels: { email: { enabled: true }, sms: { enabled: true } }
});
```

## Environment Configuration

### Required Environment Variables
```bash
# Database
MONGODB_URI=mongodb+srv://...
DB_NAME=ayursutra

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your_secure_secret
JWT_EXPIRES_IN=7d

# Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SMS_API_KEY=your_sms_api_key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Testing & Debugging

### API Testing
- Use `test-api.js` for quick health checks and basic functionality
- Test individual endpoints with tools like Postman or curl
- Check logs in `/logs/combined.log` and `/logs/error.log`

### Database Testing
- Use MongoDB Compass or Atlas interface for direct database inspection
- Seed data with `seed-data.js` for development testing
- Monitor query performance through database profiling

### Real-time Testing
- Use browser dev tools to monitor WebSocket connections
- Test Socket.io events using the browser console
- Check server logs for connection/disconnection events

## Frontend Integration Points

### API Base URL
- Development: `http://localhost:5000/api`
- Frontend proxy configured to backend port 5000

### Authentication Flow
1. Register/login returns JWT token
2. Store token in localStorage or secure cookie
3. Include `Authorization: Bearer <token>` in all requests
4. Handle token expiration with refresh logic

### Real-time Connection
```javascript
import io from 'socket.io-client';
const socket = io('http://localhost:5000');
```

### State Management
- Frontend uses Zustand for state management
- React Query for API state management
- Material-UI for components with custom theming

## Performance Considerations

### Database Optimization
- Use appropriate indexes for query patterns
- Implement pagination for large result sets
- Consider aggregation pipelines for complex reporting

### API Optimization
- Implement field selection for large documents
- Use population judiciously to avoid over-fetching
- Consider caching for frequently accessed data

### Real-time Optimization
- Limit Socket.io event frequency to avoid overwhelming clients
- Use rooms/namespaces to reduce unnecessary message broadcasting
- Implement connection pooling for high-traffic scenarios

## Deployment Notes

### Production Environment
- Use PM2 for process management
- Configure proper logging levels
- Set up database connection pooling
- Configure CORS for production domains
- Use environment-specific configuration files

### Monitoring
- Winston logs provide structured logging for debugging
- Monitor Socket.io connection counts and event frequencies
- Track API response times and error rates
- Monitor database query performance

## Integration Requirements

### Email Service
- Configure SMTP settings for appointment notifications
- Implement email templates for different notification types
- Handle email delivery failures gracefully

### SMS Service
- Integrate with SMS provider (Twilio, TextLocal, etc.)
- Implement SMS template system
- Handle SMS rate limiting and delivery tracking

### File Upload
- Multer configured for profile images and documents
- Files stored in `/uploads` directory
- Implement file type validation and size limits
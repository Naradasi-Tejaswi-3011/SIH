# AyurSutra - Project Structure

## 📁 Directory Structure

```
AyurSutra/
├── 📁 backend/                 # Backend API server
│   ├── 📁 config/             # Configuration files
│   ├── 📁 controllers/        # Route controllers
│   ├── 📁 middleware/         # Custom middleware
│   │   ├── auth.js           # Authentication & authorization
│   │   └── errorHandler.js   # Global error handling
│   ├── 📁 models/            # Database models
│   │   ├── User.js           # User model (patients, doctors, therapists, admin)
│   │   ├── Therapy.js        # Therapy definitions
│   │   ├── Appointment.js    # Appointment scheduling
│   │   ├── Notification.js   # Multi-channel notifications
│   │   └── Feedback.js       # Feedback and ratings
│   ├── 📁 routes/            # API routes
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User management
│   │   ├── therapies.js      # Therapy management
│   │   ├── appointments.js   # Appointment scheduling
│   │   ├── notifications.js  # Notification system
│   │   └── feedback.js       # Feedback system
│   ├── 📁 services/          # Business logic services
│   └── 📁 utils/             # Utility functions
│       ├── logger.js         # Winston logging
│       └── validators.js     # Joi validation schemas
├── 📁 frontend/              # Frontend application (React/Vue)
├── 📁 docs/                  # Documentation
├── 📁 tests/                 # Test files
├── 📁 logs/                  # Log files (auto-created)
├── 📄 .env                   # Environment variables
├── 📄 package.json           # Project dependencies
├── 📄 server.js              # Main server file
├── 📄 seed-data.js          # Sample data seeder
└── 📄 test-api.js           # API testing script
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi
- **Logging**: Winston
- **Real-time**: Socket.io
- **Security**: Helmet, CORS, Rate Limiting

### Frontend (Planned)
- **Framework**: React.js / Vue.js
- **State Management**: Redux / Vuex
- **UI Library**: Material-UI / Chakra UI
- **Charts**: Chart.js / D3.js
- **HTTP Client**: Axios

## 🚀 Development Setup

### 1. Environment Setup

```bash
# Clone repository
git clone <repository-url>
cd AyurSutra

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string
```

### 2. Database Setup

```bash
# Seed sample data
node seed-data.js

# Verify data insertion
# Check MongoDB Atlas or local MongoDB
```

### 3. Running the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Test API endpoints
node test-api.js
```

## 📊 Database Models Overview

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  phone: String,
  role: ['patient', 'doctor', 'therapist', 'admin'],
  medicalHistory: Object, // For patients
  professionalInfo: Object, // For doctors/therapists
  isActive: Boolean,
  isVerified: Boolean,
  notificationPreferences: Object
}
```

### Therapy Model
```javascript
{
  name: String,
  sanskritName: String,
  category: ['shodhana', 'shamana', 'rasayana', 'satvavajaya', 'daivavyapashraya'],
  description: String,
  duration: {
    perSession: Number,
    totalCourse: Number,
    frequency: String
  },
  pricing: {
    basePrice: Number,
    currency: String,
    packageDiscount: Number
  },
  requirements: Object, // Room, equipment, staff
  preparation: Object, // Pre & post therapy instructions
  scheduling: Object // Time preferences
}
```

### Appointment Model
```javascript
{
  appointmentId: String (auto-generated),
  patient: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  therapist: ObjectId (ref: User),
  therapy: ObjectId (ref: Therapy),
  scheduledDateTime: Date,
  status: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  sessionProgress: Object, // Real-time tracking
  payment: Object,
  qualityMetrics: Object
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: user._id,
  role: user.role,
  email: user.email,
  iat: timestamp,
  exp: timestamp
}
```

### Role Permissions
- **Patient**: Can book appointments, view own data, submit feedback
- **Therapist**: Can view assigned appointments, update session progress
- **Doctor**: Can manage therapies, view patient data, respond to feedback
- **Admin**: Full system access, user management, system monitoring

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/appointments/availability/:therapistId/:date` - Check availability

### Therapies
- `GET /api/therapies` - List all therapies
- `GET /api/therapies/:id` - Get therapy details
- `POST /api/therapies` - Create therapy (admin/doctor)

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Send notification
- `PUT /api/notifications/:id/read` - Mark as read

## 🧪 Testing

### Manual Testing
```bash
# Test API endpoints
node test-api.js

# Test specific endpoints with curl or Postman
curl -X GET http://localhost:5000/api/health
```

### Sample API Calls
```bash
# Register a patient
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith", 
    "email": "jane@example.com",
    "phone": "+1234567891",
    "password": "password123",
    "role": "patient",
    "dateOfBirth": "1985-05-15",
    "gender": "female"
  }'

# Login user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

## 🔍 Debugging

### Logs Location
- Development: Console output
- Production: `logs/combined.log` and `logs/error.log`

### Common Issues
1. **MongoDB Connection**: Check .env MONGODB_URI
2. **JWT Errors**: Verify JWT_SECRET in .env
3. **Port Conflicts**: Change PORT in .env if 5000 is occupied

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=production_secret_key
EMAIL_HOST=smtp.production.com
SMS_API_KEY=production_sms_key
```

### Docker Setup (Future)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🎯 Next Development Steps

1. **Complete API Implementation**
   - Full appointment scheduling logic
   - Real-time therapy tracking
   - Notification service integration

2. **Frontend Development**
   - React/Vue.js application
   - Dashboard interfaces
   - Real-time updates with Socket.io

3. **Advanced Features**
   - AI-powered recommendations
   - Data visualization charts
   - Mobile application

4. **Production Setup**
   - Comprehensive testing
   - CI/CD pipeline
   - Cloud deployment

## 📞 Support

For development questions or issues:
1. Check the logs in `logs/` directory
2. Review API documentation in this file
3. Test with `test-api.js` script
4. Create issues in the repository

---

**Happy Coding! 🧘‍♀️✨**
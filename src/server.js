const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/error');
const colors = require('colors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const fs = require('fs');
const path = require('path');
// Commented out the duplicate connectDB import to prevent SyntaxError
// const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Load dummy data seeder
const { seedAllData } = require('./models/DummyData');

// Route files
const authRoutes = require('./routes/auth');
const medicationsRoutes = require('./routes/medications');
const patientMedicationsRoutes = require('./routes/patientMedications');
const appointmentsRoutes = require('./routes/appointments');
const doctorsRoutes = require('./routes/doctors');
const messagesRoutes = require('./routes/messages');
const videoCallsRoutes = require('./routes/videoCalls');
const patientsRoutes = require('./routes/patients');
const notesRoutes = require('./routes/notes');
const prescriptionsRoutes = require('./routes/prescriptions');

// Initialize express
const app = express();

// Create upload directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());

// CORS configuration for mobile apps
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins for development
    // In production, you should specify exact domains
    // For production, uncomment and modify this:
    const allowedOrigins = ['http://localhost:5000'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Helmet configuration for mobile apps
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for mobile apps
}));

app.use(morgan('dev'));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100
});
app.use(limiter);

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/medications', medicationsRoutes);
app.use('/api/v1/patient/medications', patientMedicationsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/video-calls', videoCallsRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/notes', notesRoutes);
app.use('/api/v1/prescriptions', prescriptionsRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Medical KZ API is running...');
});

// Error handler middleware
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed all dummy data (doctors, patients, appointments)
    await seedAllData();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
}); 
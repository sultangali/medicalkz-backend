const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Patient Medication Schema - for personal medications tracking
const PatientMedicationSchema = new mongoose.Schema({
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  prescribedBy: {
    type: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  }
});

// Patient Profile Schema
const PatientProfileSchema = new mongoose.Schema({
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  address: {
    type: String
  },
  emergencyContacts: [{
    name: String,
    phoneNumber: String,
    relationship: String
  }],
  medications: [PatientMedicationSchema], // Personal medications tracking
  medicalData: {
    heightCm: Number,
    weightKg: Number,
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    chronicConditions: [String],
    lifestyleCharacteristics: {
      activityLevel: {
        type: String,
        enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']
      },
      isSmoker: Boolean,
      dietPreferences: [String]
    },
    vitalsHistory: [{
      timestamp: Date,
      systolicBP: Number,
      diastolicBP: Number,
      heartRate: Number,
      glucoseLevel: Number,
      temperature: Number,
      notes: String
    }]
  }
});

// Doctor Profile Schema
const DoctorProfileSchema = new mongoose.Schema({
  medicalLicenseId: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true,
    enum: ['OPHTHALMOLOGIST', 'THERAPIST', 'UROLOGIST', 'GASTROENTEROLOGIST', 'CARDIOLOGIST', 'NEUROLOGIST', 'DERMATOLOGIST', 'PEDIATRICIAN', 'GYNECOLOGIST', 'ENDOCRINOLOGIST']
  },
  clinicAddress: String,
  availability: {
    workingDays: [{
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    }],
    workingHours: {
      start: String,
      end: String
    },
    isAvailableForHomeVisits: {
      type: Boolean,
      default: false
    }
  }
});

// Pharmacist Profile Schema
const PharmacistProfileSchema = new mongoose.Schema({
  pharmacyLicenseId: {
    type: String,
    required: true
  },
  pharmacyName: String,
  pharmacyAddress: String
});

// Main User Schema
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ],
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Please add a name']
  },
  phoneNumber: {
    type: String
  },
  role: {
    type: String,
    enum: ['PATIENT', 'DOCTOR', 'PHARMACIST'],
    required: true,
    index: true
  },
  patientProfile: {
    type: PatientProfileSchema,
    required: function() {
      return this.role === 'PATIENT';
    }
  },
  doctorProfile: {
    type: DoctorProfileSchema,
    required: function() {
      return this.role === 'DOCTOR';
    }
  },
  pharmacistProfile: {
    type: PharmacistProfileSchema,
    required: function() {
      return this.role === 'PHARMACIST';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // Set updatedAt on save
  this.updatedAt = Date.now();
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { userId: this._id, role: this.role },
    "your-super-secret-jwt-key-here-make-it-long-and-complex",
    { expiresIn: "30d" }
  );
};

// Get refresh token
UserSchema.methods.getRefreshToken = function() {
  return jwt.sign(
    { userId: this._id },
    "your-super-secret-refresh-jwt-key-here-make-it-long-and-complex",
    { expiresIn: "7d" }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 
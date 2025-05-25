const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// @desc    Register user (patient)
// @route   POST /api/v1/auth/register/patient
// @access  Public
exports.registerPatient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, fullName, phoneNumber, dateOfBirth, gender, address } = req.body;

    // Create user with patient role
    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber,
      role: 'PATIENT',
      patientProfile: {
        dateOfBirth,
        gender,
        address,
        emergencyContacts: [],
        medicalData: {}
      }
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Register user (doctor)
// @route   POST /api/v1/auth/register/doctor
// @access  Public
exports.registerDoctor = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      email, 
      password, 
      fullName, 
      phoneNumber, 
      medicalLicenseId, 
      specialization, 
      clinicAddress 
    } = req.body;

    // Create user with doctor role
    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber,
      role: 'DOCTOR',
      doctorProfile: {
        medicalLicenseId,
        specialization,
        clinicAddress,
        availability: {
          workingDays: [],
          workingHours: { start: '', end: '' },
          isAvailableForHomeVisits: false
        }
      }
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Register user (pharmacist)
// @route   POST /api/v1/auth/register/pharmacist
// @access  Public
exports.registerPharmacist = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      email, 
      password, 
      fullName, 
      phoneNumber, 
      pharmacyLicenseId, 
      pharmacyName, 
      pharmacyAddress 
    } = req.body;

    // Create user with pharmacist role
    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber,
      role: 'PHARMACIST',
      pharmacistProfile: {
        pharmacyLicenseId,
        pharmacyName,
        pharmacyAddress
      }
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a refresh token'
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Generate new tokens
      const token = user.getSignedJwtToken();

      res.status(200).json({
        success: true,
        token
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get user id from auth middleware
    const userId = req.user.id;

    // Find user by id
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Update basic fields
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    
    // Update role-specific profiles
    if (user.role === 'PATIENT' && req.body.patientProfile) {
      // Update patient profile
      if (req.body.patientProfile.dateOfBirth) {
        user.patientProfile.dateOfBirth = req.body.patientProfile.dateOfBirth;
      }
      if (req.body.patientProfile.gender) {
        user.patientProfile.gender = req.body.patientProfile.gender;
      }
      if (req.body.patientProfile.address) {
        user.patientProfile.address = req.body.patientProfile.address;
      }
      
      // Update medical data if provided
      if (req.body.patientProfile.medicalData) {
        const medicalData = req.body.patientProfile.medicalData;
        
        // Initialize medicalData object if it doesn't exist
        if (!user.patientProfile.medicalData) {
          user.patientProfile.medicalData = {};
        }
        
        if (medicalData.heightCm) user.patientProfile.medicalData.heightCm = medicalData.heightCm;
        if (medicalData.weightKg) user.patientProfile.medicalData.weightKg = medicalData.weightKg;
        if (medicalData.bloodType) user.patientProfile.medicalData.bloodType = medicalData.bloodType;
        
        // Update arrays only if provided
        if (medicalData.allergies) {
          user.patientProfile.medicalData.allergies = medicalData.allergies;
        }
        if (medicalData.chronicConditions) {
          user.patientProfile.medicalData.chronicConditions = medicalData.chronicConditions;
        }
        
        // Add vitals history entry if provided
        if (medicalData.vitalsHistory && medicalData.vitalsHistory.length > 0) {
          const newVitals = medicalData.vitalsHistory[medicalData.vitalsHistory.length - 1];
          
          // Initialize vitalsHistory array if it doesn't exist
          if (!user.patientProfile.medicalData.vitalsHistory) {
            user.patientProfile.medicalData.vitalsHistory = [];
          }
          
          // Add new vitals record
          user.patientProfile.medicalData.vitalsHistory.push(newVitals);
        }
      }
    } else if (user.role === 'DOCTOR' && req.body.doctorProfile) {
      // Update doctor profile
      const doctorProfile = req.body.doctorProfile;
      
      console.log('Updating doctor profile:', doctorProfile);
      
      if (doctorProfile.specialization) {
        user.doctorProfile.specialization = doctorProfile.specialization;
      }
      if (doctorProfile.clinicAddress) {
        user.doctorProfile.clinicAddress = doctorProfile.clinicAddress;
      }
      if (doctorProfile.medicalLicenseId) {
        user.doctorProfile.medicalLicenseId = doctorProfile.medicalLicenseId;
      }
      
      // Update availability if provided
      if (doctorProfile.availability) {
        const availability = doctorProfile.availability;
        console.log('Updating doctor availability:', availability);
        
        // Initialize availability object if it doesn't exist
        if (!user.doctorProfile.availability) {
          user.doctorProfile.availability = {};
        }
        
        if (availability.workingDays) {
          console.log('Setting working days:', availability.workingDays);
          // Ensure all days are in uppercase format
          user.doctorProfile.availability.workingDays = availability.workingDays.map(day => day.toUpperCase());
        }
        
        if (availability.isAvailableForHomeVisits !== undefined) {
          user.doctorProfile.availability.isAvailableForHomeVisits = availability.isAvailableForHomeVisits;
        }
        
        if (availability.workingHours) {
          console.log('Setting working hours:', availability.workingHours);
          user.doctorProfile.availability.workingHours = availability.workingHours;
        }
      }
    } else if (user.role === 'PHARMACIST' && req.body.pharmacistProfile) {
      // Update pharmacist profile
      const pharmacistProfile = req.body.pharmacistProfile;
      
      if (pharmacistProfile.pharmacyLicenseId) {
        user.pharmacistProfile.pharmacyLicenseId = pharmacistProfile.pharmacyLicenseId;
      }
      if (pharmacistProfile.pharmacyName) {
        user.pharmacistProfile.pharmacyName = pharmacistProfile.pharmacyName;
      }
      if (pharmacistProfile.pharmacyAddress) {
        user.pharmacistProfile.pharmacyAddress = pharmacistProfile.pharmacyAddress;
      }
    }
    
    user.updatedAt = Date.now();
    
    // Save updated user
    await user.save();
    
    // Return user without password
    const userResponse = await User.findById(user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: userResponse,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  const options = {
    expiresIn: process.env.JWT_EXPIRE
  };

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user
  });
}; 
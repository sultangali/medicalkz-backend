const express = require('express');
const { 
  registerPatient, 
  registerDoctor, 
  registerPharmacist, 
  login, 
  refreshToken, 
  logout,
  getMe,
  updateProfile
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');

const router = express.Router();

// Registration validation
const validatePatientRegistration = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  check('fullName', 'Full name is required').not().isEmpty(),
  check('dateOfBirth', 'Date of birth is required').isISO8601(),
  check('gender', 'Gender is required').isIn(['MALE', 'FEMALE', 'OTHER'])
];

const validateDoctorRegistration = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  check('fullName', 'Full name is required').not().isEmpty(),
  check('medicalLicenseId', 'Medical license ID is required').not().isEmpty(),
  check('specialization', 'Specialization is required').isIn([
    'OPHTHALMOLOGIST', 'THERAPIST', 'UROLOGIST', 'GASTROENTEROLOGIST', 
    'CARDIOLOGIST', 'NEUROLOGIST', 'DERMATOLOGIST', 'PEDIATRICIAN', 
    'GYNECOLOGIST', 'ENDOCRINOLOGIST'
  ])
];

const validatePharmacistRegistration = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  check('fullName', 'Full name is required').not().isEmpty(),
  check('pharmacyLicenseId', 'Pharmacy license ID is required').not().isEmpty()
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Registration routes
router.post('/register/patient', validatePatientRegistration, registerPatient);
router.post('/register/doctor', validateDoctorRegistration, registerDoctor);
router.post('/register/pharmacist', validatePharmacistRegistration, registerPharmacist);

// Login route
router.post('/login', validateLogin, login);

// Token management
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

// Get current logged in user
router.get('/me', protect, getMe);

// Update user profile
router.put('/profile', protect, updateProfile);

module.exports = router; 
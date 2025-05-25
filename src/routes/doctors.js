const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * @desc    Get all doctors with filters
 * @route   GET /api/v1/doctors
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { search, specialization } = req.query;
    
    // Build query object
    const query = { role: 'DOCTOR' };
    
    // Add specialization filter if provided
    if (specialization) {
      query['doctorProfile.specialization'] = specialization;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const doctors = await User.find(query)
      .select('fullName email phoneNumber doctorProfile')
      .sort({ fullName: 1 });
    
    // Return response
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get doctor by ID
 * @route   GET /api/v1/doctors/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const doctor = await User.findOne({
      _id: req.params.id,
      role: 'DOCTOR'
    }).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    console.error(err);
    
    // If ID format is invalid
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update doctor availability (for debugging)
router.put('/:id/debug-availability', [protect], async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Ensure doctor profile exists
    if (!doctor.doctorProfile) {
      doctor.doctorProfile = {};
    }
    
    // Ensure availability exists
    if (!doctor.doctorProfile.availability) {
      doctor.doctorProfile.availability = {};
    }
    
    // Set default working days to all days of the week
    doctor.doctorProfile.availability.workingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    // Set default working hours
    doctor.doctorProfile.availability.workingHours = {
      start: '09:00',
      end: '17:00'
    };
    
    // Set available for home visits
    doctor.doctorProfile.availability.isAvailableForHomeVisits = true;
    
    await doctor.save();
    
    res.status(200).json({
      success: true,
      message: 'Doctor availability updated for debugging',
      data: doctor.doctorProfile.availability
    });
  } catch (err) {
    console.error('Error in debug-availability route:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

module.exports = router; 
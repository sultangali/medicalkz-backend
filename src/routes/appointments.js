const express = require('express');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getDoctorAvailability
} = require('../controllers/appointments');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');

const router = express.Router();

// Validation
const validateAppointment = [
  // Убираем проверку patientId, так как это поле устанавливается автоматически из токена
  // check('patientId', 'Patient ID is required').not().isEmpty(),
  check('doctorId', 'Doctor ID is required').not().isEmpty(),
  check('appointmentDate', 'Appointment date is required').isISO8601(),
  check('startTime', 'Start time is required').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('endTime', 'End time is required').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  check('status', 'Status is required').isIn([
    'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
  ]),
  check('appointmentType', 'Appointment type is required').isIn([
    'REGULAR', 'FOLLOW_UP', 'EMERGENCY', 'CONSULTATION', 'TELEHEALTH'
  ])
];

// Routes for all authorized users
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);

// Patient routes
router.post(
  '/', 
  protect, 
  authorize('PATIENT'), 
  validateAppointment, 
  createAppointment
);

router.put(
  '/:id/cancel', 
  protect, 
  authorize('PATIENT', 'DOCTOR'), 
  updateAppointment
);

// Doctor routes
router.get(
  '/doctor/:doctorId/availability', 
  protect, 
  getDoctorAvailability
);

router.put(
  '/:id', 
  protect, 
  authorize('DOCTOR'), 
  validateAppointment, 
  updateAppointment
);

router.delete(
  '/:id', 
  protect, 
  authorize('DOCTOR', 'ADMIN'), 
  deleteAppointment
);

module.exports = router; 
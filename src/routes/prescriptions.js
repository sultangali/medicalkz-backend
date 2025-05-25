const express = require('express');
const {
  getPatientPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescriptionStatus,
  getDoctorPrescriptions
} = require('../controllers/prescriptionController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Patient routes
router.get('/', protect, authorize('PATIENT'), getPatientPrescriptions);

// Doctor routes
router.get('/doctor', protect, authorize('DOCTOR'), getDoctorPrescriptions);
router.post('/', protect, authorize('DOCTOR'), createPrescription);

// Shared routes (Patient/Doctor)
router.get('/:id', protect, authorize('PATIENT', 'DOCTOR'), getPrescription);
router.put('/:id/status', protect, authorize('PATIENT', 'DOCTOR'), updatePrescriptionStatus);

module.exports = router; 
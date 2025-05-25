const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPatientMedications,
  addPatientMedication,
  updateMedicationStatus,
  removePatientMedication,
  getPatientMedication
} = require('../controllers/patientMedicationController');

const router = express.Router();

// All routes require authentication and patient role
router.use(protect);
router.use(authorize('PATIENT'));

// Patient medications routes
router.route('/')
  .get(getPatientMedications)
  .post(addPatientMedication);

router.route('/:medicationId')
  .get(getPatientMedication)
  .delete(removePatientMedication);

router.put('/:medicationId/status', updateMedicationStatus);

module.exports = router; 
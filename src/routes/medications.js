const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getLowStockMedications,
  getExpiringMedications,
  searchMedications
} = require('../controllers/medicationController');

const router = express.Router();

// Public routes
router.get('/search', searchMedications);

// Protected routes - require authentication
router.use(protect);

// Special routes (must come before /:id routes)
router.get('/low-stock', authorize('PHARMACIST'), getLowStockMedications);
router.get('/expiring', authorize('PHARMACIST'), getExpiringMedications);

// CRUD routes
router.route('/')
  .get(authorize('PHARMACIST', 'PATIENT'), getMedications)
  .post(authorize('PHARMACIST'), createMedication);

router.route('/:id')
  .get(authorize('PHARMACIST', 'PATIENT'), getMedication)
  .put(authorize('PHARMACIST'), updateMedication)
  .delete(authorize('PHARMACIST'), deleteMedication);

module.exports = router; 
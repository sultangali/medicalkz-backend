const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');

const router = express.Router();

// Routes for individual notes
router.route('/:id')
  .get(protect, authorize('DOCTOR'), getNote)
  .put(protect, authorize('DOCTOR'), updateNote)
  .delete(protect, authorize('DOCTOR'), deleteNote);

module.exports = router; 
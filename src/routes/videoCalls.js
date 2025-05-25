const express = require('express');
const {
  initiateCall,
  answerCall,
  endCall,
  getCallHistory,
  getActiveCall
} = require('../controllers/videoCalls');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');

const router = express.Router();

// Call initiation validation
const validateCallInitiation = [
  check('appointmentId', 'Appointment ID is required').not().isEmpty(),
  check('recipientId', 'Recipient ID is required').not().isEmpty()
];

// Routes
router.post('/initiate', protect, validateCallInitiation, initiateCall);
router.put('/:id/answer', protect, answerCall);
router.put('/:id/end', protect, endCall);
router.get('/appointment/:appointmentId', protect, getCallHistory);
router.get('/active/:appointmentId', protect, getActiveCall);

module.exports = router; 
const express = require('express');
const {
  getMessages,
  sendMessage,
  getUnreadCount,
  uploadAttachment
} = require('../controllers/messages');
const { protect } = require('../middleware/auth');
const { check } = require('express-validator');
const multer = require('multer');

// Configure file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/'); // Make sure this directory exists
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, documents, audio and video
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('application/') ||
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB max file size
  },
  fileFilter: fileFilter
});

const router = express.Router();

// Message validation
const validateMessage = [
  check('appointmentId', 'Appointment ID is required').not().isEmpty(),
  check('receiverId', 'Receiver ID is required').not().isEmpty(),
  check('content', 'Message content is required').not().isEmpty()
];

// Routes
router.get('/appointment/:appointmentId', protect, getMessages);
router.get('/unread', protect, getUnreadCount);
router.post('/', protect, validateMessage, sendMessage);
router.post('/attachment', protect, upload.single('file'), uploadAttachment);

module.exports = router; 
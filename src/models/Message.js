const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  attachments: [
    {
      url: String,
      type: {
        type: String,
        enum: ['image', 'document', 'audio', 'video'],
        default: 'document'
      },
      name: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster query performance
MessageSchema.index({ appointmentId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model('Message', MessageSchema); 
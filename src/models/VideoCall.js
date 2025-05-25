const mongoose = require('mongoose');

const VideoCallSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'initiated', 'ongoing', 'completed', 'missed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  roomId: {
    type: String, // Unique room identifier for the call
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster query performance
VideoCallSchema.index({ appointmentId: 1 });
VideoCallSchema.index({ initiatorId: 1, recipientId: 1 });
VideoCallSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('VideoCall', VideoCallSchema); 
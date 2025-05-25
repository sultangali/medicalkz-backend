const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['GENERAL', 'DIAGNOSIS', 'TREATMENT', 'MEDICATION', 'FOLLOW_UP', 'OBSERVATION'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ patientId: 1, doctorId: 1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema); 
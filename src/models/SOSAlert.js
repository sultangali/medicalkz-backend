const mongoose = require('mongoose');

const EmergencyContactNotificationSchema = new mongoose.Schema({
  contactName: String,
  contactPhone: String,
  notificationMethod: {
    type: String,
    enum: ['SMS', 'APP_NOTIFICATION']
  },
  notificationTimestamp: {
    type: Date,
    default: Date.now
  },
  notificationStatus: {
    type: String,
    enum: ['SENT', 'FAILED', 'PENDING']
  }
});

const SOSAlertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String
  },
  emergencyContactsNotified: [EmergencyContactNotificationSchema],
  doctorNotifiedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE',
    index: true
  },
  details: {
    type: String
  },
  resolutionNotes: {
    type: String
  },
  resolvedTimestamp: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index on location
SOSAlertSchema.index({ location: '2dsphere' });

// Set updatedAt before saving
SOSAlertSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SOSAlert', SOSAlertSchema); 
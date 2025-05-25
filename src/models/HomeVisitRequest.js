const mongoose = require('mongoose');

const HomeVisitRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  requestTimestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  symptomsBrief: {
    type: String,
    required: [true, 'Please provide a brief description of the symptoms']
  },
  preferredTimeSlot: {
    type: String
  },
  visitLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: [true, 'Please provide an address for the visit']
    }
  },
  status: {
    type: String,
    enum: [
      'PENDING_DOCTOR_ACCEPTANCE',
      'ACCEPTED',
      'DECLINED_BY_DOCTOR',
      'EN_ROUTE',
      'COMPLETED',
      'CANCELLED_BY_PATIENT'
    ],
    default: 'PENDING_DOCTOR_ACCEPTANCE',
    index: true
  },
  doctorDeclineReason: {
    type: String
  },
  scheduledTime: {
    type: Date
  },
  completionNotes: {
    type: String
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

// Create a 2dsphere index on visitLocation
HomeVisitRequestSchema.index({ visitLocation: '2dsphere' });

// Create a compound index for doctor status queries
HomeVisitRequestSchema.index({ doctorId: 1, status: 1 });

// Set updatedAt before saving
HomeVisitRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HomeVisitRequest', HomeVisitRequestSchema); 
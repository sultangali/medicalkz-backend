const mongoose = require('mongoose');

const PrescriptionMedicationSchema = new mongoose.Schema({
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  dosage: {
    type: String,
    required: [true, 'Please add a dosage (e.g., "1 tablet")']
  },
  frequency: {
    type: String,
    required: [true, 'Please add frequency (e.g., "3 times a day")']
  },
  duration: {
    type: String,
    required: [true, 'Please add duration (e.g., "7 days")']
  },
  instructions: {
    type: String
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  }
});

const PrescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  issueDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  medicationsPrescribed: [PrescriptionMedicationSchema],
  diagnosis: {
    type: String
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
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

// Set updatedAt before saving
PrescriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Prescription', PrescriptionSchema); 
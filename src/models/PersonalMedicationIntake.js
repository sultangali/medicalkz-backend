const mongoose = require('mongoose');

const PersonalMedicationIntakeSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  prescriptionMedicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication'
  },
  medicationName: {
    type: String,
    required: true
  },
  scheduledIntakeTime: {
    type: Date,
    required: true,
    index: true
  },
  actualIntakeTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'TAKEN', 'MISSED', 'SKIPPED'],
    default: 'SCHEDULED',
    index: true
  },
  notes: {
    type: String
  },
  dosage: {
    type: String,
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentTime: {
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

// Create a compound index for querying upcoming medications
PersonalMedicationIntakeSchema.index({
  patientId: 1, 
  scheduledIntakeTime: 1, 
  status: 1
});

// Set updatedAt before saving
PersonalMedicationIntakeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PersonalMedicationIntake', PersonalMedicationIntakeSchema); 
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
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
    appointmentDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'SCHEDULED'
    },
    appointmentType: {
      type: String,
      enum: ['REGULAR', 'FOLLOW_UP', 'EMERGENCY', 'CONSULTATION', 'TELEHEALTH'],
      default: 'REGULAR'
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason can not be more than 500 characters']
    },
    symptoms: {
      type: [String]
    },
    diagnosis: {
      type: String,
      maxlength: [1000, 'Diagnosis can not be more than 1000 characters']
    },
    treatmentPlan: {
      type: String,
      maxlength: [1000, 'Treatment plan can not be more than 1000 characters']
    },
    prescriptionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription'
      }
    ],
    notes: {
      type: String,
      maxlength: [1000, 'Notes can not be more than 1000 characters']
    },
    isTelehealth: {
      type: Boolean,
      default: false
    },
    telehealthLink: {
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes for quick lookups
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });

// Add virtual property for full date with time
AppointmentSchema.virtual('fullDateTime').get(function() {
  const dateObj = new Date(this.appointmentDate);
  const [hours, minutes] = this.startTime.split(':');
  dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return dateObj;
});

// Set updatedAt on save
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema); 
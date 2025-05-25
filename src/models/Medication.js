const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  nameKazakh: {
    type: String,
    required: true,
    trim: true
  },
  nameInternational: {
    type: String,
    trim: true
  },
  composition: {
    type: String,
    required: true,
    trim: true
  },
  strength: {
    type: String,
    required: true,
    trim: true
  },
  form: {
    type: String,
    enum: ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'CREAM', 'OINTMENT', 'DROPS', 'INHALER', 'PATCH', 'SUPPOSITORY', 'OTHER'],
    required: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  tagsOrCategory: [{
    type: String,
    trim: true
  }],
  addedByPharmacistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  contraindications: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  dosageInstructions: {
    type: String,
    trim: true
  },
  storageCriteria: {
    type: String,
    trim: true
  },
  stockQuantity: {
    type: Number,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
medicationSchema.index({ addedByPharmacistId: 1 });
medicationSchema.index({ nameKazakh: 'text', nameInternational: 'text', composition: 'text' });
medicationSchema.index({ form: 1 });
medicationSchema.index({ isAvailable: 1 });
medicationSchema.index({ expiryDate: 1 });
medicationSchema.index({ stockQuantity: 1 });

// Virtual for checking if medication is low stock
medicationSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity !== null && this.stockQuantity !== undefined && 
         this.stockQuantity <= this.lowStockThreshold;
});

// Virtual for checking if medication is expired
medicationSchema.virtual('isExpired').get(function() {
  return this.expiryDate && this.expiryDate < new Date();
});

// Virtual for checking if medication is expiring soon (within 30 days)
medicationSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
});

// Ensure virtual fields are serialized
medicationSchema.set('toJSON', { virtuals: true });
medicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medication', medicationSchema); 
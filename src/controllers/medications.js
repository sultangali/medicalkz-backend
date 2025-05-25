const Medication = require('../models/Medication');
const { validationResult } = require('express-validator');

// @desc    Get all medications
// @route   GET /api/v1/medications
// @access  Private
exports.getMedications = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Search query
    const searchOptions = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      searchOptions.$or = [
        { nameKazakh: searchRegex },
        { nameInternational: searchRegex }
      ];
    }
    
    // Filter by form
    if (req.query.form) {
      searchOptions.form = req.query.form;
    }
    
    // Get medications
    const medications = await Medication.find(searchOptions)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Medication.countDocuments(searchOptions);
    
    res.status(200).json({
      success: true,
      count: medications.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: medications
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single medication
// @route   GET /api/v1/medications/:id
// @access  Private
exports.getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: medication
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new medication
// @route   POST /api/v1/medications
// @access  Private (Pharmacist only)
exports.createMedication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Add user to req.body
    req.body.addedByPharmacistId = req.user.id;
    
    const medication = await Medication.create(req.body);
    
    res.status(201).json({
      success: true,
      data: medication
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update medication
// @route   PUT /api/v1/medications/:id
// @access  Private (Pharmacist only)
exports.updateMedication = async (req, res, next) => {
  try {
    let medication = await Medication.findById(req.params.id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }
    
    // Make sure user is the medication creator
    if (medication.addedByPharmacistId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medication'
      });
    }
    
    medication = await Medication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: medication
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete medication
// @route   DELETE /api/v1/medications/:id
// @access  Private (Pharmacist only)
exports.deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findById(req.params.id);
    
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }
    
    // Make sure user is the medication creator
    if (medication.addedByPharmacistId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medication'
      });
    }
    
    await medication.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 
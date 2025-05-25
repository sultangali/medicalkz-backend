const Medication = require('../models/Medication');
const User = require('../models/User');

/**
 * @desc    Get all medications for a pharmacist or all available medications for patients
 * @route   GET /api/v1/medications
 * @access  Private (Pharmacist and Patient)
 */
const getMedications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build query based on user role
    let query = {};
    
    if (userRole === 'PHARMACIST') {
      // Pharmacists see only their own medications
      query.addedByPharmacistId = userId;
    } else if (userRole === 'PATIENT') {
      // Patients see all available medications
      query.isAvailable = true;
    } else {
      // Other roles see all available medications
      query.isAvailable = true;
    }
    
    // Add search filter
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Add form filter
    if (req.query.form) {
      query.form = req.query.form.toUpperCase();
    }
    
    // Add availability filter (only for pharmacists, patients always see available ones)
    if (userRole === 'PHARMACIST' && req.query.isAvailable !== undefined) {
      query.isAvailable = req.query.isAvailable === 'true';
    }

    const medications = await Medication.find(query)
      .populate('addedByPharmacistId', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Medication.countDocuments(query);

    res.status(200).json({
      success: true,
      count: medications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: medications
    });
  } catch (error) {
    console.error('Error getting medications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get single medication
 * @route   GET /api/v1/medications/:id
 * @access  Private (Pharmacist and Patient)
 */
const getMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('addedByPharmacistId', 'fullName');

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check authorization based on user role
    if (req.user.role === 'PHARMACIST') {
      // Pharmacists can only see their own medications
      if (medication.addedByPharmacistId._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this medication'
        });
      }
    } else if (req.user.role === 'PATIENT') {
      // Patients can only see available medications
      if (!medication.isAvailable) {
        return res.status(404).json({
          success: false,
          message: 'Medication not found'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: medication
    });
  } catch (error) {
    console.error('Error getting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create new medication
 * @route   POST /api/v1/medications
 * @access  Private (Pharmacist only)
 */
const createMedication = async (req, res) => {
  try {
    const pharmacistId = req.user.id;
    
    // Verify user is a pharmacist
    const pharmacist = await User.findById(pharmacistId);
    if (!pharmacist || pharmacist.role !== 'PHARMACIST') {
      return res.status(403).json({
        success: false,
        message: 'Only pharmacists can add medications'
      });
    }

    // Add pharmacist ID to the medication data
    const medicationData = {
      ...req.body,
      addedByPharmacistId: pharmacistId
    };

    const medication = await Medication.create(medicationData);
    
    // Populate the pharmacist info
    await medication.populate('addedByPharmacistId', 'fullName');

    res.status(201).json({
      success: true,
      data: medication
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update medication
 * @route   PUT /api/v1/medications/:id
 * @access  Private (Pharmacist only)
 */
const updateMedication = async (req, res) => {
  try {
    let medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check if the medication belongs to the requesting pharmacist
    if (medication.addedByPharmacistId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medication'
      });
    }

    // Don't allow changing the pharmacist ID
    delete req.body.addedByPharmacistId;

    medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('addedByPharmacistId', 'fullName');

    res.status(200).json({
      success: true,
      data: medication
    });
  } catch (error) {
    console.error('Error updating medication:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete medication
 * @route   DELETE /api/v1/medications/:id
 * @access  Private (Pharmacist only)
 */
const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check if the medication belongs to the requesting pharmacist
    if (medication.addedByPharmacistId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medication'
      });
    }

    await Medication.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get low stock medications
 * @route   GET /api/v1/medications/low-stock
 * @access  Private (Pharmacist only)
 */
const getLowStockMedications = async (req, res) => {
  try {
    const pharmacistId = req.user.id;
    
    const medications = await Medication.find({
      addedByPharmacistId: pharmacistId,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      stockQuantity: { $exists: true, $ne: null }
    })
      .populate('addedByPharmacistId', 'fullName')
      .sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    console.error('Error getting low stock medications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get expiring medications
 * @route   GET /api/v1/medications/expiring
 * @access  Private (Pharmacist only)
 */
const getExpiringMedications = async (req, res) => {
  try {
    const pharmacistId = req.user.id;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const medications = await Medication.find({
      addedByPharmacistId: pharmacistId,
      expiryDate: { 
        $exists: true, 
        $ne: null,
        $lte: thirtyDaysFromNow 
      }
    })
      .populate('addedByPharmacistId', 'fullName')
      .sort({ expiryDate: 1 });

    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    console.error('Error getting expiring medications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Search medications (for patients/doctors)
 * @route   GET /api/v1/medications/search
 * @access  Public
 */
const searchMedications = async (req, res) => {
  try {
    const { q, form, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const query = {
      isAvailable: true,
      $text: { $search: q }
    };
    
    if (form) {
      query.form = form.toUpperCase();
    }
    
    const medications = await Medication.find(query)
      .select('nameKazakh nameInternational composition strength form price manufacturer')
      .limit(parseInt(limit))
      .sort({ score: { $meta: 'textScore' } });

    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    console.error('Error searching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getLowStockMedications,
  getExpiringMedications,
  searchMedications
}; 
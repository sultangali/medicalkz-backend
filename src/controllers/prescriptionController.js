const Prescription = require('../models/Prescription');
const Medication = require('../models/Medication');
const User = require('../models/User');

// @desc    Get patient's prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private (Patient)
const getPatientPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { patientId: req.user.id };
    if (status) {
      query.status = status.toUpperCase();
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'doctorId',
        select: 'fullName email doctorProfile.specialization'
      })
      .populate({
        path: 'medicationsPrescribed.medicationId',
        select: 'nameKazakh nameInternational strength form'
      })
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: prescriptions
    });
  } catch (error) {
    console.error('Error getting patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/v1/prescriptions/:id
// @access  Private (Patient/Doctor)
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'patientId',
        select: 'fullName email phoneNumber'
      })
      .populate({
        path: 'doctorId',
        select: 'fullName email doctorProfile.specialization'
      })
      .populate({
        path: 'medicationsPrescribed.medicationId',
        select: 'nameKazakh nameInternational strength form composition'
      });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user has access to this prescription
    if (req.user.role === 'PATIENT' && prescription.patientId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    if (req.user.role === 'DOCTOR' && prescription.doctorId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error getting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create prescription (Doctor only)
// @route   POST /api/v1/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medicationsPrescribed,
      diagnosis,
      notes
    } = req.body;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Verify all medications exist
    for (const med of medicationsPrescribed) {
      const medication = await Medication.findById(med.medicationId);
      if (!medication) {
        return res.status(404).json({
          success: false,
          message: `Medication with ID ${med.medicationId} not found`
        });
      }
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user.id,
      medicationsPrescribed,
      diagnosis,
      notes
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate({
        path: 'patientId',
        select: 'fullName email phoneNumber'
      })
      .populate({
        path: 'doctorId',
        select: 'fullName email doctorProfile.specialization'
      })
      .populate({
        path: 'medicationsPrescribed.medicationId',
        select: 'nameKazakh nameInternational strength form'
      });

    res.status(201).json({
      success: true,
      data: populatedPrescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update prescription status
// @route   PUT /api/v1/prescriptions/:id/status
// @access  Private (Doctor/Patient)
const updatePrescriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    if (req.user.role === 'PATIENT' && prescription.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }

    if (req.user.role === 'DOCTOR' && prescription.doctorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this prescription'
      });
    }

    prescription.status = status;
    await prescription.save();

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get doctor's prescriptions
// @route   GET /api/v1/prescriptions/doctor
// @access  Private (Doctor)
const getDoctorPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { doctorId: req.user.id };
    if (status) {
      query.status = status.toUpperCase();
    }
    if (patientId) {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: 'patientId',
        select: 'fullName email phoneNumber'
      })
      .populate({
        path: 'medicationsPrescribed.medicationId',
        select: 'nameKazakh nameInternational strength form'
      })
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: prescriptions
    });
  } catch (error) {
    console.error('Error getting doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getPatientPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescriptionStatus,
  getDoctorPrescriptions
}; 
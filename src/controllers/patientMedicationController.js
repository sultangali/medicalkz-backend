const User = require('../models/User');
const Medication = require('../models/Medication');
const asyncHandler = require('express-async-handler');

// @desc    Get patient's personal medications
// @route   GET /api/v1/patient/medications
// @access  Private (Patient only)
exports.getPatientMedications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  console.log('Getting patient medications for user:', req.user._id);
  
  // Get patient
  const patient = await User.findById(req.user._id)
    .populate('patientProfile.medications.medicationId');

  console.log('Found patient:', patient ? 'yes' : 'no');
  console.log('Patient role:', patient ? patient.role : 'no patient');
  console.log('Patient medications:', patient ? patient.patientProfile?.medications?.length : 'no patient');

  if (!patient || patient.role !== 'PATIENT') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  let medications = patient.patientProfile.medications || [];

  // Filter by status if provided
  if (status) {
    medications = medications.filter(med => med.status === status.toUpperCase());
  }

  // Sort by addedAt (newest first)
  medications.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedMedications = medications.slice(startIndex, endIndex);

  res.status(200).json({
    success: true,
    count: paginatedMedications.length,
    total: medications.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(medications.length / limit)
    },
    data: paginatedMedications
  });
});

// @desc    Add medication to patient's personal list
// @route   POST /api/v1/patient/medications
// @access  Private (Patient only)
exports.addPatientMedication = asyncHandler(async (req, res) => {
  const {
    medicationId,
    dosage,
    frequency,
    startDate,
    endDate,
    instructions,
    prescribedBy,
    notes
  } = req.body;

  // Validate required fields
  if (!medicationId || !dosage || !frequency || !startDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide medicationId, dosage, frequency, and startDate'
    });
  }

  // Check if medication exists in inventory
  const medication = await Medication.findById(medicationId);
  if (!medication) {
    return res.status(404).json({
      success: false,
      message: 'Medication not found in inventory'
    });
  }

  // Get patient
  const patient = await User.findById(req.user._id);
  if (!patient || patient.role !== 'PATIENT') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Create new patient medication
  const newMedication = {
    medicationId,
    dosage,
    frequency,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    instructions,
    prescribedBy,
    notes,
    status: 'ACTIVE',
    addedAt: new Date()
  };

  // Add to patient's medications
  if (!patient.patientProfile.medications) {
    patient.patientProfile.medications = [];
  }
  patient.patientProfile.medications.push(newMedication);

  // Save patient
  await patient.save();

  // Get the added medication with populated data
  const updatedPatient = await User.findById(req.user._id)
    .populate('patientProfile.medications.medicationId')
    .select('patientProfile.medications');

  const addedMedication = updatedPatient.patientProfile.medications[
    updatedPatient.patientProfile.medications.length - 1
  ];

  res.status(201).json({
    success: true,
    data: addedMedication
  });
});

// @desc    Update patient medication status
// @route   PUT /api/v1/patient/medications/:medicationId/status
// @access  Private (Patient only)
exports.updateMedicationStatus = asyncHandler(async (req, res) => {
  const { medicationId } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  // Get patient
  const patient = await User.findById(req.user._id);
  if (!patient || patient.role !== 'PATIENT') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Find the medication in patient's list
  const medicationIndex = patient.patientProfile.medications.findIndex(
    med => med._id.toString() === medicationId
  );

  if (medicationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Medication not found in patient\'s list'
    });
  }

  // Update status
  patient.patientProfile.medications[medicationIndex].status = status;
  if (status === 'COMPLETED') {
    patient.patientProfile.medications[medicationIndex].completedAt = new Date();
  }

  // Save patient
  await patient.save();

  // Get updated medication with populated data
  const updatedPatient = await User.findById(req.user._id)
    .populate('patientProfile.medications.medicationId')
    .select('patientProfile.medications');

  const updatedMedication = updatedPatient.patientProfile.medications[medicationIndex];

  res.status(200).json({
    success: true,
    data: updatedMedication
  });
});

// @desc    Remove medication from patient's list
// @route   DELETE /api/v1/patient/medications/:medicationId
// @access  Private (Patient only)
exports.removePatientMedication = asyncHandler(async (req, res) => {
  const { medicationId } = req.params;

  // Get patient
  const patient = await User.findById(req.user._id);
  if (!patient || patient.role !== 'PATIENT') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Find and remove the medication
  const medicationIndex = patient.patientProfile.medications.findIndex(
    med => med._id.toString() === medicationId
  );

  if (medicationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Medication not found in patient\'s list'
    });
  }

  patient.patientProfile.medications.splice(medicationIndex, 1);

  // Save patient
  await patient.save();

  res.status(200).json({
    success: true,
    message: 'Medication removed successfully'
  });
});

// @desc    Get single patient medication
// @route   GET /api/v1/patient/medications/:medicationId
// @access  Private (Patient only)
exports.getPatientMedication = asyncHandler(async (req, res) => {
  const { medicationId } = req.params;

  // Get patient with populated medications
  const patient = await User.findById(req.user._id)
    .populate('patientProfile.medications.medicationId')
    .select('patientProfile.medications');

  if (!patient || patient.role !== 'PATIENT') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Find the medication
  const medication = patient.patientProfile.medications.find(
    med => med._id.toString() === medicationId
  );

  if (!medication) {
    return res.status(404).json({
      success: false,
      message: 'Medication not found in patient\'s list'
    });
  }

  res.status(200).json({
    success: true,
    data: medication
  });
}); 
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Note = require('../models/Note');
const { getNotes, createNote } = require('../controllers/noteController');

const router = express.Router();

/**
 * @desc    Get all patients for a doctor
 * @route   GET /api/v1/patients
 * @access  Private (Doctor only)
 */
router.get('/', protect, authorize('DOCTOR'), async (req, res) => {
  try {
    // Get all appointments for this doctor to find patients
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate('patientId', 'fullName email phoneNumber patientProfile')
      .select('patientId')
      .lean();

    // Extract unique patients
    const patientMap = new Map();
    
    appointments.forEach(appointment => {
      if (appointment.patientId && !patientMap.has(appointment.patientId._id.toString())) {
        const patient = appointment.patientId;
        patientMap.set(patient._id.toString(), {
          id: patient._id,
          name: patient.fullName,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          age: patient.patientProfile?.dateOfBirth ? 
            new Date().getFullYear() - new Date(patient.patientProfile.dateOfBirth).getFullYear() : 
            null,
          gender: patient.patientProfile?.gender || 'UNKNOWN',
          lastVisit: null, // Will be calculated later
          condition: patient.patientProfile?.medicalData?.allergies?.join(', ') || 'No known conditions'
        });
      }
    });

    const patients = Array.from(patientMap.values());

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Get specific patient details with appointment history
 * @route   GET /api/v1/patients/:id
 * @access  Private (Doctor only)
 */
router.get('/:id', protect, authorize('DOCTOR'), async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Get patient details
    const patient = await User.findById(patientId)
      .select('fullName email phoneNumber patientProfile role');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get appointment history for this patient with this doctor
    const appointments = await Appointment.find({ 
      patientId: patientId,
      doctorId: req.user.id 
    })
      .populate('doctorId', 'fullName doctorProfile')
      .sort({ appointmentDate: -1 })
      .lean();

    // Get notes for this patient from this doctor
    const notes = await Note.find({ 
      patientId: patientId,
      doctorId: req.user.id 
    })
      .populate('doctorId', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Format patient data
    const patientData = {
      id: patient._id,
      name: patient.fullName,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      age: patient.patientProfile?.dateOfBirth ? 
        new Date().getFullYear() - new Date(patient.patientProfile.dateOfBirth).getFullYear() : 
        null,
      gender: patient.patientProfile?.gender || 'UNKNOWN',
      dateOfBirth: patient.patientProfile?.dateOfBirth,
      address: patient.patientProfile?.address,
      emergencyContact: patient.patientProfile?.emergencyContact,
      medicalData: patient.patientProfile?.medicalData,
      // Витальные показатели
      vitals: patient.patientProfile?.medicalData?.vitalsHistory || [],
      // Физические параметры
      height: patient.patientProfile?.medicalData?.heightCm,
      weight: patient.patientProfile?.medicalData?.weightKg,
      bloodType: patient.patientProfile?.medicalData?.bloodType,
      // Медицинские заметки из отдельной коллекции
      notes: notes.map(note => ({
        id: note._id,
        category: note.category,
        content: note.content,
        doctorId: note.doctorId,
        doctorName: note.doctorName,
        timestamp: note.timestamp,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      })),
      appointments: appointments.map(apt => ({
        id: apt._id,
        date: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
        type: apt.appointmentType,
        reason: apt.reason,
        symptoms: apt.symptoms,
        notes: apt.notes,
        prescriptions: apt.prescriptionIds
      }))
    };

    res.status(200).json({
      success: true,
      data: patientData
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Create appointment for patient
 * @route   POST /api/v1/patients/:id/appointments
 * @access  Private (Doctor only)
 */
router.post('/:id/appointments', protect, authorize('DOCTOR'), async (req, res) => {
  try {
    const patientId = req.params.id;
    const { appointmentDate, startTime, endTime, appointmentType, reason } = req.body;

    // Validate required fields
    if (!appointmentDate || !startTime || !endTime || !appointmentType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId: req.user.id,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      appointmentType,
      reason: reason || '',
      status: 'SCHEDULED',
      symptoms: [],
      prescriptionIds: [],
      isTelehealth: false
    });

    await appointment.populate('patientId', 'fullName email phoneNumber');
    await appointment.populate('doctorId', 'fullName doctorProfile');

    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @desc    Add medical note for patient
 * @route   POST /api/v1/patients/:id/notes
 * @access  Private (Doctor only)
 */
router.post('/:id/notes', protect, authorize('DOCTOR'), async (req, res) => {
  // Используем новый контроллер заметок
  req.params.patientId = req.params.id;
  return createNote(req, res);
});

/**
 * @desc    Get medical notes for patient
 * @route   GET /api/v1/patients/:id/notes
 * @access  Private (Doctor only)
 */
router.get('/:id/notes', protect, authorize('DOCTOR'), async (req, res) => {
  // Используем новый контроллер заметок
  req.params.patientId = req.params.id;
  return getNotes(req, res);
});

/**
 * @desc    Delete medical note for patient
 * @route   DELETE /api/v1/patients/:patientId/notes/:noteId
 * @access  Private (Doctor only)
 */
router.delete('/:patientId/notes/:noteId', protect, authorize('DOCTOR'), async (req, res) => {
  try {
    const { patientId, noteId } = req.params;
    const doctorId = req.user.id;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Find and delete the note (only if it belongs to this doctor)
    const note = await Note.findOne({ 
      _id: noteId, 
      patientId: patientId,
      doctorId: doctorId 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to delete it'
      });
    }

    await Note.findByIdAndDelete(noteId);

    console.log('Note deleted successfully:', noteId);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get appointments (with filters for role)
// @route   GET /api/v1/appointments
// @access  Private
exports.getAppointments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query based on user role
    let query = {};
    
    // Filter based on role
    if (req.user.role === 'PATIENT') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.appointmentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Get appointments
    const appointments = await Appointment.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ appointmentDate: 1, startTime: 1 })
      .populate([
        { path: 'patientId', select: 'fullName email phoneNumber' },
        { path: 'doctorId', select: 'fullName email phoneNumber doctorProfile.specialization' }
      ]);
    
    // Get total count
    const total = await Appointment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single appointment
// @route   GET /api/v1/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate([
        { path: 'patientId', select: 'fullName email phoneNumber patientProfile' },
        { path: 'doctorId', select: 'fullName email phoneNumber doctorProfile' },
        { path: 'prescriptionIds' }
      ]);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is authorized to view this appointment
    if (
      req.user.role !== 'ADMIN' && 
      appointment.patientId._id.toString() !== req.user.id && 
      appointment.doctorId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new appointment
// @route   POST /api/v1/appointments
// @access  Private (Patient only)
exports.createAppointment = async (req, res, next) => {
  try {
    console.log('-------------- Create Appointment Request --------------');
    console.log('User ID from token:', req.user.id);
    console.log('User role:', req.user.role);
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Set patientId to the current user if not specified
    if (!req.body.patientId) {
      console.log('Setting patientId from token:', req.user.id);
      req.body.patientId = req.user.id;
    }
    
    console.log('Final request data:', req.body);
    
    // Verify doctor exists and is a doctor
    const doctor = await User.findById(req.body.doctorId);
    if (!doctor || doctor.role !== 'DOCTOR') {
      console.log('Invalid doctor ID or not a doctor');
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }
    
    // Check if doctor is available at the requested time
    const isAvailable = await checkDoctorAvailability(
      req.body.doctorId,
      req.body.appointmentDate,
      req.body.startTime,
      req.body.endTime
    );
    
    console.log('Doctor availability check result:', isAvailable);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available at the requested time'
      });
    }
    
    const appointment = await Appointment.create(req.body);
    console.log('Appointment created successfully:', appointment._id);
    console.log('-------------------------------------------------------');
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    next(err);
  }
};

// @desc    Update appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private (Doctor and Patient for specific operations)
exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is authorized to update this appointment
    if (
      req.user.role !== 'ADMIN' && 
      appointment.patientId.toString() !== req.user.id && 
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }
    
    // Handle specific patient operations
    if (req.user.role === 'PATIENT') {
      // Patient can only cancel appointments
      if (req.path.endsWith('/cancel')) {
        appointment.status = 'CANCELLED';
        await appointment.save();
        
        return res.status(200).json({
          success: true,
          data: appointment
        });
      } else {
        return res.status(403).json({
          success: false,
          message: 'Patients can only cancel appointments'
        });
      }
    }
    
    // Handle doctor updates (can update everything)
    if (req.user.role === 'DOCTOR') {
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        data: updatedAppointment
      });
    }
    
    // If we get here, it's an Admin making the update
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private (Doctor and Admin only)
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is authorized to delete this appointment
    if (
      req.user.role !== 'ADMIN' && 
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }
    
    await appointment.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get doctor availability
// @route   GET /api/v1/appointments/doctor/:doctorId/availability
// @access  Private
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    console.log('-------------- Doctor Availability Request --------------');
    console.log('Doctor ID:', doctorId);
    console.log('Date requested:', date);
    
    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'DOCTOR') {
      console.log('Invalid doctor ID or not a doctor');
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }
    
    // Get doctor's working days/hours from profile
    const workingDays = doctor.doctorProfile?.availability?.workingDays || [];
    const workingHours = doctor.doctorProfile?.availability?.workingHours || { start: '09:00', end: '17:00' };
    
    console.log('Doctor working days:', workingDays);
    console.log('Doctor working hours:', workingHours);
    
    // Check if requested date is a working day
    const requestedDate = new Date(date);
    // JavaScript: 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    const dayNumber = requestedDate.getDay();
    
    // Конвертируем JavaScript day (0-6) в день недели в формате, который используется в профиле
    // где 0 = воскресенье, 1 = понедельник... 6 = суббота
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const requestedDayName = dayNames[dayNumber];

    console.log('Requested day name:', requestedDayName, 'Day number:', dayNumber);
    
    // Проверяем включен ли день недели в список рабочих дней врача
    const isDayAvailable = workingDays.some(day => 
      day.toUpperCase() === requestedDayName.toUpperCase()
    );
    
    console.log('Is day available:', isDayAvailable);
    
    if (!isDayAvailable) {
      console.log('Doctor does not work on this day');
      return res.status(200).json({
        success: true,
        message: 'Doctor does not work on this day',
        isWorkingDay: false,
        data: []
      });
    }
    
    // Get all appointments for the doctor on the requested date
    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lte: new Date(`${date}T23:59:59.999Z`)
      },
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    }).select('startTime endTime');
    
    console.log('Existing appointments:', appointments);
    
    // Generate time slots (30 min intervals)
    const slots = generateTimeSlots(workingHours.start, workingHours.end, 30);
    
    // Mark slots as available or not
    const availableSlots = slots.map(slot => {
      const isBooked = appointments.some(appt => 
        (appt.startTime <= slot.startTime && appt.endTime > slot.startTime) ||
        (appt.startTime < slot.endTime && appt.endTime >= slot.endTime) ||
        (slot.startTime <= appt.startTime && slot.endTime > appt.startTime)
      );
      
      return {
        ...slot,
        isAvailable: !isBooked
      };
    });
    
    console.log('Available slots generated:', availableSlots.length);
    console.log('-------------------------------------------------------');
    
    res.status(200).json({
      success: true,
      isWorkingDay: true,
      workingHours,
      data: availableSlots
    });
  } catch (err) {
    console.error('Error in getDoctorAvailability:', err);
    next(err);
  }
};

// Helper function to check doctor availability
async function checkDoctorAvailability(doctorId, date, startTime, endTime) {
  // Check if there are any overlapping appointments
  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: {
      $gte: new Date(`${date.split('T')[0]}T00:00:00.000Z`),
      $lte: new Date(`${date.split('T')[0]}T23:59:59.999Z`)
    },
    status: { $nin: ['CANCELLED', 'NO_SHOW'] }
  }).select('startTime endTime');
  
  // Check for overlap
  const hasOverlap = appointments.some(appt => 
    (appt.startTime <= startTime && appt.endTime > startTime) ||
    (appt.startTime < endTime && appt.endTime >= endTime) ||
    (startTime <= appt.startTime && endTime > appt.startTime)
  );
  
  return !hasOverlap;
}

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0, 0);
  
  let currentSlotStart = new Date(startDate);
  
  while (currentSlotStart < endDate) {
    const currentSlotEnd = new Date(currentSlotStart);
    currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + intervalMinutes);
    
    // Format times as HH:MM
    const formatTime = (date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    // Don't add slots that extend beyond the end time
    if (currentSlotEnd <= endDate) {
      slots.push({
        startTime: formatTime(currentSlotStart),
        endTime: formatTime(currentSlotEnd),
        displayTime: `${formatTime(currentSlotStart)} - ${formatTime(currentSlotEnd)}`
      });
    }
    
    // Move to next slot
    currentSlotStart = currentSlotEnd;
  }
  
  return slots;
} 
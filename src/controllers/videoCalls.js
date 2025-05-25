const VideoCall = require('../models/VideoCall');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// @desc    Initiate a video call
// @route   POST /api/v1/video-calls/initiate
// @access  Private (Patient and Doctor)
exports.initiateCall = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { appointmentId, recipientId } = req.body;
    
    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is part of this appointment
    if (
      appointment.patientId.toString() !== req.user.id &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to initiate calls for this appointment'
      });
    }
    
    // Check if receiver exists and is the other party in the appointment
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Call recipient not found'
      });
    }
    
    // Ensure recipient is the other party in the appointment
    if (
      appointment.patientId.toString() !== recipientId &&
      appointment.doctorId.toString() !== recipientId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Recipient must be the doctor or patient in this appointment'
      });
    }
    
    // Check if there's already an ongoing call for this appointment
    const existingCall = await VideoCall.findOne({
      appointmentId,
      status: { $in: ['initiated', 'ongoing'] }
    });
    
    if (existingCall) {
      return res.status(400).json({
        success: false,
        message: 'A call is already in progress for this appointment',
        data: existingCall
      });
    }
    
    // Generate a unique room ID for the call
    const roomId = uuidv4();
    
    // Create the video call record
    const videoCall = await VideoCall.create({
      appointmentId,
      initiatorId: req.user.id,
      recipientId,
      status: 'initiated',
      startTime: new Date(),
      roomId
    });
    
    // Populate initiator info for the response
    const populatedCall = await VideoCall.findById(videoCall._id)
      .populate('initiatorId', 'fullName role')
      .populate('recipientId', 'fullName role');
    
    res.status(201).json({
      success: true,
      data: populatedCall
    });
    
    // Here you would typically emit a socket event for real-time notification
    // eg: io.to(recipientId).emit('incoming_call', populatedCall);
    
  } catch (err) {
    next(err);
  }
};

// @desc    Answer a video call
// @route   PUT /api/v1/video-calls/:id/answer
// @access  Private (Call recipient only)
exports.answerCall = async (req, res, next) => {
  try {
    const callId = req.params.id;
    
    // Get the call
    const call = await VideoCall.findById(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }
    
    // Check if user is the call recipient
    if (call.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to answer this call'
      });
    }
    
    // Check if call is in a valid state to be answered
    if (call.status !== 'initiated') {
      return res.status(400).json({
        success: false,
        message: `Call cannot be answered (current status: ${call.status})`
      });
    }
    
    // Update call status
    call.status = 'ongoing';
    await call.save();
    
    // Populate call info for the response
    const populatedCall = await VideoCall.findById(call._id)
      .populate('initiatorId', 'fullName role')
      .populate('recipientId', 'fullName role');
    
    res.status(200).json({
      success: true,
      data: populatedCall
    });
    
    // Here you would typically emit a socket event
    // eg: io.to(populatedCall.initiatorId._id).emit('call_answered', populatedCall);
    
  } catch (err) {
    next(err);
  }
};

// @desc    End a video call
// @route   PUT /api/v1/video-calls/:id/end
// @access  Private (Call participants only)
exports.endCall = async (req, res, next) => {
  try {
    const callId = req.params.id;
    
    // Get the call
    const call = await VideoCall.findById(callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }
    
    // Check if user is a participant in the call
    if (
      call.initiatorId.toString() !== req.user.id &&
      call.recipientId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this call'
      });
    }
    
    // Check if call is in a valid state to be ended
    if (call.status !== 'initiated' && call.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: `Call is already ended (current status: ${call.status})`
      });
    }
    
    // Update call status and details
    const endTime = new Date();
    call.status = 'completed';
    call.endTime = endTime;
    
    // Calculate duration if the call was answered
    if (call.startTime) {
      const durationMs = endTime - call.startTime;
      call.duration = Math.round(durationMs / 1000); // Convert to seconds
    }
    
    await call.save();
    
    const populatedCall = await VideoCall.findById(call._id)
      .populate('initiatorId', 'fullName role')
      .populate('recipientId', 'fullName role');
    
    res.status(200).json({
      success: true,
      data: populatedCall
    });
    
    // Here you would emit a socket event to notify the other participant
    // const otherParticipantId = req.user.id === call.initiatorId.toString() 
    //   ? call.recipientId 
    //   : call.initiatorId;
    // io.to(otherParticipantId).emit('call_ended', populatedCall);
    
  } catch (err) {
    next(err);
  }
};

// @desc    Get call history for an appointment
// @route   GET /api/v1/video-calls/appointment/:appointmentId
// @access  Private (Appointment participants only)
exports.getCallHistory = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is part of this appointment
    if (
      appointment.patientId.toString() !== req.user.id &&
      appointment.doctorId.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view call history for this appointment'
      });
    }
    
    // Get call history
    const calls = await VideoCall.find({ appointmentId })
      .sort({ createdAt: -1 })
      .populate('initiatorId', 'fullName role')
      .populate('recipientId', 'fullName role');
    
    res.status(200).json({
      success: true,
      count: calls.length,
      data: calls
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active call for an appointment
// @route   GET /api/v1/video-calls/active/:appointmentId
// @access  Private (Appointment participants only)
exports.getActiveCall = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is part of this appointment
    if (
      appointment.patientId.toString() !== req.user.id &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view calls for this appointment'
      });
    }
    
    // Find active call
    const activeCall = await VideoCall.findOne({
      appointmentId,
      status: { $in: ['initiated', 'ongoing'] }
    }).populate('initiatorId', 'fullName role')
      .populate('recipientId', 'fullName role');
    
    if (!activeCall) {
      return res.status(404).json({
        success: false,
        message: 'No active call found for this appointment'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activeCall
    });
  } catch (err) {
    next(err);
  }
}; 
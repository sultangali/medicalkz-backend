const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get messages for an appointment
// @route   GET /api/v1/messages/appointment/:appointmentId
// @access  Private (Patient and Doctor involved in the appointment)
exports.getMessages = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // Check if appointment exists and user is authorized
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
        message: 'Not authorized to view these messages'
      });
    }
    
    // Get messages for this appointment
    const messages = await Message.find({ appointmentId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'fullName role');
    
    // Mark all messages as read if the user is receiving them
    if (messages.length > 0) {
      await Message.updateMany(
        { 
          appointmentId,
          receiverId: req.user.id,
          isRead: false
        },
        { isRead: true }
      );
    }
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message
// @route   POST /api/v1/messages
// @access  Private (Patient and Doctor)
exports.sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { appointmentId, receiverId, content, attachments = [] } = req.body;
    
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
        message: 'Not authorized to send messages for this appointment'
      });
    }
    
    // Check if receiver exists and is the other party in the appointment
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    
    // Ensure receiver is the other party in the appointment
    if (
      appointment.patientId.toString() !== receiverId &&
      appointment.doctorId.toString() !== receiverId
    ) {
      return res.status(400).json({
        success: false,
        message: 'Receiver must be the doctor or patient in this appointment'
      });
    }
    
    // Create message
    const message = await Message.create({
      appointmentId,
      senderId: req.user.id,
      receiverId,
      content,
      attachments
    });
    
    // Populate sender info for the response
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'fullName role');
    
    res.status(201).json({
      success: true,
      data: populatedMessage
    });
    
    // Here you would typically emit a socket event for real-time messaging
    // eg: io.to(receiverId).emit('new_message', populatedMessage);
    
  } catch (err) {
    next(err);
  }
};

// @desc    Get unread message count
// @route   GET /api/v1/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload attachment for message
// @route   POST /api/v1/messages/attachment
// @access  Private
exports.uploadAttachment = async (req, res, next) => {
  try {
    // This would typically use a file upload service like S3 or local storage
    // For now, we'll just return a mock URL
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    
    const fileType = req.file.mimetype.split('/')[0];
    let attachmentType = 'document';
    
    switch (fileType) {
      case 'image':
        attachmentType = 'image';
        break;
      case 'audio':
        attachmentType = 'audio';
        break;
      case 'video':
        attachmentType = 'video';
        break;
      default:
        attachmentType = 'document';
    }
    
    // Mock result - in a real app this would be the URL to the uploaded file
    const attachment = {
      url: `https://medicalkz.com/uploads/${req.file.filename}`,
      type: attachmentType,
      name: req.file.originalname
    };
    
    res.status(200).json({
      success: true,
      data: attachment
    });
  } catch (err) {
    next(err);
  }
}; 
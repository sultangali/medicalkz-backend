const Note = require('../models/Note');
const User = require('../models/User');

/**
 * @desc    Get all notes for a patient
 * @route   GET /api/v1/patients/:patientId/notes
 * @access  Private (Doctor only)
 */
const getNotes = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.id;

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get notes for this patient from this doctor
    const notes = await Note.find({ 
      patientId, 
      doctorId 
    })
    .populate('doctorId', 'fullName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Create a new note for a patient
 * @route   POST /api/v1/patients/:patientId/notes
 * @access  Private (Doctor only)
 */
const createNote = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { category, content } = req.body;
    const doctorId = req.user.id;

    // Validate required fields
    if (!category || !content) {
      return res.status(400).json({
        success: false,
        message: 'Category and content are required'
      });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create note
    const note = await Note.create({
      patientId,
      doctorId,
      doctorName: req.user.fullName,
      category,
      content
    });

    // Populate doctor info
    await note.populate('doctorId', 'fullName');

    console.log('Note created successfully:', note._id);

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Get a specific note
 * @route   GET /api/v1/notes/:id
 * @access  Private (Doctor only)
 */
const getNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const doctorId = req.user.id;

    const note = await Note.findOne({ 
      _id: noteId, 
      doctorId 
    }).populate('doctorId', 'fullName');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Update a note
 * @route   PUT /api/v1/notes/:id
 * @access  Private (Doctor only)
 */
const updateNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const doctorId = req.user.id;
    const { category, content } = req.body;

    const note = await Note.findOne({ 
      _id: noteId, 
      doctorId 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Update fields
    if (category) note.category = category;
    if (content) note.content = content;
    note.updatedAt = new Date();

    await note.save();
    await note.populate('doctorId', 'fullName');

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/v1/notes/:id
 * @access  Private (Doctor only)
 */
const deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const doctorId = req.user.id;

    const note = await Note.findOne({ 
      _id: noteId, 
      doctorId 
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.findByIdAndDelete(noteId);

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
};

module.exports = {
  getNotes,
  createNote,
  getNote,
  updateNote,
  deleteNote
}; 
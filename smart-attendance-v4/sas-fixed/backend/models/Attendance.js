const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  department: { type: String, required: true },
  date: {
    type: String,
    required: true  // Format: YYYY-MM-DD
  },
  time: { type: String },
  confidence: { type: Number, default: 0 },
  markedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate attendance for the same student on the same day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ department: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);

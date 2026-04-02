const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students (without face descriptor for performance)
router.get('/', async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = { isActive: true };
    if (department) query.department = new RegExp(department, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { rollNumber: new RegExp(search, 'i') }
      ];
    }
    const students = await Student.find(query).select('-faceDescriptor').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all students WITH face descriptors (for face matching)
router.get('/with-descriptors', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true, 'faceDescriptor.0': { $exists: true } });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-faceDescriptor');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST register new student
router.post('/', async (req, res) => {
  try {
    const { name, rollNumber, department, mobile, faceDescriptor, photo } = req.body;

    if (!name || !rollNumber || !department || !mobile) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: `Roll number ${rollNumber} is already registered` });
    }

    const student = new Student({
      name: name.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      department: department.trim(),
      mobile: mobile.trim(),
      faceDescriptor: faceDescriptor || [],
      photo: photo || ''
    });

    await student.save();
    const savedStudent = student.toObject();
    delete savedStudent.faceDescriptor;
    res.status(201).json({ message: 'Student registered successfully!', student: savedStudent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  try {
    const { name, department, mobile, faceDescriptor, photo } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (department) updateData.department = department.trim();
    if (mobile) updateData.mobile = mobile.trim();
    if (faceDescriptor) updateData.faceDescriptor = faceDescriptor;
    if (photo) updateData.photo = photo;

    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-faceDescriptor');

    if (!updated) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student updated successfully', student: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /purge-inactive — removes all soft-deleted students and their attendance records
// Must be defined BEFORE /:id to avoid Express matching "purge-inactive" as an ID
router.delete('/purge-inactive', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const inactive = await Student.find({ isActive: false }).select('_id');
    const ids = inactive.map(s => s._id);
    await Attendance.deleteMany({ studentId: { $in: ids } });
    await Student.deleteMany({ isActive: false });
    res.json({ message: `Purged ${ids.length} inactive student(s) and their attendance records` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student (hard delete — also removes all their attendance records)
router.delete('/:id', async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    // Remove all attendance records belonging to this student
    await Attendance.deleteMany({ studentId: req.params.id });
    res.json({ message: 'Student and their attendance records removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

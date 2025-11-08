import Student from '../models/Student.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get student dashboard data
const getDashboardData = asyncHandler(async (req, res) => {
  const studentId = req.studentId;

  // Implementation would go here
  // This is just a template structure

  successResponse(res, {
    message: 'Dashboard data fetched successfully'
  });
});

// Update student profile
const updateProfile = asyncHandler(async (req, res) => {
  const studentId = req.studentId;
  const updateData = req.body;

  const student = await Student.findByIdAndUpdate(
    studentId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!student) {
    return errorResponse(res, 'Student not found', 404);
  }

  successResponse(res, student, 'Profile updated successfully');
});

export {
  getDashboardData,
  updateProfile
};
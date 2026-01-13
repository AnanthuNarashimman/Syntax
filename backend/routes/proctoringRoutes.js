const express = require('express');
const router = express.Router();
const proctoringController = require('../controllers/proctoringController');
const { requireStudentAuth, requireAdminAuth } = require('../middleware/authMiddleware');

// Student routes - log violations
router.post('/log-violation', requireStudentAuth, proctoringController.logViolation);

// Admin routes - view violations
router.get('/contest/:contestId/violations', requireAdminAuth, proctoringController.getContestViolations);
router.get('/student/:studentId/violations', requireAdminAuth, proctoringController.getStudentViolations);
router.get('/student/:studentId/contest/:contestId/violations', requireAdminAuth, proctoringController.getStudentViolations);

module.exports = router;

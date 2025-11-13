// /backend/routes/judgeRoutes.js
const express = require('express');
const router = express.Router();

const {
  handleRunCode,
  handleSubmitCode
} = require('../controllers/judgeController');

const { requireStudentAuth } = require('../middleware/authMiddleware');

// Public route - anyone can run code in the playground
router.post('/run', handleRunCode);

// Protected route - only authenticated students can submit for grading
router.post('/submit', requireStudentAuth, handleSubmitCode);

module.exports = router;
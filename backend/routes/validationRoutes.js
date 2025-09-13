const express = require("express");
const router = express.Router();
const validationController = require('../controllers/validationController');
const middleware = require('../middleware/authMiddleware');

router.post("/validate-quiz", middleware.requireStudentAuth, validationController.validateQuiz);

module.exports = router;
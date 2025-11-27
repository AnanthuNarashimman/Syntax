const express = require("express");
const router = express.Router();
const validationController = require('../controllers/validationController');
const middleware = require('../middleware/authMiddleware');

router.post("/validate-quiz", middleware.requireStudentAuth, validationController.validateQuiz);
router.post("/check-status", middleware.requireStudentAuth, validationController.checkStatus);
router.post("/start-event", middleware.requireStudentAuth, validationController.startEvent);
router.post("/event-result", middleware.requireStudentAuth, validationController.getResult);

module.exports = router;
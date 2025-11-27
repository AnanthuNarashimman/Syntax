const express = require("express");
const router = express.Router();

const middleware = require('../middleware/authMiddleware');
const eventController = require('../controllers/eventController');
const articleCounter = require('../controllers/articleController');
const studentController = require('../controllers/studentController');

router.get('/events', middleware.requireStudentAuth, eventController.fetchEvents);
router.get('/articles', middleware.requireStudentAuth, articleCounter.getStudentArticles);
router.post('/submit-contest', middleware.requireStudentAuth, studentController.submitContest);

module.exports = router;

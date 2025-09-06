const express = require("express");
const router = express.Router();

const middleware = require('../middleware/authMiddleware');
const eventController = require('../controllers/eventController');
const articleCounter = require('../controllers/articleController');

router.get('/events', middleware.requireStudentAuth, eventController.fetchEvents);
router.get('/articles', middleware.requireStudentAuth, articleCounter.getStudentArticles);

module.exports = router;

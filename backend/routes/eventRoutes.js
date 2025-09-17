const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const articleController = require("../controllers/articleController");
const middleware = require("../middleware/authMiddleware");

// Contest Routes
router.post(
  "/admin/create-contest",
  middleware.requireAdminAuth,
  eventController.createContest
);
router.get(
  "/admin/events",
  middleware.requireAdminAuth,
  eventController.fetchAdminEvents
);
router.get(
  "/admin/events/:eventId",
  middleware.requireAdminAuth,
  eventController.fetchEvent
);
router.put(
  "/admin/events/:eventId",
  middleware.requireAdminAuth,
  eventController.updateContest
);
router.get(
  "/events/:eventId/results",
  middleware.requireAdminAuth,
  eventController.getEventResults
);

// Article Routes
router.post(
  "/articles",
  middleware.requireAdminAuth,
  articleController.createArticle
);
router.get(
  "/articles",
  middleware.requireAdminAuth,
  articleController.getAdminArticles
);

module.exports = router;

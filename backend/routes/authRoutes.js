const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Login Routes
router.post("/admin-login", authController.adminLogin);
router.post("/student-login", authController.studentLogin);
router.post("/super-login", authController.superAdminLogin);

// Logout routes
router.post("/logout", authController.logout);

module.exports = router;
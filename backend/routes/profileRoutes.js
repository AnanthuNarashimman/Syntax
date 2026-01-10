const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const middleware = require("../middleware/authMiddleware");

// Profile Fetching Routes
router.get('/user/profile', middleware.requireAdminAuth, profileController.adminProfile);
router.get('/student/profile', middleware.requireStudentAuth, profileController.studentProfile);
router.get('/super-admin/profile', middleware.requireSuperAdminAuth, profileController.superProfile);

// Profile Updating Routes
router.put('/student/profile/skills', middleware.requireStudentAuth, profileController.studentSkillsUpdate);
router.put('/student/profile/username', middleware.requireStudentAuth, profileController.studentNameUpdate);

// Password verification and updation routes
router.put('/student/profile/password', middleware.requireStudentAuth, profileController.studentProfileUpdate);
router.post('/verify/pass-verify', profileController.adminPasswordVerify);
router.post('/update/pass-update', profileController.AdminPasswordUpdate);

// Student data fetching routes
router.get('/student/profile/submissions', middleware.requireStudentAuth, profileController.getSubmissionDetails);
router.get('/student/profile/progress',middleware.requireStudentAuth, profileController.getStudentProgressData); 
router.get('/students/profile/leaderboard',middleware.requireStudentAuth, profileController.getLeaderboard);

module.exports = router;


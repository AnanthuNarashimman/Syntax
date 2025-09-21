const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const middleware = require("../middleware/authMiddleware");

// Profile Fetching Routes
router.get('/user/profile', profileController.adminProfile);
router.get('/student/profile', middleware.requireStudentAuth, profileController.studentProfile);
router.get('/super-admin/profile', middleware.requireSuperAdminAuth, profileController.superProfile);


// Profile Updating and Verifying Routes
router.put('/student/profile/skills', middleware.requireStudentAuth, profileController.studentSkillsUpdate);
router.put('/student/profile/username', middleware.requireStudentAuth, profileController.studentNameUpdate);
router.put('/student/profile/password', middleware.requireStudentAuth, profileController.adminPasswordUpdate);
router.post('/verify/pass-verify', profileController.adminPasswordVerify);
router.post('/update/pass-update', profileController.adminPasswordUpdate);


router.get('/student/profile/submissions', middleware.requireStudentAuth, profileController.getSubmissionDetails);
router.get('/student/profile/progress',middleware.requireStudentAuth, profileController.getStudentProgressData); 
router.get('/students/profile/leaderboard',middleware.requireStudentAuth, profileController.getLeaderboard);

module.exports = router;


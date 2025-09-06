const express = require("express");
const router = express.Router();

const middleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const eventController = require('../controllers/eventController');

// Super Admin routes for managing admins
router.get('/admins', middleware.requireSuperAdminAuth, adminController.getAdmins);
router.post('/admins', middleware.requireSuperAdminAuth, adminController.createAdmin);
router.put('/admins/:adminId', middleware.requireSuperAdminAuth, adminController.updateAdmin);
router.delete('/admins/:adminId', middleware.requireSuperAdminAuth, adminController.deleteAdmin);

// Super Admin routes for managing contests
router.get('/contests', middleware.requireSuperAdminAuth, eventController.fetchSuperEvent);
router.delete('/contests/:contestId', middleware.requireSuperAdminAuth, eventController.deleteSuperEvent);


module.exports = router
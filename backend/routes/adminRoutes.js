const express = require("express");
const router = express.Router();
const multer = require('multer');

const middleware = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/students', middleware.requireAdminAuth, studentController.addStudent);
router.get('/students', middleware.requireAdminAuth, studentController.fetchStudents);
router.delete('/students/:studentId', middleware.requireAdminAuth, studentController.deleteStudent);
router.put('/students/:studentId/ban', middleware.requireAdminAuth, studentController.banStudent);
router.post('/students/bulk-import', middleware.requireAdminAuth, upload.single("file"), studentController.bulkStudentAdd);

module.exports = router;
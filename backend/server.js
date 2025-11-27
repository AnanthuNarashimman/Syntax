const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const XLSX = require("xlsx");


// Express App Setup and Middleware Configuration
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

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


const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const profileRoutes = require('./routes/profileRoutes');
const studentRoutes = require('./routes/studentRoutes');
const superRoutes = require('./routes/superRoutes');
const validationRoutes = require('./routes/validationRoutes');
const judgeRoutes = require('./routes/judgeRoutes');


app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/super-admin', superRoutes);
app.use('/api/student', validationRoutes);
app.use('/api/judge', judgeRoutes);


// Starting up Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access your API at http://localhost:${PORT}`);
  console.log(
    `Current time (IST): ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`
  );
  console.log("\n--- IMPORTANT CHECKLIST ---");
  console.log(
    "1. Ensure your Firebase `serviceAccountKey.json` is correctly placed or configured."
  );
  console.log(
    "2. Ensure your `.env` file is present and correctly configured with `JWT_SECRET` AND `FRONTEND_URL`."
  );
  console.log(
    "3. Ensure your Firestore `users` collection has test admin/student data with `hashedPassword` and `isAdmin` flags (`isAdmin: true`)."
  );
  console.log(
    "4. Remember to configure your FRONTEND DEVELOPMENT PROXY if your frontend is not on the same port!"
  );
});
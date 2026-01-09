const { db, admin } = require("../config/firebase");
const passwordUtils = require("../utils/passwordUtil");
const cache = require('../utils/cache');
const XLSX = require('xlsx');

const addStudent = async(req, res) => {
    try {
        const { name, email, department, year, section, semester, batch } =
          req.body;
    
        if (
          !name ||
          !email ||
          !department ||
          !year ||
          !section ||
          !semester ||
          !batch
        ) {
          return res.status(400).json({
            message:
              "All fields (name, email, department, year, section, semester, batch) are required.",
          });
        }
    
        // Check for duplicate email
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("email", "==", email).limit(1).get();
        if (!snapshot.empty) {
          return res.status(409).json({
            message: "A user with this email already exists.",
          });
        }
    
        // Generate custom password in format "Name@YearSection"
        const customPassword = `${name.replace(/\s/g, "")}@${year}${section}`;
        console.log(customPassword);
    
        // Hash the custom password
        const hashedPassword = await passwordUtils.hashPasswords(customPassword);
    
        // Create new student
        const newStudent = {
          userName: name,
          email,
          department,
          year: parseInt(year),
          section,
          semester: parseInt(semester),
          batch,
          hashedPassword: hashedPassword, // Store the hashed password
          isStudent: true,
          isAdmin: false,
          isSuper: false,
          status: "active",
          contestsParticipated: 0,
          totalScore: 0,
          joinDate: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
    
        const docRef = await usersRef.add(newStudent);
        res.status(201).json({
          message: "Student added successfully!",
          id: docRef.id,
          student: {
            id: docRef.id,
            ...newStudent,
            joinDate: new Date().toISOString(),
          },
          generatedPassword: customPassword, // Return the generated password for admin reference
        });
      } catch (error) {
        console.error("Error adding student:", error);
        res
          .status(500)
          .json({ message: "Failed to add student.", error: error.message });
      }
}


const fetchStudents = async(req, res) => {
    try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get total count of students
    const totalSnapshot = await db
      .collection("users")
      .where("isStudent", "==", true)
      .get();
    const total = totalSnapshot.size;

    // Get paginated students
    const snapshot = await db
      .collection("users")
      .where("isStudent", "==", true)
      .offset(offset)
      .limit(limit)
      .get();

    const students = [];
    snapshot.forEach((doc) => {
      const studentData = doc.data();
      students.push({
        id: doc.id,
        name: studentData.userName,
        email: studentData.email,
        department: studentData.department,
        year: studentData.year,
        section: studentData.section,
        semester: studentData.semester,
        batch: studentData.batch,
        status: studentData.status || "active",
        banReason: studentData.banReason || null,
        contestsParticipated: studentData.contestsParticipated || 0,
        totalScore: studentData.totalScore || 0,
        joinDate: studentData.joinDate
          ? studentData.joinDate.toDate().toISOString()
          : new Date().toISOString(),
        lastActive: studentData.lastActive || "Recently",
        achievements: studentData.achievements || [],
      });
    });

    res.status(200).json({
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch students.", error: error.message });
  }
}

const deleteStudent = async(req, res) => {
    try {
      const { studentId } = req.params;

      const studentRef = db.collection("users").doc(studentId);
      const studentDoc = await studentRef.get();

      if (!studentDoc.exists) {
        return res.status(404).json({ message: "Student not found." });
      }

      const studentData = studentDoc.data();
      if (!studentData.isStudent) {
        return res.status(400).json({ message: "This user is not a student." });
      }

      await studentRef.delete();
      res.status(200).json({ message: "Student deleted successfully." });
    } catch (error) {
      console.error("Error deleting student:", error);
      res
        .status(500)
        .json({ message: "Failed to delete student.", error: error.message });
    }
}

const banStudent = async(req, res) => {
    try {
          const { studentId } = req.params;
          const { reason } = req.body;

          if (!reason || reason.trim() === "") {
            return res.status(400).json({ message: "Ban reason is required." });
          }

          const studentRef = db.collection("users").doc(studentId);
          const studentDoc = await studentRef.get();

          if (!studentDoc.exists) {
            return res.status(404).json({ message: "Student not found." });
          }

          const studentData = studentDoc.data();
          if (!studentData.isStudent) {
            return res.status(400).json({ message: "This user is not a student." });
          }

          await studentRef.update({
            status: "banned",
            banReason: reason,
            bannedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).json({ message: "Student banned successfully." });
        } catch (error) {
          console.error("Error banning student:", error);
          res
            .status(500)
            .json({ message: "Failed to ban student.", error: error.message });
        }
}

const unbanStudent = async(req, res) => {
    try {
          const { studentId } = req.params;

          const studentRef = db.collection("users").doc(studentId);
          const studentDoc = await studentRef.get();

          if (!studentDoc.exists) {
            return res.status(404).json({ message: "Student not found." });
          }

          const studentData = studentDoc.data();
          if (!studentData.isStudent) {
            return res.status(400).json({ message: "This user is not a student." });
          }

          if (studentData.status !== "banned") {
            return res.status(400).json({ message: "Student is not currently banned." });
          }

          await studentRef.update({
            status: "active",
            banReason: admin.firestore.FieldValue.delete(),
            bannedAt: admin.firestore.FieldValue.delete(),
            unbannedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.status(200).json({ message: "Student unbanned successfully." });
        } catch (error) {
          console.error("Error unbanning student:", error);
          res
            .status(500)
            .json({ message: "Failed to unban student.", error: error.message });
        }
}

const bulkStudentAdd = async(req, res) => {
    try {
      console.log('=== BULK STUDENT IMPORT STARTED ===');
      console.log('Request file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
      
      // Validate file upload
      if (!req.file) {
        console.log('ERROR: No file uploaded');
        return res.status(400).json({
          success: false,
          message: "No file uploaded."
        });
      }

      console.log('Parsing Excel file...');
      // Parse the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Parsed ${data.length} rows from Excel`);

      if (data.length === 0) {
        console.log('ERROR: Excel file is empty');
        return res.status(400).json({
          success: false,
          message: "Excel file is empty or has no data."
        });
      }

      // Validate required columns
      const requiredColumns = [
        "Name",
        "Email",
        "Department", 
        "Year",
        "Section",
        "Semester",
        "Batch",
      ];
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(
        (col) => !(col in firstRow)
      );

      if (missingColumns.length > 0) {
        console.log('ERROR: Missing columns:', missingColumns);
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingColumns.join(", ")}. Please ensure your Excel file has all required columns.`
        });
      }

      console.log('All required columns found. Processing rows...');

      const usersRef = db.collection("users");
      const importedStudents = [];
      const criticalErrors = []; // Missing data, invalid format
      const duplicateErrors = []; // Duplicate emails

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

        try {
          // Validate required fields
          if (
            !row.Name ||
            !row.Email ||
            !row.Department ||
            !row.Year ||
            !row.Section ||
            !row.Semester ||
            !row.Batch
          ) {
            criticalErrors.push(`Row ${rowNumber}: Missing required fields`);
            console.log(`Row ${rowNumber}: Missing required fields`);
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.Email)) {
            criticalErrors.push(`Row ${rowNumber}: Invalid email format - ${row.Email}`);
            console.log(`Row ${rowNumber}: Invalid email format - ${row.Email}`);
            continue;
          }

          // Check if email already exists
          const existingUser = await usersRef
            .where("email", "==", row.Email.trim().toLowerCase())
            .limit(1)
            .get();
          if (!existingUser.empty) {
            duplicateErrors.push({ row: rowNumber, email: row.Email.trim(), name: row.Name.trim() });
            console.log(`Row ${rowNumber}: Email ${row.Email} already exists`);
            continue;
          }

          // Generate custom password in format "Name@YearBatch"
          const customPassword = `${row.Name.trim()}@${row.Year.toString().trim()}${row.Batch.trim()}`;

          // Hash the custom password
          const hashedPassword = await passwordUtils.hashPasswords(customPassword);

          // Create student document
          const studentData = {
            userName: row.Name.trim(),
            email: row.Email.trim().toLowerCase(),
            department: row.Department.trim(),
            year: parseInt(row.Year.toString().trim()),
            section: row.Section.trim(),
            semester: parseInt(row.Semester.toString().trim()),
            batch: row.Batch.trim(),
            hashedPassword: hashedPassword,
            isStudent: true,
            isAdmin: false,
            isSuper: false,
            status: "active",
            contestsParticipated: 0,
            totalScore: 0,
            lastActive: "Never",
            joinDate: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          console.log(`Row ${rowNumber}: Adding student ${row.Name} (${row.Email})`);
          const docRef = await usersRef.add(studentData);
          console.log(`Row ${rowNumber}: Successfully added with ID ${docRef.id}`);
          
          importedStudents.push({
            id: docRef.id,
            ...studentData,
          });
        } catch (error) {
          console.error(`Row ${rowNumber}: Error - ${error.message}`);
          criticalErrors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      console.log(`=== BULK IMPORT COMPLETED ===`);
      console.log(`Imported: ${importedStudents.length}/${data.length} students`);
      console.log(`Critical Errors: ${criticalErrors.length}`);
      console.log(`Duplicate Errors: ${duplicateErrors.length}`);

      // If there are critical errors and no students imported, return error
      if (criticalErrors.length > 0 && importedStudents.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Import failed due to data validation errors. Please fix the errors in your Excel file and try again.',
          data: {
            criticalErrors: criticalErrors,
            duplicates: duplicateErrors
          }
        });
      }

      // Structure response
      const response = {
        success: true,
        message: `Successfully imported ${importedStudents.length} student${importedStudents.length !== 1 ? 's' : ''}.`,
        data: {
          importedCount: importedStudents.length,
          totalRows: data.length,
          criticalErrors: criticalErrors,
          duplicates: duplicateErrors,
          importedStudents: importedStudents
        }
      };

      if (criticalErrors.length > 0) {
        response.message += ` ${criticalErrors.length} row${criticalErrors.length !== 1 ? 's' : ''} had validation errors.`;
      }
      
      if (duplicateErrors.length > 0) {
        response.hasDuplicates = true;
      }

      res.status(200).json(response);

    } catch (error) {
      console.error("Error during bulk import:", error);
      res.status(500).json({
        success: false,
        message: "Failed to import students.",
        error: error.message
      });
    }
}


// Submit contest solution
const submitContest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      contestId,
      problemId,
      code,
      language,
      testResults,
      score,
      totalTests,
      passedTests,
      submittedAt
    } = req.body;

    // Validate required fields
    if (!contestId || !problemId || !code || !language || !testResults) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get user data
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userData = userDoc.data();

    // Create submission record in eventAttempts collection
    const submissionData = {
      userId,
      userName: userData.userName || "Unknown",
      userEmail: userData.email || "",
      eventId: contestId,
      problemId,
      code,
      language,
      testResults,
      score: score || 0,
      totalTests: totalTests || 0,
      passedTests: passedTests || 0,
      submittedAt: submittedAt || new Date().toISOString(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const attemptRef = await db.collection("eventAttempts").add(submissionData);

    // Update or create eventResults entry for leaderboard
    const resultsQuery = await db.collection("eventResults")
      .where("userId", "==", userId)
      .where("eventId", "==", contestId)
      .limit(1)
      .get();

    if (resultsQuery.empty) {
      // Create new result entry
      await db.collection("eventResults").add({
        userId,
        eventId: contestId,
        points: score || 0,
        submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Update existing entry if new score is higher
      const resultDoc = resultsQuery.docs[0];
      const currentPoints = resultDoc.data().points || 0;

      if (score > currentPoints) {
        await resultDoc.ref.update({
          points: score,
          submittedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Update user stats if all tests passed
    if (score > 0) {
      await userRef.update({
        totalScore: admin.firestore.FieldValue.increment(score),
        lastActive: new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // OPTIMIZED: Invalidate leaderboard cache after score update
      cache.delete('leaderboard:top20');
    }

    res.status(200).json({
      success: true,
      message: "Submission recorded successfully",
      submissionId: attemptRef.id,
      score: score || 0
    });

  } catch (error) {
    console.error("Error submitting contest:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit contest",
      error: error.message
    });
  }
};

module.exports = {
  addStudent,
  fetchStudents,
  deleteStudent,
  banStudent,
  unbanStudent,
  bulkStudentAdd,
  submitContest
}
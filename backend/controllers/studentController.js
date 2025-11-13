const { db, admin } = require("../config/firebase");
const passwordUtils = require("../utils/passwordUtil");

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
    const snapshot = await db
      .collection("users")
      .where("isStudent", "==", true)
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
        contestsParticipated: studentData.contestsParticipated || 0,
        totalScore: studentData.totalScore || 0,
        joinDate: studentData.joinDate
          ? studentData.joinDate.toDate().toISOString()
          : new Date().toISOString(),
        lastActive: studentData.lastActive || "Recently",
        achievements: studentData.achievements || [],
      });
    });
    res.status(200).json({ students });
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

const bulkStudentAdd = async(req, res) => {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded."
        });
      }

      // Parse the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
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
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingColumns.join(", ")}. Please ensure your Excel file has all required columns.`
        });
      }

      const usersRef = db.collection("users");
      const importedStudents = [];
      const errors = [];

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
            errors.push(`Row ${rowNumber}: Missing required fields`);
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.Email)) {
            errors.push(`Row ${rowNumber}: Invalid email format`);
            continue;
          }

          // Check if email already exists
          const existingUser = await usersRef
            .where("email", "==", row.Email)
            .limit(1)
            .get();
          if (!existingUser.empty) {
            errors.push(`Row ${rowNumber}: Email ${row.Email} already exists`);
            continue;
          }

          // Generate custom password in format "Name@YearBatch"
          const customPassword = `${row.Name.trim()}@${row.Year.toString().trim()}${row.Batch.trim()}`;

          // Hash the custom password
          const hashedPassword = await hashPassword(customPassword);

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

          const docRef = await usersRef.add(studentData);
          importedStudents.push({
            id: docRef.id,
            ...studentData,
          });
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      // Structure response
      const response = {
        success: true,
        message: `Bulk import completed. ${importedStudents.length} students imported successfully.`,
        data: {
          importedCount: importedStudents.length,
          totalRows: data.length,
          errors: errors,
          importedStudents: importedStudents
        }
      };

      if (errors.length > 0) {
        response.message += ` ${errors.length} rows had errors.`;
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
  bulkStudentAdd,
  submitContest
}
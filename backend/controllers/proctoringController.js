const { db, admin } = require("../config/firebase");

// Log a proctoring violation
// 1) Gets contest ID, violation type, and count from request
// 2) Gets student ID from authenticated user
// 3) Stores violation in a single document per user-event using transaction
// 4) Returns success response
// 5) In case of errors or exceptions, appropriate logs are made
const logViolation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { contestId, violationType, violationCount, timestamp } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    if (!contestId || !violationType || violationCount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: contestId, violationType, violationCount"
      });
    }

    // Get user details (outside transaction for efficiency)
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Document ID: userId_contestId (one document per user-contest pair)
    const docId = `${userId}_${contestId}`;
    const docRef = db.collection("proctoringLogs").doc(docId);

    // Use transaction to safely handle concurrent writes
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);

      const violationEntry = {
        type: violationType,
        count: violationCount,
        timestamp: timestamp || new Date().toISOString(),
        userAgent: req.headers['user-agent'] || "Unknown",
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown"
      };

      if (doc.exists) {
        // Document exists - append to violations array
        const currentData = doc.data();
        const violations = currentData.violations || [];
        violations.push(violationEntry);

        transaction.update(docRef, {
          totalViolations: violations.length,
          violations: violations,
          lastViolationType: violationType,
          lastViolationAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Document doesn't exist - create new document
        transaction.set(docRef, {
          userId,
          userName: userData.userName || "Unknown",
          userEmail: userData.email || "",
          contestId,
          totalViolations: 1,
          violations: [violationEntry],
          lastViolationType: violationType,
          lastViolationAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    // Also update summary in the contest result document
    const contestResultRef = db.collection("users")
      .doc(userId)
      .collection("contestResults")
      .doc(contestId);

    const contestResultDoc = await contestResultRef.get();

    if (contestResultDoc.exists) {
      await contestResultRef.update({
        proctoringViolations: admin.firestore.FieldValue.increment(1),
        lastViolationType: violationType,
        lastViolationAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await contestResultRef.set({
        proctoringViolations: 1,
        lastViolationType: violationType,
        lastViolationAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log(`📝 Proctoring violation logged: ${violationType} (${violationCount}) - User: ${userId}, Contest: ${contestId}`);

    res.status(200).json({
      success: true,
      message: "Violation logged successfully"
    });

  } catch (error) {
    console.error("Error logging proctoring violation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log violation",
      error: error.message
    });
  }
};

// Get proctoring violations for a contest (Admin only)
// 1) Gets contest ID from request
// 2) Fetches all violation documents for that contest
// 3) Returns violation logs grouped by student with detailed violation arrays
// 4) In case of errors or exceptions, appropriate logs are made
const getContestViolations = async (req, res) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: "Contest ID is required"
      });
    }

    // Fetch all violation documents for this contest
    const violationsSnapshot = await db
      .collection("proctoringLogs")
      .where("contestId", "==", contestId)
      .get();

    if (violationsSnapshot.empty) {
      return res.status(200).json({
        success: true,
        contestId,
        totalViolations: 0,
        totalStudents: 0,
        violationsByUser: []
      });
    }

    const violationsByUser = [];
    let totalViolationCount = 0;

    violationsSnapshot.forEach(doc => {
      const data = doc.data();
      totalViolationCount += data.totalViolations || 0;

      violationsByUser.push({
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        totalViolations: data.totalViolations,
        lastViolationType: data.lastViolationType,
        lastViolationAt: data.lastViolationAt,
        violations: data.violations || []
      });
    });

    res.status(200).json({
      success: true,
      contestId,
      totalViolations: totalViolationCount,
      totalStudents: violationsByUser.length,
      violationsByUser
    });

  } catch (error) {
    console.error("Error fetching proctoring violations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch violations",
      error: error.message
    });
  }
};

// Get proctoring violations for a specific student (Admin only)
// 1) Gets student ID and optional contest ID from request
// 2) Fetches violation documents for that student
// 3) Returns violation logs with detailed violation arrays
// 4) In case of errors or exceptions, appropriate logs are made
const getStudentViolations = async (req, res) => {
  try {
    const { studentId, contestId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required"
      });
    }

    let violationsData = [];

    if (contestId) {
      // Get specific contest violations for this student
      const docId = `${studentId}_${contestId}`;
      const docRef = db.collection("proctoringLogs").doc(docId);
      const doc = await docRef.get();

      if (doc.exists) {
        violationsData.push({
          id: doc.id,
          ...doc.data()
        });
      }
    } else {
      // Get all violations for this student across all contests
      const query = db.collection("proctoringLogs").where("userId", "==", studentId);
      const violationsSnapshot = await query.get();

      violationsSnapshot.forEach(doc => {
        violationsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    // Calculate total violations across all contests
    const totalViolations = violationsData.reduce((sum, doc) => {
      return sum + (doc.totalViolations || 0);
    }, 0);

    res.status(200).json({
      success: true,
      studentId,
      contestId: contestId || "all",
      totalViolations,
      totalContests: violationsData.length,
      violations: violationsData
    });

  } catch (error) {
    console.error("Error fetching student violations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student violations",
      error: error.message
    });
  }
};

module.exports = {
  logViolation,
  getContestViolations,
  getStudentViolations
};

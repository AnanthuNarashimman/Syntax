const { db, admin } = require("../config/firebase");

// Log a proctoring violation
// 1) Gets contest ID, violation type, and count from request
// 2) Gets student ID from authenticated user
// 3) Stores violation log in Firestore
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

    // Get user details
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Create proctoring log entry
    const violationLog = {
      userId,
      userName: userData.userName || "Unknown",
      userEmail: userData.email || "",
      contestId,
      violationType,
      violationCount,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'] || "Unknown",
      ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Store in Firestore
    await db.collection("proctoringLogs").add(violationLog);

    // Also update a summary in the contest result document
    const contestResultRef = db.collection("users")
      .doc(userId)
      .collection("contestResults")
      .doc(contestId);

    const contestResultDoc = await contestResultRef.get();

    if (contestResultDoc.exists) {
      // Update existing result with violation count
      await contestResultRef.update({
        proctoringViolations: admin.firestore.FieldValue.increment(1),
        lastViolationType: violationType,
        lastViolationAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create summary document if it doesn't exist yet
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
// 2) Fetches all violation logs for that contest
// 3) Returns violation logs grouped by student
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

    // Fetch all violations for this contest
    const violationsSnapshot = await db
      .collection("proctoringLogs")
      .where("contestId", "==", contestId)
      .orderBy("createdAt", "desc")
      .get();

    const violations = [];
    violationsSnapshot.forEach(doc => {
      violations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Group by user
    const violationsByUser = violations.reduce((acc, violation) => {
      const userId = violation.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId: violation.userId,
          userName: violation.userName,
          userEmail: violation.userEmail,
          violations: []
        };
      }
      acc[userId].violations.push(violation);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      contestId,
      totalViolations: violations.length,
      violationsByUser: Object.values(violationsByUser)
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
// 1) Gets student ID and contest ID from request
// 2) Fetches all violation logs for that student in that contest
// 3) Returns violation logs
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

    let query = db.collection("proctoringLogs").where("userId", "==", studentId);

    if (contestId) {
      query = query.where("contestId", "==", contestId);
    }

    const violationsSnapshot = await query.orderBy("createdAt", "desc").get();

    const violations = [];
    violationsSnapshot.forEach(doc => {
      violations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json({
      success: true,
      studentId,
      contestId: contestId || "all",
      totalViolations: violations.length,
      violations
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

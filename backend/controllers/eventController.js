const eventService = require("../services/eventService");
const { db, admin } = require("../config/firebase");
const jwt = require("jsonwebtoken");
const cache = require("../utils/cache");

// Create contest (Quizzes (or) Coding contests)
// 1) Gets required data from request
// 2) Based on the type of contest (Quiz (or) Contest), corresponding services will be called
// 3) In case of errors or exceptions, appropriate logs will be printed
const createContest = async (req, res) => {
  try {
    const {
      contestTitle,
      contestDescription,
      duration,
      numberOfQuestions,
      questions,
      selectedLanguage,
      contestType,
      contestMode,
      topicsCovered,
      allowedDepartments,
    } = req.body;

    if (
      !contestTitle ||
      !contestDescription ||
      !duration ||
      !numberOfQuestions ||
      !contestType ||
      !contestMode ||
      !topicsCovered ||
      !allowedDepartments
    ) {
      return res.status(400).json({
        message:
          "Missing required contest setup fields: title, description, duration, number of questions, contest type, contest mode, topics covered, or allowed departments.",
      });
    }

    // For coding contests, selectedLanguage is required
    if (contestType === "contest" && !selectedLanguage) {
      return res.status(400).json({
        message: "Selected language is required for coding contests.",
      });
    }

    const parsedNumberOfQuestions = parseInt(numberOfQuestions);
    if (isNaN(parsedNumberOfQuestions) || parsedNumberOfQuestions <= 0) {
      return res
        .status(400)
        .json({ message: "Number of questions must be a positive integer." });
    }

    // Auto-calculate points based on contest type
    let pointsPerProgram;
    if (contestType === "quiz") {
      pointsPerProgram = 1; // Always 1 point per quiz question
    } else if (contestType === "contest") {
      pointsPerProgram = 100 / parsedNumberOfQuestions; // Distribute 100 points across all problems
    }

    console.log("Received contest data:", {
      contestTitle,
      contestDescription,
      contestType,
      contestMode,
      topicsCovered,
      allowedDepartments,
      numberOfQuestions: parsedNumberOfQuestions,
      pointsPerProgram, // Auto-calculated
      selectedLanguage,
    });

    // Handle different contest types
    if (contestType === "quiz") {
      // Handle Quiz Creation
      return await eventService.handleQuizCreation(req, res, {
        contestTitle,
        contestDescription,
        duration,
        numberOfQuestions: parsedNumberOfQuestions,
        pointsPerProgram,
        questions,
        contestType,
        contestMode,
        topicsCovered,
        allowedDepartments,
      });
    } else if (contestType === "contest") {
      // Handle Coding Contest Creation
      return await eventService.handleCodingContestCreation(req, res, {
        contestTitle,
        contestDescription,
        duration,
        numberOfQuestions: parsedNumberOfQuestions,
        pointsPerProgram,
        questions,
        selectedLanguage,
        contestType,
        contestMode,
        topicsCovered,
        allowedDepartments,
      });
    } else {
      return res.status(400).json({
        message: 'Invalid contest type. Must be either "quiz" or "contest".',
      });
    }
  } catch (error) {
    console.error("Error in create-contest route:", error);
    res.status(500).json({
      message: "Failed to create contest. Please check server logs.",
      error: error.message,
    });
  }
};


// Upddating contests before starting
// 1) Gets the eventID and the data to be updated from the request
// 2) Delete the createdBy, createdAt and id from the data to be updated as these always needs to be same
// 3) Checks if the event exists and is created by the requested user
// 4) Updates the data in firebase
// 5) In case of errors or exceptions appropriate logs are made
const updateContest = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.id;

    // Add updated timestamp
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if the event belongs to the authenticated admin
    const eventData = eventDoc.data();
    if (eventData.createdBy !== req.user.userId) {
      return res.status(403).json({
        message: "Access denied: You can only update events you created",
      });
    }

    await eventRef.update(updateData);

    res.status(200).json({
      message: "Event updated successfully!",
      eventId,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      message: "Failed to update event. Please try again.",
      error: error.message,
    });
  }
};

// Fetch Events for Admin Dashboard (Optimized with Parallel Participant Counting)
// 1) Gets the authenticated admin's user ID from the request (set by auth middleware)
// 2) Queries 'events' collection to fetch all events where 'createdBy' matches the admin's userId
// 3) Extracts event IDs from the fetched events to prepare for participant count queries
// 4) For each event, creates a parallel query to fetch participant counts from 'eventAttempts' collection:
//    - Queries eventAttempts where eventId matches
//    - Uses JavaScript Set to count UNIQUE participants (handles multiple submissions from same user)
//    - Returns object with eventId and participantCount
//    - Handles errors gracefully by returning 0 count if query fails
// 5) Uses Promise.all to execute all participant count queries in parallel (optimization for speed)
// 6) Creates a participantCountMap for O(1) lookup when merging data
// 7) Merges participant counts with event data by mapping through events and adding 'participants' field
// 8) Sorts events by 'createdAt' timestamp in descending order (newest events first)
//    - Handles multiple Firebase timestamp formats (toDate(), _seconds)
//    - Falls back to epoch (new Date(0)) if timestamp is missing
// 9) Returns success response with events array containing participant counts
// 10) In case of errors or exceptions, appropriate logs are printed and error response is sent
// Note: Parallel processing significantly improves performance when admin has many events
const fetchAdminEvents = async (req, res) => {
  try {
    const eventsSnapshot = await db
      .collection("events")
      .where("createdBy", "==", req.user.userId)
      .get();

    // console.log("Making firebase call from admin side.")

    const events = [];
    eventsSnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Get participant counts for all events
    const eventIds = events.map(event => event.id);
    const participantCountPromises = eventIds.map(async (eventId) => {
      try {
        const eventAttemptsSnapshot = await db
          .collection("eventAttempts")
          .where("eventId", "==", eventId)
          .get();
        
        // Count unique participants (by userId)
        const uniqueParticipants = new Set();
        eventAttemptsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userId) {
            uniqueParticipants.add(data.userId);
          }
        });
        
        return {
          eventId,
          participantCount: uniqueParticipants.size
        };
      } catch (error) {
        console.error(`Error fetching participants for event ${eventId}:`, error);
        return {
          eventId,
          participantCount: 0
        };
      }
    });

    const participantCounts = await Promise.all(participantCountPromises);
    
    // Create a map for quick lookup
    const participantCountMap = {};
    participantCounts.forEach(({ eventId, participantCount }) => {
      participantCountMap[eventId] = participantCount;
    });

    // Add participant counts to events
    const eventsWithParticipants = events.map(event => ({
      ...event,
      participants: participantCountMap[event.id] || 0
    }));

    // Sort events by createdAt in descending order (newest first)
    eventsWithParticipants.sort((a, b) => {
      const aTime =
        a.createdAt?.toDate?.() ||
        new Date(a.createdAt?._seconds * 1000) ||
        new Date(0);
      const bTime =
        b.createdAt?.toDate?.() ||
        new Date(b.createdAt?._seconds * 1000) ||
        new Date(0);
      return bTime - aTime;
    });

    res.status(200).json({
      message: "Events retrieved successfully!",
      events: eventsWithParticipants,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Failed to fetch events. Please try again.",
      error: error.message,
    });
  }
};

// Fetches all eligible events for a student
// 1) Collects events from firebase where the allowedDepartments matches the user department and has a status 'active'
// 2) Removes the correst answer from the results and sorts it based in upload time
// 3) Sends it back to the student
// 4) In case of errors or exceptions, appropriate logs are made
const fetchEvents = async (req, res) => {
  try {
    const eventsSnapShot = await db
      .collection("events")
      .where("allowedDepartments", "in", [
        req.user.department,
        "Any department",
      ])
      .where("status", "==", "active")
      .get();

    // console.log("Making firebase call from student side.")

    const events = [];

    eventsSnapShot.forEach((doc) => {
      const eventData = doc.data();

      if (eventData.questions && Array.isArray(eventData.questions)) {
        eventData.questions = eventData.questions.map((question) => {
          const { correctAnswer, ...questionWithoutAnswer } = question;
          return questionWithoutAnswer;
        });
      }

      events.push({
        id: doc.id,
        ...eventData,
      });
    });

    events.sort((a, b) => {
      const aTime =
        a.createdAt?.toDate?.() ||
        new Date(a.createdAt?._seconds * 1000) ||
        new Date(0);
      const bTime =
        b.createdAt?.toDate?.() ||
        new Date(b.createdAt?._seconds * 1000) ||
        new Date(0);
      return bTime - aTime;
    });

    res.status(200).json({
      message: "Events retrieved successfully!",
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      message: "Failed to fetch events. Please try again.",
      error: error.message,
    });
  }
};


// Fetch a single event with event ID
// 1) Gets event id from request
// 2) Find corresponsing event from firebase
// 3) Checks department restrictions and sends it back to the user
// 4) In case of errors or exceptions, appropriate logs are made
const fetchStudentEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        message: "Event ID is required",
      });
    }

    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const eventData = eventDoc.data();

    // Check if student's department is allowed
    const userDepartment = req.user.department;
    const allowedDepartments = eventData.allowedDepartments;

    if (
      allowedDepartments !== "Any department" &&
      allowedDepartments !== userDepartment
    ) {
      return res.status(403).json({
        message: "This event is not available for your department",
      });
    }

    // Remove correct answers from questions (for quizzes)
    if (eventData.questions && Array.isArray(eventData.questions)) {
      eventData.questions = eventData.questions.map((question) => {
        const { correctAnswer, ...questionWithoutAnswer } = question;
        return questionWithoutAnswer;
      });
    }

    // Remove hidden test cases from coding contest problems (security measure)
    // Students should not see hidden test case inputs/outputs
    // Server will validate submissions using backend Judge0 API
    if (eventData.problems && Array.isArray(eventData.problems)) {
      eventData.problems = eventData.problems.map((problem) => {
        const {
          hiddenTestCases,
          testCases, // Old format field
          ...safeProblem
        } = problem;

        return {
          ...safeProblem,
          // Only include count of hidden tests, not the actual test cases
          hiddenTestCount: hiddenTestCases?.length || testCases?.length || 0
        };
      });
    }

    res.status(200).json({
      message: "Event retrieved successfully!",
      event: {
        id: eventDoc.id,
        ...eventData,
      },
    });
  } catch (error) {
    console.error("Error fetching student event:", error);
    res.status(500).json({
      message: "Failed to fetch event. Please try again.",
      error: error.message,
    });
  }
};

// Specific events for admin 
// 1) Gets the user id from the request
// 2) Fetches events from 'events' collection with matching eventId
// 3) Checks if the user created it, if not neglects it
// 4) Returns back to the client
// 5) In case of errors or exceptions, appropriate logs are made
const fetchEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDoc = await db.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if the event belongs to the authenticated admin
    const eventData = eventDoc.data();
    if (eventData.createdBy !== req.user.userId) {
      return res.status(403).json({
        message: "Access denied: You can only view events you created",
      });
    }

    res.status(200).json({
      message: "Event retrieved successfully!",
      event: {
        id: eventDoc.id,
        ...eventData,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      message: "Failed to fetch event. Please try again.",
      error: error.message,
    });
  }
};

// Fethces all events (For super admins)
// 1) Fetches all datas from 'events' collection in descending order
// 2) Sends it back to the user
// 3) In case of errors or exceptions, appropriate logs are made
const fetchSuperEvent = async (req, res) => {
  try {
    const snapshot = await db
      .collection("events")
      .orderBy("createdAt", "desc")
      .get();

    // console.log("Making firebase call from super admin side");

    const contests = [];
    snapshot.forEach((doc) => {
      const contestData = doc.data();
      contests.push({
        id: doc.id,
        title: contestData.eventTitle,
        description: contestData.eventDescription,
        type: contestData.eventType,
        mode: contestData.eventMode,
        status: contestData.status,
        createdBy: contestData.createdBy,
        createdAt: contestData.createdAt,
        participants: contestData.participants?.length || 0,
      });
    });
    res.status(200).json({ contests });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch contests.", error: error.message });
  }
};

// Deletes an event (By super admin)
// 1) Gets the contest id from the request
// 2) Checks if the event exists
// 3) Deletes the event
// 4) In case of errors or exceptions appropriate logs are made
const deleteSuperEvent = async (req, res) => {
  try {
    const { contestId } = req.params;

    const contestRef = db.collection("events").doc(contestId);
    const contestDoc = await contestRef.get();

    if (!contestDoc.exists) {
      return res.status(404).json({ message: "Contest not found." });
    }

    await contestRef.delete();

    res.status(200).json({ message: "Contest deleted successfully!" });
  } catch (error) {
    console.error("Error deleting contest:", error);
    res
      .status(500)
      .json({ message: "Failed to delete contest.", error: error.message });
  }
};

// Get Event Results
// 1) Gets the event id from the request 
// 2) Calls 'fetchResultsForEvent' service
// 3) Handle response from service
// 4) Sends back response to the client
// 5) In case of errors or exceptions appropriate logs are made
const getEventResults = async (req, res) => {
  try {
    // Get the eventId from the URL parameters
    const { eventId } = req.params;

    // Call the service function to get the data from Firestore
    const results = await eventService.fetchResultsForEvent(eventId);

    // Handle case where no results are found
    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No results found for this event." });
    }

    // Send the results back as a JSON response
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching event results:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching results." });
  }
};


const finishContest = async (req, res) => {
    try {
        const { contestId, submissions, totalProblems, completedAt, submissionToken } = req.body;
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        // Decode JWT to get student ID
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }
        const decoded = jwt.verify(token, jwtSecret);
        const studentId = decoded.userId;

        if (!studentId || !contestId || !submissions || !Array.isArray(submissions)) {
            return res.status(400).json({
                message: "Invalid request. Missing required fields."
            });
        }

        console.log(`Processing contest finish for student ${studentId}, contest ${contestId}`);
        console.log(`Received ${submissions.length} submissions (already verified by backend)`);

        // CRITICAL: Check if this contest has already been submitted by this student
        // This prevents duplicate document creation from race conditions
        const existingResultRef = db.collection('users')
            .doc(studentId)
            .collection('contestResults')
            .doc(contestId);

        const existingResult = await existingResultRef.get();

        if (existingResult.exists) {
            const existingData = existingResult.data();
            console.log(`⚠️ Contest ${contestId} already submitted by student ${studentId}`);
            console.log(`Existing submission timestamp: ${existingData.completedAt || existingData.verifiedAt}`);

            // Check if submission token matches (if provided)
            if (submissionToken && existingData.submissionToken === submissionToken) {
                console.log('ℹ️ Exact duplicate request detected (same submission token) - returning existing result');
                return res.status(200).json({
                    success: true,
                    message: `Contest already submitted. Your score: ${existingData.totalScore}/${existingData.totalPossible}`,
                    totalScore: existingData.totalScore,
                    totalPossible: existingData.totalPossible,
                    problemsAttempted: existingData.problemsAttempted,
                    totalProblems: existingData.totalProblems,
                    duplicate: true
                });
            }

            // Different submission token or no token - this is a duplicate submission attempt
            return res.status(409).json({
                success: false,
                message: "Contest already submitted. Duplicate submission prevented.",
                existingScore: existingData.totalScore,
                existingPossible: existingData.totalPossible,
                submittedAt: existingData.completedAt || existingData.verifiedAt
            });
        }

        console.log(`✓ No existing submission found - proceeding with new submission`);

        // Fetch contest details
        const contestRef = db.collection('events').doc(contestId);
        const contestDoc = await contestRef.get();

        if (!contestDoc.exists) {
            return res.status(404).json({ message: "Contest not found" });
        }

        const contest = contestDoc.data();
        const problems = contest.problems || [];

        // Process verified submissions (already validated during submission via /api/judge/contest-submit)
        const results = [];
        let totalScore = 0;
        let totalPossible = 0;

        for (const submission of submissions) {
            const problemIndex = submission.problemIndex;
            console.log(`Processing submission for problem index: ${problemIndex}, pointsEarned: ${submission.pointsEarned}`);

            const problem = problems[problemIndex];

            if (!problem) {
                console.error(`❌ Problem at index ${problemIndex} not found in problems array (length: ${problems.length})`);
                continue;
            }

            const pointsEarned = submission.pointsEarned || 0;
            totalPossible += problem.points;
            totalScore += pointsEarned;

            console.log(`✓ Problem ${problemIndex + 1}: ${submission.passedTests}/${submission.totalTests} tests passed, Score: ${pointsEarned}/${problem.points}`);

            // Create result object, filtering out undefined values
            const resultData = {
                problemId: submission.problemId || problem.id || `problem_${problemIndex}`,
                problemCode: submission.problemCode || problem.code || '',
                problemTitle: submission.problemTitle || problem.title || 'Untitled Problem',
                language: submission.language || 'unknown',
                passedTests: submission.passedTests || 0,
                totalTests: submission.totalTests || 0,
                score: pointsEarned,
                maxScore: submission.maxPoints || problem.points,
                solved: submission.solved || false,
                timestamp: submission.timestamp || admin.firestore.FieldValue.serverTimestamp()
            };

            // Remove any remaining undefined values
            Object.keys(resultData).forEach(key => {
                if (resultData[key] === undefined) {
                    delete resultData[key];
                }
            });

            results.push(resultData);
        }

        console.log(`📊 Total Score Calculation: ${totalScore}/${totalPossible}`);

        // Store contest result in Firestore
        const contestResultRef = db.collection('users')
            .doc(studentId)
            .collection('contestResults')
            .doc(contestId);

        await contestResultRef.set({
            contestId,
            contestTitle: contest.eventTitle,
            studentId,
            totalScore: totalScore,
            totalPossible: totalPossible,
            problemsAttempted: submissions.length,
            totalProblems,
            submissions: results,
            completedAt: completedAt || admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            submissionToken: submissionToken || null // Store token for duplicate detection
        });

        // 1) Update user's total scores and contests participated
        let userName = 'Unknown';
        let department = 'Unknown';

        try {
            const userDocRef = db.collection("users").doc(studentId);
            const userSnapshot = await userDocRef.get();

            if (userSnapshot.exists) {
                const userData = userSnapshot.data();
                userName = userData.userName || 'Unknown';
                department = userData.department || 'Unknown';

                await userDocRef.update({
                    totalScore: admin.firestore.FieldValue.increment(totalScore),
                    contestsParticipated: admin.firestore.FieldValue.increment(1)
                });

                console.log(`✓ Updated user ${studentId} total scores (+${totalScore})`);
            }
        } catch (e) {
            console.error('Error updating user scores:', e);
        }

        // 2) Update userSubmissions collection
        try {
            const userSubmissionSnapshot = await db.collection("userSubmissions")
                .where("userId", "==", studentId)
                .get();

            if (userSubmissionSnapshot.empty) {
                // Create new submission record
                await db.collection('userSubmissions').add({
                    userId: studentId,
                    userName: userName,
                    department: department,
                    totalScore: totalScore,
                    submissions: [contestId],
                    submissionCount: 1
                });
                console.log(`✓ Created new userSubmissions record for ${studentId}`);
            } else {
                // Update existing submission record
                const submissionRef = userSubmissionSnapshot.docs[0].ref;
                await submissionRef.update({
                    userName: userName,
                    department: department,
                    submissions: admin.firestore.FieldValue.arrayUnion(contestId),
                    totalScore: admin.firestore.FieldValue.increment(totalScore),
                    submissionCount: admin.firestore.FieldValue.increment(1)
                });
                console.log(`✓ Updated userSubmissions for ${studentId}`);
            }
        } catch (e) {
            console.error('Error updating userSubmissions:', e);
        }

        // 3) Update eventAttempts and eventResults
        try {
            // Find the event attempt
            const eventSnapshot = await db.collection('eventAttempts')
                .where('userId', '==', studentId)
                .where('eventId', '==', contestId)
                .get();

            if (!eventSnapshot.empty) {
                const attemptDoc = eventSnapshot.docs[0];

                // Update attempt status
                await attemptDoc.ref.update({
                    status: 'completed',
                    completed_at: admin.firestore.FieldValue.serverTimestamp(),
                    points: totalScore
                });

                console.log(`✓ Updated eventAttempt ${attemptDoc.id}: status=completed, points=${totalScore}`);

                // Create result record in eventResults
                const resultData = {
                    userId: studentId,
                    userName: userName,
                    department: department,
                    eventId: contestId,
                    eventTitle: contest.eventTitle || 'Unknown',
                    points: totalScore,
                    maxPoints: totalPossible,
                    problemsAttempted: submissions.length,
                    totalProblems: totalProblems,
                    submittedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                const resultRef = await db.collection('eventResults').add(resultData);

                // Update attempt with result reference
                await attemptDoc.ref.update({
                    result_ref: resultRef.id
                });

                console.log(`✓ Created eventResult ${resultRef.id} with points=${totalScore}`);
            } else {
                console.warn(`⚠ No eventAttempt found for student ${studentId} and contest ${contestId}`);
                console.log(`Creating new eventAttempt and eventResult...`);

                // Create new eventAttempt if it doesn't exist
                const newAttemptData = {
                    userId: studentId,
                    userName: userName,
                    department: department,
                    eventId: contestId,
                    eventTitle: contest.eventTitle || 'Unknown',
                    status: 'completed',
                    started_at: admin.firestore.FieldValue.serverTimestamp(),
                    completed_at: admin.firestore.FieldValue.serverTimestamp(),
                    points: totalScore
                };

                const attemptRef = await db.collection('eventAttempts').add(newAttemptData);
                console.log(`✓ Created new eventAttempt ${attemptRef.id} with points=${totalScore}`);

                // Create result record in eventResults
                const resultData = {
                    userId: studentId,
                    userName: userName,
                    department: department,
                    eventId: contestId,
                    eventTitle: contest.eventTitle || 'Unknown',
                    points: totalScore,
                    maxPoints: totalPossible,
                    problemsAttempted: submissions.length,
                    totalProblems: totalProblems,
                    submittedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                const resultRef = await db.collection('eventResults').add(resultData);

                // Update attempt with result reference
                await attemptRef.update({
                    result_ref: resultRef.id
                });

                console.log(`✓ Created eventResult ${resultRef.id} with points=${totalScore}`);
            }

            // Invalidate leaderboard cache
            cache.delete('leaderboard:top20');
        } catch (e) {
            console.error('Error updating eventAttempts/eventResults:', e);
            console.error('Error details:', e.message);
        }

        console.log(`✓ Contest ${contestId} completed by student ${studentId}. Final score: ${totalScore}/${totalPossible}`);

        res.status(200).json({
            success: true,
            message: `Contest submitted successfully! Your final score: ${totalScore}/${totalPossible}`,
            totalScore: totalScore,
            totalPossible: totalPossible,
            problemsAttempted: submissions.length,
            totalProblems
        });

    } catch (error) {
        console.error('Error in finishContest:', error);

        let errorMessage = 'Failed to submit contest';
        if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid authentication token';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};

// Reopen contest for a specific user (Admin only)
// 1) Gets userId and eventId from request body
// 2) Deletes user's submission from eventResults collection
// 3) Deletes user's attempt from eventAttempts collection
// 4) Deletes user's contest result from users/{userId}/contestResults/{eventId} subcollection
// 5) Decrements user's total score and contests participated count
// 6) Updates userSubmissions collection
// 7) Allows the user to retake the contest with a fresh start
const reopenContest = async (req, res) => {
    try {
        const { userId, eventId } = req.body;

        if (!userId || !eventId) {
            return res.status(400).json({
                success: false,
                message: "userId and eventId are required"
            });
        }

        console.log(`🔄 Reopening contest ${eventId} for user ${userId}`);

        // Get user data before deletion (to restore scores)
        const contestResultRef = db.collection('users')
            .doc(userId)
            .collection('contestResults')
            .doc(eventId);

        const contestResultDoc = await contestResultRef.get();
        let scoresToRevert = 0;

        if (contestResultDoc.exists) {
            scoresToRevert = contestResultDoc.data().totalScore || 0;
            console.log(`Reverting ${scoresToRevert} points from user total score`);
        }

        // 1) Delete from eventResults collection
        const eventResultsQuery = await db.collection('eventResults')
            .where('userId', '==', userId)
            .where('eventId', '==', eventId)
            .get();

        const deletePromises = [];

        if (!eventResultsQuery.empty) {
            eventResultsQuery.forEach(doc => {
                deletePromises.push(doc.ref.delete());
                console.log(`✓ Deleting eventResult document: ${doc.id}`);
            });
        }

        // 2) Delete from eventAttempts collection
        const eventAttemptsQuery = await db.collection('eventAttempts')
            .where('userId', '==', userId)
            .where('eventId', '==', eventId)
            .get();

        if (!eventAttemptsQuery.empty) {
            eventAttemptsQuery.forEach(doc => {
                deletePromises.push(doc.ref.delete());
                console.log(`✓ Deleting eventAttempt document: ${doc.id}`);
            });
        }

        // 3) Delete from users/{userId}/contestResults/{eventId} subcollection
        if (contestResultDoc.exists) {
            deletePromises.push(contestResultRef.delete());
            console.log(`✓ Deleting contestResult from user subcollection`);
        }

        // Execute all deletions in parallel
        await Promise.all(deletePromises);

        // 4) Update user's total scores and contests participated count
        if (scoresToRevert > 0) {
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
                totalScore: admin.firestore.FieldValue.increment(-scoresToRevert),
                contestsParticipated: admin.firestore.FieldValue.increment(-1)
            });
            console.log(`✓ Reverted user scores: -${scoresToRevert} points, -1 contest`);
        }

        // 5) Update userSubmissions collection
        try {
            const userSubmissionQuery = await db.collection('userSubmissions')
                .where('userId', '==', userId)
                .get();

            if (!userSubmissionQuery.empty) {
                const submissionDoc = userSubmissionQuery.docs[0];
                const submissionData = submissionDoc.data();

                // Remove this contest from submissions array
                const updatedSubmissions = (submissionData.submissions || []).filter(
                    id => id !== eventId
                );

                await submissionDoc.ref.update({
                    submissions: updatedSubmissions,
                    totalScore: admin.firestore.FieldValue.increment(-scoresToRevert),
                    submissionCount: admin.firestore.FieldValue.increment(-1)
                });
                console.log(`✓ Updated userSubmissions collection`);
            }
        } catch (err) {
            console.error('Error updating userSubmissions:', err);
            // Non-critical, continue
        }

        // 6) Clear proctoring logs for this user-event combination
        try {
            const proctoringLogId = `${userId}_${eventId}`;
            const proctoringLogRef = db.collection('proctoringLogs').doc(proctoringLogId);
            const proctoringLogDoc = await proctoringLogRef.get();

            if (proctoringLogDoc.exists) {
                await proctoringLogRef.delete();
                console.log(`✓ Deleted proctoring logs`);
            }
        } catch (err) {
            console.error('Error deleting proctoring logs:', err);
            // Non-critical, continue
        }

        // Invalidate leaderboard cache
        cache.delete('leaderboard:top20');

        console.log(`✅ Successfully reopened contest ${eventId} for user ${userId}`);

        res.status(200).json({
            success: true,
            message: "Contest reopened successfully. User can now retake the contest.",
            revertedScore: scoresToRevert
        });

    } catch (error) {
        console.error('Error reopening contest:', error);
        res.status(500).json({
            success: false,
            message: "Failed to reopen contest",
            error: error.message
        });
    }
};

module.exports = {
  createContest,
  updateContest,
  fetchAdminEvents,
  fetchEvents,
  fetchStudentEvent,
  fetchEvent,
  fetchSuperEvent,
  deleteSuperEvent,
  getEventResults,
  finishContest,
  reopenContest
};

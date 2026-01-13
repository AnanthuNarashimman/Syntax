const eventService = require("../services/eventService");
const { db, admin } = require("../config/firebase");

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
};

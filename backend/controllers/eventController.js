const eventService = require("../services/eventService");
const { db, admin } = require("../config/firebase");

const createContest = async (req, res) => {
    try {

        const {
            contestTitle,
            contestDescription,
            duration,
            numberOfQuestions,
            pointsPerProgram,
            questions,
            selectedLanguage,
            contestType,
            contestMode,
            topicsCovered,
            allowedDepartments
        } = req.body;

        if (
            !contestTitle ||
            !contestDescription ||
            !duration ||
            !numberOfQuestions ||
            !pointsPerProgram ||
            !contestType ||
            !contestMode ||
            !topicsCovered ||
            !allowedDepartments
        ) {
            return res.status(400).json({
                message:
                    "Missing required contest setup fields: title, description, duration, number of questions, points per program, contest type, contest mode, topics covered, or allowed departments.",
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

        console.log("Received contest data:", {
            contestTitle,
            contestDescription,
            contestType,
            contestMode,
            topicsCovered,
            allowedDepartments,
            numberOfQuestions: parsedNumberOfQuestions,
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
}

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
}


// Event fetching


// Admin Specific
const fetchAdminEvents = async(req, res) => {
    try {
    const eventsSnapshot = await db
      .collection("events")
      .where("createdBy", "==", req.user.userId)
      .get();

    console.log("Making firebase call from admin side.")

    const events = [];
    eventsSnapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort events by createdAt in descending order (newest first)
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
}

// All events from all department
const fetchEvents = async (req, res) => {
    try {
        const eventsSnapShot = await db.collection('events')
            .where('allowedDepartments', 'in', [req.user.department, 'Any department'])
            .where('status', '==', 'active')
            .get();

        console.log("Making firebase call from student side.")

        const events = [] 

        eventsSnapShot.forEach(doc => {
            const eventData = doc.data()

            
            if (eventData.questions && Array.isArray(eventData.questions)) {
                eventData.questions = eventData.questions.map(question => {
                    const { correctAnswer, ...questionWithoutAnswer } = question; 
                    return questionWithoutAnswer; 
                });
            }

            
            events.push({
                id: doc.id,
                ...eventData
            });
        })

        events.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt?._seconds * 1000) || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt?._seconds * 1000) || new Date(0);
            return bTime - aTime;
        })

        res.status(200).json({
            message: 'Events retrieved successfully!',
            events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            message: 'Failed to fetch events. Please try again.',
            error: error.message
        });
    }
}

// Specific events for admin view
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
}

// Super Admin Fetching events
const fetchSuperEvent = async (req, res) => {
    try {
        const snapshot = await db
            .collection("events")
            .orderBy("createdAt", "desc")
            .get();

        console.log("Making firebase call from super admin side");
        
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
}

const deleteSuperEvent = async(req, res) => {
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
}

module.exports = {
    createContest,
    updateContest,
    fetchAdminEvents,
    fetchEvents,
    fetchEvent,
    fetchSuperEvent,
    deleteSuperEvent
}
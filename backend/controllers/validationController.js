const validationService = require('../services/validationService');
const { db, admin } = require('../config/firebase');
const cache = require('../utils/cache');

const validateQuiz = async (req, res) => {
    try {
        const studentSubmission = req.body;
        const userId = req.user.userId;

        const quizId = studentSubmission.quizId;
        const studentAnswers = studentSubmission.studentAnswers;

        if (!quizId || !studentAnswers) {
            return res.status(400).json({
                "message": "QuizId and studentAnswers are required"
            });
        }

        const result = await validationService.validateQuizAnswers(quizId, studentAnswers);
        console.log('Quiz validation result:', result.QuizResult);

        const totalPoints = result.pointsPerQuestion * result.correctAnswerCount;

        // OPTIMIZED: Fetch user data once and use it for both updates
        let userName = 'Unknown';
        let department = 'Unknown';

        try {
            const userDocRef = db.collection("users").doc(userId);
            const userSnapshot = await userDocRef.get();

            if (userSnapshot.exists) {
                const userData = userSnapshot.data();
                userName = userData.userName || 'Unknown';
                department = userData.department || 'Unknown';

                await userDocRef.update({
                    totalScores: admin.firestore.FieldValue.increment(totalPoints),
                    contestsParticipated: admin.firestore.FieldValue.increment(1)
                });
            }

            console.log("Updated Successfully");
        } catch (e) {
            console.log(e);
        }


        try {
            const userSubmissionSnapShot = await db.collection("userSubmissions").where("userId", "==", userId).get();

            if (userSubmissionSnapShot.empty) {
                // OPTIMIZED: Store userName and department for faster leaderboard queries
                const newDocRef = await db.collection('userSubmissions').add({
                    "userId": userId,
                    "userName": userName,
                    "department": department,
                    "totalScore": totalPoints,
                    "submissions": [quizId],
                    "submissionCount": 1
                });
            } else {
                const submissionRef = userSubmissionSnapShot.docs[0].ref;
                // OPTIMIZED: Update userName and department in case they changed
                await submissionRef.update({
                    userName: userName,
                    department: department,
                    submissions: admin.firestore.FieldValue.arrayUnion(quizId),
                    totalScore: admin.firestore.FieldValue.increment(totalPoints),
                    submissionCount: admin.firestore.FieldValue.increment(1)
                });
            }
        } catch (e) {
            console.log(e);
        }

        const submissionResult = await validationService.submitEvent(quizId, userId, totalPoints);

        if (submissionResult.success) {
            // OPTIMIZED: Invalidate leaderboard cache after successful submission
            cache.delete('leaderboard:top20');

            res.status(200).json({
                "QuizResult": result.QuizResult,
                "CorrectAnswerCount": result.correctAnswerCount,
                "Points": totalPoints,
                "message": "Quiz submitted successfully"
            });
        } else {
            res.status(500).json({
                "message": "Quiz validated but submission failed",
                "error": submissionResult.error,
                "QuizResult": result.QuizResult,
                "CorrectAnswerCount": result.correctAnswerCount,
                "Points": totalPoints
            });
        }
    } catch (error) {
        console.error('Error validating quiz:', error);
        res.status(500).json({
            "message": "Failed to validate quiz",
            "error": error.message
        });
    }
}


const checkStatus = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.userId;

        if (!eventId) {
            return res.status(400).json({
                "message": "EventId is required"
            });
        }

        const statusResult = await validationService.getEventStatus(eventId, userId);
        const status = statusResult.status;

        console.log('Event status for user', userId, 'event', eventId, ':', status);

        res.status(200).json({
            "eventStatus": status,
            "data": statusResult.data || null
        });
    } catch (error) {
        console.error('Error checking event status:', error);
        res.status(500).json({
            "message": "Failed to check event status",
            "error": error.message
        });
    }
}


const startEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.userId;

        if (!eventId) {
            return res.status(400).json({
                "success": false,
                "message": "EventId is required"
            });
        }

        // Check if user has already started this event
        const statusResult = await validationService.getEventStatus(eventId, userId);
        if (statusResult.status === 'in_progress' || statusResult.status === 'completed') {
            return res.status(200).json({
                "success": true,
                "message": "Event already started or completed",
                "status": statusResult.status
            });
        }

        const result = await validationService.startEvent(eventId, userId);

        if (result.success) {
            res.status(200).json({
                "success": true,
                "message": "Event started successfully"
            });
        } else {
            res.status(500).json({
                "success": false,
                "message": "Failed to start event",
                "error": result.error
            });
        }
    } catch (error) {
        console.error('Error starting event:', error);
        res.status(500).json({
            "success": false,
            "message": "Failed to start event",
            "error": error.message
        });
    }
}


const getResult = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.userId;

        if (!eventId) {
            return res.status(400).json({
                "message": "EventId is required"
            });
        }

        const resultSnapshot = await db.collection('eventResults')
            .where("userId", "==", userId)
            .where("eventId", "==", eventId)
            .get();

        if (resultSnapshot.empty) {
            return res.status(404).json({
                "message": "Result not found"
            });
        }

        const resultDoc = resultSnapshot.docs[0];
        const resultData = resultDoc.data();

        res.status(200).json({
            "result": resultData
        });
    } catch (error) {
        console.error('Error getting result:', error);
        res.status(500).json({
            "message": "Failed to get result",
            "error": error.message
        });
    }
}

// OPTIMIZED: Combined endpoint to get status and results in single request
const getStatusWithResults = async (req, res) => {
    try {
        const { eventId } = req.body;
        const userId = req.user.userId;

        if (!eventId) {
            return res.status(400).json({
                "message": "EventId is required"
            });
        }

        // Fetch status and results in parallel
        const [statusResult, resultSnapshot] = await Promise.all([
            validationService.getEventStatus(eventId, userId),
            db.collection('eventResults')
                .where("userId", "==", userId)
                .where("eventId", "==", eventId)
                .limit(1)
                .get()
        ]);

        const status = statusResult.status;
        let resultData = null;

        // Only include result if event is completed
        if (status === 'completed' && !resultSnapshot.empty) {
            resultData = resultSnapshot.docs[0].data();
        }

        res.status(200).json({
            "eventStatus": status,
            "attemptData": statusResult.data || null,
            "result": resultData
        });

    } catch (error) {
        console.error('Error getting status with results:', error);
        res.status(500).json({
            "message": "Failed to get status with results",
            "error": error.message
        });
    }
}


module.exports = {
    validateQuiz,
    startEvent,
    checkStatus,
    getResult,
    getStatusWithResults
}
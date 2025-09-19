const validationService = require('../services/validationService');
const { db, admin } = require('../config/firebase');

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

        try {

            const userDocRef = db.collection("users").doc(userId);
            const userSnapshot = await userDocRef.get();

            if (userSnapshot.exists) {
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
                const newDocRef = await db.collection('userSubmissions').add({
                    "userId": userId,
                    "totalScore": totalPoints,
                    "submissions": [quizId],
                    "submissionCount": 1
                });
            } else {
                const submissionRef = userSubmissionSnapShot.docs[0].ref;
                await submissionRef.update({
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


module.exports = {
    validateQuiz,
    startEvent,
    checkStatus,
    getResult
}
const jwt = require("jsonwebtoken");
const { db, admin } = require("../config/firebase");

async function validateQuizAnswers(quizId, studentAnswers) {
    console.log("QuizId:", quizId);
    console.log("StudentAnswers:", studentAnswers);

    const quizRef = db.collection('events').doc(quizId);
    const doc = await quizRef.get();

    if (doc.empty) {
        throw new Error("Invalid quizId.");
    }

    const quizData = doc.data();

    const questionData = quizData.questions;

    const questionCount = Object.keys(questionData).length;

    correctAnswerCount = 0;

    for (let i = 0; i < questionCount; i++) {
        if (questionData[i].correctAnswer === studentAnswers[i]) {
            correctAnswerCount += 1;
        }
    }

    const correctAnswers = [];

    for (const question of questionData) {
        const { correctAnswer, ...other } = question;
        correctAnswers.push(correctAnswer);
        console.log(correctAnswer);
    }

    // Creating final result
    const quizResult = {};
    for (let i = 0; i < correctAnswers.length; i++) {
        quizResult[i] = {
            correctAnswer: correctAnswers[i],
            studentAnswer: studentAnswers[i]
        };
    }

    console.log("CorrectAnswerCount:", correctAnswerCount);
    console.log("Result:", quizResult);


    return {
        "QuizResult": quizResult,
        "correctAnswerCount": correctAnswerCount,
        "pointsPerQuestion": quizData.pointsPerQuestion
    }
}


async function getEventStatus(eventId, userId) {
    console.log("UserId:", userId);
    console.log("EventId:", eventId);

    try {
        const statusSnapshot = await db.collection('eventAttempts')
            .where("userId", "==", userId)
            .where("eventId", "==", eventId)
            .get();

        if (statusSnapshot.empty) {
            return {
                "status": "not_started"
            }
        }

        const statusDoc = statusSnapshot.docs[0];
        const statusData = statusDoc.data();

        return {
            "status": statusData.status,
            "data": statusData
        }
    } catch (error) {
        console.error("Error getting event status:", error);
        return {
            "status": "not_started"
        }
    }
}


async function startEvent(eventId, userId) {
    console.log("UserId:", userId);
    console.log("EventId:", eventId);

    const statusData = {
        "userId": userId,
        "eventId": eventId,
        "status": "in_progress",
        "started_at": admin.firestore.FieldValue.serverTimestamp(),
        "completed_at": null,
        "result_ref": null
    }

    try {
        await db.collection('eventAttempts').add(statusData);
        return {
            "success": true
        }
    } catch (err) {
        console.log(err);
        return {
            "success": false,
            "error": err.message
        }
    }
}

async function submitEvent(eventId, userId, points) {
    console.log("UserId:", userId);
    console.log("EventId:", eventId);

    try {
        const eventSnapshot = await db.collection('eventAttempts')
            .where('userId', '==', userId)
            .where('eventId', '==', eventId)
            .get();

        if(eventSnapshot.empty) {
            throw new Error("Event not started");
        }

        // Update the attempt status to completed
        const attemptDoc = eventSnapshot.docs[0];
        await attemptDoc.ref.update({
            status: 'completed',
            completed_at: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create result record
        const resultData = {
            "userId": userId,
            "eventId": eventId,
            "points": points,
            "submittedAt": admin.firestore.FieldValue.serverTimestamp()
        }

        const resultRef = await db.collection('eventResults').add(resultData);
        
        // Update attempt with result reference
        await attemptDoc.ref.update({
            result_ref: resultRef.id
        });
        
        return {
            "success": true
        }

    } catch(err) {
        console.log("Error submitting event:", err);
        return {
            "success": false,
            "error": err.message
        }
    }
}

module.exports = {
    validateQuizAnswers,
    getEventStatus,
    startEvent,
    submitEvent
}
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

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


module.exports = { validateQuizAnswers }
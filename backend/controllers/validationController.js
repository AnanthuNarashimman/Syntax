const valiationService = require('../services/validationService');

const validateQuiz = async(req, res) => {
    const studentSubmission = req.body;

    const quizId = studentSubmission.quizId;

    const studentAnswers = studentSubmission.studentAnswers;

    const result = await valiationService.validateQuizAnswers(quizId, studentAnswers);
    console.log(result.QuizResult);

    const totalPoints = result.pointsPerQuestion * result.correctAnswerCount;

    res.status(200).json({
        "QuizResult": result.QuizResult,
        "CorrectAnswerCount": result.correctAnswerCount,
        "Points": totalPoints
    });


}


module.exports = {validateQuiz}
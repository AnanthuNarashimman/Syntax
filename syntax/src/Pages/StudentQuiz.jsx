import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Home, RotateCcw } from 'lucide-react';
import StudentNavbar from '../Components/StudentNavbar';
import styles from '../Styles/PageStyles/StudentQuiz.module.css';

const StudentQuiz = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get quiz data from navigation state
  const quizData = location.state?.quizData;

  // State management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStartTime] = useState(Date.now());

  // Initialize timer and load saved answers
  useEffect(() => {
    if (!quizData) {
      navigate('/student-contests');
      return;
    }

    // Set initial time (convert minutes to seconds)
    const duration = quizData.durationMinutes || quizData.duration || 30;
    setTimeRemaining(duration * 60);

    // Load saved answers from localStorage
    const savedAnswers = localStorage.getItem(`quiz_${quizData.id}_answers`);
    if (savedAnswers) {
      setSelectedAnswers(JSON.parse(savedAnswers));
    }

    // Load saved current question
    const savedQuestion = localStorage.getItem(`quiz_${quizData.id}_current`);
    if (savedQuestion) {
      setCurrentQuestion(parseInt(savedQuestion));
    }
  }, [quizData, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (quizData && Object.keys(selectedAnswers).length > 0) {
      localStorage.setItem(`quiz_${quizData.id}_answers`, JSON.stringify(selectedAnswers));
      localStorage.setItem(`quiz_${quizData.id}_current`, currentQuestion.toString());
    }
  }, [selectedAnswers, currentQuestion, quizData]);

  // Get questions array from quiz data
  const questions = quizData?.questions || [];

  // Utility functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: optionIndex
    };
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const handleSubmit = () => {
    // Clear localStorage
    localStorage.removeItem(`quiz_${quizData.id}_answers`);
    localStorage.removeItem(`quiz_${quizData.id}_current`);

    // Save final answers with timestamp
    const finalAnswers = {
      quizId: quizData.id,
      answers: selectedAnswers,
      submittedAt: new Date().toISOString(),
      timeTaken: quizData.durationMinutes * 60 - timeRemaining
    };

    localStorage.setItem(`quiz_${quizData.id}_final`, JSON.stringify(finalAnswers));
    setShowResults(true);
  };

  const handleRestart = () => {
    // Clear all saved data
    localStorage.removeItem(`quiz_${quizData.id}_answers`);
    localStorage.removeItem(`quiz_${quizData.id}_current`);
    localStorage.removeItem(`quiz_${quizData.id}_final`);

    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setTimeRemaining((quizData.durationMinutes || 30) * 60);
  };

  const handleBackToContests = () => {
    navigate('/student-contests');
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return { text: "Excellent! Outstanding performance!", class: "excellent" };
    if (percentage >= 80) return { text: "Great job! You did very well!", class: "excellent" };
    if (percentage >= 70) return { text: "Good work! Keep it up!", class: "good" };
    if (percentage >= 60) return { text: "Not bad! There's room for improvement.", class: "good" };
    return { text: "Keep practicing! You'll do better next time.", class: "needsImprovement" };
  };

  // Early return if no quiz data
  if (!quizData) {
    return (
      <div className={styles.studentQuiz}>
        <StudentNavbar />
        <div className={styles.quizContainer}>
          <div className={styles.quizCard}>
            <h2>No Quiz Data Found</h2>
            <p>Please select a quiz from the contests page.</p>
            <button className={styles.homeButton} onClick={handleBackToContests}>
              Back to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate score for results
  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  // Results view
  if (showResults) {
    const score = calculateScore();
    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const scoreMessage = getScoreMessage(percentage);
    const scoreColor = getScoreColor(percentage);

    return (
      <div className={styles.studentQuiz}>
        <StudentNavbar />
        <div className={styles.quizContainer}>
          <div className={styles.quizCard}>
            <div className={styles.resultsSection}>
              <h1 className={styles.resultsTitle}>Quiz Completed!</h1>

              <div className={styles.scoreDisplay}>
                <div
                  className={styles.scoreCircle}
                  style={{ borderColor: scoreColor }}
                >
                  <div className={styles.scoreText} style={{ color: scoreColor }}>
                    {score}/{questions.length}
                  </div>
                </div>
                <div className={styles.scorePercentage}>
                  {percentage.toFixed(1)}% Score
                </div>
                <div className={`${styles.scoreMessage} ${styles[scoreMessage.class]}`}>
                  {scoreMessage.text}
                </div>
              </div>

              <div className={styles.answerReview}>
                <h3 className={styles.reviewTitle}>Answer Review</h3>
                {questions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div
                      key={index}
                      className={`${styles.reviewItem} ${isCorrect ? styles.correct : styles.incorrect}`}
                    >
                      <div className={styles.reviewQuestion}>
                        Q{index + 1}: {question.question}
                      </div>
                      <div className={`${styles.reviewAnswer} ${isCorrect ? styles.correct : styles.incorrect}`}>
                        Your answer: {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                      </div>
                      {!isCorrect && (
                        <div className={styles.reviewCorrect}>
                          Correct answer: {question.options[question.correctAnswer]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.actionButtons}>
                <button className={styles.restartButton} onClick={handleRestart}>
                  <RotateCcw size={20} />
                  Restart Quiz
                </button>
                <button className={styles.homeButton} onClick={handleBackToContests}>
                  <Home size={20} />
                  Back to Contests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz view
  if (questions.length === 0) {
    return (
      <div className={styles.studentQuiz}>
        <StudentNavbar />
        <div className={styles.quizContainer}>
          <div className={styles.quizCard}>
            <h2>No Questions Available</h2>
            <p>This quiz doesn't have any questions yet.</p>
            <button className={styles.homeButton} onClick={handleBackToContests}>
              Back to Contests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className={styles.studentQuiz}>
      <StudentNavbar />
      <div className={styles.quizContainer}>
        {/* Quiz Header */}
        <div className={styles.quizHeader}>
          <button className={styles.backBtn} onClick={handleBackToContests}>
            <ArrowLeft size={20} />
            Back to Contests
          </button>

          <h1 className={styles.quizTitle}>
            {quizData.eventTitle || quizData.title || 'Quiz'}
          </h1>

          <div className={styles.timerContainer}>
            <Clock size={20} />
            <span className={styles.timerText}>
              {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
            </span>
          </div>
        </div>

        {/* Progress Section */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressInfo}>
            <span className={styles.questionCounter}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <div className={styles.questionsOverview}>
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.questionDot} ${
                    index === currentQuestion ? styles.current :
                    selectedAnswers[index] !== undefined ? styles.answered : ''
                  }`}
                  onClick={() => handleQuestionJump(index)}
                  title={`Question ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quiz Card */}
        <div className={styles.quizCard}>
          <div className={styles.questionSection}>
            <div className={styles.questionNumber}>
              Question {currentQuestion + 1}
            </div>
            <div className={styles.questionText}>
              {currentQ.question}
            </div>
          </div>

          <div className={styles.optionsContainer}>
            {currentQ.options.map((option, index) => (
              <div
                key={index}
                className={`${styles.option} ${
                  selectedAnswers[currentQuestion] === index ? styles.selected : ''
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
              >
                <div className={styles.optionIndicator}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className={styles.optionText}>
                  {option}
                </div>
                {selectedAnswers[currentQuestion] === index && (
                  <CheckCircle className={styles.selectedIcon} size={20} />
                )}
              </div>
            ))}
          </div>

          <div className={styles.navigationControls}>
            <button
              className={`${styles.navButton} ${styles.secondary}`}
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
              >
                Submit Quiz
              </button>
            ) : (
              <button
                className={`${styles.navButton} ${styles.primary}`}
                onClick={handleNext}
              >
                Next
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;
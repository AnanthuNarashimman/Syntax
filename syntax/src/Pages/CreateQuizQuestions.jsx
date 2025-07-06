import { use, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Calculator, Home, 
  Plus, 
  Settings, 
  MessageSquare, 
  User, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  Activity } from 'lucide-react';
import '../Styles/PageStyles/CreateQuizQuestions.css';
import AdminNavbar from "../Components/AdminNavbar";
import { useNavigate } from 'react-router-dom';

function CreateQuizQuestions() {

    const navigate = useNavigate();

    const [totalQuestions, setTotalQuestions] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [showScoreManagement, setShowScoreManagement] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [scorePerQuestion, setScorePerQuestion] = useState(1);
    const [totalScore, setTotalScore] = useState(0);
    const [activeTab, setActiveTabState] = useState('create');

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'create', label: 'Create Contest', icon: Plus },
        { id: 'manage', label: 'Manage Events', icon: Settings },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    const setActiveTab = (tab) => {
    setActiveTabState(tab);
    // Map tab id to route
    const tabRoutes = {
      home: '/admin-dashboard',
      create: '/create-contest',
      manage: '/manage-contest',
      participants: '/manage-participants',
      analytics: '/analytics',
      profile: '/admin-profile',
    };
    if (tabRoutes[tab]) {
      navigate(tabRoutes[tab]);
    }
  };

    const handleQuestionCountSubmit = (e) => {
        e.preventDefault();
        if (totalQuestions > 0) {
            const initialQuestions = Array.from({ length: totalQuestions }, (_, index) => ({
                id: index + 1,
                question: '',
                options: ['', '', '', ''],
                correctAnswer: ''
            }));
            setQuestions(initialQuestions);
            setShowQuestionForm(true);
            setCurrentQuestion(0);
        }
    };

    const handleQuestionChange = (field, value, optionIndex = null) => {
        const updatedQuestions = [...questions];

        if (field === 'question') {
            updatedQuestions[currentQuestion].question = value;
        } else if (field === 'option') {
            updatedQuestions[currentQuestion].options[optionIndex] = value;
        } else if (field === 'correctAnswer') {
            updatedQuestions[currentQuestion].correctAnswer = value;
        }

        setQuestions(updatedQuestions);
    };

    const handleNext = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleQuestionsComplete = () => {
        setShowQuestionForm(false);
        setShowScoreManagement(true);
        setTotalScore(totalQuestions * scorePerQuestion);
    };

    const handleScoreSubmit = () => {
        const finalTotalScore = totalQuestions * scorePerQuestion;
        setTotalScore(finalTotalScore);

        const quizData = {
            questions: questions,
            scorePerQuestion: scorePerQuestion,
            totalScore: finalTotalScore,
            totalQuestions: totalQuestions
        };

        console.log('Quiz created with scoring:', quizData);
        alert(`Quiz created successfully! Total Score: ${finalTotalScore} points`);

        // Reset form
        setTotalQuestions(0);
        setCurrentQuestion(0);
        setShowQuestionForm(false);
        setShowScoreManagement(false);
        setQuestions([]);
        setScorePerQuestion(1);
        setTotalScore(0);
    };

    const isCurrentQuestionValid = () => {
        const current = questions[currentQuestion];
        return current &&
            current.question.trim() !== '' &&
            current.options.every(option => option.trim() !== '') &&
            current.correctAnswer.trim() !== '';
    };

    const areAllQuestionsValid = () => {
        return questions.every(q =>
            q.question.trim() !== '' &&
            q.options.every(option => option.trim() !== '') &&
            q.correctAnswer.trim() !== ''
        );
    };

    const handleScoreChange = (value) => {
        const score = Math.max(0.5, Math.min(100, parseFloat(value) || 0));
        setScorePerQuestion(score);
        setTotalScore(totalQuestions * score);
    };

    const renderQuestionCountForm = () => (
        <div className="question-count-container">
            <h2 className="form-title">Set Number of Questions</h2>
            <p className="form-subtitle">How many questions would you like to add to your quiz?</p>

            <div className="question-count-form">
                <div className="input-group">
                    <label htmlFor="questionCount">Number of Questions</label>
                    <input
                        type="number"
                        id="questionCount"
                        min="1"
                        max="50"
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 0)}
                        placeholder="Enter number of questions"
                        required
                    />
                </div>

                <button
                    type="button"
                    className="continue-button"
                    onClick={handleQuestionCountSubmit}
                    disabled={totalQuestions <= 0}
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const renderQuestionForm = () => (
        <div className="question-form-container">
            <div className="question-header">
                <h2 className="form-title">
                    Question {currentQuestion + 1} of {totalQuestions}
                </h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="question-card">
                <div className="question-input-group">
                    <label htmlFor="question">Question</label>
                    <textarea
                        id="question"
                        value={questions[currentQuestion]?.question || ''}
                        onChange={(e) => handleQuestionChange('question', e.target.value)}
                        placeholder="Enter your question here..."
                        rows="3"
                        required
                    />
                </div>

                <div className="options-container">
                    <label>Answer Options</label>
                    {questions[currentQuestion]?.options.map((option, index) => (
                        <div key={index} className="option-input-group">
                            <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleQuestionChange('option', e.target.value, index)}
                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                required
                            />
                        </div>
                    ))}
                </div>

                <div className="correct-answer-group">
                    <label htmlFor="correctAnswer">Correct Answer</label>
                    <select
                        id="correctAnswer"
                        value={questions[currentQuestion]?.correctAnswer || ''}
                        onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                        required
                    >
                        <option value="">Select correct answer</option>
                        {questions[currentQuestion]?.options.map((option, index) => (
                            <option key={index} value={option} disabled={!option.trim()}>
                                {String.fromCharCode(65 + index)}. {option}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="question-navigation">
                <button
                    type="button"
                    className="nav-button prev-button"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>

                <div className="question-indicators">
                    {questions.map((_, index) => (
                        <div
                            key={index}
                            className={`question-indicator ${index === currentQuestion ? 'active' : ''} ${questions[index] &&
                                questions[index].question.trim() &&
                                questions[index].options.every(opt => opt.trim()) &&
                                questions[index].correctAnswer.trim() ? 'completed' : ''
                                }`}
                            onClick={() => setCurrentQuestion(index)}
                        >
                            {index + 1}
                        </div>
                    ))}
                </div>

                {currentQuestion === totalQuestions - 1 ? (
                    <button
                        type="button"
                        className="nav-button submit-button"
                        onClick={handleQuestionsComplete}
                        disabled={!areAllQuestionsValid()}
                    >
                        <Check size={16} />
                        Continue to Scoring
                    </button>
                ) : (
                    <button
                        type="button"
                        className="nav-button next-button"
                        onClick={handleNext}
                        disabled={!isCurrentQuestionValid()}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );

    const renderScoreManagement = () => (
        <div className="score-management-container">
            <div className="score-header">
                <Calculator size={24} className="score-icon" />
                <h2 className="form-title">Score Management</h2>
                <p className="form-subtitle">
                    Set the scoring system for your quiz
                </p>
            </div>

            <div className="score-card">
                <div className="quiz-summary">
                    <h3>Quiz Summary</h3>
                    <div className="summary-item">
                        <span className="summary-label">Total Questions:</span>
                        <span className="summary-value">{totalQuestions}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Questions Completed:</span>
                        <span className="summary-value">{questions.filter(q =>
                            q.question.trim() &&
                            q.options.every(opt => opt.trim()) &&
                            q.correctAnswer.trim()
                        ).length}</span>
                    </div>
                </div>

                <div className="score-form">
                    <div className="score-input-group">
                        <label htmlFor="scorePerQuestion">Score per Question</label>
                        <div className="score-input-wrapper">
                            <input
                                type="number"
                                id="scorePerQuestion"
                                min="0.5"
                                max="100"
                                step="0.5"
                                value={scorePerQuestion}
                                onChange={(e) => handleScoreChange(e.target.value)}
                                placeholder="Enter score per question"
                                required
                            />
                            <span className="score-unit">points</span>
                        </div>
                        <small className="score-hint">
                            Each question will be worth {scorePerQuestion} point{scorePerQuestion !== 1 ? 's' : ''}
                        </small>
                    </div>

                    <div className="total-score-display">
                        <div className="total-score-card">
                            <h4>Total Quiz Score</h4>
                            <div className="total-score-value">
                                {totalScore} <span className="score-unit">points</span>
                            </div>
                            <div className="score-calculation">
                                {totalQuestions} questions × {scorePerQuestion} points = {totalScore} points
                            </div>
                        </div>
                    </div>

                    <div className="score-actions">
                        <button
                            type="button"
                            className="back-button"
                            onClick={() => {
                                setShowScoreManagement(false);
                                setShowQuestionForm(true);
                            }}
                        >
                            <ChevronLeft size={16} />
                            Back to Questions
                        </button>

                        <button
                            type="button"
                            className="create-quiz-button"
                            onClick={handleScoreSubmit}
                            disabled={!areAllQuestionsValid() || scorePerQuestion <= 0}
                        >
                            <Check size={16} />
                            Create Quiz
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="create-quiz-questions">
            <AdminNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarItems={sidebarItems}
            />
            <div className="content-wrapper">
                <div className="page-header">
                    <button
                        className="back-to-create"
                        onClick={() => {navigate(-1)}}
                    >
                        <ChevronLeft size={16} />
                        Back to Create Contest
                    </button>
                    <h1>Create Quiz Questions</h1>
                </div>

                {!showQuestionForm && !showScoreManagement && renderQuestionCountForm()}
                {showQuestionForm && renderQuestionForm()}
                {showScoreManagement && renderScoreManagement()}
            </div>
        </div>
    );
}

export default CreateQuizQuestions
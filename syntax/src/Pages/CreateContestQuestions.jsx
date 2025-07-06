import { useState } from "react";
import { 
  Home, 
  Plus, 
  Settings, 
  Users, 
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Save,
  Code,
  FileText,
  TestTube
} from 'lucide-react';
import '../Styles/PageStyles/CreateContestQuestions.css';
import AdminNavbar from "../Components/AdminNavbar";
import { useNavigate } from 'react-router-dom';

function CreateContestQuestions() {
  const [step, setStep] = useState(1);
  const [numberOfQuestions, setNumberOfQuestions] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState({});
  const [activeTab, setActiveTabState] = useState('create');
  const navigate = useNavigate();

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

  const handleConfigSubmit = () => {
    if (!numberOfQuestions || !selectedLanguage) {
      alert('Please select both number of questions and language');
      return;
    }
    
    // Initialize questions object
    const initialQuestions = {};
    for (let i = 1; i <= parseInt(numberOfQuestions); i++) {
      initialQuestions[i] = {
        problem: '',
        testCases: [{ input: '', output: '' }],
        example: { input: '', output: '' }
      };
    }
    setQuestions(initialQuestions);
    setStep(2);
  };

  const handleQuestionChange = (field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        [field]: value
      }
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        testCases: prev[currentQuestion].testCases.map((testCase, i) => 
          i === index ? { ...testCase, [field]: value } : testCase
        )
      }
    }));
  };

  const handleExampleChange = (field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        example: {
          ...prev[currentQuestion].example,
          [field]: value
        }
      }
    }));
  };

  const addTestCase = () => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        testCases: [...prev[currentQuestion].testCases, { input: '', output: '' }]
      }
    }));
  };

  const removeTestCase = (index) => {
    if (questions[currentQuestion].testCases.length > 1) {
      setQuestions(prev => ({
        ...prev,
        [currentQuestion]: {
          ...prev[currentQuestion],
          testCases: prev[currentQuestion].testCases.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleNext = () => {
    if (!questions[currentQuestion].problem.trim()) {
      alert('Please enter the problem statement');
      return;
    }
    
    if (currentQuestion < parseInt(numberOfQuestions)) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSaveContest = () => {
    // Validate all questions
    for (let i = 1; i <= parseInt(numberOfQuestions); i++) {
      if (!questions[i].problem.trim()) {
        alert(`Please complete question ${i}`);
        return;
      }
    }
    
    // Save contest data
    const contestData = {
      ...JSON.parse(localStorage.getItem('contestFormData') || '{}'),
      numberOfQuestions,
      selectedLanguage,
      questions
    };
    
    localStorage.setItem('completeContestData', JSON.stringify(contestData));
    alert('Contest created successfully!');
    navigate('/manage-contest');
  };

  const renderConfigStep = () => (
    <div className="step-container">
      <div className="config-header">
        <h2 className="step-title">Configure Contest</h2>
        <p className="step-subtitle">Set up your coding contest parameters</p>
      </div>
      
      <div className="config-form">
        <div className="form-group">
          <p className="label">Number of Questions</p>
          <select 
            id="numberOfQuestions"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
          >
            <option value="">Select number of questions</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <p className="label">Programming Language</p>
          <div className="language-options">
            <div 
              className={`language-card ${selectedLanguage === 'python' ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage('python')}
            >
              <div className="language-icon">
                <Code size={24} />
              </div>
              <h3>Python</h3>
              <p>Python programming language</p>
            </div>
            
            <div 
              className={`language-card ${selectedLanguage === 'java' ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage('java')}
            >
              <div className="language-icon">
                <Code size={24} />
              </div>
              <h3>Java</h3>
              <p>Java programming language</p>
            </div>
            
            <div 
              className={`language-card ${selectedLanguage === 'both' ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage('both')}
            >
              <div className="language-icon">
                <Code size={24} />
              </div>
              <h3>Both</h3>
              <p>Python and Java</p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="back-button" 
            onClick={() => navigate('/create-contest')}
          >
            <ChevronLeft size={16} />
            Back to Contest Setup
          </button>
          <button 
            className="continue-button" 
            onClick={handleConfigSubmit}
          >
            Continue
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuestionStep = () => (
    <div className="step-container">
      <div className="question-header">
        <h2 className="step-title">Question {currentQuestion} of {numberOfQuestions}</h2>
        <p className="step-subtitle">Create your coding problem</p>
      </div>

      <div className="question-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentQuestion / parseInt(numberOfQuestions)) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">{currentQuestion}/{numberOfQuestions}</span>
      </div>

      <div className="question-form">
        <div className="form-group">
          <p className="label">
            <FileText size={16} />
            Problem Statement
          </p>
          <textarea
            id="problem"
            rows="6"
            placeholder="Enter the problem statement..."
            value={questions[currentQuestion]?.problem || ''}
            onChange={(e) => handleQuestionChange('problem', e.target.value)}
          />
        </div>

        <div className="example-section">
          <h3>
            <Code size={16} />
            Example
          </h3>
          <div className="example-grid">
            <div className="form-group">
              <p className="label">Input</p>
              <textarea
                rows="3"
                placeholder="Example input..."
                value={questions[currentQuestion]?.example?.input || ''}
                onChange={(e) => handleExampleChange('input', e.target.value)}
              />
            </div>
            <div className="form-group">
              <p className="label">Output</p>
              <textarea
                rows="3"
                placeholder="Expected output..."
                value={questions[currentQuestion]?.example?.output || ''}
                onChange={(e) => handleExampleChange('output', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="test-cases-section">
          <div className="section-header">
            <h3>
              <TestTube size={16} />
              Test Cases
            </h3>
            <button className="add-test-case-btn" onClick={addTestCase}>
              <Plus size={16} />
              Add Test Case
            </button>
          </div>
          
          {questions[currentQuestion]?.testCases?.map((testCase, index) => (
            <div key={index} className="test-case-card">
              <div className="test-case-header">
                <span>Test Case {index + 1}</span>
                {questions[currentQuestion].testCases.length > 1 && (
                  <button 
                    className="remove-test-case-btn"
                    onClick={() => removeTestCase(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="test-case-grid">
                <div className="form-group">
                  <p className="label">Input</p>
                  <textarea
                    rows="3"
                    placeholder="Test case input..."
                    value={testCase.input}
                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <p className="label">Expected Output</p>
                  <textarea
                    rows="3"
                    placeholder="Expected output..."
                    value={testCase.output}
                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button 
            className="back-button" 
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <div className="right-actions">
            {currentQuestion === parseInt(numberOfQuestions) ? (
              <button className="save-button" onClick={handleSaveContest}>
                <Save size={16} />
                Save Contest
              </button>
            ) : (
              <button className="next-button" onClick={handleNext}>
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="create-contest-questions">
      <AdminNavbar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        sidebarItems={sidebarItems}
      />

      <div className="content-wrapper">
        {step === 1 && renderConfigStep()}
        {step === 2 && renderQuestionStep()}
      </div>
    </div>
  );
}

export default CreateContestQuestions;
// /syntax/src/Pages/CreateContestQuestions.jsx
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
  TestTube,
  Eye,       // <-- Import Eye icon
  EyeOff     // <-- Import EyeOff icon
} from 'lucide-react';
import '../Styles/PageStyles/CreateContestQuestions.css';
import AdminNavbar from "../Components/AdminNavbar";
import { useNavigate } from 'react-router-dom';
import { useContestContext } from '../contexts/ContestContext';
import { useAlert } from '../contexts/AlertContext';

function CreateContestQuestions() {
  const [step, setStep] = useState(1);
  const [numberOfQuestions, setNumberOfQuestions] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState({});
  const [activeTab, setActiveTabState] = useState('create');
  const navigate = useNavigate();
  const { addNewEvent } = useContestContext();
  const { showError, showSuccess } = useAlert();

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
      showError('Please select both number of questions and language');
      return;
    }
    
    // Initialize questions object
    const initialQuestions = {};
    for (let i = 1; i <= parseInt(numberOfQuestions); i++) {
      initialQuestions[i] = {
        problem: '',
        // --- MODIFIED DATA STRUCTURE ---
        visibleTestCases: [{ input: '', output: '' }], // Replaced 'example'
        hiddenTestCases: [{ input: '', output: '' }],  // Replaced 'testCases'
        // --------------------------------
        problemDetails: {
          inputFormat: '',
          outputFormat: ''
        },
        starterCode: {
          python: 'print("hello world")',
          java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("hello world");\n    }\n}',
          javascript: 'console.log("hello world");'
        }
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

  const handleProblemDetailsChange = (field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        problemDetails: {
          ...prev[currentQuestion]?.problemDetails,
          [field]: value
        }
      }
    }));
  };

  const handleStarterCodeChange = (lang, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        starterCode: {
          ...prev[currentQuestion]?.starterCode,
          [lang]: value
        }
      }
    }));
  };

  // --- Handlers for VISIBLE Test Cases ---
  const handleVisibleTestCaseChange = (index, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        visibleTestCases: prev[currentQuestion].visibleTestCases.map((testCase, i) => 
          i === index ? { ...testCase, [field]: value } : testCase
        )
      }
    }));
  };

  const addVisibleTestCase = () => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        visibleTestCases: [...prev[currentQuestion].visibleTestCases, { input: '', output: '' }]
      }
    }));
  };

  const removeVisibleTestCase = (index) => {
    if (questions[currentQuestion].visibleTestCases.length > 1) {
      setQuestions(prev => ({
        ...prev,
        [currentQuestion]: {
          ...prev[currentQuestion],
          visibleTestCases: prev[currentQuestion].visibleTestCases.filter((_, i) => i !== index)
        }
      }));
    }
  };

  // --- Handlers for HIDDEN Test Cases ---
  const handleHiddenTestCaseChange = (index, field, value) => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        hiddenTestCases: prev[currentQuestion].hiddenTestCases.map((testCase, i) => 
          i === index ? { ...testCase, [field]: value } : testCase
        )
      }
    }));
  };

  const addHiddenTestCase = () => {
    setQuestions(prev => ({
      ...prev,
      [currentQuestion]: {
        ...prev[currentQuestion],
        hiddenTestCases: [...prev[currentQuestion].hiddenTestCases, { input: '', output: '' }]
      }
    }));
  };

  const removeHiddenTestCase = (index) => {
    if (questions[currentQuestion].hiddenTestCases.length > 1) {
      setQuestions(prev => ({
        ...prev,
        [currentQuestion]: {
          ...prev[currentQuestion],
          hiddenTestCases: prev[currentQuestion].hiddenTestCases.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleNext = () => {
    if (!questions[currentQuestion].problem.trim()) {
      showError('Please enter the problem statement');
      return;
    }
    
    if (!questions[currentQuestion].problemDetails?.inputFormat?.trim()) {
      showError('Please enter the input format');
      return;
    }
    
    if (!questions[currentQuestion].problemDetails?.outputFormat?.trim()) {
      showError('Please enter the output format');
      return;
    }
    
    if (!questions[currentQuestion].starterCode?.python?.trim()) {
      showError('Please enter Python starter code');
      return;
    }

    if (!questions[currentQuestion].starterCode?.java?.trim()) {
      showError('Please enter Java starter code');
      return;
    }

    if (!questions[currentQuestion].starterCode?.javascript?.trim()) {
      showError('Please enter JavaScript starter code');
      return;
    }
    
    // --- MODIFIED Validation ---
    if (questions[currentQuestion].visibleTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
        showError('Please complete all visible test cases');
        return;
    }
    if (questions[currentQuestion].hiddenTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
        showError('Please complete all hidden test cases');
        return;
    }

    if (currentQuestion < parseInt(numberOfQuestions)) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1); // Corrected from + 1
    }
  };

  const handleSaveContest = async () => {
    // --- MODIFIED Full Contest Validation ---
    for (let i = 1; i <= parseInt(numberOfQuestions); i++) {
        if (!questions[i].problem.trim()) {
            showError(`Please complete problem statement for question ${i}`);
            return;
        }
        if (questions[i].visibleTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
            showError(`Please complete all visible test cases for question ${i}`);
            return;
        }
        if (questions[i].hiddenTestCases.some(tc => !tc.input.trim() || !tc.output.trim())) {
            showError(`Please complete all hidden test cases for question ${i}`);
            return;
        }
        if (!questions[i].problemDetails?.inputFormat?.trim()) {
            showError(`Please complete input format for question ${i}`);
            return;
        }
        if (!questions[i].problemDetails?.outputFormat?.trim()) {
            showError(`Please complete output format for question ${i}`);
            return;
        }
        if (!questions[i].starterCode?.python?.trim()) {
            showError(`Please complete Python starter code for question ${i}`);
            return;
        }
        if (!questions[i].starterCode?.java?.trim()) {
            showError(`Please complete Java starter code for question ${i}`);
            return;
        }
        if (!questions[i].starterCode?.javascript?.trim()) {
            showError(`Please complete JavaScript starter code for question ${i}`);
            return;
        }
    }

    let contestGeneralData = {};
    
    try {
        const stored = localStorage.getItem('contestFormData');
        if (stored) {
            contestGeneralData = JSON.parse(stored);
        } else {
            throw new Error('No contest data found in localStorage');
        }
    } catch (e) {
        showError('Contest general information not found. Please go back and fill in the contest details first.');
        return;
    }

    if (!contestGeneralData.title || !contestGeneralData.description) {
        showError('Contest title and description not found. Please go back and fill in the contest details first.');
        return;
    }

    const dataToSend = {
        contestTitle: contestGeneralData.title,
        contestDescription: contestGeneralData.description,
        duration: contestGeneralData.duration,
        pointsPerProgram: contestGeneralData.pointsPerProgram,
        contestMode: contestGeneralData.mode, 
        contestType: contestGeneralData.type, 
        topicsCovered: contestGeneralData.topicsCovered,
        allowedDepartments: contestGeneralData.allowedDepartments,
        numberOfQuestions: parseInt(numberOfQuestions),
        selectedLanguage: selectedLanguage,
        questions: questions, // This now contains the visible/hidden test cases
    };

    console.log('Data being sent to API:', dataToSend);

    try {
        // TODO: Make sure this endpoint matches your backend routes
        const response = await fetch('/api/admin/create-contest', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // TODO: Add Authorization header if needed
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const errorData = await response.json();
            showError(`Failed to create contest: ${errorData.message || 'Unknown error'}`);
            return;
        }

        const result = await response.json();
        showSuccess('Contest created successfully!');
        
        if (result.event) {
            addNewEvent(result.event);
        }
        
        localStorage.removeItem('contestFormData');
        navigate('/manage-contest');

    } catch (error) {
        console.error('Network or unexpected error:', error);
        showError('An unexpected error occurred while saving the contest.');
    }
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
              className={`language-card ${selectedLanguage === 'javascript' ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage('javascript')}
            >
              <div className="language-icon">
                <Code size={24} />
              </div>
              <h3>JavaScript</h3>
              <p>JavaScript programming language</p>
            </div>

            <div
              className={`language-card ${selectedLanguage === 'both' ? 'selected' : ''}`}
              onClick={() => setSelectedLanguage('both')}
            >
              <div className="language-icon">
                <Code size={24} />
              </div>
              <h3>All Three</h3>
              <p>Python, Java and JavaScript</p>
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

        {/* --- MODIFIED JSX for Visible Test Cases --- */}
        <div className="test-cases-section">
          <div className="section-header">
            <h3>
              <Eye size={16} />
              Visible Test Cases (Examples)
            </h3>
            <button className="add-test-case-btn" onClick={addVisibleTestCase}>
              <Plus size={16} />
              Add Visible Test Case
            </button>
          </div>
          <p className="section-subtitle">These test cases will be visible to the student as examples.</p>
          
          {questions[currentQuestion]?.visibleTestCases?.map((testCase, index) => (
            <div key={index} className="test-case-card">
              <div className="test-case-header">
                <span>Visible Case {index + 1}</span>
                {questions[currentQuestion].visibleTestCases.length > 1 && (
                  <button 
                    className="remove-test-case-btn"
                    onClick={() => removeVisibleTestCase(index)}
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
                    placeholder="Example input..."
                    value={testCase.input}
                    onChange={(e) => handleVisibleTestCaseChange(index, 'input', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <p className="label">Expected Output</p>
                  <textarea
                    rows="3"
                    placeholder="Expected output..."
                    value={testCase.output}
                    onChange={(e) => handleVisibleTestCaseChange(index, 'output', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input/Output Format Section */}
        <div className="io-format-section">
          <h3>
            <Code size={16} />
            Input/Output Format
          </h3>
          <div className="io-format-grid">
            <div className="form-group">
              <p className="label">Input Format</p>
              <textarea
                rows="2"
                placeholder="Describe the input format..."
                value={questions[currentQuestion]?.problemDetails?.inputFormat || ''}
                onChange={e => handleProblemDetailsChange('inputFormat', e.target.value)}
              />
            </div>
            <div className="form-group">
              <p className="label">Output Format</p>
              <textarea
                rows="2"
                placeholder="Describe the output format..."
                value={questions[currentQuestion]?.problemDetails?.outputFormat || ''}
                onChange={e => handleProblemDetailsChange('outputFormat', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Starter Code Section */}
        <div className="starter-code-section">
          <h3>
            <Code size={16} />
            Starter Code
          </h3>
          <div className="starter-code-grid">
            <div className="form-group">
              <p className="label">Python</p>
              <textarea
                rows="3"
                placeholder="Python starter code..."
                value={questions[currentQuestion]?.starterCode?.python || ''}
                onChange={e => handleStarterCodeChange('python', e.target.value)}
              />
            </div>
            <div className="form-group">
              <p className="label">Java</p>
              <textarea
                rows="5"
                placeholder="Java starter code..."
                value={questions[currentQuestion]?.starterCode?.java || ''}
                onChange={e => handleStarterCodeChange('java', e.target.value)}
              />
            </div>
            <div className="form-group">
              <p className="label">JavaScript</p>
              <textarea
                rows="3"
                placeholder="JavaScript starter code..."
                value={questions[currentQuestion]?.starterCode?.javascript || ''}
                onChange={e => handleStarterCodeChange('javascript', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- MODIFIED JSX for Hidden Test Cases --- */}
        <div className="test-cases-section">
          <div className="section-header">
            <h3>
              <EyeOff size={16} />
              Hidden Test Cases
            </h3>
            <button className="add-test-case-btn" onClick={addHiddenTestCase}>
              <Plus size={16} />
              Add Hidden Test Case
            </button>
          </div>
          <p className="section-subtitle">These test cases will be used for judging and are NOT visible to the student.</p>

          {questions[currentQuestion]?.hiddenTestCases?.map((testCase, index) => (
            <div key={index} className="test-case-card">
              <div className="test-case-header">
                <span>Hidden Case {index + 1}</span>
                {questions[currentQuestion].hiddenTestCases.length > 1 && (
                  <button 
                    className="remove-test-case-btn"
                    onClick={() => removeHiddenTestCase(index)}
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
                    onChange={(e) => handleHiddenTestCaseChange(index, 'input', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <p className="label">Expected Output</p>
                  <textarea
                    rows="3"
                    placeholder="Expected output..."
                    value={testCase.output}
                    onChange={(e) => handleHiddenTestCaseChange(index, 'output', e.target.value)}
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
      <AdminNavbar />

      <div className="content-wrapper">
        {step === 1 && renderConfigStep()}
        {step === 2 && renderQuestionStep()}
      </div>
    </div>
  );
}

export default CreateContestQuestions;
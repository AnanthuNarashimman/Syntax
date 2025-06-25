import { useState } from "react";
import { 
  Home, 
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
  Activity
} from 'lucide-react';
import '../Styles/PageStyles/CreateContest.css';
import AdminNavbar from "../Components/AdminNavbar";

import Create from '../assets/Images/Create.svg';

function CreateContest() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  const [activeTab, setActiveTab] = useState('create');

  const sidebarItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'create', label: 'Create Contest', icon: Plus },
    { id: 'manage', label: 'Manage Events', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const handleTypeSelection = (type) => {
    setSelectedType(type);
    if (type === 'article') {
      // Articles don't need mode selection, go directly to form
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedType('');
    } else if (step === 3) {
      if (selectedType === 'article') {
        setStep(1);
        setSelectedType('');
      } else {
        setStep(2);
        setSelectedMode('');
      }
    }
  };

  const renderStepOne = () => (
    <div className="step-container">
      <h2 className="step-title">Choose Contest Type</h2>
      <p className="step-subtitle">Select the type of content you want to create</p>
      
      <div className="options-grid">
        <div 
          className="option-card"
          onClick={() => handleTypeSelection('quiz')}
        >
          <div className="option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Quiz</h3>
          <p>Create multiple choice questions and assessments</p>
        </div>

        <div 
          className="option-card"
          onClick={() => handleTypeSelection('contest')}
        >
          <div className="option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Coding Contest</h3>
          <p>Create programming challenges and competitions</p>
        </div>

        <div 
          className="option-card"
          onClick={() => handleTypeSelection('article')}
        >
          <div className="option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Practice Article</h3>
          <p>Upload educational content and practice materials</p>
        </div>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="step-container">
      <h2 className="step-title">Choose {selectedType === 'quiz' ? 'Quiz' : 'Contest'} Mode</h2>
      <p className="step-subtitle">Select how you want participants to engage with your {selectedType}</p>
      
      <div className="options-grid two-column">
        <div 
          className="option-card mode-card"
          onClick={() => handleModeSelection('strict')}
        >
          <div className="option-icon strict">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Strict Mode</h3>
          <p>Timed assessment with marks and scoring</p>
          <ul className="mode-features">
            <li>Limited time duration</li>
            <li>Scoring system</li>
            <li>Immediate results</li>
            <li>Leaderboard ranking</li>
          </ul>
        </div>

        <div 
          className="option-card mode-card"
          onClick={() => handleModeSelection('practice')}
        >
          <div className="option-icon practice">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7089 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Practice Mode</h3>
          <p>Flexible learning environment for skill development</p>
          <ul className="mode-features">
            <li>No time restrictions</li>
            <li>Multiple attempts</li>
            <li>Detailed explanations</li>
            <li>Progress tracking</li>
          </ul>
        </div>
      </div>

      <button className="back-button" onClick={handleBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Type Selection
      </button>
    </div>
  );

  const renderStepThree = () => (
    <div className="step-container">
      <h2 className="step-title">
        Create {selectedType === 'article' ? 'Practice Article' : 
               selectedType === 'quiz' ? `${selectedMode === 'strict' ? 'Strict' : 'Practice'} Quiz` :
               `${selectedMode === 'strict' ? 'Strict' : 'Practice'} Contest`}
      </h2>
      <p className="step-subtitle">Configure your {selectedType} settings</p>
      
      <div className="form-container">
        <div className="form-group">
          <p htmlFor="title">Title</p>
          <input type="text" id="title" placeholder="Enter title" />
        </div>

        <div className="form-group">
          <p htmlFor="description">Description</p>
          <textarea id="description" rows="4" placeholder="Enter description"></textarea>
        </div>

        {selectedType !== 'article' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <p className="p" htmlFor="duration">Duration (minutes)</p>
                <input 
                  type="number" 
                  id="duration" 
                  placeholder="60" 
                  disabled={selectedMode === 'practice'}
                />
              </div>
              <div className="form-group">
                <p className="p" htmlFor="points">Points per question</p>
                <input type="number" id="points" placeholder="100" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <p className="p" htmlFor="attempts">Max Attempts</p>
                <input 
                  type="number" 
                  id="attempts" 
                  placeholder={selectedMode === 'practice' ? "Unlimited" : "3"} 
                />
              </div>
              <div className="form-group">
                <p htmlFor="difficulty">Difficulty</p>
                <select id="difficulty">
                  <option value="">Select difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </>
        )}

        {selectedType === 'article' && (
          <div className="form-group">
            <p htmlFor="file">Upload Article</p>
            <div className="file-upload">
              <input type="file" id="file" accept=".pdf,.doc,.docx,.txt" />
              <span>Choose file or drag and drop</span>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="back-button" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button className="create-button">
            Create {selectedType === 'article' ? 'Article' : selectedType === 'quiz' ? 'Quiz' : 'Contest'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="create-contest">
        <AdminNavbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          sidebarItems={sidebarItems}
        />

      <div className="content-wrapper">
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Type</span>
          </div>
          {selectedType !== 'article' && (
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Mode</span>
            </div>
          )}
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">{selectedType === 'article' ? '2' : '3'}</div>
            <span>Configure</span>
          </div>
        </div>

        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
      </div>
    </div>

    <img className="createImg" src={Create}></img>
    </>
  );
}

export default CreateContest

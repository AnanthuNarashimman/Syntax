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
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';

import Create from '../assets/Images/Create.svg';

function CreateContest() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topicsCovered: '',
    duration: '', // Added
    pointsPerProgram: '', // Added
    allowedDepartments: '' // Added department field
  });

  const [activeTab, setActiveTabState] = useState('create');
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  const [articleInputType, setArticleInputType] = useState('file'); // 'file' or 'link'
  const [articleFile, setArticleFile] = useState(null);
  const [articleLink, setArticleLink] = useState('');
  const [articleText, setArticleText] = useState('');

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArticleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
      setArticleFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setArticleText(event.target.result);
      };
      reader.readAsText(file);
    } else {
      setArticleFile(null);
      setArticleText('');
      showError('Only .txt files are accepted for article upload.');
    }
  };

  const handleArticleLinkChange = (e) => {
    setArticleLink(e.target.value);
  };

  const handleCreate = async () => {
    // Validate form data
    if (!formData.title.trim() || !formData.description.trim() || !formData.topicsCovered.trim() || !formData.allowedDepartments.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    if (selectedType === 'article') {
      if (articleInputType === 'file') {
        if (!articleFile || !articleText.trim()) {
          showError('Please upload a valid .txt file for the article.');
          return;
        }
      } else if (articleInputType === 'link') {
        if (!articleLink.trim()) {
          showError('Please provide a valid article link.');
          return;
        }
      }
      // Send article to backend
      try {
        const payload = {
          title: formData.title,
          description: formData.description,
          topicsCovered: formData.topicsCovered,
          allowedDepartments: formData.allowedDepartments,
          type: 'article',
          articleContent: articleInputType === 'file' ? articleText : undefined,
          articleLink: articleInputType === 'link' ? articleLink : undefined,
        };
        const response = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          showError(data.message || 'Failed to create article.');
          return;
        }
        showSuccess('Article created successfully!');
        // Optionally reset form or navigate
      } catch (err) {
        showError('Failed to create article.');
      }
      return;
    }

    if (!formData.duration.trim() || !formData.pointsPerProgram.trim()) {
      showError('Please fill in all required fields');
      return;
    }
    localStorage.setItem('contestFormData', JSON.stringify({
      ...formData,
      type: selectedType,
      mode: selectedMode
    }));
    if (selectedType === 'quiz') {
      navigate('/create-quiz-questions');
    } else if (selectedType === 'contest') {
      navigate('/create-contest-questions');
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
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.7893 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          <input 
            type="text" 
            id="title" 
            placeholder="Enter title" 
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
        </div>

        <div className="form-group">
          <p htmlFor="description">Description</p>
          <textarea 
            id="description" 
            rows="4" 
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <p htmlFor="topicsCovered">Topics Covered</p>
          <textarea 
            id="topicsCovered" 
            rows="3" 
            placeholder="Enter topics covered (separated by commas)"
            value={formData.topicsCovered}
            onChange={(e) => handleInputChange('topicsCovered', e.target.value)}
          ></textarea>
        </div>

        {/* New fields for duration and pointsPerProgram */}
        {selectedType !== 'article' && (
          <>
            <div className="form-group">
              <p htmlFor="duration">Duration (minutes)</p>
              <input
                type="number"
                id="duration"
                placeholder="Enter duration in minutes"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                min="1"
              />
            </div>
            <div className="form-group">
              <p htmlFor="pointsPerProgram">Points per Problem</p>
              <input
                type="number"
                id="pointsPerProgram"
                placeholder="Enter points per problem"
                value={formData.pointsPerProgram}
                onChange={(e) => handleInputChange('pointsPerProgram', e.target.value)}
                min="1"
              />
            </div>
          </>
        )}

        {selectedType === 'article' && (
          <>
            <div className="form-group">
              <p>Article Input Type</p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <p style={{margin: 0, display: 'flex', alignItems: 'center'}}>
                  <input
                    type="radio"
                    name="articleInputType"
                    value="file"
                    checked={articleInputType === 'file'}
                    onChange={() => setArticleInputType('file')}
                    style={{ marginRight: '0.5em' }}
                  />
                  Upload .txt File
                </p>
                <p style={{margin: 0, display: 'flex', alignItems: 'center'}}>
                  <input
                    type="radio"
                    name="articleInputType"
                    value="link"
                    checked={articleInputType === 'link'}
                    onChange={() => setArticleInputType('link')}
                    style={{ marginRight: '0.5em' }}
                  />
                  Provide Link
                </p>
              </div>
            </div>
            {articleInputType === 'file' && (
              <div className="form-group">
                <p htmlFor="file">Upload Article (.txt only)</p>
                <div
                  className="file-upload"
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleArticleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDragEnter={e => e.preventDefault()}
                  style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#fafbfc',
                    color: '#333',
                  }}
                  onClick={() => document.getElementById('article-file-input').click()}
                >
                  <input
                    type="file"
                    id="article-file-input"
                    accept=".txt"
                    style={{ display: 'none' }}
                    onChange={handleArticleFileChange}
                  />
                  <span>
                    {articleFile ? articleFile.name : 'Click or drag and drop a .txt file here'}
                  </span>
                </div>
              </div>
            )}
            {articleInputType === 'link' && (
              <div className="form-group">
                <p htmlFor="articleLink">Article Link</p>
                <input
                  type="url"
                  id="articleLink"
                  placeholder="Paste article link (e.g. GeeksforGeeks)"
                  value={articleLink}
                  onChange={handleArticleLinkChange}
                />
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <p htmlFor="allowedDepartments">Allowed to Attend</p>
          <select
            id="allowedDepartments"
            value={formData.allowedDepartments}
            onChange={(e) => handleInputChange('allowedDepartments', e.target.value)}
          >
            <option value="">Select Departments</option>
            <option value="Any department">Any department</option>
            <option value="CSE">CSE</option>
            <option value="EEE">EEE</option>
            <option value="ECE">ECE</option>
            <option value="IT">IT</option>
            <option value="CSD">CSD</option>
          </select>
        </div>

        <div className="form-actions">
          <button className="back-button" onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button className="create-button" onClick={handleCreate}>
            Create {selectedType === 'article' ? 'Article' : selectedType === 'quiz' ? 'Quiz' : 'Contest'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="create-contest">
        <AdminNavbar />

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
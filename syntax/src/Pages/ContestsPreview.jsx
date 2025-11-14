import React, { useState, useEffect } from 'react';
import styles from '../Styles/PageStyles/ContestsPreview.module.css';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import {
  User, Code, FileText, BarChart2, Clock, Calendar, Trophy,
  Target, Users, BookOpen, Zap, Award, Timer, CheckCircle,
  AlertCircle, Play, ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import contestsImg from '../assets/Images/contests.png';
import axios from 'axios';

const ContestsPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [contestData, setContestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventStatus, setEventStatus] = useState('not_started');
  const [eventResults, setEventResults] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [userAttemptData, setUserAttemptData] = useState(null);

  // Get contest data from navigation state
  const passedContestData = location.state?.contestData;

  // Load contest data from navigation state
  useEffect(() => {
    const loadContestData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate brief loading for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use passed data if available
        if (passedContestData) {
          setContestData(passedContestData);
          
          // Check event status after loading contest data
          if (passedContestData.id) {
            await checkEventStatus(passedContestData.id);
          }
        } else {
          setError('No contest data provided. Please select a contest from the list.');
        }
      } catch (err) {
        console.error('Error loading contest data:', err);
        setError('Failed to load contest data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadContestData();
  }, [passedContestData, location.state]);

  // Function to check event status
  const checkEventStatus = async (eventId) => {
    try {
      setStatusLoading(true);
      const response = await axios.post('/api/student/check-status', {
        eventId: eventId
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Event Status Response:', response.data);
      setEventStatus(response.data.eventStatus);
      
      // Store user attempt data if available
      if (response.data.data) {
        setUserAttemptData(response.data.data);
      }

      // If completed, fetch results from the new API
      if (response.data.eventStatus === 'completed') {
        await fetchEventResults(eventId);
      }
    } catch (error) {
      console.error('Error checking event status:', error);
      setEventStatus('not_started'); // Default to not started on error
    } finally {
      setStatusLoading(false);
    }
  };

  // Function to fetch event results
  const fetchEventResults = async (eventId) => {
    try {
      const response = await axios.post('/api/student/event-result', {
        eventId: eventId
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Event Results Response:', response.data);
      if (response.data.result) {
        setEventResults(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching event results:', error);
      // Try fallback to localStorage
      const savedResults = localStorage.getItem(`quiz_${eventId}_final`);
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        if (parsedResults.validationResults) {
          setEventResults(parsedResults.validationResults);
        }
      }
    }
  };

  // Utility functions for real data structure
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not specified';

    try {
      let date;

      // Handle Firestore timestamp
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'Not specified';
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not specified';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Not specified';
    }
  };

  // Get formatted contest/quiz information - handles both API data and mock data
  const getEventInfo = (data) => {
    if (!data) return {};

    // Check if it's mock data (has 'title' instead of 'eventTitle')
    const isMockData = data.title && !data.eventTitle;

    if (isMockData) {
      // Handle mock data structure
      const isQuiz = data.type === 'Quiz';
      return {
        title: data.title || 'Untitled Event',
        description: `This is a ${data.type.toLowerCase()} for ${data.department} department. Duration: ${data.duration}`,
        type: isQuiz ? 'quiz' : 'contest',
        mode: 'practice',
        departments: data.department || 'All Departments',
        duration: parseInt(data.duration) || 60, // Extract number from "2 hours" etc.
        totalScore: isQuiz ? 50 : 100,
        topics: isQuiz ? 'General Knowledge, Aptitude' : 'Programming, Algorithms',
        rules: isQuiz ? 'Answer all questions within time limit' : 'Submit working code solutions',
        status: 'active',
        participants: Math.floor(Math.random() * 50) + 10, // Random for demo
        organizer: 'Syntax',
        createdAt: new Date(),
        leaderboardEnabled: true,
        questions: [], // Mock data doesn't have detailed questions
        questionCount: isQuiz ? 10 : 5,
        pointsPerItem: isQuiz ? 5 : 20
      };
    } else {
      // Handle real API data structure
      const isQuiz = data.eventType === 'quiz';
      return {
        title: data.eventTitle || 'Untitled Event',
        description: data.eventDescription || 'No description available',
        type: data.eventType || 'contest',
        mode: data.eventMode || 'practice',
        departments: data.allowedDepartments || 'All Departments',
        duration: data.durationMinutes || 0,
        totalScore: data.totalScore || (isQuiz ? data.numberOfQuestions * data.pointsPerQuestion : data.numberOfPrograms * data.pointsPerProgram) || 0,
        topics: data.topicsCovered || 'General',
        rules: data.rules || 'Follow standard contest rules',
        status: data.status || 'active',
        participants: data.participants?.length || 0,
        organizer: data.organizer || 'Syntax',
        createdAt: data.createdAt,
        leaderboardEnabled: data.leaderboardEnabled || false,
        questions: isQuiz ? data.questions || [] : data.problems || [],
        questionCount: isQuiz ? data.numberOfQuestions || 0 : data.numberOfPrograms || 0,
        pointsPerItem: isQuiz ? data.pointsPerQuestion || 1 : data.pointsPerProgram || 1
      };
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', color: '#3b82f6', bgColor: '#eff6ff', icon: Clock };
      case 'active':
        return { label: 'Active', color: '#10b981', bgColor: '#ecfdf5', icon: Play };
      case 'completed':
        return { label: 'Completed', color: '#6b7280', bgColor: '#f9fafb', icon: CheckCircle };
      default:
        return { label: 'Unknown', color: '#ef4444', bgColor: '#fef2f2', icon: AlertCircle };
    }
  };



  const handleStartContest = async () => {
    if (eventStatus === 'completed') {
      // Do nothing for completed events
      return;
    }

    if (eventStatus === 'in_progress') {
      // Allow resuming the event
      const isMockData = contestData.title && !contestData.eventTitle;
      const eventType = isMockData ?
        (contestData.type === 'Quiz' ? 'quiz' : 'contest') :
        contestData.eventType;

      if (eventType === 'quiz') {
        navigate('/student-quiz', { state: { quizData: contestData } });
      } else {
        // Navigate to contest execution page
        navigate(`/contest/${contestData.id}`);
      }
      return;
    }

    // Start new event
    try {
      setIsStarting(true);
      
      // Make API call to start event
      const response = await axios.post('/api/student/start-event', {
        eventId: contestData.id
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('Event started successfully');
        setEventStatus('in_progress');

        // Check if it's mock data
        const isMockData = contestData.title && !contestData.eventTitle;
        const eventType = isMockData ?
          (contestData.type === 'Quiz' ? 'quiz' : 'contest') :
          contestData.eventType;

        console.log(`Starting ${eventType}...`, contestData.id);

        // Navigate to appropriate page based on type
        if (eventType === 'quiz') {
          navigate('/student-quiz', { state: { quizData: contestData } });
        } else {
          // Navigate to contest execution page
          navigate(`/contest/${contestData.id}`);
        }
      } else {
        throw new Error('Failed to start event');
      }
    } catch (error) {
      console.error('Error starting event:', error);
      alert(`Failed to start event. Please try again.`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleBack = () => {
    navigate('/student-contests');
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className={styles.studentContests}>
          <div className={styles.contestsContainer} style={{marginTop: '100px !important'}}>
            <Loader />
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudentNavbar />
        <div className={styles.studentContests}>
          <div className={styles.contestsContainer}>
            <div className={styles.errorMessage}>
              <h2>Error Loading Contest</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!contestData) {
    return (
      <>
        <StudentNavbar />
        <div className={styles.studentContests}>
          <div className={styles.contestsContainer}>
            <div className={styles.errorMessage}>
              <h2>Contest Not Found</h2>
              <p>The requested contest could not be found.</p>
              <button onClick={() => navigate('/student-contests')}>Back to Contests</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Extract event information using real data structure
  const eventInfo = getEventInfo(contestData);
  const statusInfo = getStatusInfo(eventInfo.status);
  const isQuiz = eventInfo.type === 'quiz';
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <StudentNavbar />
      <div className={styles.studentContests}>
        <div className={styles.contestsContainer}>
          {/* Header with Back Button */}
          <div className={styles.pageHeader}>
            <button className={styles.backBtn} onClick={handleBack}>
              <ArrowLeft size={20} />
              Back to Contests
            </button>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>
                {isQuiz ? 'Quiz' : 'Contest'} Details
              </h1>
              <p className={styles.pageSubtitle}>
                Review the information below and join when ready
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.contentGrid}>
            {/* Left Column - Main Information */}
            <div className={styles.mainContent}>
              {/* Title and Status */}
              <div className={styles.titleSection}>
                <div className={styles.titleHeader}>
                  <div className={styles.eventIcon}>
                    {isQuiz ? <BookOpen size={32} /> : <Code size={32} />}
                  </div>
                  <div className={styles.titleInfo}>
                    <h1 className={styles.eventTitle}>{eventInfo.title}</h1>
                    <div className={styles.eventMeta}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          color: eventStatus === 'completed' ? '#10b981' : statusInfo.color,
                          backgroundColor: eventStatus === 'completed' ? '#ecfdf5' : statusInfo.bgColor
                        }}
                      >
                        {eventStatus === 'completed' ? <CheckCircle size={14} /> : <StatusIcon size={14} />}
                        {eventStatus === 'completed' ? 'Completed' : statusInfo.label}
                      </span>
                      <span className={styles.modeBadge}>
                        <Award size={14} />
                        {eventInfo.mode === 'strict' ? 'Strict Mode' : 'Practice Mode'}
                      </span>
                      {eventStatus === 'completed' && (
                        <span 
                          className={styles.statusBadge}
                          style={{
                            color: '#059669',
                            backgroundColor: '#d1fae5'
                          }}
                        >
                          <Trophy size={14} />
                          {isQuiz ? 'Quiz' : 'Contest'} Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.descriptionSection}>
                <h3 className={styles.sectionTitle}>Description</h3>
                <p className={styles.description}>{eventInfo.description}</p>
              </div>

              {/* Topics/Tags */}
              <div className={styles.topicsSection}>
                <h3 className={styles.sectionTitle}>Topics Covered</h3>
                <div className={styles.topicsList}>
                  {eventInfo.topics.split(',').map((topic, index) => (
                    <span key={index} className={styles.topicTag}>
                      {topic.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div className={styles.rulesSection}>
                <h3 className={styles.sectionTitle}>Rules & Guidelines</h3>
                <ul className={styles.rulesList}>
                  {eventInfo.rules.split('.').filter(rule => rule.trim()).map((rule, index) => (
                    <li key={index} className={styles.ruleItem}>
                      <CheckCircle size={16} />
                      {rule.trim()}
                    </li>
                  ))}
                  {/* Add default rules based on event type */}
                  <li className={styles.ruleItem}>
                    <CheckCircle size={16} />
                    {isQuiz ? 'Answer all questions within the time limit' : 'Submit your code before the deadline'}
                  </li>
                  <li className={styles.ruleItem}>
                    <CheckCircle size={16} />
                    {isQuiz ? 'No external help allowed' : 'Original code only - no plagiarism'}
                  </li>
                  {eventInfo.leaderboardEnabled && (
                    <li className={styles.ruleItem}>
                      <CheckCircle size={16} />
                      Results will be displayed on the leaderboard
                    </li>
                  )}
                </ul>
              </div>
              {/* Results Display for Completed Events */}
              {eventStatus === 'completed' && (
                <div className={styles.resultsCard}>
                  <h3 className={styles.resultsTitle}>
                    <Trophy size={24} />
                    Your Results
                  </h3>
                  {eventResults ? (
                    <div className={styles.resultsContent}>
                      {/* Check if it's API data (from eventResults collection) or localStorage data */}
                      {eventResults.points !== undefined ? (
                        // API data format
                        <div className={styles.apiResultsLayout}>
                          <div className={styles.leftResultsPanel}>
                            <div className={styles.pointsSection}>
                              <div className={styles.pointsDisplay}>
                                <div className={styles.pointsIcon}>
                                  <Trophy size={32} />
                                </div>
                                <div className={styles.pointsInfo}>
                                  <div className={styles.pointsValue}>{eventResults.points}</div>
                                  <div className={styles.pointsLabel}>Points Earned</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className={styles.submissionSection}>
                              <div className={styles.submissionHeader}>
                                <CheckCircle size={20} />
                                <span>Successfully Submitted</span>
                              </div>
                              <div className={styles.submissionDetails}>
                                <div className={styles.submissionItem}>
                                  <Calendar size={16} />
                                  <div className={styles.submissionInfo}>
                                    <span className={styles.submissionLabel}>Submitted on</span>
                                    <span className={styles.submissionValue}>
                                      {(() => {
                                        try {
                                          let date;

                                          const submitted = eventResults.submittedAt;

                                          // 1) Firestore Timestamp-like object with toDate() method
                                          if (submitted?.toDate && typeof submitted.toDate === 'function') {
                                            date = submitted.toDate();
                                          }
                                          // 2) Firestore-like raw object with seconds/_seconds and nanoseconds/_nanoseconds
                                          else if (submitted && (submitted.seconds !== undefined || submitted._seconds !== undefined)) {
                                            const secs = submitted.seconds !== undefined ? submitted.seconds : submitted._seconds;
                                            const nanos = submitted.nanoseconds !== undefined ? submitted.nanoseconds : (submitted._nanoseconds || 0);
                                            const ms = Number(secs) * 1000 + Math.floor(Number(nanos) / 1e6);
                                            date = new Date(ms);
                                          }
                                          // 3) Firebase formatted string like "14 September 2025 at 17:29:40 UTC+5:30"
                                          else if (typeof submitted === 'string' && submitted.includes(' at ')) {
                                            const cleaned = submitted.replace(/ UTC[+-]\d{1,2}:\d{2}$/, '').replace(' at ', ' ');
                                            date = new Date(cleaned);
                                          }
                                          // 4) Direct Date or ISO/number string
                                          else if (submitted instanceof Date) {
                                            date = submitted;
                                          } else if (typeof submitted === 'number' || typeof submitted === 'string') {
                                            date = new Date(submitted);
                                          } else {
                                            return 'Date not available';
                                          }

                                          // Validate
                                          if (!date || isNaN(date.getTime())) {
                                            return 'Invalid Date';
                                          }

                                          return date.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          });
                                        } catch (error) {
                                          console.error('Date parsing error:', error, 'for value:', eventResults.submittedAt);
                                          return 'Date parsing error';
                                        }
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.submissionItem}>
                                  <Target size={16} />
                                  <div className={styles.submissionInfo}>
                                    <span className={styles.submissionLabel}>Event ID</span>
                                    <span className={styles.submissionValue}>{eventResults.eventId}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // localStorage data format (fallback)
                        <div className={styles.scoreOverview}>
                          <div className={styles.scoreItem}>
                            <div className={styles.scoreLabel}>Score</div>
                            <div className={styles.scoreValue}>
                              {eventResults.CorrectAnswerCount} / {Object.keys(eventResults.QuizResult || {}).length}
                            </div>
                          </div>
                          <div className={styles.scoreItem}>
                            <div className={styles.scoreLabel}>Percentage</div>
                            <div className={styles.scoreValue}>
                              {Object.keys(eventResults.QuizResult || {}).length > 0 
                                ? ((eventResults.CorrectAnswerCount / Object.keys(eventResults.QuizResult).length) * 100).toFixed(1)
                                : 0}%
                            </div>
                          </div>
                          <div className={styles.scoreItem}>
                            <div className={styles.scoreLabel}>Points</div>
                            <div className={styles.scoreValue}>{eventResults.Points || 0}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.resultsPlaceholder}>
                      <CheckCircle size={24} />
                      <p>You have successfully completed this {isQuiz ? 'quiz' : 'contest'}!</p>
                      <p className={styles.placeholderSubtext}>Results have been recorded.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Stats and Actions */}
            <div className={styles.sidebar}>
              {/* Quick Stats */}
              <div className={styles.statsCard}>
                <h3 className={styles.cardTitle}>Quick Stats</h3>
                <div className={styles.statsList}>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <Timer size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Duration</span>
                      <span className={styles.statValue}>{eventInfo.duration} minutes</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <Trophy size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Total Points</span>
                      <span className={styles.statValue}>{eventInfo.totalScore}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <Users size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Participants</span>
                      <span className={styles.statValue}>{eventInfo.participants}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <BookOpen size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>{isQuiz ? 'Questions' : 'Problems'}</span>
                      <span className={styles.statValue}>{eventInfo.questionCount}</span>
                    </div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <Calendar size={20} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Created</span>
                      <span className={styles.statValue}>
                        {formatDate(eventInfo.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Info */}
              <div className={styles.infoCard}>
                <h3 className={styles.cardTitle}>Event Information</h3>
                <div className={styles.infoContent}>
                  <div className={styles.infoItem}>
                    <Users size={16} />
                    <span>Departments: {eventInfo.departments}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <Target size={16} />
                    <span>Event ID: {contestData.id || 'N/A'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <Award size={16} />
                    <span>Organizer: {eventInfo.organizer}</span>
                  </div>
                  {eventInfo.leaderboardEnabled && (
                    <div className={styles.infoItem}>
                      <Trophy size={16} />
                      <span>Leaderboard: Enabled</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionCard}>
                {statusLoading ? (
                  <button className={styles.primaryBtn} disabled>
                    <Play size={20} />
                    Checking Status...
                  </button>
                ) : (
                  <>
                    <button
                      className={`${styles.primaryBtn} ${eventStatus === 'completed' ? styles.submittedBtn : ''}`}
                      onClick={handleStartContest}
                      disabled={isStarting || eventStatus === 'completed' || (eventInfo.status === 'ended' && eventStatus !== 'in_progress')}
                    >
                      {eventStatus === 'completed' ? (
                        <>
                          <CheckCircle size={20} />
                          Submitted
                        </>
                      ) : (
                        <>
                          <Play size={20} />
                          {isStarting ? 'Starting...' :
                           eventStatus === 'in_progress' ? `Resume ${isQuiz ? 'Quiz' : 'Contest'}` :
                           eventInfo.status === 'ended' ? `${isQuiz ? 'Quiz' : 'Contest'} Ended` :
                           `Start ${isQuiz ? 'Quiz' : 'Contest'}`}
                        </>
                      )}
                    </button>
                  </>
                )}
                <button className={styles.secondaryBtn} onClick={handleBack}>
                  <ArrowLeft size={16} />
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContestsPreview;
import React, { useState, useEffect } from 'react';
import styles from '../Styles/PageStyles/ContestsPreview.module.css';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import { User, Code, FileText, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import contestsImg from '../assets/Images/contests.png';

const ContestsPreview = () => {
  const navigate = useNavigate();
  const [contestData, setContestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock contest data - this will be replaced with actual API calls
  const mockContestData = {
    id: 1,
    title: "Python Contest",
    participants: 65,
    department: "CSE",
    difficulty: "Easy",
    description: "A comprehensive contest covering basics of arrays and strings in python. This will be taken as your placement assessment. So students are asked to perform well. Based on your performance it'll be decided whether you'll be allowed or denied to further placement training classes.",
    tags: ["Python", "Arrays", "Strings"],
    duration: "2 hours",
    startTime: "2024-01-15T14:00:00Z",
    endTime: "2024-01-15T16:00:00Z",
    maxParticipants: 100,
    currentParticipants: 65,
    status: "upcoming",
    type: "coding",
    language: "Python",
    questions: 10,
    totalPoints: 100
  };

  // Simulate API call to fetch contest data
  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock API response - replace this with actual API call
        // const response = await fetch(`/api/contests/${contestId}`);
        // const data = await response.json();
        
        // For now, use mock data
        setContestData(mockContestData);
      } catch (err) {
        console.error('Error fetching contest data:', err);
        setError('Failed to load contest data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContestData();
  }, []);

  const handleStartContest = async () => {
    try {
      // Mock API call to start contest
      // const response = await fetch(`/api/contests/${contestData.id}/start`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include'
      // });
      
      console.log('Starting contest...', contestData.id);
      navigate('/contest-page');
    } catch (error) {
      console.error('Error starting contest:', error);
      // Handle error (show alert, etc.)
    }
  };

  const handleCancel = () => {
    console.log('Canceling...');
    navigate('/student-contests');
  };

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className={styles.studentContests}>
          <div className={styles.contestsContainer}>
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

  return (
    <>
      <StudentNavbar />
      <div className={styles.studentContests}>
        <div className={styles.contestsContainer}>
          <div className={styles['contest-card']}>
            <div className={styles['contest-details']}>
              <h1 className={styles['contest-title']}>{contestData.title}</h1>
              <div className={styles['contest-meta']}>
                <span className={styles['meta-item']}>
                  <User size={16} /> {contestData.currentParticipants}
                </span>
                <span className={styles['meta-item']}>
                  {contestData.department}
                </span>
                <span className={`${styles['meta-item']} ${styles['difficulty']}`}>
                  {contestData.difficulty}
                </span>
              </div>
              <p className={styles['contest-description']}>
                {contestData.description}
              </p>
              <div className={styles['contest-tags']}>
                {contestData.tags.map((tag, index) => (
                  <span key={index} className={styles['tag']}>{tag}</span>
                ))}
              </div>
              <div className={styles['contest-actions']}>
                <button 
                  className={`${styles['action-btn']} ${styles['start-btn']}`} 
                  onClick={handleStartContest}
                >
                  Start Contest
                </button>
                <button 
                  className={`${styles['action-btn']} ${styles['cancel-btn']}`} 
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className={styles['contest-image-container']}>
              <div className={styles['contest-image']}>
                <img src={contestsImg} alt="Contest Illustration" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContestsPreview;
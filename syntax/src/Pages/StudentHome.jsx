import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Users, Calendar, Clock, Target, Zap, BookOpen, Trophy } from 'lucide-react';
import StudentNavbar from "../Components/StudentNavbar";
import Loader from '../Components/Loader';
import { useContestContext } from '../contexts/ContestContext';
import styles from "../Styles/PageStyles/StudentHome.module.css";
import welcomeImg from '../assets/Images/welcome.jpg';
import findImg from '../assets/Images/find.jpg';
import { useAlert } from "../contexts/AlertContext";

const getInitial = (name) => name && name.length > 0 ? name[0].toUpperCase() : '?';

const StudentHome = () => {
  const { showError } = useAlert();

  // Get data from context
  const {
    studentContests,
    studentContestsLoading,
    getRecentStudentContests,
    formatStudentDate,
    getStudentContestStatus,
    fetchStudentContests,
    studentSubmissions,
    submissionsLoading,
    submissionsError,
    fetchStudentSubmissions
  } = useContestContext();

  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submissionStats, setSubmissionStats] = useState({
    contestsParticipated: 0,
    totalScore: 0
  });
  const [studentData, setStudentData] = useState({
    userName: 'User',
    department: '',
    year: '',
    section: '',
    semester: '',
    batch: '',
    rollNumber: '',
    college: '',
    languages: [],
    skills: []
  });

  // Get recent contests from context (fallback to mock data)
  const recentContests = getRecentStudentContests();
  const upcomingContests = recentContests.length > 0 ? recentContests : [
    {
      id: 1,
      title: "Weekly Coding Challenge",
      date: "Sunday 16:30",
      participants: 150,
      type: "contest",
      difficulty: "Medium",
      duration: "2 hours"
    },
    {
      id: 2,
      title: "Daily Practice Session",
      date: "Mon-Fri 17:00",
      participants: 200,
      type: "practice",
      difficulty: "Easy",
      duration: "1 hour"
    },
    {
      id: 3,
      title: "Aptitude Assessment",
      date: "Saturday 14:30",
      participants: 180,
      type: "quiz",
      difficulty: "Hard",
      duration: "45 min"
    }
  ];

  useEffect(() => {
    const fetchStudentProfile = async () => {
      try {
        const response = await fetch('/api/student/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student profile');
        }

        const data = await response.json();
        setStudentData({
          ...data.profile,
          languages: data.profile.languages || [],
          skills: data.profile.skills || []
        });
      } catch (error) {
        console.error('Error fetching student profile:', error);
        showError('Failed to load student profile');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [showError]);

  useEffect(() => {
    fetchStudentContests();
    fetchStudentSubmissions();
  }, []);

  // Update submission stats when context data loads
  useEffect(() => {
    if (!submissionsLoading && !submissionsError && studentSubmissions) {
      console.log('StudentHome - Updating submission stats:', studentSubmissions);
      setSubmissionStats({
        contestsParticipated: studentSubmissions.contestsParticipated || 0,
        totalScore: studentSubmissions.totalPoints || 0
      });
    }
  }, [submissionsLoading, studentSubmissions, submissionsError]);

  // Fallback: fetch submissions directly if context data is not available
  useEffect(() => {
    if (!loading && submissionsLoading) {
      const fetchSubmissionsDirectly = async () => {
        try {
          console.log('StudentHome - Fetching submissions directly...');
          const response = await fetch('/api/student/profile/submissions', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });

          if (response.ok) {
            const data = await response.json();
            console.log('StudentHome - Direct submissions result:', data);
            setSubmissionStats({
              contestsParticipated: data.Count || 0,
              totalScore: data.Points || 0
            });
          }
        } catch (error) {
          console.error('StudentHome - Error fetching submissions:', error);
        }
      };

      const timer = setTimeout(fetchSubmissionsDirectly, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, submissionsLoading]);

  const handleContestJoin = () => {
    if (contestCode.trim()) {
      console.log('Joining contest with code:', contestCode);
    }
  };

  if (loading) {
    return (
      <div className={styles.studentHome}>
        <StudentNavbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.studentHome}>
      <StudentNavbar />
      <div className={styles.homeContainer}>
            {/* Header Section */}
            <div className={styles.headerSection}>
              <div className={styles.welcomeCard}>
                <div className={styles.welcomeContent}>
                  <h1 className={styles.welcomeTitle}>
                    Welcome back, <span className={styles.highlight}>{studentData.userName}</span>!
                  </h1>
                  <p className={styles.welcomeSubtitle}>
                    Ready to conquer today's coding challenges?
                  </p>
                  <div className={styles.studentInfo}>
                    <span className={styles.infoTag}>{studentData.department}</span>
                    <span className={styles.infoTag}>Year {studentData.year}</span>
                    <span className={styles.infoTag}>Section {studentData.section}</span>
                  </div>
                </div>
                <div className={styles.welcomeImage}>
                  <img src={welcomeImg} alt="Welcome" />
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className={styles.statsSection}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Trophy size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{submissionStats.contestsParticipated}</h3>
                    <p className={styles.statLabel}>Events Participated</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Target size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>{submissionStats.totalScore}</h3>
                    <p className={styles.statLabel}>Total Points</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Award size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>Gold</h3>
                    <p className={styles.statLabel}>Current Tier</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className={styles.progressSection}>
              <div className={styles.progressCard}>
                <div className={styles.progressHeader}>
                  <h2 className={styles.progressTitle}>Level Progress</h2>
                  <div className={styles.progressBadge}>Gold Tier</div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{
                    width: `${Math.min((submissionStats.totalScore / 300) * 100, 100)}%`
                  }}></div>
                </div>
                <div className={styles.progressStats}>
                  <span>{submissionStats.totalScore} / 300 points</span>
                  <span>{Math.max(300 - submissionStats.totalScore, 0)} points to next level</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsSection}>
              <h2 className={styles.sectionTitle}>Quick Actions</h2>
              <div className={styles.actionsGrid}>
                <button className={styles.actionCard}>
                  <BookOpen size={24} />
                  <span>Practice Problems</span>
                </button>
                <button className={styles.actionCard}>
                  <Users size={24} />
                  <span>Join Contest</span>
                </button>
                <button className={styles.actionCard}>
                  <Trophy size={24} />
                  <span>View Leaderboard</span>
                </button>
                <button className={styles.actionCard}>
                  <Zap size={24} />
                  <span>Daily Challenge</span>
                </button>
              </div>
            </div>

            {/* Contest Join Section */}
            <div className={styles.contestSection}>
              <div className={styles.contestCard}>
                <div className={styles.contestContent}>
                  <h2 className={styles.contestTitle}>Join Live Contests</h2>
                  <p className={styles.contestDescription}>
                    Enter contest codes to participate in real-time coding challenges
                  </p>
                  <div className={styles.contestInput}>
                    <input
                      type="text"
                      placeholder="Enter contest code..."
                      value={contestCode}
                      onChange={(e) => setContestCode(e.target.value)}
                      className={styles.codeInput}
                    />
                    <button onClick={handleContestJoin} className={styles.joinButton}>
                      Join Contest
                    </button>
                  </div>
                </div>
                <div className={styles.contestIllustration}>
                  <img src={findImg} alt="Join Contest" />
                </div>
              </div>
            </div>

            {/* Upcoming Contests */}
            <div className={styles.upcomingSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Upcoming Contests</h2>
                <button className={styles.viewAllButton}>View All</button>
              </div>
              <div className={styles.contestsGrid}>
                {upcomingContests.map(contest => {
                  const isApiData = contest.eventTitle; // Check if it's API data
                  const statusInfo = isApiData ? getStudentContestStatus(contest.status || 'active') : null;

                  return (
                    <div key={contest.id} className={styles.contestItem}>
                      <div className={styles.contestHeader}>
                        <div className={styles.contestType}>
                          <span className={`${styles.typeBadge} ${styles[isApiData ? contest.eventType : contest.type]}`}>
                            {isApiData ? (contest.eventType === 'quiz' ? 'Quiz' : 'Contest') : contest.type}
                          </span>
                          {isApiData && statusInfo ? (
                            <span className={styles.difficulty} style={{ color: statusInfo.color }}>
                              {statusInfo.label}
                            </span>
                          ) : (
                            <span className={styles.difficulty}>{contest.difficulty}</span>
                          )}
                        </div>
                        <div className={styles.contestTime}>
                          <Clock size={16} />
                          <span>{isApiData ? `${contest.durationMinutes} min` : contest.duration}</span>
                        </div>
                      </div>
                      <h3 className={styles.contestName}>
                        {isApiData ? contest.eventTitle : contest.title}
                      </h3>
                      <div className={styles.contestMeta}>
                        <div className={styles.metaItem}>
                          <Calendar size={16} />
                          <span>
                            {isApiData ? formatStudentDate(contest.createdAt) : contest.date}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <Users size={16} />
                          <span>
                            {isApiData ?
                              `${contest.participants?.length || 0} participants` :
                              `${contest.participants} participants`
                            }
                          </span>
                        </div>
                      </div>
                      <button className={styles.contestJoinBtn}>Join Now</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
    </div>
  );
};

export default StudentHome;
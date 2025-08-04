import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import StudentNavbar from "../Components/StudentNavbar";
import Loader from '../Components/Loader';
import styles from "../Styles/PageStyles/StudentHome.module.css"; // Import as a 'styles' object
import welcomeImg from '../assets/Images/welcome.jpg';
import findImg from '../assets/Images/find.jpg';

const StudentHome = () => {
  const [contestCode, setContestCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    quiz: [30, 35, 32, 38, 30, 35, 40],
    codethon: [25, 30, 28, 35, 32, 30, 35],
    practice: [20, 25, 30, 28, 35, 40, 38]
  });

  const upcomingContests = [
    { id: 1, title: "Weekly Contest", date: "Sunday 16:30 pm", participants: 150 },
    { id: 2, title: "Daily Contest", date: "Monday - Friday 5:00 pm", participants: 200 },
    { id: 3, title: "Aptitude Quiz", date: "Saturday 2:30 pm", participants: 180 }
  ];

  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

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
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeTitle}>Welcome Back, User!</h1>
            <div className={styles.welcomeIllustration}>
              <img src={welcomeImg} alt="Welcome" className={styles.welcomeImage} />
            </div>
          </div>
          <div className={`${styles.overallInfo} ${styles.card}`}>
            <div className={styles.overallHeader}>
              <span>Overall Information</span>
              <span className={styles.overallMenu}>&#8942;</span>
            </div>
            <div className={styles.overallMainStats}>
              <div className={styles.mainStat}>
                <div className={styles.mainStatNumber}>24</div>
                <div className={styles.mainStatLabel}>Codathon attended</div>
              </div>
              <div className={styles.mainStat}>
                <div className={styles.mainStatNumber}>45</div>
                <div className={styles.mainStatLabel}>Quizzes answered</div>
              </div>
            </div>
            <div className={styles.overallProgress}>
              <span>100 points to level up!</span>
              <span className={styles.overallProgressBar}><span style={{width: '66%'}}></span></span>
              <span className={styles.overallProgressLabel}>200/300</span>
              <span className={styles.overallTier}><Award size={18} style={{verticalAlign:'middle'}}/> Gold Tier</span>
            </div>
            <div className={styles.overallBadges}>
              <div className={styles.badge}>
                <div className={styles.badgeNumber}>5</div>
                <div className={styles.badgeLabel}>Top 10</div>
              </div>
              <div className={styles.badge}>
                <div className={styles.badgeNumber}>11</div>
                <div className={styles.badgeLabel}>Top 10</div>
              </div>
              <div className={styles.badge}>
                <div className={styles.badgeNumber}>33</div>
                <div className={styles.badgeLabel}>Topics</div>
              </div>
            </div>
          </div>
        </div>
        <hr className={styles.sectionDivider} />
        
        <div className={styles.performanceSectionstd}>
          <h2 className={styles.performanceTitle}>Performance Overview</h2>
          <div className={styles.performanceContent}>
            <div className={styles.chartContainer}>
              <div className={styles.chartHeader}>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.quiz}`}></div>
                    <span>Quiz</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.codethon}`}></div>
                    <span>Codethon</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.practice}`}></div>
                    <span>Practice</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartArea}>
                <div className={styles.chartGrid}>
                  <div className={styles.yAxis}>
                    <span>40</span>
                    <span>30</span>
                    <span>20</span>
                    <span>10</span>
                    <span>0</span>
                  </div>
                  <div className={styles.chartLines}>
                    <svg viewBox="0 0 300 200" className={styles.chartSvg}>
                      <polyline 
                        points="0,140 50,125 100,136 150,124 200,140 250,125 300,120"
                        fill="none" 
                        stroke="#ff6b6b" 
                        strokeWidth="2"
                        className={`${styles.chartLine} ${styles.quiz}`}
                      />
                      <polyline 
                        points="0,150 50,140 100,144 150,125 200,136 250,140 300,125"
                        fill="none" 
                        stroke="#4ecdc4" 
                        strokeWidth="2"
                        className={`${styles.chartLine} ${styles.codethon}`}
                      />
                      <polyline 
                        points="0,160 50,150 100,140 150,144 200,125 250,120 300,124"
                        fill="none" 
                        stroke="#45b7d1" 
                        strokeWidth="2"
                        className={`${styles.chartLine} ${styles.practice}`}
                      />
                    </svg>
                  </div>
                  <div className={styles.xAxis}>
                    <span>January</span>
                    <span>February</span>
                    <span>March</span>
                    <span>April</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={`${styles.monthProgress} ${styles.card}`}>
              <div className={styles.monthHeader}>
                <span>Month Progress</span>
                <span className={styles.monthMenu}>&#8942;</span>
              </div>
              <div className={styles.monthCompare}>Compared to last month*</div>
              <div className={styles.monthOverview}>
                <span className={styles.monthOverviewTitle}>OVERVIEW</span>
                <ul className={styles.monthOverviewList}>
                  <li><span className={`${styles.dot} ${styles.work}`}></span>Work</li>
                  <li><span className={`${styles.dot} ${styles.meditation}`}></span>Meditation</li>
                  <li><span className={`${styles.dot} ${styles.projects}`}></span>Project's</li>
                </ul>
              </div>
              <div className={styles.monthProgressCircle}>
                <svg width="100" height="100">
                  <circle cx="50" cy="50" r="40" stroke="#eee" strokeWidth="10" fill="none" />
                  <circle cx="50" cy="50" r="40" stroke="#ff6b6b" strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="50" />
                </svg>
                <span className={styles.monthProgressText}>120%</span>
              </div>
              <div className={styles.monthProgressButtons}>
                <button className={`${styles.btn} ${styles.btnSecondary}`}>Find Contests</button>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>View Leaderboard</button>
              </div>
            </div>
          </div>
        </div>

        {/* Contest Join Section */}
        <div className={styles.contestJoinSection}>
          <div className={styles.contestContent}>
            <h2>Join contests and grow with peers</h2>
            <p>Find and join coding contests with like-minded learners!</p>
            <div className={styles.contestInput}>
              <input
                type="text"
                placeholder="Enter Code..."
                value={contestCode}
                onChange={(e) => setContestCode(e.target.value)}
                className={styles.contestCodeInput}
              />
              <button onClick={handleContestJoin} className={`${styles.btn} ${styles.btnPrimary}`}>
                Find
              </button>
            </div>
          </div>
          <div className={styles.contestIllustration}>
            <img src={findImg} alt="Find Contest" className={styles.findImage} />
          </div>
        </div>

        {/* Upcoming Contests */}
        <div className={styles.upcomingContests}>
          <div className={styles.sectionHeader}>
            <h2>Current/Upcoming Contest Highlight</h2>
            <button className={`${styles.btn} ${styles.btnOutline}`}>Show More...</button>
          </div>
          <div className={styles.contestsGrid}>
            {upcomingContests.map(contest => (
              <div key={contest.id} className={styles.contestCard}>
                <div className={styles.contestInfo}>
                  <h3>{contest.title}</h3>
                  <div className={styles.contestMeta}>
                    <div className={styles.contestDate}>
                      <span>🗓️</span> {/* Replaced Lucide icon for simplicity, add it back if you need it */}
                      <span>{contest.date}</span>
                    </div>
                    <div className={styles.contestParticipants}>
                       <span>👥</span> {/* Replaced Lucide icon */}
                      <span>{contest.participants} participants</span>
                    </div>
                  </div>
                </div>
                <div className={styles.contestActions}>
                  <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>Join</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
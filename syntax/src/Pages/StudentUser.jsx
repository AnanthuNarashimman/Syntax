import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import styles from '../Styles/PageStyles/StudentUser.module.css'; // Import as a 'styles' object
import StudentNavbar from '../Components/StudentNavbar';

const StudentUser = () => {
  // Sample data for charts and components
  const performanceData = [
    { date: 'Jan 15', practice: 25, contests: 15, avgScore: 78 },
    { date: 'Jan 20', practice: 35, contests: 22, avgScore: 82 },
    { date: 'Jan 25', practice: 28, contests: 18, avgScore: 75 },
    { date: 'Feb 01', practice: 42, contests: 28, avgScore: 85 },
    { date: 'Feb 05', practice: 38, contests: 25, avgScore: 88 },
    { date: 'Feb 10', practice: 45, contests: 32, avgScore: 90 },
    { date: 'Feb 15', practice: 52, contests: 38, avgScore: 92 }
  ];

  const heatmapData = [
    { day: 'Wed', data: Array(52).fill(0).map((_, i) => i > 30 ? Math.random() > 0.7 ? 3 : 0 : 0) },
    { day: 'Fri', data: Array(52).fill(0).map((_, i) => i > 25 ? Math.random() > 0.6 ? 2 : 0 : 0) },
    { day: 'Sun', data: Array(52).fill(0).map((_, i) => i > 20 ? Math.random() > 0.8 ? 1 : 0 : 0) },
    { day: 'Tue', data: Array(52).fill(0).map((_, i) => i > 15 ? Math.random() > 0.9 ? 1 : 0 : 0) }
  ];

  const getHeatmapColor = (value) => {
    if (value === 0) return '#e8f5e8';
    if (value === 1) return '#c6e48b';
    if (value === 2) return '#7bc96f';
    if (value === 3) return '#239a3b';
    return '#196127';
  };

  return (
    <div className={styles.studentDashboard}>
      <StudentNavbar />
      <div className={styles.dashboardContent}>
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelTop}>
            <div className={styles.userProfile}>
              <div className={styles.profileAvatar}></div>
              <div className={styles.profileInfo}>
                <h3>Amar K</h3>
                <span className={styles.userId}>7710311009</span>
                <span className={styles.userBadge}>Log</span>
              </div>
            </div>

            <div className={styles.userStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>College:</span>
                <span className={styles.statValue}>KSRCE</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>DEPT:</span>
                <span className={styles.statValue}>CSE</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>YEAR:</span>
                <span className={styles.statValue}>II</span>
              </div>
            </div>

            <div className={styles.userLanguages}>
              <h4>Languages :</h4>
              <div className={styles.languageTags}>
                <span className={styles.tag}>C++</span>
                <span className={styles.tag}>Python</span>
              </div>
            </div>

            <div className={styles.userSkills}>
              <h4>Skills :</h4>
              <div className={styles.skillTags}>
                <span className={styles.skillTag}>Array</span>
                <span className={styles.skillTag}>Tree</span>
                <span className={styles.skillTag}>Graph</span>
              </div>
            </div>
          </div>
          <div className={styles.leftPanelBottom}>
            <h4>Accomplishments</h4>
            <div className={styles.achievementGrid}>
              <div className={styles.achievementItem}>
                <div className={styles.achievementIcon}>🏆</div>
                <span>Top 10</span>
              </div>
              <div className={styles.achievementItem}>
                <div className={styles.achievementIcon}>📍</div>
                <span>Top 50</span>
              </div>
              <div className={styles.achievementItem}>
                <div className={styles.achievementIcon}>📊</div>
                <span>Score</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeText}>
              <h2>Hey Amar,</h2>
              <p>Greatness isn't far — you're already on the right path. Keep participating and sharpening your skills.</p>
            </div>
            <div className={styles.welcomeIllustration}>
              <div className={styles.characterAvatar}></div>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.currentTier}>
              <h3>Current Tier</h3>
              <div className={styles.tierBadge}>
                <div className={styles.tierStar}>⭐</div>
                <span className={styles.tierText}>Gold</span>
              </div>
              <div className={styles.tierProgress}>
                <span>180 points</span>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill}></div>
                </div>
                <span>You need 20 more for next tier: 200/200</span>
              </div>
            </div>

            <div className={styles.dailyInteractions}>
              <h3>Daily Interactions</h3>
              <div className={styles.interactionChart}>
                {[20, 40, 30, 45, 35, 50, 25].map((height, index) => (
                  <div key={index} className={styles.chartBar} style={{ height: `${height}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.performanceSection}>
            <div className={`${styles.analyticsChartContainer} ${styles.largeChart}`}>
              <div className={styles.chartHeader}>
                <h3>Daily Practice & Performance Trends</h3>
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.practice}`}></div><span>Practice Sessions</span></div>
                  <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.contests}`}></div><span>Contest Participation</span></div>
                  <div className={styles.legendItem}><div className={`${styles.legendColor} ${styles.scores}`}></div><span>Avg Score</span></div>
                </div>
              </div>
              <div className={styles.chartContent}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#718096" />
                    <YAxis stroke="#718096" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="practice" stackId="1" stroke="#e53e3e" fill="#e53e3e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="contests" stackId="2" stroke="#38a169" fill="#38a169" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="avgScore" stroke="#3182ce" strokeWidth={3} dot={{ fill: '#3182ce', strokeWidth: 2, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.monthProgress}>
              <h4>Month Progress</h4>
              <p>Compared to last month*</p>
              <div className={styles.progressOverview}>
                <div className={styles.progressItems}>
                  <div className={styles.progressItem}><span className={styles.progressLabel}>• Work</span></div>
                  <div className={styles.progressItem}><span className={styles.progressLabel}>• Meditation</span></div>
                  <div className={styles.progressItem}><span className={styles.progressLabel}>• Projects</span></div>
                </div>
                <div className={styles.circularProgress}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                    <circle cx="40" cy="40" r="30" fill="none" stroke="#333" strokeWidth="8" strokeDasharray="188.4" strokeDashoffset="47.1" transform="rotate(-90 40 40)"/>
                    <text x="40" y="45" textAnchor="middle" fontSize="14" fill="#333">75%</text>
                  </svg>
                </div>
              </div>
              <div className={styles.progressButtons}>
                <button className={styles.btnSecondary}>Find Contests</button>
                <button className={styles.btnPrimary}>View Leaderboard</button>
              </div>
            </div>
          </div>

          <div className={styles.heatmapSection}>
            <h3>Submission Heat Map</h3>
            <div className={styles.heatmapContainer}>
              <div className={styles.heatmapGrid}>
                {heatmapData.map((row, rowIndex) => (
                  <div key={rowIndex} className={styles.heatmapRow}>
                    <span className={styles.dayLabel}>{row.day}</span>
                    <div className={styles.heatmapCells}>
                      {row.data.map((value, cellIndex) => (
                        <div key={cellIndex} className={styles.heatmapCell} style={{ backgroundColor: getHeatmapColor(value) }}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.heatmapMonths}>
                <span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentUser;
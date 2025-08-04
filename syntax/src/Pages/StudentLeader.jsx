import React, { useState, useEffect } from 'react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import styles from '../Styles/PageStyles/StudentLeader.module.css'; // Import as a 'styles' object

const StudentLeader = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const itemsPerPage = 8;

  // Mock data...
  const mockUserProfile = { name: 'Amar', points: 1800, rank: 3, /* ... */ };
  const mockLeaderboardData = [
    { id: 1, name: 'Alice', avatar: '👩‍💻', department: 'CSE', tier: 'gold', hackathons: 5, quizzes: 12, points: 2100, position: 1 },
    { id: 2, name: 'Bob', avatar: '👨‍💻', department: 'ECE', tier: 'silver', hackathons: 3, quizzes: 10, points: 1800, position: 2 },
    { id: 3, name: 'Charlie', avatar: '👨‍🎓', department: 'EEE', tier: 'bronze', hackathons: 2, quizzes: 8, points: 1500, position: 3 },
    { id: 4, name: 'Diana', avatar: '👩‍🎓', department: 'IT', tier: 'gold', hackathons: 4, quizzes: 11, points: 1700, position: 4 },
    { id: 5, name: 'Eve', avatar: '👩‍🔬', department: 'CSE', tier: 'silver', hackathons: 1, quizzes: 7, points: 1200, position: 5 },
    { id: 6, name: 'Frank', avatar: '👨‍🔬', department: 'ECE', tier: 'gold', hackathons: 2, quizzes: 9, points: 1600, position: 6 },
    { id: 7, name: 'Grace', avatar: '👩‍💼', department: 'EEE', tier: 'silver', hackathons: 3, quizzes: 6, points: 1400, position: 7 },
    { id: 8, name: 'Henry', avatar: '👨‍💼', department: 'IT', tier: 'bronze', hackathons: 1, quizzes: 5, points: 1100, position: 8 },
    { id: 9, name: 'Ivy', avatar: '👩‍🔧', department: 'CSE', tier: 'gold', hackathons: 4, quizzes: 13, points: 2000, position: 9 },
    { id: 10, name: 'Jack', avatar: '👨‍🔧', department: 'ECE', tier: 'bronze', hackathons: 2, quizzes: 8, points: 1300, position: 10 },
    { id: 11, name: 'Kathy', avatar: '👩‍🚀', department: 'EEE', tier: 'gold', hackathons: 5, quizzes: 14, points: 2200, position: 11 },
    { id: 12, name: 'Leo', avatar: '👨‍🚀', department: 'IT', tier: 'silver', hackathons: 3, quizzes: 10, points: 1700, position: 12 },
  ];

  useEffect(() => {
    // Simulate API calls
    setTimeout(() => {
      setUserProfile({
        name: 'Amar K',
        points: 1800,
        rank: 3,
        avatar: '👑',
        summary: {
          codefusions: { count: 24, points: 300 },
          quizzes: { count: 45, points: 500 },
          practices: { count: 33, points: 400 }
        }
      });
      setLeaderboardData(mockLeaderboardData);
      setLoading(false);
    }, 2000);
  }, []);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#9E9E9E';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '⚪';
    }
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return '🏆';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return position;
    }
  };

  const filteredData = leaderboardData.filter(user => {
    const matchesDepartment = filterDepartment === '' || user.department === filterDepartment;
    const matchesTier = filterTier === '' || user.tier === filterTier;
    return matchesDepartment && matchesTier;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  // Removed: const topThree = leaderboardData.slice(0, 3);

  if (loading) {
    return (
      <div className={styles.studentLeader}>
        <StudentNavbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.studentLeader}>
      <StudentNavbar />
      
      <div className={styles.leaderContainer}>
        <div className={styles.leaderTopSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>
              <div className={styles.avatarCircle}>
                <span className={styles.rankNumber}>{userProfile.rank}</span>
              </div>
              <div className={styles.crownIcon}>👑</div>
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileHeader}>
                <h2>{userProfile.name}</h2>
                <div className={styles.pointsBadge}>
                  <span className={styles.pointsIcon}>🏆</span>
                  <span>{userProfile.points} points</span>
                </div>
              </div>
              <div className={styles.profileSummary}>
                <h3>Summary</h3>
                <div className={styles.summaryItems}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>🔥</span>
                    <span className={styles.summaryLabel}>Codefusions</span>
                    <span className={styles.summaryCount}>{userProfile.summary.codefusions.count}</span>
                    <span className={styles.summaryPoints}>{userProfile.summary.codefusions.points}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>⚡</span>
                    <span className={styles.summaryLabel}>Quizzes</span>
                    <span className={styles.summaryCount}>{userProfile.summary.quizzes.count}</span>
                    <span className={styles.summaryPoints}>{userProfile.summary.quizzes.points}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryIcon}>💪</span>
                    <span className={styles.summaryLabel}>Practices</span>
                    <span className={styles.summaryCount}>{userProfile.summary.practices.count}</span>
                    <span className={styles.summaryPoints}>{userProfile.summary.practices.points}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Removed: mini leaderboard card */}
        </div>

        <div className={styles.leaderboardSection}>
          <div className={styles.leaderboardHeader}>
            <h2>Leader Board 📊</h2>
            <div className={styles.leaderboardFilters}>
              <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className={styles.filterSelect}>
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="IT">IT</option>
              </select>
              <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className={styles.filterSelect}>
                <option value="">All Tiers</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>
          </div>

          <div className={styles.leaderboardTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Position</div>
              <div className={styles.headerCell}>Name</div>
              <div className={styles.headerCell}>Department</div>
              <div className={styles.headerCell}>Tier</div>
              <div className={styles.headerCell}>Hackathons</div>
              <div className={styles.headerCell}>Quizzes</div>
              <div className={styles.headerCell}>Points</div>
            </div>
            
            <div className={styles.tableBody}>
              {paginatedData.map((user) => (
                <div key={user.id} className={`${styles.tableRow} ${user.name === userProfile.name ? styles.currentUser : ''}`}>
                  <div className={`${styles.tableCell} ${styles.positionCell}`}>
                    <span className={styles.positionDisplay}>{getPositionIcon(user.position)}</span>
                  </div>
                  <div className={`${styles.tableCell} ${styles.nameCell}`}>
                    <span className={styles.userAvatar}>{user.avatar}</span>
                    <span className={styles.userName}>{user.name}</span>
                  </div>
                  <div className={styles.tableCell}>{user.department}</div>
                  <div className={`${styles.tableCell} ${styles.tierCell}`}>
                    <div className={styles.tierBadge} style={{ backgroundColor: getTierColor(user.tier) }}>
                      {getTierIcon(user.tier)}
                    </div>
                  </div>
                  <div className={styles.tableCell}>{user.hackathons}</div>
                  <div className={styles.tableCell}>{user.quizzes}</div>
                  <div className={`${styles.tableCell} ${styles.pointsCell}`}>
                    <span className={styles.pointsValue}>{user.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.pagination}>
            <button className={styles.paginationBtn} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
              ← Prev
            </button>
            <div className={styles.paginationPages}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button key={pageNum} className={`${styles.paginationPage} ${currentPage === pageNum ? styles.active : ''}`} onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </button>
              ))}
            </div>
            <button className={styles.paginationBtn} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLeader;
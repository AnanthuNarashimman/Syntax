import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Users, Target, Filter, Search, Award, Star, Zap, ChevronUp, ChevronDown, Flame, Calendar, BookOpen, RefreshCw, ArrowUp } from 'lucide-react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import styles from '../Styles/PageStyles/StudentLeader.module.css';

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
        {/* Header Section */}
        <div className={styles.leaderHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Leaderboard & Rankings</h1>
              <p className={styles.pageSubtitle}>
                Track your progress and compete with fellow students across various challenges
              </p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Users size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>1,247</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>#{userProfile.rank}</h3>
                  <p>Your Rank</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Flame size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>15</h3>
                  <p>Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className={styles.profileSection}>
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.profileAvatar}>
                <div className={styles.avatarCircle}>
                  <span className={styles.rankNumber}>#{userProfile.rank}</span>
                </div>
                {userProfile.rank <= 3 && (
                  <div className={styles.crownIcon}>
                    {userProfile.rank === 1 && <Crown size={24} color="#FFD700" />}
                    {userProfile.rank === 2 && <Medal size={24} color="#C0C0C0" />}
                    {userProfile.rank === 3 && <Award size={24} color="#CD7F32" />}
                  </div>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{userProfile.name}</h2>
                <div className={styles.pointsBadge}>
                  <Trophy size={16} />
                  <span>{userProfile.points} points</span>
                </div>
              </div>
            </div>

            <div className={styles.profileStats}>
              <h3 className={styles.statsTitle}>Performance Summary</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <Trophy size={20} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statLabel}>Contests</span>
                    <div className={styles.statValues}>
                      <span className={styles.statCount}>{userProfile.summary.codefusions.count}</span>
                      <span className={styles.statPoints}>{userProfile.summary.codefusions.points} pts</span>
                    </div>
                    <div className={styles.statTrend}>
                      <ChevronUp size={14} />
                      <span>+2 this week</span>
                    </div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <Zap size={20} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statLabel}>Quizzes</span>
                    <div className={styles.statValues}>
                      <span className={styles.statCount}>{userProfile.summary.quizzes.count}</span>
                      <span className={styles.statPoints}>{userProfile.summary.quizzes.points} pts</span>
                    </div>
                    <div className={styles.statTrend}>
                      <ChevronUp size={14} />
                      <span>+5 this week</span>
                    </div>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <BookOpen size={20} />
                  </div>
                  <div className={styles.statDetails}>
                    <span className={styles.statLabel}>Practice</span>
                    <div className={styles.statValues}>
                      <span className={styles.statCount}>{userProfile.summary.practices.count}</span>
                      <span className={styles.statPoints}>{userProfile.summary.practices.points} pts</span>
                    </div>
                    <div className={styles.statTrend}>
                      <ChevronDown size={14} />
                      <span>-1 this week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className={styles.achievementSection}>
              <h4 className={styles.achievementTitle}>Recent Achievements</h4>
              <div className={styles.achievementBadges}>
                <div className={styles.achievementBadge}>
                  <Crown size={16} />
                  <span>Top 10</span>
                </div>
                <div className={styles.achievementBadge}>
                  <Flame size={16} />
                  <span>15 Day Streak</span>
                </div>
                <div className={styles.achievementBadge}>
                  <Trophy size={16} />
                  <span>Contest Winner</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className={styles.leaderboardSection}>
          <div className={styles.leaderboardHeader}>
            <div className={styles.leaderboardTitle}>
              <Trophy size={24} />
              <h2>Global Leaderboard</h2>
            </div>
            <div className={styles.leaderboardFilters}>
              <div className={styles.filterGroup}>
                <Filter size={16} />
                <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className={styles.filterSelect}>
                  <option value="">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="IT">IT</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <Users size={16} />
                <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className={styles.filterSelect}>
                  <option value="">All Tiers</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="bronze">Bronze</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.leaderboardTable}>
            <div className={styles.tableHeader}>
              <div className={styles.headerCell}>Rank</div>
              <div className={styles.headerCell}>Student</div>
              <div className={styles.headerCell}>Department</div>
              <div className={styles.headerCell}>Tier</div>
              <div className={styles.headerCell}>Contests</div>
              <div className={styles.headerCell}>Quizzes</div>
              <div className={styles.headerCell}>Total Points</div>
            </div>

            <div className={styles.tableBody}>
              {paginatedData.map((user) => (
                <div key={user.id} className={`${styles.tableRow} ${user.name === userProfile.name ? styles.currentUser : ''}`}>
                  <div className={styles.tableCell}>
                    <div className={styles.rankCell}>
                      <span className={styles.rankNumber}>#{user.position}</span>
                      {user.position === 1 && <Crown size={16} color="#FFD700" />}
                      {user.position === 2 && <Medal size={16} color="#C0C0C0" />}
                      {user.position === 3 && <Award size={16} color="#CD7F32" />}
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.studentCell}>
                      <div className={styles.studentAvatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{user.name}</span>
                        {user.name === userProfile.name && (
                          <span className={styles.youBadge}>You</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.departmentBadge}>{user.department}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.tierBadge} style={{ backgroundColor: getTierColor(user.tier) }}>
                      {getTierIcon(user.tier)}
                    </div>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.activityCount}>{user.hackathons}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.activityCount}>{user.quizzes}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <div className={styles.pointsCell}>
                      <Trophy size={14} />
                      <span className={styles.pointsValue}>{user.points}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.pagination}>
            <button
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ''}`}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.pageNumber} ${currentPage === pageNum ? styles.active : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className={styles.floatingActions}>
          <button
            className={styles.floatingBtn}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
          <button
            className={styles.floatingBtn}
            onClick={() => window.location.reload()}
            title="Refresh leaderboard"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLeader;
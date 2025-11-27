import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Users, Filter, Award, Star, Flame, RefreshCw, User } from 'lucide-react';
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
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/profile/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      
      // Set leaderboard data
      setLeaderboardData(data.leaderboard || []);
      
      // Set user profile from userPosition data
      if (data.userPosition) {
        setUserProfile({
          name: data.userPosition.userName || 'Unknown',
          points: data.userPosition.totalScore || 0,
          rank: data.userPosition.position || 0,
          avatar: '👑',
          userId: data.userPosition.userId,
          summary: {
            codefusions: { count: data.userPosition.submissionCount || 0, points: Math.floor((data.userPosition.totalScore || 0) * 0.3) },
            quizzes: { count: Math.floor((data.userPosition.submissionCount || 0) * 0.7), points: Math.floor((data.userPosition.totalScore || 0) * 0.5) },
            practices: { count: Math.floor((data.userPosition.submissionCount || 0) * 0.5), points: Math.floor((data.userPosition.totalScore || 0) * 0.2) }
          }
        });
      }
      
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      // Set default values on error
      setLeaderboardData([]);
      setUserProfile({
        name: 'User',
        points: 0,
        rank: 0,
        avatar: '👑',
        summary: {
          codefusions: { count: 0, points: 0 },
          quizzes: { count: 0, points: 0 },
          practices: { count: 0, points: 0 }
        }
      });
    } finally {
      setLoading(false);
    }
  };

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

  // Function to assign tier based on position
  const getTierFromPosition = (position) => {
    if (position <= 3) return 'gold';
    if (position <= 10) return 'silver';
    if (position <= 20) return 'bronze';
    return 'none';
  };

  // Function to get department from real data or assign default
  const getDepartmentFromUser = (user) => {
    return user.department || 'Unknown';
  };

  const filteredData = leaderboardData.filter(user => {
    const userDepartment = getDepartmentFromUser(user);
    const userTier = getTierFromPosition(user.position);
    const matchesDepartment = filterDepartment === '' || userDepartment === filterDepartment;
    const matchesTier = filterTier === '' || userTier === filterTier;
    return matchesDepartment && matchesTier;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
            <div className={styles.headerIcon}>
              <Trophy size={32} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Leaderboard & Rankings</h1>
              <p className={styles.pageSubtitle}>
                Track your progress and compete with fellow students across various challenges
              </p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statNumber}>{leaderboardData.length}</h3>
                <p className={styles.statLabel}>Total Students</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statNumber}>Rank {userProfile?.rank || 0}</h3>
                <p className={styles.statLabel}>Your Rank</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Flame size={24} />
              </div>
              <div className={styles.statInfo}>
                <h3 className={styles.statNumber}>{userProfile?.points || 0}</h3>
                <p className={styles.statLabel}>Your Points</p>
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
                  <User size={32} />
                </div>
                <div className={styles.rankBadge}>
                  <span className={styles.rankNumber}>Rank {userProfile?.rank || 0}</span>
                </div>
                {userProfile && userProfile.rank <= 3 && (
                  <div className={styles.crownIcon}>
                    {userProfile.rank === 1 && <Crown size={20} />}
                    {userProfile.rank === 2 && <Medal size={20} />}
                    {userProfile.rank === 3 && <Award size={20} />}
                  </div>
                )}
              </div>
              <div className={styles.profileInfo}>
                <h2 className={styles.profileName}>{userProfile?.name || 'Loading...'}</h2>
                <div className={styles.pointsBadge}>
                  <Trophy size={16} />
                  <span>{userProfile?.points || 0} points</span>
                </div>
                <div className={styles.tierBadge}>
                  <Star size={14} />
                  <span>{userProfile && userProfile.rank <= 3 ? 'Gold' : userProfile && userProfile.rank <= 10 ? 'Silver' : 'Bronze'} Tier</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className={styles.leaderboardSection}>
          <div className={styles.leaderboardCard}>
            <div className={styles.leaderboardHeader}>
              <div className={styles.leaderboardTitle}>
                <div className={styles.titleIcon}>
                  <Trophy size={24} />
                </div>
                <div className={styles.titleText}>
                  <h2>Global Leaderboard</h2>
                  <p>Compete with students worldwide</p>
                </div>
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
                <button className={styles.refreshButton} onClick={fetchLeaderboardData}>
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </button>
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
              {paginatedData.map((user) => {
                const userTier = getTierFromPosition(user.position);
                const userDepartment = getDepartmentFromUser(user);
                const isCurrentUser = userProfile && user.userId === userProfile.userId;
                
                return (
                  <div key={user.id} className={`${styles.tableRow} ${isCurrentUser ? styles.currentUser : ''}`}>
                    <div className={styles.tableCell}>
                      <div className={styles.rankCell}>
                        <span className={styles.rankNumber}>Rank {user.position}</span>
                        {user.position === 1 && <Crown size={16} color="#FFD700" />}
                        {user.position === 2 && <Medal size={16} color="#C0C0C0" />}
                        {user.position === 3 && <Award size={16} color="#CD7F32" />}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.studentCell}>
                        <div className={styles.studentAvatar}>
                          {(user.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>{user.userName || 'Unknown'}</span>
                          {isCurrentUser && (
                            <span className={styles.youBadge}>You</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={styles.departmentBadge}>{userDepartment}</span>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.tierBadge} style={{ backgroundColor: getTierColor(userTier) }}>
                        {getTierIcon(userTier)}
                      </div>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={styles.activityCount}>{user.submissionCount || 0}</span>
                    </div>
                    <div className={styles.tableCell}>
                      <span className={styles.activityCount}>{Math.floor((user.submissionCount || 0) * 0.7)}</span>
                    </div>
                    <div className={styles.tableCell}>
                      <div className={styles.pointsCell}>
                        <Trophy size={14} />
                        <span className={styles.pointsValue}>{user.totalScore || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            onClick={fetchLeaderboardData}
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
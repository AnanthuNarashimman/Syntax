import React, { useState, useEffect } from 'react';
import { Search, Filter, Trophy, Clock, Users, Code, BookOpen, Target, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import styles from '../Styles/PageStyles/StudentContests.module.css';
import contestsImg from '../assets/Images/contests.jpg';

const StudentContests = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('All Language');
  const [filterType, setFilterType] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All Department');
  const [filterSearch, setFilterSearch] = useState('');
  const [filteredContests, setFilteredContests] = useState([]);
  const languageOptions = ['All Language', 'Python', 'C', 'C++', 'Java', 'Data Structures'];
  const typeOptions = ['All', 'Quiz', 'Coding contest'];
  const departmentOptions = ['All Department', 'CSE', 'IT', 'ECE', 'EEE'];
  const [loading, setLoading] = useState(true);
  const [codeSearch, setCodeSearch] = useState('');
  const [showAllContests, setShowAllContests] = useState(false);

  const handleFindCode = () => {
    alert(`Finding contest for code: ${codeSearch}`);
  };

  // Mock data for 6 contests styled like the Figma example
  const mockContests = [
    {
      id: 1,
      type: 'Coding Contest',
      title: 'Weekly Coding Challenge',
      duration: '2 hours',
      department: 'CSE',
      strict: true
    },
    {
      id: 2,
      type: 'Quiz',
      title: 'Quiz on Arrays',
      duration: '30 min',
      department: 'IT',
      strict: true
    },
    {
      id: 3,
      type: 'Coding Contest',
      title: 'Monthly Marathon',
      duration: '3 hours',
      department: 'EEE',
      strict: true
    },
    {
      id: 4,
      type: 'Quiz',
      title: 'Networks Quiz',
      duration: '40 min',
      department: 'CSE',
      strict: true
    },
    {
      id: 5,
      type: 'Coding Contest',
      title: 'Night Owl Coding',
      duration: '1.5 hours',
      department: 'ECE',
      strict: true
    },
    {
      id: 6,
      type: 'Quiz',
      title: 'DBMS Quiz',
      duration: '35 min',
      department: 'IT',
      strict: true
    }
  ];

  // Add mock contest data for cards styled like StudentPractice
  const mockContestCards = [
    { id: 1, type: 'Coding Contest', title: 'Algo Sprint', duration: '2 hours', department: 'CSE' },
    { id: 2, type: 'Quiz', title: 'Logic Quiz', duration: '30 min', department: 'IT' },
    { id: 3, type: 'Coding Contest', title: 'Bug Hunt', duration: '1 hour', department: 'ECE' },
    { id: 4, type: 'Quiz', title: 'Math Mania', duration: '45 min', department: 'EEE' },
    { id: 5, type: 'Coding Contest', title: 'Code Rush', duration: '3 hours', department: 'IT' },
    { id: 6, type: 'Quiz', title: 'Aptitude Test', duration: '25 min', department: 'CSE' },
    // New mock data
    { id: 7, type: 'Coding Contest', title: 'Bitwise Battles', duration: '2 hours', department: 'CSE' },
    { id: 8, type: 'Quiz', title: 'Logic Gates', duration: '22 min', department: 'ECE' },
    { id: 9, type: 'Coding Contest', title: 'Code Golf', duration: '1 hour', department: 'EEE' },
    { id: 10, type: 'Quiz', title: 'Placement Prep', duration: '50 min', department: 'IT' },
    { id: 11, type: 'Coding Contest', title: 'Graph Masters', duration: '2.5 hours', department: 'CSE' },
  ];

  // When filter button is clicked, filter the mockContestCards
  const handleFilter = () => {
    const filtered = mockContestCards.filter(contest => {
      const matchesSearch = contest.title?.toLowerCase().includes(filterSearch.toLowerCase()) || contest.description?.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesLanguage = filterLanguage === 'All Language' || (contest.language && contest.language === filterLanguage);
      const matchesType = filterType === 'All' || (contest.type && contest.type === filterType);
      const matchesDepartment = filterDepartment === 'All Department' || (contest.department && contest.department === filterDepartment);
      return matchesSearch && matchesLanguage && matchesType && matchesDepartment;
    });
    setFilteredContests(filtered);
    setShowAllContests(false); // Reset to first 9
  };

  // On mount, show all
  useEffect(() => { 
    setFilteredContests(mockContestCards); 
    // Simulate loading time
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return '#4CAF50';
      case 'upcoming': return '#FF9800';
      case 'completed': return '#757575';
      default: return '#757575';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#757575';
    }
  };

  const handleViewContest = (contest) => {
    navigate('/student-contests-preview');
  };

  const handleViewDetails = (contestId) => {
    alert(`View details for contest ${contestId}`);
  };

  const handleJoinContest = (contestId) => {
    alert(`Join contest ${contestId}`);
  };

  // Use filteredContests for display
  const contestCardsToShow = showAllContests ? filteredContests : filteredContests.slice(0, 9);

  if (loading) {
    return (
      <div className={styles.studentContests}>
        <StudentNavbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className={styles.studentContests}>
      <StudentNavbar />
      <div className={styles.contestsContainer}>
        {/* Header Section */}
        <div className={styles.contestsHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Contests & Competitions</h1>
              <p className={styles.pageSubtitle}>
                Challenge yourself with coding contests and quizzes designed to enhance your skills
              </p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Trophy size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>24</h3>
                  <p>Active Contests</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Users size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>1.2k</h3>
                  <p>Participants</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.headerIllustration}>
            <img src={contestsImg} alt="Contests" className={styles.contestsImage} />
          </div>
        </div>

        {/* Quick Access Section */}
        <div className={styles.quickAccessSection}>
          <div className={styles.codeSearchCard}>
            <div className={styles.cardHeader}>
              <Target size={20} />
              <h3>Quick Access</h3>
            </div>
            <p>Have a contest code? Enter it below for instant access</p>
            <div className={styles.codeSearchInput}>
              <input
                type="text"
                placeholder="Enter contest code (e.g., CC2024001)"
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                className={styles.codeInput}
              />
              <button className={styles.codeFindBtn} onClick={handleFindCode}>
                <Search size={18} />
                Find Contest
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <div className={styles.filterTitle}>
              <Filter size={20} />
              <h3>Explore Contests</h3>
            </div>
            <p>Discover contests that match your interests and skill level</p>
          </div>
          <div className={styles.filterControls}>
            <div className={styles.searchGroup}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className={styles.filterSelect}
            >
              {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={styles.filterSelect}
            >
              {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button className={styles.filterBtn} onClick={handleFilter}>
              <Filter size={16} />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Contest Cards Grid */}
        <div className={styles.contestsGrid}>
          {contestCardsToShow.map(contest => (
            <div key={contest.id} className={styles.contestCard}>
              <div className={styles.contestCardHeader}>
                <div className={styles.contestType}>
                  {contest.type === 'Coding Contest' ? <Code size={16} /> : <BookOpen size={16} />}
                  <span className={styles.typeLabel}>{contest.type}</span>
                </div>
                <div className={styles.contestBadge}>
                  <Award size={14} />
                  <span>Contest</span>
                </div>
              </div>

              <div className={styles.contestCardBody}>
                <h3 className={styles.contestTitle}>{contest.title}</h3>
                <div className={styles.contestDetails}>
                  <div className={styles.detailItem}>
                    <Clock size={16} />
                    <span>Duration: {contest.duration}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Users size={16} />
                    <span>Department: {contest.department}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <Calendar size={16} />
                    <span>Status: Active</span>
                  </div>
                </div>
              </div>

              <div className={styles.contestCardFooter}>
                <button
                  className={styles.joinBtn}
                  onClick={() => handleViewContest(contest)}
                >
                  <Trophy size={16} />
                  Join Contest
                </button>
                <button
                  className={styles.detailsBtn}
                  onClick={() => handleViewDetails(contest.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Show More/Less Section */}
        <div className={styles.loadMoreSection}>
          {(!showAllContests && mockContestCards.length > 9) && (
            <button className={styles.loadMoreBtn} onClick={() => setShowAllContests(true)}>
              <Target size={16} />
              Show More Contests
            </button>
          )}
          {(showAllContests && mockContestCards.length > 9) && (
            <button className={styles.loadMoreBtn} onClick={() => setShowAllContests(false)}>
              Show Less
            </button>
          )}
        </div>

        {/* Rest of the component remains the same */}
      </div>
    </div>
  );
};

export default StudentContests;
import React, { useState, useEffect } from 'react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import styles from '../Styles/PageStyles/StudentContests.module.css'; // Import as a 'styles' object
import contestsImg from '../assets/Images/contests.jpg';

const StudentContests = () => {
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
    alert(`View clicked for ${contest.type}: ${contest.title}`);
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
            <h1>Contests</h1>
            <p>Join coding contests and quizzes to test your skills</p>
          </div>
          <div className={styles.headerIllustration}>
            <img src={contestsImg} alt="Contests" className={styles.contestsImage} />
          </div>
        </div>

        {/* Code Find Bar */}
        <div className={styles.codeFindBar}>
          <input
            type="text"
            placeholder="Enter contest code..."
            value={codeSearch}
            onChange={(e) => setCodeSearch(e.target.value)}
            className={styles.codeInput}
          />
          <button className={styles.codeFindBtn} onClick={handleFindCode}>
            Find Contest
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className={styles.searchFilterBar}>
          <input
            type="text"
            placeholder="Search contests..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className={styles.filterSelect}
          >
            {languageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className={styles.filterSelect}
          >
            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <button className={styles.filterBtn} onClick={handleFilter}>Filter</button>
        </div>

        {/* Mock Contest Cards Section (Practice Card Style) */}
        <div className={styles.practiceGrid}>
          {contestCardsToShow.map(contest => (
            <div key={contest.id} className={styles.practiceCard}>
              <div className={styles.cardHeader}>
                <span className={styles.typeBadge}>{contest.type}</span>
                <span className={styles.practiceBadge}>Contest</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardInfo}>
                  <div><b>Title :</b> {contest.title}</div>
                  <div><b>Duration :</b> {contest.duration}</div>
                  <div><b>Department :</b> {contest.department}</div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.viewBtn} onClick={() => handleViewContest(contest)}>View</button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.showMore}>
          {(!showAllContests && mockContestCards.length > 9) && (
            <button className={styles.showMoreBtn} onClick={() => setShowAllContests(true)}>Show More...</button>
          )}
          {(showAllContests && mockContestCards.length > 9) && (
            <button className={styles.showMoreBtn} onClick={() => setShowAllContests(false)}>Show Less...</button>
          )}
        </div>

        {/* Rest of the component remains the same */}
      </div>
    </div>
  );
};

export default StudentContests;
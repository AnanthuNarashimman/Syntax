import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Trophy, Clock, Users, Code, BookOpen, Target, Calendar, Award, Play, Eye, Zap } from 'lucide-react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import { useContestContext } from '../contexts/ContestContext';
import styles from '../Styles/PageStyles/StudentContests.module.css';
import contestsImg from '../assets/Images/contests.jpg';

const StudentContests = () => {

  const navigate = useNavigate();

  // Get data from context
  const {
    studentContests,
    studentContestsLoading,
    studentContestsError,
    fetchStudentContests,
    formatStudentDate,
    getStudentContestStatus
  } = useContestContext();


  // Local state for filtering and UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('All Language');
  const [filterType, setFilterType] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All Department');
  const [filterSearch, setFilterSearch] = useState('');
  const [filteredContests, setFilteredContests] = useState([]);
  const languageOptions = ['All Language', 'Python', 'C', 'C++', 'Java', 'Data Structures'];
  const typeOptions = ['All', 'Quiz', 'Coding contest'];
  const departmentOptions = ['All Department', 'CSE', 'IT', 'ECE', 'EEE'];
  const [codeSearch, setCodeSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [showAllContests, setShowAllContests] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);

  const [contestCount, setContestCount] = useState(0);

  // Search error modal state
  const [searchErrorMessage, setSearchErrorMessage] = useState('');
  const [showSearchErrorModal, setShowSearchErrorModal] = useState(false);

  // Handle code search
  const handleFindCode = () => {
    if (codeSearch.trim()) {
      const foundContest = studentContests.find(contest =>
        contest.id.toLowerCase().includes(codeSearch.toLowerCase()) ||
        contest.eventTitle.toLowerCase().includes(codeSearch.toLowerCase())
      );

      if (foundContest) {
        setSelectedContest(foundContest);
        setShowModal(true);
      } else {
        setSearchErrorMessage(`No contest found for code: "${codeSearch}"`);
        setShowSearchErrorModal(true);
      }
    }
  };

  // Handle search error modal close
  const handleCloseSearchErrorModal = () => {
    setShowSearchErrorModal(false);
    setSearchErrorMessage('');
  };

  useEffect(() => {
    setFilteredContests(studentContests);
    setContestCount(studentContests.length);
  }, [studentContests]);

  useEffect(() => {
    fetchStudentContests();
  }, []);

  // When filter button is clicked, filter the contests
  const handleFilter = () => {
    const filtered = studentContests.filter(contest => {
      const matchesSearch = contest.eventTitle?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        contest.eventDescription?.toLowerCase().includes(filterSearch.toLowerCase());

      const matchesLanguage = filterLanguage === 'All Language' ||
        (contest.topicsCovered && contest.topicsCovered.includes(filterLanguage));

      const matchesType = filterType === 'All' ||
        (contest.eventType && contest.eventType === filterType.toLowerCase());

      const matchesDepartment = filterDepartment === 'All Department' ||
        (contest.allowedDepartments && contest.allowedDepartments.includes(filterDepartment));

      return matchesSearch && matchesLanguage && matchesType && matchesDepartment;
    });
    setFilteredContests(filtered);
    setCurrentPage(1); // Reset to first page
    setShowAllContests(false);
  };



  const handleViewContest = (contest) => {
    // Navigate to contest preview page with contest data
    navigate('/student-contests-preview', {
      state: { contestData: contest }
    });
  };

  // Modal handlers
  const handleViewDetails = (contest) => {
    setSelectedContest(contest);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContest(null);
  };

  const handleJoinContest = (contest) => {
    // Navigate to contest preview page with contest data
    navigate('/student-contests-preview', {
      state: { contestData: contest }
    });
    handleCloseModal();
  };

  // Pagination calculations
  const totalItems = filteredContests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Use filteredContests for display with pagination
  const contestCardsToShow = showAllContests ? filteredContests : filteredContests.slice(startIndex, endIndex);

  if (studentContestsLoading) {
    return (
      <div className={styles.studentContests}>
        <StudentNavbar />
        <Loader />
      </div>
    );
  }

  if (studentContestsError) {
    return (
      <div className={styles.studentContests}>
        <StudentNavbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <h2>Error Loading Contests</h2>
            <p>{studentContestsError}</p>
            <button
              className={styles.retryBtn}
              onClick={fetchStudentContests}
            >
              Try Again
            </button>
          </div>
        </div>
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
                  <h3>{contestCount}</h3>
                  <p>Active Contests</p>
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
        {contestCardsToShow.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <Trophy size={64} />
            </div>
            <h2>No Contests Available</h2>
            <p>There are currently no contests matching your criteria. Check back later or adjust your filters.</p>
          </div>
        ) : (
        <div className={styles.contestsGrid}>
          {contestCardsToShow.map(contest => {
            const statusInfo = getStudentContestStatus(contest.status || 'active');

            return (
              <div key={contest.id} className={styles.contestCard}>
                <div className={styles.contestCardHeader}>
                  <div className={styles.contestType}>
                    {contest.eventType === 'contest' ? <Code size={16} /> : <BookOpen size={16} />}
                    <span className={styles.typeLabel}>
                      {contest.eventType === 'quiz' ? 'Quiz' : 'Coding Contest'}
                    </span>
                  </div>
                  <div className={styles.contestBadges}>
                    {/* Event Mode Badge */}
                    {contest.eventMode && (
                      <div className={`${styles.modeBadge} ${styles[contest.eventMode]}`}>
                        <span>{contest.eventMode === 'strict' ? 'Strict Mode' : 'Practice Mode'}</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={styles.contestBadge} style={{ backgroundColor: statusInfo.color }}>
                      <Award size={14} />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.contestCardBody}>
                  <h3 className={styles.contestTitle}>
                    {contest.eventTitle}
                  </h3>
                  <div className={styles.contestDetails}>
                    <div className={styles.detailItem}>
                      <Clock size={16} />
                      <span>Duration: {contest.durationMinutes} min</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Users size={16} />
                      <span>Department: {contest.allowedDepartments}</span>
                    </div>
                    {/* Event Type Detail */}
                    {contest.eventType && (
                      <div className={styles.detailItem}>
                        {contest.eventType === 'quiz' ? <BookOpen size={16} /> : <Code size={16} />}
                        <span>Type: {contest.eventType === 'quiz' ? 'Quiz Competition' : 'Coding Contest'}</span>
                      </div>
                    )}
                    {/* Event Mode Detail */}
                    {contest.eventMode && (
                      <div className={styles.detailItem}>
                        <Trophy size={16} />
                        <span>Mode: {contest.eventMode === 'strict' ? 'Strict (Timed)' : 'Practice (Flexible)'}</span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <Calendar size={16} />
                      <span style={{ color: statusInfo.color }}>
                        Status: {statusInfo.label}
                      </span>
                    </div>
                    {/* Contest ID */}
                    <div className={styles.detailItem}>
                      <Target size={16} />
                      <span className={styles.contestId}>ID: {contest.id}</span>
                    </div>
                    {contest.totalScore && (
                      <div className={styles.detailItem}>
                        <Trophy size={16} />
                        <span>Points: {contest.totalScore}</span>
                      </div>
                    )}
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
                    onClick={() => handleViewDetails(contest)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Pagination Section */}
        {!showAllContests && totalPages > 1 && (
          <div className={styles.paginationSection}>
            <div className={styles.paginationInfo}>
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} contests
              </span>
            </div>
            <div className={styles.paginationControls}>
              <button
                className={`${styles.paginationBtn} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    className={`${styles.pageBtn} ${currentPage === pageNum ? styles.active : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className={`${styles.paginationBtn} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Show All/Less Toggle */}
        <div className={styles.loadMoreSection}>
          {(!showAllContests && totalItems > 9) && (
            <button className={styles.loadMoreBtn} onClick={() => setShowAllContests(true)}>
              <Target size={16} />
              Show All Contests
            </button>
          )}
          {(showAllContests && totalItems > 9) && (
            <button className={styles.loadMoreBtn} onClick={() => setShowAllContests(false)}>
              Show Paginated View
            </button>
          )}
        </div>

        {/* Contest Details Modal */}
        {showModal && selectedContest && (
          <div className={styles.modalOverlay} onClick={handleCloseModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  {selectedContest.eventTitle || selectedContest.title}
                </h2>
                <button className={styles.closeBtn} onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalSection}>
                  <h3>Description</h3>
                  <p>{selectedContest.eventDescription || selectedContest.description || 'No description available'}</p>
                </div>

                <div className={styles.modalSection}>
                  <h3>Contest Details</h3>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <Clock size={16} />
                      <span>Duration: {selectedContest.durationMinutes ? `${selectedContest.durationMinutes} minutes` : selectedContest.duration}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Users size={16} />
                      <span>Departments: {selectedContest.allowedDepartments || selectedContest.department}</span>
                    </div>
                    {selectedContest.eventType && (
                      <div className={styles.detailItem}>
                        {selectedContest.eventType === 'quiz' ? <BookOpen size={16} /> : <Code size={16} />}
                        <span>Type: {selectedContest.eventType === 'quiz' ? 'Quiz Competition' : 'Coding Contest'}</span>
                      </div>
                    )}
                    {selectedContest.eventMode && (
                      <div className={styles.detailItem}>
                        <Trophy size={16} />
                        <span>Mode: {selectedContest.eventMode === 'strict' ? 'Strict (Timed)' : 'Practice (Flexible)'}</span>
                      </div>
                    )}
                    {selectedContest.topicsCovered && (
                      <div className={styles.detailItem}>
                        <Target size={16} />
                        <span>Topics: {selectedContest.topicsCovered}</span>
                      </div>
                    )}
                    {selectedContest.totalScore && (
                      <div className={styles.detailItem}>
                        <Award size={16} />
                        <span>Total Points: {selectedContest.totalScore}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.modalSection}>
                  <h3>Contest Information</h3>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <Target size={16} />
                      <span className={styles.contestId}>Contest ID: {selectedContest.id}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Calendar size={16} />
                      <span>Created: {selectedContest.createdAt ? formatStudentDate(selectedContest.createdAt) : 'Unknown'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Users size={16} />
                      <span>Participants: {selectedContest.participants?.length || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <Trophy size={16} />
                      <span>Status: {getStudentContestStatus(selectedContest.status || 'active').label}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button className={styles.joinContestBtn} onClick={() => handleJoinContest(selectedContest)}>
                  <Trophy size={16} />
                  Join Contest
                </button>
                <button className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Error Modal */}
        {showSearchErrorModal && (
          <div className={styles.modalOverlay} onClick={handleCloseSearchErrorModal}>
            <div className={styles.errorModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.errorModalHeader}>
                <div className={styles.errorIcon}>
                  <Search size={48} />
                </div>
                <h2 className={styles.errorModalTitle}>Contest Not Found</h2>
                <button className={styles.closeBtn} onClick={handleCloseSearchErrorModal}>
                  ×
                </button>
              </div>

              <div className={styles.errorModalBody}>
                <p className={styles.errorMessage}>{searchErrorMessage}</p>
                <div className={styles.errorSuggestions}>
                  <h4>Please check:</h4>
                  <ul>
                    <li>The contest ID is correct</li>
                    <li>The contest exists and is available</li>
                  </ul>
                </div>
              </div>

              <div className={styles.errorModalFooter}>
                <button className={styles.tryAgainBtn} onClick={handleCloseSearchErrorModal}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentContests;
import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Code, Clock, Users, Target, Play, Eye, Zap, Brain, TrendingUp, Star, Calendar, FileText } from 'lucide-react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import { useContestContext } from '../contexts/ContestContext';
import styles from '../Styles/PageStyles/StudentPractice.module.css';
import pracImg from '../assets/Images/prac.jpg';

const StudentPractice = () => {
    // Get data from context
    const {
        studentArticles,
        studentArticlesLoading,
        studentArticlesError,
        fetchStudentArticles,
        formatStudentDate
    } = useContestContext();

    const [articleCount, setArticleCount] = useState(0)

    // Local state for filtering and UI
    const [searchTerm, setSearchTerm] = useState('');
    const [articleSearch, setArticleSearch] = useState('');
    const departments = ['All Department', 'CSE', 'IT', 'ECE', 'EEE'];

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Full-screen article reader modal state
    const [showArticleReader, setShowArticleReader] = useState(false);
    const [articleToRead, setArticleToRead] = useState(null);

    // Search error modal state
    const [searchErrorMessage, setSearchErrorMessage] = useState('');
    const [showSearchErrorModal, setShowSearchErrorModal] = useState(false);

    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
    const types = ['All', 'Quiz', 'Coding Contest', 'Practice Article'];
    const languages = ['All Language', 'Python', 'C', 'C++', 'Java', 'Data Structures'];

    // Handle article ID search functionality
    const handleFindArticle = () => {
        if (articleSearch.trim()) {
            const dataToSearch = studentArticles.length > 0 ? studentArticles : mockProblems;
            const foundArticle = dataToSearch.find(article =>
                article.id.toLowerCase().includes(articleSearch.toLowerCase()) ||
                article.title.toLowerCase().includes(articleSearch.toLowerCase())
            );

            if (foundArticle) {
                setSelectedArticle(foundArticle);
                setShowModal(true);
            } else {
                setSearchErrorMessage(`No article found for code: "${articleSearch}"`);
                setShowSearchErrorModal(true);
            }
        }
    };

    // Handle search error modal close
    const handleCloseSearchErrorModal = () => {
        setShowSearchErrorModal(false);
        setSearchErrorMessage('');
    };

    // Modal handlers
    const handleViewDetails = (article) => {
        setSelectedArticle(article);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedArticle(null);
    };

    const handleReadArticle = (article) => {
        setArticleToRead(article);
        setShowArticleReader(true);
        handleCloseModal(); // Close the details modal
    };

    const handleCloseArticleReader = () => {
        setShowArticleReader(false);
        setArticleToRead(null);
    };

    const [filterType, setFilterType] = useState('All');
    const [filterLanguage, setFilterLanguage] = useState('All Language');
    const [filterDepartment, setFilterDepartment] = useState('All Department');
    const [filterSearch, setFilterSearch] = useState('');
    const [filteredProblems, setFilteredProblems] = useState([]);

    // When filter button is clicked, filter the articles
    const handleFilter = () => {
        const dataToFilter = studentArticles.length > 0 ? studentArticles : mockProblems;
        const filtered = dataToFilter.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(filterSearch.toLowerCase()) ||
                item.description?.toLowerCase().includes(filterSearch.toLowerCase());

            const matchesType = filterType === 'All' ||
                (item.type && item.type === filterType) ||
                (filterType === 'Practice Article' && !item.type); // Articles don't have type

            const matchesLanguage = filterLanguage === 'All Language' ||
                (item.topicsCovered && item.topicsCovered.includes(filterLanguage)) ||
                (item.language && item.language === filterLanguage);

            const matchesDepartment = filterDepartment === 'All Department' ||
                (item.allowedDepartments && item.allowedDepartments.includes(filterDepartment)) ||
                (item.department && item.department === filterDepartment);

            return matchesSearch && matchesType && matchesLanguage && matchesDepartment;
        });
        setFilteredProblems(filtered);
        setCurrentPage(1); // Reset to first page
        setShowAll(false);
    };

    // On mount, show all
    useEffect(() => {
        if (studentArticles.length > 0) {
            setFilteredProblems(studentArticles);
        } else {
            setFilteredProblems(mockProblems);
        }
    }, [studentArticles]);

    useEffect(() => {
        fetchStudentArticles();
    }, []);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return '#4CAF50';
            case 'Medium': return '#FF9800';
            case 'Hard': return '#F44336';
            default: return '#757575';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in-progress': return 'In Progress';
            case 'not-started': return 'Start Practice';
            default: return 'Start Practice';
        }
    };

    // Helper to map status strings to CSS module classes
    const statusClasses = {
        'completed': styles.completed,
        'in-progress': styles.inProgress,
        'not-started': styles.notStarted
    };

    // Mock data for Figma card design
    const mockProblems = [
        { id: 1, type: 'Quiz', title: 'Quiz on Arrays', duration: '30 min', department: 'CSE' },
        { id: 2, type: 'Coding Contest', title: 'Weekly Coding Challenge', duration: '2 hours', department: 'IT' },
        { id: 3, type: 'Practice Article', title: 'Recursion Basics', duration: '15 min', department: 'ECE' },
        { id: 4, type: 'Quiz', title: 'OOP Concepts', duration: '25 min', department: 'CSE' },
        { id: 5, type: 'Coding Contest', title: 'Monthly Marathon', duration: '3 hours', department: 'EEE' },
        { id: 6, type: 'Practice Article', title: 'Sorting Algorithms', duration: '20 min', department: 'IT' },
        { id: 7, type: 'Quiz', title: 'DBMS Quiz', duration: '35 min', department: 'CSE' },
        { id: 8, type: 'Coding Contest', title: 'Night Owl Coding', duration: '1.5 hours', department: 'ECE' },
        { id: 9, type: 'Practice Article', title: 'Pointers in C', duration: '10 min', department: 'CSE' },
        { id: 10, type: 'Quiz', title: 'Networks Quiz', duration: '40 min', department: 'IT' },
        // New mock data
        { id: 11, type: 'Coding Contest', title: 'Bitwise Battles', duration: '2 hours', department: 'CSE' },
        { id: 12, type: 'Practice Article', title: 'Dynamic Programming', duration: '18 min', department: 'IT' },
        { id: 13, type: 'Quiz', title: 'Logic Gates', duration: '22 min', department: 'ECE' },
        { id: 14, type: 'Coding Contest', title: 'Code Golf', duration: '1 hour', department: 'EEE' },
        { id: 15, type: 'Practice Article', title: 'Graph Traversal', duration: '25 min', department: 'CSE' },
    ];

    const handleStart = (problem) => {
        alert(`Start clicked for ${problem.type}: ${problem.title}`);
        // Implement navigation or logic here
    };

    const handleView = (problem) => {
        alert(`View clicked for ${problem.type}: ${problem.title}`);
        // Implement navigation or logic here
    };

    const [showAll, setShowAll] = useState(false);

    // Update filtered articles when studentArticles data changes
    useEffect(() => {
        if (studentArticles.length > 0) {
            setFilteredProblems(studentArticles);
            setArticleCount(studentArticles.length)
        } else {
            setFilteredProblems(mockProblems);
        }
    }, [studentArticles]);

    // Pagination calculations
    const totalItems = filteredProblems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Use filteredProblems for display with pagination
    const problemsToShow = showAll ? filteredProblems : filteredProblems.slice(startIndex, endIndex);

    if (studentArticlesLoading) {
        return (
            <div className={styles.studentPractice}>
                <StudentNavbar />
                <Loader />
            </div>
        );
    }

    if (studentArticlesError) {
        return (
            <div className={styles.studentPractice}>
                <StudentNavbar />
                <div className={styles.errorContainer}>
                    <div className={styles.errorCard}>
                        <h2>Error Loading Articles</h2>
                        <p>{studentArticlesError}</p>
                        <button
                            className={styles.retryBtn}
                            onClick={fetchStudentArticles}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.studentPractice}>
            <StudentNavbar />
            <div className={styles.practiceContainer}>
                {/* Header Section */}
                <div className={styles.practiceHeader}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerText}>
                            <h1 className={styles.pageTitle}>Daily Practice & Learning</h1>
                            <p className={styles.pageSubtitle}>
                                Master programming concepts through consistent practice and real-world problem solving
                            </p>
                        </div>
                        <div className={styles.headerStats}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>
                                    <Brain size={24} />
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>{articleCount}</h3>
                                    <p>Practice Articles</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerIllustration}>
                        <img src={pracImg} alt="Practice" className={styles.practiceImage} />
                    </div>
                </div>

                {/* Quick Access Section */}
                <div className={styles.quickAccessSection}>
                    <div className={styles.codeSearchCard}>
                        <div className={styles.cardHeader}>
                            <Zap size={20} />
                            <h3>Quick Practice Access</h3>
                        </div>
                        <p>Have a specific practice code? Enter it below for instant access</p>
                        <div className={styles.codeSearchInput}>
                            <input
                                type="text"
                                placeholder="Enter article ID or title (e.g., ART2024001)"
                                value={articleSearch}
                                onChange={(e) => setArticleSearch(e.target.value)}
                                className={styles.codeInput}
                            />
                            <button className={styles.codeFindBtn} onClick={handleFindArticle}>
                                <Search size={18} />
                                Find Article
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className={styles.filterSection}>
                    <div className={styles.filterHeader}>
                        <div className={styles.filterTitle}>
                            <Target size={20} />
                            <h3>Explore Practice Problems</h3>
                        </div>
                        <p>Discover problems that match your learning goals and skill level</p>
                    </div>
                    <div className={styles.filterControls}>
                        <div className={styles.searchGroup}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by title or topic..."
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
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className={styles.filterSelect}
                        >
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button className={styles.filterBtn} onClick={handleFilter}>
                            <Target size={16} />
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Practice Cards Grid */}
                <div className={styles.practiceGrid}>
                    {problemsToShow.map(problem => {
                        const isApiData = problem.articleContent || problem.articleLink; // Check if it's API article data (content or link)

                        return (
                            <div key={problem.id} className={styles.practiceCard}>
                                <div className={styles.practiceCardHeader}>
                                    <div className={styles.practiceType}>
                                        {isApiData ? <FileText size={16} /> :
                                            problem.type === 'Coding Contest' ? <Code size={16} /> :
                                                problem.type === 'Quiz' ? <Zap size={16} /> : <BookOpen size={16} />}
                                        <span className={styles.typeLabel}>
                                            Article
                                        </span>
                                    </div>
                                    <div className={styles.practiceBadge}>
                                        <Zap size={14} />
                                        <span>Practice</span>
                                    </div>
                                </div>

                                <div className={styles.practiceCardBody}>
                                    <h3 className={styles.practiceTitle}>{problem.title}</h3>
                                    <div className={styles.practiceDetails}>
                                        {isApiData ? (
                                            <>
                                                <div className={styles.detailItem}>
                                                    <Calendar size={16} />
                                                    <span>Created: {formatStudentDate(problem.createdAt)}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <Users size={16} />
                                                    <span>Department: {problem.allowedDepartments}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <BookOpen size={16} />
                                                    <span>Topic: {problem.topicsCovered}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <Target size={16} />
                                                    <span className={styles.articleId}>ID: {problem.id}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={styles.detailItem}>
                                                    <Clock size={16} />
                                                    <span>Duration: {problem.duration}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <Users size={16} />
                                                    <span>Department: {problem.department}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <Star size={16} />
                                                    <span>Difficulty: Medium</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.practiceCardFooter}>
                                    {isApiData ? (
                                        // For API articles - same button text, different actions
                                        problem.articleLink ? (
                                            <a
                                                href={problem.articleLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.startBtn}
                                            >
                                                <BookOpen size={16} />
                                                Read Article
                                            </a>
                                        ) : (
                                            <button
                                                className={styles.startBtn}
                                                onClick={() => handleReadArticle(problem)}
                                            >
                                                <BookOpen size={16} />
                                                Read Article
                                            </button>
                                        )
                                    ) : (
                                        // For mock data
                                        <button
                                            className={styles.startBtn}
                                            onClick={() => handleStart(problem)}
                                        >
                                            <Play size={16} />
                                            Start Practice
                                        </button>
                                    )}
                                    <button
                                        className={styles.viewBtn}
                                        onClick={() => handleViewDetails(problem)}
                                    >
                                        <Eye size={16} />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Section */}
                {!showAll && totalPages > 1 && (
                    <div className={styles.paginationSection}>
                        <div className={styles.paginationInfo}>
                            <span>
                                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} articles
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
                    {(!showAll && totalItems > 9) && (
                        <button className={styles.loadMoreBtn} onClick={() => setShowAll(true)}>
                            <TrendingUp size={16} />
                            Show All Articles
                        </button>
                    )}
                    {(showAll && totalItems > 9) && (
                        <button className={styles.loadMoreBtn} onClick={() => setShowAll(false)}>
                            Show Paginated View
                        </button>
                    )}
                </div>

                {/* Article Details Modal */}
                {showModal && selectedArticle && (
                    <div className={styles.modalOverlay} onClick={handleCloseModal}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>
                                    {selectedArticle.title}
                                </h2>
                                <button className={styles.closeBtn} onClick={handleCloseModal}>
                                    ×
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <div className={styles.modalSection}>
                                    <h3>Description</h3>
                                    <p>{selectedArticle.description || 'No description available'}</p>
                                </div>

                                <div className={styles.modalSection}>
                                    <h3>Article Details</h3>
                                    <div className={styles.detailsGrid}>
                                        <div className={styles.detailItem}>
                                            <Target size={16} />
                                            <span className={styles.articleId}>Article ID: {selectedArticle.id}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <Users size={16} />
                                            <span>Departments: {selectedArticle.allowedDepartments || 'All Departments'}</span>
                                        </div>
                                        {selectedArticle.topicsCovered && (
                                            <div className={styles.detailItem}>
                                                <BookOpen size={16} />
                                                <span>Topics: {selectedArticle.topicsCovered}</span>
                                            </div>
                                        )}
                                        {selectedArticle.createdAt && (
                                            <div className={styles.detailItem}>
                                                <Calendar size={16} />
                                                <span>Created: {formatStudentDate(selectedArticle.createdAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedArticle.articleContent && (
                                    <div className={styles.modalSection}>
                                        <h3>Article Content Preview</h3>
                                        <div className={styles.contentPreview}>
                                            <p>{selectedArticle.articleContent.substring(0, 200)}...</p>
                                        </div>
                                    </div>
                                )}

                                {selectedArticle.articleLink && (
                                    <div className={styles.modalSection}>
                                        <h3>External Link</h3>
                                        <a
                                            href={selectedArticle.articleLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.externalLink}
                                        >
                                            Open Article Link
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                {selectedArticle.articleLink ? (
                                    // For link-type articles - same text, redirect to link
                                    <a
                                        href={selectedArticle.articleLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.startPracticeBtn}
                                    >
                                        <BookOpen size={16} />
                                        Read Article
                                    </a>
                                ) : (
                                    // For document-type articles
                                    <button className={styles.startPracticeBtn} onClick={() => handleReadArticle(selectedArticle)}>
                                        <BookOpen size={16} />
                                        Read Article
                                    </button>
                                )}
                                <button className={styles.cancelBtn} onClick={handleCloseModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Full-Screen Article Reader Modal */}
                {showArticleReader && articleToRead && (
                    <div className={styles.fullScreenModal} onClick={handleCloseArticleReader}>
                        <div className={styles.fullScreenContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.fullScreenHeader}>
                                <h1 className={styles.fullScreenTitle}>
                                    {articleToRead.title}
                                </h1>
                                <button className={styles.fullScreenCloseBtn} onClick={handleCloseArticleReader}>
                                    ×
                                </button>
                            </div>

                            <div className={styles.fullScreenBody}>
                                <div className={styles.articleContent}>
                                    {articleToRead.articleContent ? (
                                        <div
                                            className={styles.markdownContent}
                                            dangerouslySetInnerHTML={{
                                                __html: articleToRead.articleContent
                                                    .replace(/\n/g, '<br>')
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                                    .replace(/`(.*?)`/g, '<code>$1</code>')
                                                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                                                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                                                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                                            }}
                                        />
                                    ) : (
                                        <p className={styles.noContent}>No content available for this article.</p>
                                    )}
                                </div>
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
                                <h2 className={styles.errorModalTitle}>Article Not Found</h2>
                                <button className={styles.closeBtn} onClick={handleCloseSearchErrorModal}>
                                    ×
                                </button>
                            </div>

                            <div className={styles.errorModalBody}>
                                <p className={styles.errorMessage}>{searchErrorMessage}</p>
                                <div className={styles.errorSuggestions}>
                                    <h4>Please check:</h4>
                                    <ul>
                                        <li>The article ID is correct</li>
                                        <li>The article exists and is available</li>
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

export default StudentPractice;
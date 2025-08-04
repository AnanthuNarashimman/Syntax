import React, { useState, useEffect } from 'react';
import StudentNavbar from '../Components/StudentNavbar';
import Loader from '../Components/Loader';
import styles from '../Styles/PageStyles/StudentPractice.module.css'; // Import as a 'styles' object
import pracImg from '../assets/Images/prac.jpg';

const StudentPractice = () => {
    const [searchTerm, setSearchTerm] = useState('');
    // Remove selectedStatus state and statuses array
    const [selectedType, setSelectedType] = useState('All');
    const [selectedLanguage, setSelectedLanguage] = useState('All Language');
    const [selectedDepartment, setSelectedDepartment] = useState('All Department');
    const departments = ['All Department', 'CSE', 'IT', 'ECE', 'EEE'];
    const [loading, setLoading] = useState(true);

    // Remove the mock practiceProblems data array
    const practiceProblems = [];

    const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
    const types = ['All', 'Quiz', 'Coding Contest', 'Practice Article'];
    const languages = ['All Language', 'Python', 'C', 'C++', 'Java', 'Data Structures'];
   

    const [filterType, setFilterType] = useState('All');
    const [filterLanguage, setFilterLanguage] = useState('All Language');
    const [filterDepartment, setFilterDepartment] = useState('All Department');
    const [filterSearch, setFilterSearch] = useState('');
    const [filteredProblems, setFilteredProblems] = useState([]);

    // When filter button is clicked, filter the mockProblems
    const handleFilter = () => {
      const filtered = mockProblems.filter(problem => {
        const matchesSearch = problem.title?.toLowerCase().includes(filterSearch.toLowerCase()) || problem.description?.toLowerCase().includes(filterSearch.toLowerCase());
        const matchesType = filterType === 'All' || problem.type === filterType;
        const matchesLanguage = filterLanguage === 'All Language' || (problem.language && problem.language === filterLanguage);
        const matchesDepartment = filterDepartment === 'All Department' || (problem.department && problem.department === filterDepartment);
        return matchesSearch && matchesType && matchesLanguage && matchesDepartment;
      });
      setFilteredProblems(filtered);
      setShowAll(false); // Reset to first 9
    };

    // On mount, show all
    useEffect(() => { 
      setFilteredProblems(mockProblems); 
      // Simulate loading time
      setTimeout(() => {
        setLoading(false);
      }, 2000);
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
    // Use filteredProblems for display
    const problemsToShow = showAll ? filteredProblems : filteredProblems.slice(0, 9);

    if (loading) {
      return (
        <div className={styles.studentPracticeContainer}>
          <StudentNavbar />
          <Loader />
        </div>
      );
    }

    return (
        <div className={styles.studentPracticeContainer}>
            <StudentNavbar />
            <div className={styles.practiceContent}>
                <div className={styles.practiceHeader}>
                    <div className={styles.headerContent}>
                        <h1>Daily Practice.</h1>
                        <h2>Consistent Growth.</h2>
                        <p>Practice real-world problems designed for placements and skill-building.</p>
                        <div className={styles.quickSearch}>
                            <input
                                type="text"
                                placeholder="Enter Code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button className={styles.findBtn}>Find</button>
                        </div>
                    </div>
                    <div className={styles.headerIllustration}>
                        <img src={pracImg} alt="Practice" className={styles.practiceImage} />
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3>Can't remember the code ?</h3>
                    <p>Search and explore random practices that match your needs</p>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)} className={styles.filterSelect}>
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <input type="text" placeholder="Search by name..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className={styles.filterInput} />
                        </div>
                        <div className={styles.filterGroup}>
                            <select value={filterLanguage} onChange={e => setFilterLanguage(e.target.value)} className={styles.filterSelect}>
                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <select value={filterDepartment} onChange={e => setFilterDepartment(e.target.value)} className={styles.filterSelect}>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <button className={styles.filterBtn} onClick={handleFilter}>Filter</button>
                    </div>
                </div>

                <div className={styles.practiceGrid}>
                    {problemsToShow.map(problem => (
                        <div key={problem.id} className={styles.practiceCard}>
                            <div className={styles.cardHeader}>
                                <span className={styles.typeBadge}>{problem.type}</span>
                                <span className={styles.practiceBadge}>Practice</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.cardInfo}>
                                    <div><b>Title :</b> {problem.title}</div>
                                    <div><b>Duration :</b> {problem.duration}</div>
                                    <div><b>Department :</b> {problem.department}</div>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <button className={styles.viewBtn} onClick={() => handleView(problem)}>View</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.showMore}>
                    {(!showAll && mockProblems.length > 9) && (
                        <button className={styles.showMoreBtn} onClick={() => setShowAll(true)}>Show More...</button>
                    )}
                    {(showAll && mockProblems.length > 9) && (
                        <button className={styles.showMoreBtn} onClick={() => setShowAll(false)}>Show Less...</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentPractice;
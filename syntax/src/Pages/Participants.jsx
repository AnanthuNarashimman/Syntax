import {
    Home,
    Plus,
    Settings,
    MessageSquare,
    User,
    TrendingUp,
    Activity, Clock, EllipsisVertical ,Users, Trophy, BookOpen, Brain,Search, Filter, MoreVertical, Mail, Phone, Calendar, UserCheck, UserX, Download, Eye, X, Save, Trash2, Ban, Upload, FileSpreadsheet, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminNavbar from "../Components/AdminNavbar";
import '../Styles/PageStyles/Participants.css';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';

function Participants() {

    const [activeTab, setActiveTabState] = useState('participants');
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useAlert();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // Check authentication status
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/user/profile', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });
                
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    // Redirect to login if not authenticated
                    navigate('/admin-login');
                    return;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                navigate('/admin-login');
                return;
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, [navigate]);

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        // Map tab id to route
        const tabRoutes = {
            home: '/admin-dashboard',
            create: '/create-contest',
            manage: '/manage-contest',
            participants: '/manage-participants',
            analytics: '/analytics',
            profile: '/admin-profile',
        };
        if (tabRoutes[tab]) {
            navigate(tabRoutes[tab]);
        }
    };

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'create', label: 'Create Contest', icon: Plus },
        { id: 'manage', label: 'Manage Events', icon: Settings },
        { id: 'participants', label: 'Participants', icon: Users },
        // { id: 'analytics', label: 'Analytics', icon: TrendingUp }, // Under development
        { id: 'profile', label: 'Profile', icon: User }
    ];

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [banReason, setBanReason] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department: '',
        year: '',
        section: '',
        semester: '',
        batch: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [error, setError] = useState(null);
    const [bulkImportFile, setBulkImportFile] = useState(null);
    const [bulkImportPreview, setBulkImportPreview] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [pageCache, setPageCache] = useState({});
    const STUDENTS_PER_PAGE = 20;

    // Fetch participants data from backend API with pagination
    const fetchParticipants = async (page = 1, useCache = true) => {
        // Check cache first
        if (useCache && pageCache[page]) {
            console.log(`Loading page ${page} from cache`);
            setParticipants(pageCache[page].students);
            setCurrentPage(page);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/admin/students?page=${page}&limit=${STUDENTS_PER_PAGE}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);

                const students = data.students.map(student => ({
                    ...student,
                    name: student.name || 'Unknown Student',
                    avatar: student.name ? student.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN'
                }));

                // Update state
                setParticipants(students);
                setCurrentPage(page);
                setTotalStudents(data.total || students.length);
                setTotalPages(Math.ceil((data.total || students.length) / STUDENTS_PER_PAGE));

                // Cache the page data
                setPageCache(prev => ({
                    ...prev,
                    [page]: {
                        students,
                        timestamp: Date.now()
                    }
                }));

                setError(null);
            } else {
                throw new Error('Failed to fetch participants');
            }
        } catch (error) {
            console.error('Error fetching participants:', error);
            setError('Failed to load participants. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Clear cache and refetch current page
    const refreshParticipants = () => {
        setPageCache({});
        fetchParticipants(currentPage, false);
    };

    // Fetch data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchParticipants(1, false);
        }
    }, [isAuthenticated]);

    const handleDeleteStudent = async (studentId) => {
        setConfirmMessage('Are you sure you want to delete this student? This action cannot be undone.');
        setConfirmAction(() => async () => {
            try {
                const response = await fetch(`/api/admin/students/${studentId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (response.ok) {
                    console.log('Student deleted successfully');
                    showSuccess('Student deleted successfully');
                    refreshParticipants();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete student');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                showError(error.message || 'Failed to delete student. Please try again.');
            }
            setShowConfirmModal(false);
        });
        setShowConfirmModal(true);
    };

    const handleBulkDelete = async () => {
        const count = selectedParticipants.length;
        setConfirmMessage(`Are you sure you want to delete ${count} student${count > 1 ? 's' : ''}? This action cannot be undone.`);
        setConfirmAction(() => async () => {
            try {
                const deletePromises = selectedParticipants.map(studentId =>
                    fetch(`/api/admin/students/${studentId}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    })
                );

                const results = await Promise.all(deletePromises);

                const successCount = results.filter(response => response.ok).length;
                const failCount = count - successCount;

                if (successCount > 0) {
                    showSuccess(`Successfully deleted ${successCount} student${successCount > 1 ? 's' : ''}`);
                }

                if (failCount > 0) {
                    showError(`Failed to delete ${failCount} student${failCount > 1 ? 's' : ''}`);
                }

                setSelectedParticipants([]);
                refreshParticipants();
            } catch (error) {
                console.error('Error deleting students:', error);
                showError('Failed to delete students. Please try again.');
            }
            setShowConfirmModal(false);
        });
        setShowConfirmModal(true);
    };

    const handleBanStudent = async () => {
        if (!banReason.trim()) {
            showWarning('Please provide a reason for banning this student.');
            return;
        }

        try {
            const response = await fetch(`/api/admin/students/${selectedStudent.id}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ reason: banReason })
            });

            if (response.ok) {
                console.log('Student banned successfully');
                showSuccess('Student banned successfully');
                setShowBanModal(false);
                setBanReason('');
                setSelectedStudent(null);
                refreshParticipants();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to ban student');
            }
        } catch (error) {
            console.error('Error banning student:', error);
            showError(error.message || 'Failed to ban student. Please try again.');
        }
    };

    const handleUnbanStudent = async (student) => {
        setConfirmMessage(`Are you sure you want to unban ${student.name}? This will restore their access.`);
        setConfirmAction(() => async () => {
            try {
                const response = await fetch(`/api/admin/students/${student.id}/unban`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (response.ok) {
                    console.log('Student unbanned successfully');
                    showSuccess('Student unbanned successfully');
                    refreshParticipants();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to unban student');
                }
            } catch (error) {
                console.error('Error unbanning student:', error);
                showError(error.message || 'Failed to unban student. Please try again.');
            }
            setShowConfirmModal(false);
        });
        setShowConfirmModal(true);
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setShowViewModal(true);
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        
        if (!bulkImportFile) {
            showWarning('Please select a file to import.');
            return;
        }

        try {
            setError(null); // Clear any previous errors
            const formData = new FormData();
            formData.append('file', bulkImportFile);

            const response = await fetch('/api/admin/students/bulk-import', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Bulk import successful:', data);
                
                // Show success message with details
                let successMessage = data.message;
                if (data.errors && data.errors.length > 0) {
                    successMessage += `\n\nErrors:\n${data.errors.join('\n')}`;
                }
                
                showSuccess(successMessage);
                
                setShowBulkImportModal(false);
                setBulkImportFile(null);
                setBulkImportPreview([]);
                refreshParticipants();
            } else {
                throw new Error(data.message || 'Failed to import students');
            }
        } catch (error) {
            console.error('Error importing students:', error);
            showError(error.message || 'Failed to import students. Please try again.');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/vnd.ms-excel.sheet.macroEnabled.12'
            ];
            
            if (!validTypes.includes(file.type)) {
                showError('Please select a valid Excel file (.xlsx or .xls)');
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size must be less than 5MB');
                return;
            }
            
            setBulkImportFile(file);
            
            // Read and preview the file
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    // For now, we'll show a generic preview message
                    // In a real implementation, you could use a library like SheetJS to parse the file client-side
                    setBulkImportPreview([]);
                } catch (error) {
                    console.error('Error reading file:', error);
                    showError('Error reading file. Please try again.');
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        
        // Validate form
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        if (!formData.department.trim()) errors.department = 'Department is required';
        if (!formData.year.trim()) errors.year = 'Year is required';
        if (!formData.section.trim()) errors.section = 'Section is required';
        if (!formData.semester.trim()) errors.semester = 'Semester is required';
        if (!formData.batch.trim()) errors.batch = 'Batch is required';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const response = await fetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Student added successfully:', data);
                
                showSuccess('Student added successfully');
                
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    department: '',
                    year: '',
                    section: '',
                    semester: '',
                    batch: ''
                });
                setFormErrors({});
                setShowAddForm(false);

                // Refresh participants list
                refreshParticipants();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add student');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            showError(error.message || 'Failed to add student. Please try again.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const filteredParticipants = participants.filter(participant => {
        const name = participant.name || '';
        const email = participant.email || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || participant.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const handleSelectParticipant = (participantId) => {
        setSelectedParticipants(prev =>
            prev.includes(participantId)
                ? prev.filter(id => id !== participantId)
                : [...prev, participantId]
        );
    };

    const handleSelectAll = () => {
        if (selectedParticipants.length === filteredParticipants.length) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(filteredParticipants.map(p => p.id));
        }
    };

    const toggleRowExpansion = (participantId) => {
        setExpandedRows(prev =>
            prev.includes(participantId)
                ? prev.filter(id => id !== participantId)
                : [...prev, participantId]
        );
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { text: 'Active', className: 'participant-status-active' },
            inactive: { text: 'Inactive', className: 'participant-status-inactive' },
            banned: { text: 'Banned', className: 'participant-status-banned' }
        };
        return statusConfig[status] || { text: status, className: 'participant-status-default' };
    };

    const getRankBadge = (rank) => {
        if (rank <= 3) return 'participant-rank-top';
        if (rank <= 10) return 'participant-rank-good';
        return 'participant-rank-normal';
    };

    if (authLoading) {
        return (
            <div className="participants-management-container">
                <div className="loading-state">
                    <p>Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    if (loading) {
        return (
            <>
                <AdminNavbar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    sidebarItems={sidebarItems}
                />
                <div className="participants-management-container">
                    <div className="loading-state">
                        <p>Loading participants...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AdminNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarItems={sidebarItems}
            />

            <div className="participants-management-container">
                <div className="participants-header-section">
                    <h1>Participants Management</h1>
                    <p>Monitor and manage participant activities, performance, and engagement</p>
                </div>

                {error && (
                    <div className="error-message" style={{ 
                        background: '#fed7d7', 
                        color: '#e53e3e', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '1rem' 
                    }}>
                        {error}
                    </div>
                )}

                <div className="participants-stats-overview">
                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper total-icon">
                            <Users className="participant-stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Total Students</h3>
                            <span className="stat-number">{totalStudents}</span>
                        </div>
                    </div>

                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper active-icon">
                            <UserCheck className="participant-stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Active Students</h3>
                            <span className="stat-number">{participants.filter(p => p.status === 'active').length}</span>
                        </div>
                    </div>

                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper banned-icon">
                            <UserX className="participant-stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Banned Students</h3>
                            <span className="stat-number">{participants.filter(p => p.status === 'banned').length}</span>
                        </div>
                    </div>
                </div>

                <div className="participants-control-panel">
                    <div className="participant-search-container">
                        <Search className="participant-search-icon" />
                        <input
                            type="text"
                            placeholder="Search participants by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="participant-search-input"
                        />
                    </div>

                    <div className="participant-filter-container">
                        <Filter className="participant-filter-icon" />
                        <div className="participant-filter-options">
                            <button
                                className={`participant-filter-btn ${activeFilter === 'all' ? 'filter-active' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={`participant-filter-btn ${activeFilter === 'active' ? 'filter-active' : ''}`}
                                onClick={() => setActiveFilter('active')}
                            >
                                Active
                            </button>
                            <button
                                className={`participant-filter-btn ${activeFilter === 'inactive' ? 'filter-active' : ''}`}
                                onClick={() => setActiveFilter('inactive')}
                            >
                                Inactive
                            </button>
                            <button
                                className={`participant-filter-btn ${activeFilter === 'banned' ? 'filter-active' : ''}`}
                                onClick={() => setActiveFilter('banned')}
                            >
                                Banned
                            </button>
                        </div>
                    </div>

                    <div className="participant-bulk-actions">
                        <button
                            className="bulk-action-btn refresh-btn"
                            onClick={refreshParticipants}
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button 
                            className="bulk-action-btn add-student-btn"
                            onClick={() => setShowAddForm(true)}
                        >
                            <Plus className="btn-icon" />
                            Add Student
                        </button>
                        <button 
                            className="bulk-action-btn bulk-import-btn"
                            onClick={() => setShowBulkImportModal(true)}
                        >
                            <Upload className="btn-icon" />
                            Bulk Import
                        </button>
                    </div>
                </div>

                {/* Add Student Modal */}
                {showAddForm && (
                    <div className="participants-add-student-modal">
                        <div className="participants-modal-content">
                            <div className="participants-modal-header">
                                <h2>Add New Student</h2>
                                <button 
                                    className="participants-close-btn"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    <X />
                                </button>
                            </div>
                            <form onSubmit={handleAddStudent} className="add-student-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <p>Name *</p>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={formErrors.name ? 'error' : ''}
                                            placeholder="Enter full name"
                                        />
                                        {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                                    </div>
                                    <div className="form-group">
                                        <p>Email *</p>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={formErrors.email ? 'error' : ''}
                                            placeholder="Enter email address"
                                        />
                                        {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <p>Department *</p>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className={formErrors.department ? 'error' : ''}
                                            placeholder="e.g., Computer Science"
                                        />
                                        {formErrors.department && <span className="error-message">{formErrors.department}</span>}
                                    </div>
                                    <div className="form-group">
                                        <p>Year *</p>
                                        <input
                                            type="number"
                                            name="year"
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            className={formErrors.year ? 'error' : ''}
                                            placeholder="e.g., 1, 2, 3, 4"
                                            min="1"
                                            max="4"
                                        />
                                        {formErrors.year && <span className="error-message">{formErrors.year}</span>}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <p>Section *</p>
                                        <input
                                            type="text"
                                            name="section"
                                            value={formData.section}
                                            onChange={handleInputChange}
                                            className={formErrors.section ? 'error' : ''}
                                            placeholder="e.g., A, B, C"
                                        />
                                        {formErrors.section && <span className="error-message">{formErrors.section}</span>}
                                    </div>
                                    <div className="form-group">
                                        <p>Semester *</p>
                                        <input
                                            type="number"
                                            name="semester"
                                            value={formData.semester}
                                            onChange={handleInputChange}
                                            className={formErrors.semester ? 'error' : ''}
                                            placeholder="e.g., 1, 2, 3, 4"
                                            min="1"
                                            max="8"
                                        />
                                        {formErrors.semester && <span className="error-message">{formErrors.semester}</span>}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <p>Batch *</p>
                                        <input
                                            type="text"
                                            name="batch"
                                            value={formData.batch}
                                            onChange={handleInputChange}
                                            className={formErrors.batch ? 'error' : ''}
                                            placeholder="e.g., 2024-2028"
                                        />
                                        {formErrors.batch && <span className="error-message">{formErrors.batch}</span>}
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        <Save className="btn-icon" />
                                        Add Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Ban Student Modal */}
                {showBanModal && selectedStudent && (
                    <div className="add-student-modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Ban Student</h2>
                                <button 
                                    className="close-btn"
                                    onClick={() => {
                                        setShowBanModal(false);
                                        setBanReason('');
                                        setSelectedStudent(null);
                                    }}
                                >
                                    <X />
                                </button>
                            </div>
                            <div className="ban-student-form">
                                <div className="form-group">
                                    <p>Student: {selectedStudent.name || 'Unknown Student'}</p>
                                </div>
                                <div className="form-group">
                                    <p>Reason for Ban *</p>
                                    <textarea
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        placeholder="Please provide a reason for banning this student..."
                                        rows="4"
                                        className="ban-reason-input"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button 
                                        type="button" 
                                        className="cancel-btn" 
                                        onClick={() => {
                                            setShowBanModal(false);
                                            setBanReason('');
                                            setSelectedStudent(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        className="ban-btn"
                                        onClick={handleBanStudent}
                                    >
                                        <Ban className="btn-icon" />
                                        Ban Student
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Student Modal */}
                {showViewModal && selectedStudent && (
                    <div className="add-student-modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Student Details</h2>
                                <button 
                                    className="close-btn"
                                    onClick={() => {
                                        setShowViewModal(false);
                                        setSelectedStudent(null);
                                    }}
                                >
                                    <X />
                                </button>
                            </div>
                            <div className="student-details-view">
                                <div className="student-profile-section">
                                    <div className="student-avatar-large">
                                        {selectedStudent.avatar}
                                    </div>
                                                                         <div className="student-info">
                                         <h3>{selectedStudent.name || 'Unknown Student'}</h3>
                                        <p className="student-email">{selectedStudent.email}</p>
                                        <div className={`student-status-badge ${getStatusBadge(selectedStudent.status).className}`}>
                                            {getStatusBadge(selectedStudent.status).text}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="student-details-grid">
                                    <div className="detail-section">
                                        <h4>Academic Information</h4>
                                        <div className="detail-item">
                                            <span className="detail-label">Department:</span>
                                            <span>{selectedStudent.department}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Year:</span>
                                            <span>{selectedStudent.year}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Section:</span>
                                            <span>{selectedStudent.section}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Semester:</span>
                                            <span>{selectedStudent.semester}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Batch:</span>
                                            <span>{selectedStudent.batch}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-section">
                                        <h4>Performance</h4>
                                        <div className="detail-item">
                                            <span className="detail-label">Contests Participated:</span>
                                            <span>{selectedStudent.contestsParticipated}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Total Score:</span>
                                            <span>{selectedStudent.totalScore}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Last Active:</span>
                                            <span>{selectedStudent.lastActive}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Join Date:</span>
                                            <span>{new Date(selectedStudent.joinDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {selectedStudent.achievements && selectedStudent.achievements.length > 0 && (
                                    <div className="detail-section">
                                        <h4>Achievements</h4>
                                        <div className="achievements-list">
                                            {selectedStudent.achievements.map((achievement, index) => (
                                                <span key={index} className="achievement-badge">
                                                    {achievement}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Import Modal */}
                {showBulkImportModal && (
                    <div className="participants-add-student-modal">
                        <div className="participants-modal-content">
                            <div className="participants-modal-header">
                                <h2>Bulk Import Students</h2>
                                <button 
                                    className="participants-close-btn"
                                    onClick={() => {
                                        setShowBulkImportModal(false);
                                        setBulkImportFile(null);
                                        setBulkImportPreview([]);
                                    }}
                                >
                                    <X />
                                </button>
                            </div>
                            <form onSubmit={handleBulkImport} className="bulk-import-form">
                                <div className="form-group">
                                    <p>Upload Excel File (.xlsx, .xls)</p>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="file-input"
                                    />
                                    <p className="file-help">Please ensure your Excel file has columns: Name, Email, Department, Year, Section, Semester, Batch</p>
                                </div>
                                
                                {bulkImportPreview.length > 0 && (
                                    <div className="import-preview">
                                        <h4>Preview ({bulkImportPreview.length} students)</h4>
                                        <div className="preview-table">
                                            <div className="preview-header">
                                                <span>Name</span>
                                                <span>Email</span>
                                                <span>Department</span>
                                                <span>Year</span>
                                            </div>
                                            {bulkImportPreview.slice(0, 5).map((student, index) => (
                                                <div key={index} className="preview-row">
                                                    <span>{student.name}</span>
                                                    <span>{student.email}</span>
                                                    <span>{student.department}</span>
                                                    <span>{student.year}</span>
                                                </div>
                                            ))}
                                            {bulkImportPreview.length > 5 && (
                                                <div className="preview-more">
                                                    ... and {bulkImportPreview.length - 5} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="form-actions">
                                    <button 
                                        type="button" 
                                        className="cancel-btn" 
                                        onClick={() => {
                                            setShowBulkImportModal(false);
                                            setBulkImportFile(null);
                                            setBulkImportPreview([]);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="save-btn"
                                        disabled={!bulkImportFile}
                                    >
                                        <FileSpreadsheet className="btn-icon" />
                                        Import Students
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                                 )}

                 {/* Confirmation Modal */}
                 {showConfirmModal && (
                     <div className="add-student-modal">
                         <div className="modal-content">
                             <div className="modal-header">
                                 <h2>Confirm Action</h2>
                                 <button 
                                     className="close-btn"
                                     onClick={() => setShowConfirmModal(false)}
                                 >
                                     <X />
                                 </button>
                             </div>
                             <div className="confirm-modal-content">
                                 <p>{confirmMessage}</p>
                                 <div className="form-actions">
                                     <button 
                                         type="button" 
                                         className="cancel-btn" 
                                         onClick={() => setShowConfirmModal(false)}
                                     >
                                         Cancel
                                     </button>
                                     <button 
                                         type="button" 
                                         className="delete-btn"
                                         onClick={() => {
                                             if (confirmAction) {
                                                 confirmAction();
                                             }
                                         }}
                                     >
                                         <Trash2 className="btn-icon" />
                                         Confirm
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}

                <div className="participants-table-container">
                    <div className="participants-table-header">
                        <div className="table-header-left">
                            <input
                                type="checkbox"
                                checked={selectedParticipants.length === filteredParticipants.length && filteredParticipants.length > 0}
                                onChange={handleSelectAll}
                                className="participant-checkbox"
                            />
                            <span className="selected-count">
                                {selectedParticipants.length > 0 && `${selectedParticipants.length} selected`}
                            </span>
                            {selectedParticipants.length > 0 && (
                                <button
                                    className="bulk-delete-btn"
                                    onClick={handleBulkDelete}
                                    title="Delete selected students"
                                >
                                    <Trash2 className="btn-icon" />
                                    Delete Selected
                                </button>
                            )}
                        </div>
                        <div className="table-header-right">
                            <span className="participants-total">
                                Showing {filteredParticipants.length > 0 ? ((currentPage - 1) * STUDENTS_PER_PAGE + 1) : 0}-{Math.min(currentPage * STUDENTS_PER_PAGE, totalStudents)} of {totalStudents} participants
                            </span>
                        </div>
                    </div>

                    {/* Table Header Row */}
                    <div className="participants-table-head">
                        <div className="table-col-checkbox"></div>
                        <div className="table-col-name-email">Name / Email</div>
                        <div className="table-col-dept">Department</div>
                        <div className="table-col-year">Year</div>
                        <div className="table-col-section">Section</div>
                        <div className="table-col-semester">Semester</div>
                        <div className="table-col-status">Status</div>
                        <div className="table-col-actions">Actions</div>
                    </div>

                    <div className="participants-table">
                        {filteredParticipants.map((participant) => (
                            <div key={participant.id} className="participant-row-wrapper">
                                <div className="participant-row">
                                    <div className="table-col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedParticipants.includes(participant.id)}
                                            onChange={() => handleSelectParticipant(participant.id)}
                                            className="participant-checkbox"
                                        />
                                    </div>
                                    <div className="table-col-name-email">
                                        <div className="participant-avatar">{participant.avatar}</div>
                                        <div className="name-email-wrapper">
                                            <span className="participant-name">{participant.name || 'Unknown Student'}</span>
                                            <span className="participant-email">{participant.email}</span>
                                        </div>
                                    </div>
                                    <div className="table-col-dept">{participant.department}</div>
                                    <div className="table-col-year">{participant.year}</div>
                                    <div className="table-col-section">{participant.section}</div>
                                    <div className="table-col-semester">{participant.semester}</div>
                                    <div className="table-col-status">
                                        <div className={`participant-status-badge ${getStatusBadge(participant.status || 'active').className}`}>
                                            {getStatusBadge(participant.status || 'active').text}
                                        </div>
                                    </div>
                                    <div className="table-col-actions">
                                        {(participant.status || 'active') === 'banned' ? (
                                            <button
                                                className="participant-action-btn unban-btn"
                                                onClick={() => handleUnbanStudent(participant)}
                                                title="Unban Student"
                                            >
                                                <UserCheck className="action-icon" />
                                            </button>
                                        ) : (
                                            <button
                                                className="participant-action-btn ban-btn"
                                                onClick={() => {
                                                    setSelectedStudent(participant);
                                                    setShowBanModal(true);
                                                }}
                                                title="Ban Student"
                                            >
                                                <Ban className="action-icon" />
                                            </button>
                                        )}
                                        <button
                                            className="participant-action-btn delete-btn"
                                            onClick={() => handleDeleteStudent(participant.id)}
                                            title="Delete Student"
                                        >
                                            <Trash2 className="action-icon" />
                                        </button>
                                        <button
                                            className={`participant-action-btn dropdown-btn ${expandedRows.includes(participant.id) ? 'expanded' : ''}`}
                                            onClick={() => toggleRowExpansion(participant.id)}
                                            title="Show More Details"
                                        >
                                            {expandedRows.includes(participant.id) ? (
                                                <ChevronUp className="action-icon" />
                                            ) : (
                                                <ChevronDown className="action-icon" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {expandedRows.includes(participant.id) && (
                                    <div className="participant-expanded-details">
                                        <div className="expanded-details-grid">
                                            <div className="detail-group">
                                                <span className="detail-label">Batch:</span>
                                                <span className="detail-value">{participant.batch}</span>
                                            </div>
                                            <div className="detail-group">
                                                <span className="detail-label">Contests Participated:</span>
                                                <span className="detail-value">{participant.contestsParticipated || 0}</span>
                                            </div>
                                            <div className="detail-group">
                                                <span className="detail-label">Total Score:</span>
                                                <span className="detail-value">{participant.totalScore || 0}</span>
                                            </div>
                                            <div className="detail-group">
                                                <span className="detail-label">Join Date:</span>
                                                <span className="detail-value">{participant.joinDate ? new Date(participant.joinDate).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            {(participant.status === 'banned' && participant.banReason) && (
                                                <div className="detail-group ban-reason-group">
                                                    <span className="detail-label">Ban Reason:</span>
                                                    <span className="detail-value ban-reason-text">{participant.banReason}</span>
                                                </div>
                                            )}
                                            {participant.achievements && participant.achievements.length > 0 && (
                                                <div className="detail-group achievements-group">
                                                    <span className="detail-label">Achievements:</span>
                                                    <div className="achievements-list-expanded">
                                                        {participant.achievements.map((achievement, index) => (
                                                            <span key={index} className="achievement-badge-expanded">
                                                                {achievement}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                className="pagination-btn"
                                onClick={() => fetchParticipants(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            <div className="pagination-numbers">
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNumber === 1 ||
                                        pageNumber === totalPages ||
                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNumber}
                                                className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                                                onClick={() => fetchParticipants(pageNumber)}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    } else if (
                                        pageNumber === currentPage - 2 ||
                                        pageNumber === currentPage + 2
                                    ) {
                                        return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                className="pagination-btn"
                                onClick={() => fetchParticipants(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

                {filteredParticipants.length === 0 && (
                    <div className="participants-empty-state">
                        <p>No participants found matching your search criteria.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default Participants

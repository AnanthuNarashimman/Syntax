import {
    Home,
    Plus,
    Settings,
    MessageSquare,
    User,
    TrendingUp,
    Activity, Clock, EllipsisVertical ,Users, Trophy, BookOpen, Brain,Search, Filter, MoreVertical, Mail, Phone, Calendar, Award, UserCheck, UserX, Download, Eye
} from 'lucide-react';
import { useState } from 'react';
import AdminNavbar from "../Components/AdminNavbar";
import '../Styles/PageStyles/Participants.css';

function Participants() {

    const [activeTab, setActiveTab] = useState('participants');

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'create', label: 'Create Contest', icon: Plus },
        { id: 'manage', label: 'Manage Events', icon: Settings },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User }
    ];


    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    // Sample participants data
    const participants = [
        {
            id: 1,
            name: 'Alex Johnson',
            email: 'alex.johnson@email.com',
            phone: '+1 234-567-8901',
            joinDate: '2024-01-15',
            status: 'active',
            contestsParticipated: 12,
            totalScore: 1450,
            rank: 1,
            avatar: 'AJ',
            lastActive: '2 hours ago',
            achievements: ['Top Performer', 'Contest Winner']
        },
        {
            id: 2,
            name: 'Sarah Chen',
            email: 'sarah.chen@email.com',
            phone: '+1 234-567-8902',
            joinDate: '2024-02-10',
            status: 'active',
            contestsParticipated: 8,
            totalScore: 1200,
            rank: 2,
            avatar: 'SC',
            lastActive: '1 day ago',
            achievements: ['Quick Learner']
        },
        {
            id: 3,
            name: 'Michael Brown',
            email: 'michael.brown@email.com',
            phone: '+1 234-567-8903',
            joinDate: '2024-01-20',
            status: 'inactive',
            contestsParticipated: 15,
            totalScore: 1380,
            rank: 3,
            avatar: 'MB',
            lastActive: '1 week ago',
            achievements: ['Consistent Performer']
        },
        {
            id: 4,
            name: 'Emily Davis',
            email: 'emily.davis@email.com',
            phone: '+1 234-567-8904',
            joinDate: '2024-03-05',
            status: 'active',
            contestsParticipated: 6,
            totalScore: 890,
            rank: 4,
            avatar: 'ED',
            lastActive: '3 hours ago',
            achievements: ['Rising Star']
        },
        {
            id: 5,
            name: 'David Wilson',
            email: 'david.wilson@email.com',
            phone: '+1 234-567-8905',
            joinDate: '2024-02-28',
            status: 'banned',
            contestsParticipated: 3,
            totalScore: 250,
            rank: 5,
            avatar: 'DW',
            lastActive: '2 weeks ago',
            achievements: []
        },
        {
            id: 6,
            name: 'Lisa Rodriguez',
            email: 'lisa.rodriguez@email.com',
            phone: '+1 234-567-8906',
            joinDate: '2024-01-08',
            status: 'active',
            contestsParticipated: 10,
            totalScore: 1100,
            rank: 6,
            avatar: 'LR',
            lastActive: '5 minutes ago',
            achievements: ['Team Player', 'Mentor']
        }
    ];

    const filteredParticipants = participants.filter(participant => {
        const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            participant.email.toLowerCase().includes(searchQuery.toLowerCase());
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

                <div className="participants-stats-overview">
                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper active-icon">
                            <UserCheck className="stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Active Users</h3>
                            <span className="stat-number">{participants.filter(p => p.status === 'active').length}</span>
                        </div>
                    </div>

                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper total-icon">
                            <Award className="stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Total Participants</h3>
                            <span className="stat-number">{participants.length}</span>
                        </div>
                    </div>

                    <div className="participant-stat-card">
                        <div className="stat-icon-wrapper inactive-icon">
                            <UserX className="stat-icon" />
                        </div>
                        <div className="stat-content">
                            <h3>Inactive Users</h3>
                            <span className="stat-number">{participants.filter(p => p.status === 'inactive').length}</span>
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
                        <button className="bulk-action-btn export-btn">
                            <Download className="btn-icon" />
                            Export
                        </button>
                    </div>
                </div>

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
                        </div>
                        <div className="table-header-right">
                            <span className="participants-total">Total: {filteredParticipants.length} participants</span>
                        </div>
                    </div>

                    <div className="participants-table">
                        {filteredParticipants.map(participant => (
                            <div key={participant.id} className="participant-row">
                                <div className="participant-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedParticipants.includes(participant.id)}
                                        onChange={() => handleSelectParticipant(participant.id)}
                                        className="participant-checkbox"
                                    />
                                </div>

                                <div className="participant-profile">
                                    <div className="participant-avatar">
                                        {participant.avatar}
                                    </div>
                                    <div className="participant-info">
                                        <h4 className="participant-name">{participant.name}</h4>
                                        <div className="participant-contact">
                                            <Mail className="contact-icon" />
                                            <span>{participant.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="participant-details">
                                    <div className="detail-item">
                                        <Phone className="detail-icon" />
                                        <span>{participant.phone}</span>
                                    </div>
                                    <div className="detail-item">
                                        <Calendar className="detail-icon" />
                                        <span>Joined {new Date(participant.joinDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="participant-performance">
                                    <div className="performance-stat">
                                        <span className="stat-label">Contests</span>
                                        <span className="stat-value">{participant.contestsParticipated}</span>
                                    </div>
                                    <div className="performance-stat">
                                        <span className="stat-label">Score</span>
                                        <span className="stat-value">{participant.totalScore}</span>
                                    </div>
                                    <div className={`participant-rank ${getRankBadge(participant.rank)}`}>
                                        #{participant.rank}
                                    </div>
                                </div>

                                <div className="participant-status-section">
                                    <div className={`participant-status-badge ${getStatusBadge(participant.status).className}`}>
                                        {getStatusBadge(participant.status).text}
                                    </div>
                                    <div className="participant-last-active">
                                        Last active: {participant.lastActive}
                                    </div>
                                </div>

                                <div className="participant-achievements">
                                    {participant.achievements.slice(0, 2).map((achievement, index) => (
                                        <span key={index} className="achievement-badge">
                                            {achievement}
                                        </span>
                                    ))}
                                    {participant.achievements.length > 2 && (
                                        <span className="achievement-more">
                                            +{participant.achievements.length - 2} more
                                        </span>
                                    )}
                                </div>

                                <div className="participant-actions">
                                    <button className="action-btn menu-btn" style={{width: '50px', marginRight: '40px'}}>
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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

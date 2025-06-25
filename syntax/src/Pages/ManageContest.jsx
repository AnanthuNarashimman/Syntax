
import {
    Home,
    Plus,
    Settings,
    MessageSquare,
    User,
    TrendingUp,
    Calendar,
    Award,
    Activity, Search, Filter, Clock, Users, Trophy, BookOpen, Brain
} from 'lucide-react';
import { useState } from 'react';
import AdminNavbar from "../Components/AdminNavbar";
import '../Styles/PageStyles/ManageContest.css';

function ManageContest() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [activeTab, setActiveTab] = useState('manage');

    const sidebarItems = [
        { id: 'home', label: 'Dashboard', icon: Home },
        { id: 'create', label: 'Create Contest', icon: Plus },
        { id: 'manage', label: 'Manage Events', icon: Settings },
        { id: 'participants', label: 'Participants', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    // Sample data - replace with your actual data
    const contests = [
        {
            id: 1,
            title: 'Data Structures Challenge',
            type: 'contest',
            participants: 156,
            status: 'ongoing',
            timeLeft: '2h 30m left',
            mode: 'strict',
            description: 'Advanced data structures implementation challenge'
        },
        {
            id: 2,
            title: 'Algorithm Sprint',
            type: 'contest',
            participants: 89,
            status: 'upcoming',
            timeLeft: 'Tomorrow 2:00 PM',
            mode: 'usual',
            description: 'Quick algorithm solving competition'
        },
        {
            id: 3,
            title: 'Web Development Quiz',
            type: 'quiz',
            participants: 234,
            status: 'ended',
            timeLeft: '2 days ago',
            mode: 'strict',
            description: 'Frontend and backend concepts quiz'
        },
        {
            id: 4,
            title: 'Python Fundamentals',
            type: 'practice',
            participants: 178,
            status: 'ongoing',
            timeLeft: '45m left',
            mode: 'usual',
            description: 'Basic Python programming practice'
        },
        {
            id: 5,
            title: 'React Hooks Practice',
            type: 'practice',
            participants: 92,
            status: 'upcoming',
            timeLeft: 'In 3 hours',
            mode: 'usual',
            description: 'Hands-on React hooks implementation'
        },
        {
            id: 6,
            title: 'JavaScript Fundamentals Quiz',
            type: 'quiz',
            participants: 145,
            status: 'ongoing',
            timeLeft: '1h 15m left',
            mode: 'strict',
            description: 'Core JavaScript concepts assessment'
        }
    ];

    const filteredContests = contests.filter(contest => {
        const matchesSearch = contest.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || contest.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const badges = {
            ongoing: { text: 'LIVE', className: 'live' },
            upcoming: { text: 'SCHEDULED', className: 'scheduled' },
            ended: { text: 'COMPLETED', className: 'completed' }
        };
        return badges[status] || { text: status.toUpperCase(), className: 'default' };
    };

    const getTypeIcon = (type) => {
        const icons = {
            contest: <Trophy className="type-icon" />,
            quiz: <Brain className="type-icon" />,
            practice: <BookOpen className="type-icon" />
        };
        return icons[type] || <Trophy className="type-icon" />;
    };

    const groupedContests = {
        contest: filteredContests.filter(c => c.type === 'contest'),
        quiz: filteredContests.filter(c => c.type === 'quiz'),
        practice: filteredContests.filter(c => c.type === 'practice')
    };

    return (
        <>
            <AdminNavbar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                sidebarItems={sidebarItems}
            />
            <div className="manage-contest-page">
                <div className="page-header">
                    <h1>Manage Contests</h1>
                    <p>Organize and monitor your coding contests, quizzes, and practice sessions</p>
                </div>

                <div className="controls-section">
                    <div className="search-bar">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search contests, quizzes, or practice sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-section">
                        <Filter className="filter-icon" />
                        <div className="filter-buttons">
                            <button
                                className={statusFilter === 'all' ? 'active' : ''}
                                onClick={() => setStatusFilter('all')}
                            >
                                All
                            </button>
                            <button
                                className={statusFilter === 'ongoing' ? 'active' : ''}
                                onClick={() => setStatusFilter('ongoing')}
                            >
                                Ongoing
                            </button>
                            <button
                                className={statusFilter === 'upcoming' ? 'active' : ''}
                                onClick={() => setStatusFilter('upcoming')}
                            >
                                Upcoming
                            </button>
                            <button
                                className={statusFilter === 'ended' ? 'active' : ''}
                                onClick={() => setStatusFilter('ended')}
                            >
                                Ended
                            </button>
                        </div>
                    </div>
                </div>

                <div className="content-sections">
                    {Object.entries(groupedContests).map(([type, items]) => (
                        items.length > 0 && (
                            <div key={type} className="section">
                                <div className="section-header">
                                    <h2>
                                        {getTypeIcon(type)}
                                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                                        <span className="count">({items.length})</span>
                                    </h2>
                                </div>

                                <div className="cards-grid">
                                    {items.map(item => (
                                        <div key={item.id} className="contest-card">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    <h3>{item.title}</h3>
                                                    <div className="mode-badge">
                                                        {item.mode === 'strict' ? 'Exam Mode' : 'Practice Mode'}
                                                    </div>
                                                </div>
                                                <div className={`status-badge ${getStatusBadge(item.status).className}`}>
                                                    {getStatusBadge(item.status).text}
                                                </div>
                                            </div>

                                            <p className="card-description">{item.description}</p>

                                            <div className="card-footer">
                                                <div className="participants">
                                                    <Users className="icon" />
                                                    <span>{item.participants} participants</span>
                                                </div>
                                                <div className="time-info">
                                                    <Clock className="icon" />
                                                    <span>{item.timeLeft}</span>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <button className="btn-secondary">Edit</button>
                                                <button className="btn-primary">View Details</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {filteredContests.length === 0 && (
                    <div className="empty-state">
                        <p>No contests found matching your criteria.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default ManageContest

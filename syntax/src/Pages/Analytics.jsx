import '../Styles/PageStyles/Analytics.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import {Home,
    Plus,
    Settings,
    MessageSquare,
    User, TrendingUp, Users, Clock, Target, Filter, Calendar, Download, Eye, Award, AlertCircle } from 'lucide-react';
import AdminNavbar from "../Components/AdminNavbar";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


function Analytics() {

    const [activeTab, setActiveTabState] = useState('analytics');
    const navigate = useNavigate();

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
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
    const [selectedQuizType, setSelectedQuizType] = useState('all');

    // Sample data for charts
    const participationData = [
        { date: 'Mon', participants: 45, completions: 38, avgScore: 78 },
        { date: 'Tue', participants: 62, completions: 54, avgScore: 82 },
        { date: 'Wed', participants: 38, completions: 35, avgScore: 75 },
        { date: 'Thu', participants: 71, completions: 68, avgScore: 85 },
        { date: 'Fri', participants: 89, completions: 81, avgScore: 88 },
        { date: 'Sat', participants: 34, completions: 29, avgScore: 72 },
        { date: 'Sun', participants: 28, completions: 24, avgScore: 69 }
    ];

    const quizPerformanceData = [
        { name: 'JavaScript', attempts: 234, avgScore: 82, completion: 89 },
        { name: 'React', attempts: 156, avgScore: 78, completion: 85 },
        { name: 'CSS Advanced', attempts: 189, avgScore: 74, completion: 76 },
        { name: 'Node.js Basics', attempts: 98, avgScore: 86, completion: 92 },
        { name: 'Database', attempts: 145, avgScore: 71, completion: 68 }
    ];

    const difficultyDistribution = [
        { name: 'Easy', value: 45, color: '#38a169' },
        { name: 'Medium', value: 35, color: '#d69e2e' },
        { name: 'Hard', value: 20, color: '#e53e3e' }
    ];

    const timeSpentData = [
        { timeRange: '0-5 min', students: 23 },
        { timeRange: '5-10 min', students: 67 },
        { timeRange: '10-15 min', students: 89 },
        { timeRange: '15-20 min', students: 45 },
        { timeRange: '20+ min', students: 28 }
    ];

    const topPerformers = [
        { id: 1, name: 'Alex Johnson', score: 96, quizzes: 12, streak: 8 },
        { id: 2, name: 'Sarah Chen', score: 94, quizzes: 10, streak: 6 },
        { id: 3, name: 'Michael Brown', score: 92, quizzes: 15, streak: 5 },
        { id: 4, name: 'Emily Davis', score: 90, quizzes: 8, streak: 4 },
        { id: 5, name: 'David Wilson', score: 88, quizzes: 11, streak: 3 }
    ];

    const recentActivity = [
        { id: 1, user: 'Alex Johnson', action: 'Completed "React Hooks Quiz"', score: 94, time: '2 minutes ago' },
        { id: 2, user: 'Sarah Chen', action: 'Started "JavaScript Advanced"', score: null, time: '5 minutes ago' },
        { id: 3, user: 'Michael Brown', action: 'Retook "CSS Fundamentals"', score: 88, time: '8 minutes ago' },
        { id: 4, user: 'Emily Davis', action: 'Completed "Node.js Basics"', score: 92, time: '12 minutes ago' }
    ];

    return (
        <>

            <AdminNavbar />


            <div className="analytics-dashboard-wrapper">
                <div className="analytics-main-header">
                    <h1>Quiz Analytics Dashboard</h1>
                    <p>Monitor student engagement, performance trends, and quiz effectiveness</p>
                </div>

                <div className="analytics-controls-bar">
                    <div className="analytics-timeframe-selector">
                        <Calendar className="selector-icon" />
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="analytics-select-input"
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 3 Months</option>
                            <option value="1year">Last Year</option>
                        </select>
                    </div>

                    <div className="analytics-quiz-filter">
                        <Filter className="selector-icon" />
                        <select
                            value={selectedQuizType}
                            onChange={(e) => setSelectedQuizType(e.target.value)}
                            className="analytics-select-input"
                        >
                            <option value="all">All Quizzes</option>
                            <option value="javascript">JavaScript</option>
                            <option value="react">React</option>
                            <option value="css">CSS</option>
                            <option value="nodejs">Node.js</option>
                        </select>
                    </div>

                    <button className="analytics-export-button">
                        <Download className="export-icon" />
                        Export Report
                    </button>
                </div>

                <div className="analytics-metrics-grid">
                    <div className="analytics-metric-card primary-metric">
                        <div className="metric-icon-container participation-icon">
                            <Users className="metric-icon" />
                        </div>
                        <div className="metric-details">
                            <h3>Total Participants</h3>
                            <div className="metric-value">1,247</div>
                            <div className="metric-change positive">
                                <TrendingUp className="change-icon" />
                                +12.3% from last week
                            </div>
                        </div>
                    </div>

                    <div className="analytics-metric-card">
                        <div className="metric-icon-container completion-icon">
                            <Target className="metric-icon" />
                        </div>
                        <div className="metric-details">
                            <h3>Completion Rate</h3>
                            <div className="metric-value">87.5%</div>
                            <div className="metric-change positive">
                                <TrendingUp className="change-icon" />
                                +3.2% from last week
                            </div>
                        </div>
                    </div>

                    <div className="analytics-metric-card">
                        <div className="metric-icon-container time-icon">
                            <Clock className="metric-icon" />
                        </div>
                        <div className="metric-details">
                            <h3>Avg. Time Spent</h3>
                            <div className="metric-value">14.2 min</div>
                            <div className="metric-change negative">
                                <TrendingUp className="change-icon down" />
                                -1.8% from last week
                            </div>
                        </div>
                    </div>

                    <div className="analytics-metric-card">
                        <div className="metric-icon-container score-icon">
                            <Award className="metric-icon" />
                        </div>
                        <div className="metric-details">
                            <h3>Average Score</h3>
                            <div className="metric-value">78.9%</div>
                            <div className="metric-change positive">
                                <TrendingUp className="change-icon" />
                                +5.1% from last week
                            </div>
                        </div>
                    </div>
                </div>

                <div className="analytics-charts-section">
                    <div className="analytics-chart-container large-chart">
                        <div className="chart-header">
                            <h3>Daily Participation & Performance Trends</h3>
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <div className="legend-color participants"></div>
                                    <span>Participants</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color completions"></div>
                                    <span>Completions</span>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color scores"></div>
                                    <span>Avg Score</span>
                                </div>
                            </div>
                        </div>
                        <div className="chart-content">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={participationData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" stroke="#718096" />
                                    <YAxis stroke="#718096" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="participants" stackId="1" stroke="#e53e3e" fill="#e53e3e" fillOpacity={0.6} />
                                    <Area type="monotone" dataKey="completions" stackId="2" stroke="#38a169" fill="#38a169" fillOpacity={0.6} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-chart-container">
                        <div className="chart-header">
                            <h3>Quiz Difficulty Distribution</h3>
                        </div>
                        <div className="chart-content">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={difficultyDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        dataKey="value"
                                    >
                                        {difficultyDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pie-chart-legend">
                                {difficultyDistribution.map((item, index) => (
                                    <div key={index} className="pie-legend-item">
                                        <div className="pie-legend-color" style={{ backgroundColor: item.color }}></div>
                                        <span>{item.name}: {item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="analytics-secondary-charts">
                    <div className="analytics-chart-container">
                        <div className="chart-header">
                            <h3>Quiz Performance Overview</h3>
                        </div>
                        <div className="chart-content">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={quizPerformanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" stroke="#718096" angle={-45} textAnchor="end" height={80} />
                                    <YAxis stroke="#718096" />
                                    <Tooltip />
                                    <Bar dataKey="avgScore" fill="#e53e3e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="analytics-chart-container">
                        <div className="chart-header">
                            <h3>Time Spent Distribution</h3>
                        </div>
                        <div className="chart-content">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={timeSpentData} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" stroke="#718096" />
                                    <YAxis dataKey="timeRange" type="category" stroke="#718096" width={80} />
                                    <Tooltip />
                                    <Bar dataKey="students" fill="#38a169" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="analytics-data-tables">
                    <div className="analytics-table-container">
                        <div className="table-header-section">
                            <h3>Top Performers</h3>
                            <button className="table-action-btn">
                                <Eye className="btn-icon" />
                                View All
                            </button>
                        </div>
                        <div className="analytics-data-table">
                            <div className="table-header-row">
                                <span>Rank</span>
                                <span>Student</span>
                                <span>Avg Score</span>
                                <span>Quizzes</span>
                                <span>Streak</span>
                            </div>
                            {topPerformers.map((performer, index) => (
                                <div key={performer.id} className="table-data-row">
                                    <div className={`rank-badge rank-${index + 1}`}>#{index + 1}</div>
                                    <div className="student-info">
                                        <div className="student-avatar">{performer.name.split(' ').map(n => n[0]).join('')}</div>
                                        <span className="student-name">{performer.name}</span>
                                    </div>
                                    <div className="score-display">{performer.score}%</div>
                                    <div className="quiz-count">{performer.quizzes}</div>
                                    <div className="streak-display">
                                        <Award className="streak-icon" />
                                        {performer.streak}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="analytics-table-container">
                        <div className="table-header-section">
                            <h3>Recent Activity</h3>
                            <button className="table-action-btn">
                                <Eye className="btn-icon" />
                                View All
                            </button>
                        </div>
                        <div className="analytics-activity-feed">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-user">{activity.user}</div>
                                    <div className="activity-description">{activity.action}</div>
                                    <div className="activity-meta">
                                        {activity.score && (
                                            <span className="activity-score">Score: {activity.score}%</span>
                                        )}
                                        <span className="activity-time">{activity.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="analytics-insights-section">
                    <div className="insights-card">
                        <div className="insights-header">
                            <AlertCircle className="insights-icon" />
                            <h3>Key Insights</h3>
                        </div>
                        <div className="insights-content">
                            <div className="insight-item">
                                <div className="insight-indicator positive"></div>
                                <p>Quiz completion rates have improved by 15% this month, indicating better engagement.</p>
                            </div>
                            <div className="insight-item">
                                <div className="insight-indicator warning"></div>
                                <p>Students spend less time on "CSS Advanced" quiz - consider reviewing difficulty level.</p>
                            </div>
                            <div className="insight-item">
                                <div className="insight-indicator positive"></div>
                                <p>Peak participation occurs on Thursday and Friday - optimal days for new quiz releases.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Analytics

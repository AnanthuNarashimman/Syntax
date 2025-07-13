import { 
  Home, 
  Plus, 
  Settings, 
  User, 
  Users, 
  Trophy, 
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';

import { useState, useEffect } from 'react';
import '../Styles/PageStyles/AdminDashboard.css';
import AdminNavbar from '../Components/AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { useContestContext } from '../contexts/ContestContext';

function AdminDashboard() {
  // Use ContestContext
  const { getStats, getRecentContests, loading, adminName } = useContestContext();

  const [activeTab, setActiveTabState] = useState('home');
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

  // Get real data from context
  const statsData = getStats();
  const recentContestsData = getRecentContests();

  const stats = [
    { title: 'Active Contests', value: statsData.activeContests.toString(), icon: Trophy, color: '#e95a49' },
    { title: 'Total Participants', value: statsData.totalParticipants.toString(), icon: Users, color: '#ff7569' },
    { title: 'Completed Events', value: statsData.completedEvents.toString(), icon: Award, color: '#ff8a7a' }
  ];

  // Format recent contests for display
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const recentContests = recentContestsData.map(contest => ({
    name: contest.title,
    participants: contest.participants,
    status: contest.status === 'ongoing' ? 'Live' : contest.status === 'queue' ? 'Scheduled' : 'Completed',
    time: contest.status === 'ongoing' ? 'Active' : formatTimeAgo(contest.createdAt)
  }));

  return (
    <>
    <div className="admin-dashboard">
      {/* Sidebar */}
      <AdminNavbar />

      {/* Main Content */}
      <div className="AdminDashboardMainContent column-dashboard">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Welcome back, {adminName}!</h1>
            <p>Manage your coding contests and monitor participant activity</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={() => navigate('/create-contest')}>
              <Plus size={16} />
              New Contest
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="AdminDashboardStatsGrid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="AdminDashboardStatCard">
                <div className="AdminDashboardStatIcon" style={{ backgroundColor: stat.color }}>
                  <Icon size={24} color="white" />
                </div>
                <div className="AdminDashboardStatContent">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Contests & Quick Actions Row */}
        <div className="AdminDashboardRow">
          <div className="AdminDashboardCard AdminDashboardRecentContests">
            <div className="AdminDashboardCardHeader">
              <h2>Recent Contests</h2>
              <button className="btn-secondary" onClick={() => navigate('/manage-contest')}>View All</button>
            </div>
            {recentContests.length > 0 ? (
              <div className="AdminDashboardContestList">
                {recentContests.map((contest, index) => (
                  <>
                    <div key={index} className="AdminDashboardContestItem">
                      <div className="AdminDashboardContestInfo">
                        <h4>{contest.name}</h4>
                        <p>{contest.participants} participants</p>
                      </div>
                      <div className="AdminDashboardContestStatus">
                        <span className={`AdminDashboardStatusBadge ${contest.status.toLowerCase()}`}>{contest.status}</span>
                        <p className="AdminDashboardContestTime">{contest.time}</p>
                      </div>
                    </div>
                    {index !== recentContests.length - 1 && <hr className="contest-divider" />}
                  </>
                ))}
              </div>
            ) : (
              <div className="AdminDashboardEmptyContests">
                <p>No contests created</p>
              </div>
            )}
          </div>

          <div className="AdminDashboardCard AdminDashboardQuickActionsCard">
            <div className="AdminDashboardCardHeader">
              <h2>Quick Actions</h2>
            </div>
            <div className="AdminDashboardQuickActions">
              <button className="AdminDashboardActionBtn large" onClick={() => navigate('/create-contest')}>
                <Plus size={32} />
                <span>Create New Contest</span>
              </button>
              <button className="AdminDashboardActionBtn large" onClick={() => navigate('/manage-participants')}>
                <Users size={32} />
                <span>Manage Users</span>
              </button>
              <button className="AdminDashboardActionBtn large" onClick={() => navigate('/manage-articles')}>
                <BookOpen size={32} />
                <span>Manage Articles</span>
              </button>
              <button className="AdminDashboardActionBtn large" onClick={() => navigate('/manage-contest')}>
                <Settings size={32} />
                <span>Manage Events</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="AdminDashboardCard AdminDashboardFullWidth">
          <div className="AdminDashboardCardHeader">
            <h2>Participation Overview</h2>
            <select className="time-selector">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
          <div className="AdminDashboardChartPlaceholder">
            <div className="AdminDashboardChartBars">
              <div className="AdminDashboardBar" style={{ height: '60%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '80%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '45%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '90%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '70%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '85%' }}></div>
              <div className="AdminDashboardBar" style={{ height: '65%' }}></div>
            </div>
            <div className="AdminDashboardChartLabels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>
      </div>
      </>
      )
}

export default AdminDashboard

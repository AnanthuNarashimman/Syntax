import { 
  Home, 
  Plus, 
  Settings, 
  MessageSquare, 
  User, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  Activity
} from 'lucide-react';

import { useState, useEffect } from 'react';
import '../Styles/PageStyles/AdminDashboard.css';
import AdminNavbar from '../Components/AdminNavbar';

function AdminDashboard() {

  useEffect(() => {
    authCheck();
  }, []);

  async function authCheck() {
    const res = await Axis3DIcon.get('http:..localhost:5000/api/auth-verify', {
      headers: {
        Authorization: 'Bearer' + ThermometerSnowflakeIcon,
      },
    });
    console.log(res.data);
  }

  const [activeTab, setActiveTab] = useState('home');

  const sidebarItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'create', label: 'Create Contest', icon: Plus },
    { id: 'manage', label: 'Manage Events', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const stats = [
    { title: 'Active Contests', value: '12', icon: Trophy, color: '#e95a49' },
    { title: 'Total Participants', value: '1,247', icon: Users, color: '#ff7569' },
    { title: 'Completed Events', value: '45', icon: Award, color: '#ff8a7a' }
  ];

  const recentContests = [
    { name: 'Data Structures Challenge', participants: 156, status: 'Live', time: '2h 30m left' },
    { name: 'Algorithm Sprint', participants: 89, status: 'Scheduled', time: 'Tomorrow 2:00 PM' },
    { name: 'Web Development Quiz', participants: 234, status: 'Completed', time: '2 days ago' },
    { name: 'Python Fundamentals', participants: 178, status: 'Live', time: '45m left' }
  ];

  return (
    <>
    <div className="admin-dashboard">
      {/* Sidebar */}
      <AdminNavbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          sidebarItems={sidebarItems}
        />

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Welcome back, Admin!</h1>
            <p>Manage your coding contests and monitor participant activity</p>
          </div>
          <div className="header-actions">
            <button className="btn-primary">
              <Plus size={16} />
              New Contest
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                  <Icon size={24} color="white" />
                </div>
                <div className="stat-content">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Recent Contests */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Contests</h2>
              <button className="btn-secondary">View All</button>
            </div>
            <div className="contest-list">
              {recentContests.map((contest, index) => (
                <div key={index} className="contest-item">
                  <div className="contest-info">
                    <h4>{contest.name}</h4>
                    <p>{contest.participants} participants</p>
                  </div>
                  <div className="contest-status">
                    <span className={`status-badge ${contest.status.toLowerCase()}`}>
                      {contest.status}
                    </span>
                    <p className="contest-time">{contest.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button className="action-btn">
                <Plus size={20} />
                <span>Create New Contest</span>
              </button>
              <button className="action-btn">
                <Calendar size={20} />
                <span>Schedule Event</span>
              </button>
              <button className="action-btn">
                <MessageSquare size={20} />
                <span>Send Notification</span>
              </button>
              <button className="action-btn">
                <Users size={20} />
                <span>Manage Users</span>
              </button>
            </div>
          </div>

          {/* Activity Chart Placeholder */}
          <div className="card full-width">
            <div className="card-header">
              <h2>Participation Overview</h2>
              <select className="time-selector">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <div className="chart-placeholder">
              <div className="chart-bars">
                <div className="bar" style={{ height: '60%' }}></div>
                <div className="bar" style={{ height: '80%' }}></div>
                <div className="bar" style={{ height: '45%' }}></div>
                <div className="bar" style={{ height: '90%' }}></div>
                <div className="bar" style={{ height: '70%' }}></div>
                <div className="bar" style={{ height: '85%' }}></div>
                <div className="bar" style={{ height: '65%' }}></div>
              </div>
              <div className="chart-labels">
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
      </div>
      </>
      )
}

export default AdminDashboard

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Activity,
  Plus,
  Settings,
  User,
  Shield
} from 'lucide-react';
import SuperAdminNavbar from '../Components/SuperAdminNavbar';
import '../Styles/PageStyles/SuperAdminDashboard.css';
import { useAlert } from '../contexts/AlertContext';

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalContests: 0,
    activeContests: 0,
    totalParticipants: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch admins count
      const adminsResponse = await fetch('/api/super-admin/admins', {
        credentials: 'include'
      });
      const adminsData = await adminsResponse.json();
      
      // Fetch contests count
      const contestsResponse = await fetch('/api/super-admin/contests', {
        credentials: 'include'
      });
      const contestsData = await contestsResponse.json();
      
      const activeContests = contestsData.contests?.filter(c => c.status === 'active').length || 0;
      
      setStats({
        totalAdmins: adminsData.admins?.length || 0,
        totalContests: contestsData.contests?.length || 0,
        activeContests: activeContests,
        totalParticipants: contestsData.contests?.reduce((sum, contest) => sum + (contest.participants || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage admin accounts',
      icon: Users,
      path: '/super-manage-users',
      color: '#e95a49'
    },
    {
      title: 'Manage Contests',
      description: 'Oversee all contests and events',
      icon: Trophy,
      path: '/super-manage-contests',
      color: '#10B981'
    },
    {
      title: 'View Profile',
      description: 'Update your super admin profile',
      icon: User,
      path: '/super-profile',
      color: '#F59E0B'
    }
  ];

  const statCards = [
    {
      title: 'Total Admins',
      value: stats.totalAdmins,
      icon: Shield,
      color: '#e95a49',
      description: 'Registered administrators'
    },
    {
      title: 'Total Contests',
      value: stats.totalContests,
      icon: Trophy,
      color: '#10B981',
      description: 'All contests created'
    },
    {
      title: 'Active Contests',
      value: stats.activeContests,
      icon: Activity,
      color: '#F59E0B',
      description: 'Currently running'
    },
    {
      title: 'Total Participants',
      value: stats.totalParticipants,
      icon: Users,
      color: '#EF4444',
      description: 'Across all contests'
    }
  ];

  if (loading) {
    return (
      <>
        <SuperAdminNavbar />
        <div className="Super_Admin_Dashboard">
          <div className="Loading_State">
            <p>Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SuperAdminNavbar />
      <div className="Super_Admin_Dashboard">
        <div className="Dashboard_Header">
          <div className="Header_Content">
            <h1>Super Admin Dashboard</h1>
            <p>System overview and administration controls</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="Stats_Grid">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="Stat_Card">
                <div className="Stat_Icon" style={{ backgroundColor: stat.color }}>
                  <IconComponent />
                </div>
                <div className="Stat_Content">
                  <h3>{stat.value}</h3>
                  <p>{stat.title}</p>
                  <span className="Stat_Description">{stat.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="Content_Grid">
          <div className="Card">
            <div className="Card_Header">
              <h2>Quick Actions</h2>
            </div>
            <div className="Quick_Actions">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    className="Action_Button"
                    onClick={() => navigate(action.path)}
                    style={{ '--action-color': action.color }}
                  >
                    <div className="Action_Icon">
                      <IconComponent />
                    </div>
                    <div className="Action_Content">
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="Card">
            <div className="Card_Header">
              <h2>System Status</h2>
            </div>
            <div className="System_Status">
              <div className="Status_Item">
                <div className="Status_Indicator Online"></div>
                <div className="Status_Content">
                  <h4>Backend Server</h4>
                  <p>Online and operational</p>
                </div>
              </div>
              <div className="Status_Item">
                <div className="Status_Indicator Online"></div>
                <div className="Status_Content">
                  <h4>Database</h4>
                  <p>Connected and responsive</p>
                </div>
              </div>
              <div className="Status_Item">
                <div className="Status_Indicator Online"></div>
                <div className="Status_Content">
                  <h4>Authentication</h4>
                  <p>JWT tokens active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SuperAdminDashboard;
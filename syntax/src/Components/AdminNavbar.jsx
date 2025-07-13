import { 
  Home, 
  Plus, 
  Settings, 
  User, 
  Users, 
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../Styles/ComponentStyles/AdminNavbar.css';
import { Button } from './Button';

const sidebarItems = [
  { id: 'home', label: 'Dashboard', icon: Home, route: '/admin-dashboard' },
  { id: 'create', label: 'Create Contest', icon: Plus, route: '/create-contest' },
  { id: 'manage', label: 'Manage Events', icon: Settings, route: '/manage-contest' },
  { id: 'participants', label: 'Participants', icon: Users, route: '/manage-participants' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, route: '/analytics' },
  { id: 'articles', label: 'Articles', icon: BookOpen, route: '/manage-articles' },
  { id: 'profile', label: 'Profile', icon: User, route: '/admin-profile' }
];

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab by matching current path
  const activeTab = sidebarItems.find(item => location.pathname.startsWith(item.route))?.id || 'home';

  return (
    <div className="navbar-sidebar">
      <div className="navbar-header">
        <div className="navbar-logo">
          <span className="navbar-logo-bracket">&lt;</span>
          <span className="navbar-logo-text">SYNTAX</span>
          <span className="navbar-logo-bracket">/&gt;</span>
        </div>
        <p className="navbar-logo-subtitle">Admin Panel</p>
      </div>
      
      <nav className="navbar-nav">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`navbar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.route)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <Button className="navbar-logout-btn" onClick={() => window.location.href = '/'}>Logout</Button>
      </nav>
    </div>
  );
}

export default AdminNavbar

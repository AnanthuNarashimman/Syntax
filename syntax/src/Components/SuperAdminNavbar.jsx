import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';
import '../Styles/ComponentStyles/SuperAdminNavbar.css';

function SuperAdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/super-dashboard' },
    { id: 'manage-users', label: 'Manage Users', icon: Users, path: '/super-manage-users' },
    { id: 'manage-contests', label: 'Manage Contests', icon: Settings, path: '/super-manage-contests' },
    { id: 'profile', label: 'Profile', icon: User, path: '/super-profile' },
  ];

  return (
    <nav className="SuperAdminNavbar">
      <div className="NavbarHeader">
        <div className="NavbarLogo">
          <Shield className="LogoIcon" />
          <span className="NavbarLogoText">Super Admin</span>
        </div>
        <p className="NavbarLogoSubtitle">System Administration</p>
      </div>

      <div className="NavbarNav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className={`NavbarNavItem ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <IconComponent className="NavIcon" />
              {item.label}
            </button>
          );
        })}
      </div>

      <button
        className="NavbarLogoutBtn"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="LogoutIcon" />
        {isLoggingOut ? 'Logging Out...' : 'Logout'}
      </button>
    </nav>
  );
}

export default SuperAdminNavbar; 
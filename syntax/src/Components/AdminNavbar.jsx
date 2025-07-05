import { 
  Home, 
  Plus, 
  Settings, 
  User, 
  Users, 
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import '../Styles/ComponentStyles/AdminNavbar.css';
import { Button } from './Button';

function AdminNavbar({ activeTab, onTabChange, sidebarItems = [] }) {
  const defaultSidebarItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'create', label: 'Create Contest', icon: Plus },
    { id: 'manage', label: 'Manage Events', icon: Settings },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const items = sidebarItems.length > 0 ? sidebarItems : defaultSidebarItems;

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
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`navbar-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(item.id)}
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

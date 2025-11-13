import React, { useState } from 'react';
import { User, Menu, X, LogOut } from 'lucide-react';
import styles from "../Styles/ComponentStyles/StudentNavbar.module.css"; // Updated import
import { useNavigate, NavLink } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';

const StudentNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        showSuccess('Logged out successfully!');
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        showError('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showError('Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className={styles['student-navbar']}>
      <div className={styles['navbar-container']}>
        {/* Logo */}
        <div className={styles['navbar-logo']}>&lt; SYNTAX /&gt;</div>

        {/* Desktop Navigation */}
        <div className={`${styles['navbar-menu']} ${styles['desktop-menu']}`}>
          <NavLink to="/student-home" className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}>Home</NavLink>
          <NavLink to="/student-practice" className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}>Practice</NavLink>
          <NavLink to="/student-contests" className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}>Contests</NavLink>
          <NavLink to="/student-leader" className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}>Leaderboard</NavLink>
          <NavLink to="/student-codeground" className={({ isActive }) => `${styles['nav-link']} ${isActive ? styles['active'] : ''}`}>Codeground</NavLink>
        </div>

        {/* Right side items */}
        <div className={styles['navbar-right']}>
          {/* User Profile */}
          <div className={styles['user-profile']} onClick={() => navigate('/student-user')} style={{ cursor: 'pointer' }}>
            <div className={styles['user-avatar']}>
              <User size={20} />
            </div>
          </div>

          {/* Logout Button */}
          <button 
            className={styles['logout-btn']} 
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
          >
            <LogOut size={20} />
          </button>

          {/* Mobile Menu Button */}
          <button className={styles['mobile-menu-btn']} onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={styles['mobile-menu']}>
          <NavLink to="/student-home" className={styles['mobile-nav-link']}>Home</NavLink>
          <NavLink to="/student-practice" className={styles['mobile-nav-link']}>Practice</NavLink>
          <NavLink to="/student-contests" className={styles['mobile-nav-link']}>Contests</NavLink>
          <NavLink to="/student-leader" className={styles['mobile-nav-link']}>Leaderboard</NavLink>
          <NavLink to="/student-codeground" className={styles['mobile-nav-link']}>Codeground</NavLink>
        </div>
      )}
    </nav>
  );
};

export default StudentNavbar;
import React, { useState } from 'react';
import { User, Menu, X } from 'lucide-react';
import styles from "../Styles/ComponentStyles/StudentNavbar.module.css"; // Updated import
import { useNavigate, NavLink } from 'react-router-dom';

const StudentNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
          <span className={styles['nav-link']}>Codeground</span>
        </div>

        {/* Right side items */}
        <div className={styles['navbar-right']}>
          {/* User Profile */}
          <div className={styles['user-profile']} onClick={() => navigate('/student-user')} style={{ cursor: 'pointer' }}>
            <div className={styles['user-avatar']}>
              <User size={20} />
            </div>
          </div>

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
          <span className={styles['mobile-nav-link']}>Codeground</span>
        </div>
      )}
    </nav>
  );
};

export default StudentNavbar;
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFlash } from '../../context/FlashContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showSuccess } = useFlash();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const catRef = useRef(null);
  const toolsRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
    setToolsOpen(false);
  }, [location.pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target)) {
        setToolsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/home');
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    showSuccess('You have logged out successfully.');
    navigate('/home');
  };

  return (
    <nav className="app-navbar" role="navigation" aria-label="Main navigation">
      <div className="cover">
        <Link className="navbar-brand" to="/home">
          <span className="brand-mark"><i className="fa-solid fa-wave-square"></i></span>
          <span>SensiQ</span>
        </Link>

        <form className="nav-search" onSubmit={handleSearchSubmit} role="search">
          <input
            type="text"
            name="q"
            placeholder="Search courses..."
            aria-label="Search courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Search"><i className="fa-solid fa-magnifying-glass"></i></button>
        </form>

        <button
          className="nav-toggler"
          type="button"
          aria-label="Toggle navigation"
          id="navToggler"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <div className={`nav-mobile-wrap ${mobileOpen ? 'open' : ''}`} id="navMobileWrap">
          <ul className="nav-links">
            <li>
              <Link className="nav-link" to="/home">
                <i className="fa-solid fa-house"></i> Home
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/home/about">
                <i className="fa-solid fa-circle-info"></i> About
              </Link>
            </li>
            <li>
              <Link className="nav-link" to="/home/contact">
                <i className="fa-solid fa-phone"></i> Contact Us
              </Link>
            </li>

            <li className={`nav-dropdown ${catOpen ? 'open' : ''}`} id="navCatDropdown" ref={catRef}>
              <a
                className="nav-link"
                href="#categories"
                id="catDropdownToggle"
                aria-expanded={catOpen}
                aria-haspopup="true"
                onClick={(e) => {
                  e.preventDefault();
                  setCatOpen((prev) => !prev);
                  setToolsOpen(false);
                }}
              >
                <i className="fa-solid fa-list"></i> Categories{' '}
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '.7rem' }}></i>
              </a>
              <div className="nav-dropdown-menu" role="menu">
                <Link to="/category/deaf" role="menuitem">
                  <i className="fa-solid fa-ear-deaf"></i> Deaf Learners
                </Link>
                <Link to="/category/mute" role="menuitem">
                  <i className="fa-solid fa-microphone-lines-slash"></i> Mute Learners
                </Link>
                <Link to="/category/visually_impaired" role="menuitem">
                  <i className="fa-solid fa-eye-low-vision"></i> Visually Impaired
                </Link>
                <Link to="/category/deaf_mute" role="menuitem">
                  <i className="fa-solid fa-hands-asl-interpreting"></i> Deaf & Mute
                </Link>
                <Link to="/category/mute_visually_impaired" role="menuitem">
                  <i className="fa-solid fa-universal-access"></i> Mute & Visually Impaired
                </Link>
              </div>
            </li>

            <li className={`nav-dropdown ${toolsOpen ? 'open' : ''}`} id="navToolsDropdown" ref={toolsRef}>
              <a
                className="nav-link nav-link-tools"
                href="#tools"
                id="toolsDropdownToggle"
                aria-expanded={toolsOpen}
                aria-haspopup="true"
                onClick={(e) => {
                  e.preventDefault();
                  setToolsOpen((prev) => !prev);
                  setCatOpen(false);
                }}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i> Assistive Tools{' '}
                <i className="fa-solid fa-chevron-down" style={{ fontSize: '.7rem' }}></i>
              </a>
              <div className="nav-dropdown-menu nav-tools-menu" role="menu">
                <div className="nav-tools-header">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Accessibility Tools
                </div>
                <Link to="/tools/speech-to-text" role="menuitem" className="nav-tool-item">
                  <span className="nav-tool-icon stt-icon"><i className="fa-solid fa-microphone"></i></span>
                  <span className="nav-tool-info">
                    <strong>Speech to Text</strong>
                    <small>Convert your voice to written text</small>
                  </span>
                </Link>
                <Link to="/tools/text-to-speech" role="menuitem" className="nav-tool-item">
                  <span className="nav-tool-icon tts-icon"><i className="fa-solid fa-volume-high"></i></span>
                  <span className="nav-tool-info">
                    <strong>Text to Speech</strong>
                    <small>Listen to text read aloud</small>
                  </span>
                </Link>
                <Link to="/tools/text-to-sign" role="menuitem" className="nav-tool-item">
                  <span className="nav-tool-icon t2s-icon"><i className="fa-solid fa-hands-asl-interpreting"></i></span>
                  <span className="nav-tool-info">
                    <strong>Text to Sign</strong>
                    <small>Convert text to ISL fingerspelling</small>
                  </span>
                </Link>
              </div>
            </li>
          </ul>

          <div className="nav-auth">
            {!user ? (
              <>
                <Link className="nav-btn nav-btn-outline" to="/home/login">Log in</Link>
                <Link className="nav-btn nav-btn-filled" to="/home/signup">Sign up</Link>
              </>
            ) : (
              <>
                <span className="nav-user-badge">
                  <i className="fa-solid fa-user"></i> {user.username}
                </span>
                <Link className="nav-btn nav-btn-outline" to="/dashboard">
                  <i className="fa-solid fa-gauge"></i> Dashboard
                </Link>
                <button
                  type="button"
                  className="nav-btn nav-btn-filled"
                  onClick={handleLogout}
                  style={{ cursor: 'pointer', border: 'none', font: 'inherit' }}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

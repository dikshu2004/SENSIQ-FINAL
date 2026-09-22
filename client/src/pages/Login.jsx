import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';

export default function Login() {
  const { user, login } = useAuth();
  const { showSuccess, showError } = useFlash();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.disabilityType && user.disabilityType !== 'none') {
        navigate(`/category/${user.disabilityType}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(username, password);
      showSuccess('✅ Welcome back to SensiQ! Continue your learning journey.');
      if (data && data.redirectUrl) {
        navigate(data.redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-blob-gold"></div>
      <div className="auth-blob-teal"></div>
      <div className="cover">
        <div className="auth-card">
          <div className="auth-panel auth-panel-dark">
            <span className="eyebrow eyebrow-dark">Welcome Back</span>
            <h1>Sign in to continue learning.</h1>
            <p>Access your SensiQ account and continue with your preferred accessibility pathway.</p>
            <Link to="/home/signup" className="auth-link">
              <i className="fa-solid fa-arrow-right"></i> Create a new account
            </Link>
          </div>

          <div className="auth-panel auth-panel-form">
            <h2>Log In</h2>
            <form onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="form-control"
                type="text"
                name="username"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="form-control"
                type="password"
                name="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

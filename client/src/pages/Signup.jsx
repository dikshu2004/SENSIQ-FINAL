import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';

export default function Signup() {
  const { user, signup } = useAuth();
  const { showSuccess, showError } = useFlash();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    disabilityType: 'none',
  });
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      showError('Username, email, and password are required.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(formData);
      showSuccess('🎉 Welcome to SensiQ! Your account has been created. Start learning!');
      if (data && data.redirectUrl) {
        navigate(data.redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showError(err.message || 'Registration failed.');
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
            <span className="eyebrow eyebrow-dark">Join SensiQ</span>
            <h1>Create an account for inclusive, flexible learning.</h1>
            <p>
              Register to unlock personalised access to accessible study flows, assistive tools, and learning pathways tailored to your needs.
            </p>
            <Link to="/home/login" className="auth-link">
              <i className="fa-solid fa-arrow-right"></i> Already have an account?
            </Link>
          </div>

          <div className="auth-panel auth-panel-form">
            <h2>Create Account</h2>
            <form onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="form-control"
                type="text"
                name="username"
                placeholder="Choose a username"
                required
                value={formData.username}
                onChange={handleChange}
              />

              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="form-control"
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleChange}
              />

              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="form-control"
                type="password"
                name="password"
                placeholder="Create a password"
                required
                value={formData.password}
                onChange={handleChange}
              />

              <label className="form-label" htmlFor="disabilityType">
                I identify as
              </label>
              <select
                id="disabilityType"
                className="form-control"
                name="disabilityType"
                value={formData.disabilityType}
                onChange={handleChange}
              >
                <option value="none">Select your learning category (optional)</option>
                <option value="deaf">Deaf Learner</option>
                <option value="mute">Mute Learner</option>
                <option value="visually_impaired">Visually Impaired Learner</option>
                <option value="deaf_mute">Deaf &amp; Mute Learner</option>
                <option value="mute_visually_impaired">Mute &amp; Visually Impaired Learner</option>
              </select>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

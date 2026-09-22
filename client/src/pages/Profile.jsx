import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useFlash } from '../context/FlashContext';

export default function Profile() {
  const { user, setUser, loading: authLoading } = useAuth();
  const {
    highContrast,
    setHighContrast,
    autoNarrate,
    setAutoNarrate,
    fontSize,
    setFontSize,
  } = useAccessibility();
  const { showSuccess, showError } = useFlash();
  const navigate = useNavigate();

  const [disabilityType, setDisabilityType] = useState('none');
  const [formHighContrast, setFormHighContrast] = useState(false);
  const [formAutoNarrate, setFormAutoNarrate] = useState(false);
  const [formFontSize, setFormFontSize] = useState('normal');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
      return;
    }

    if (user) {
      setDisabilityType(user.disabilityType || 'none');
      setFormHighContrast(!!user.preferences?.highContrast);
      setFormAutoNarrate(!!user.preferences?.autoNarrate);
      setFormFontSize(user.preferences?.fontSize || 'normal');
    }
  }, [user, authLoading, navigate, showError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          disabilityType,
          highContrast: formHighContrast,
          autoNarrate: formAutoNarrate,
          fontSize: formFontSize,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setHighContrast(formHighContrast);
        setAutoNarrate(formAutoNarrate);
        setFontSize(formFontSize);
        showSuccess('Profile updated successfully.');
        navigate('/dashboard');
      } else {
        showError(data.error || 'Could not update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showError('Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--blue)' }}></i>
      </div>
    );
  }

  return (
    <>
      <section className="content-hero">
        <div className="cover narrow">
          <span className="eyebrow eyebrow-dark">My Profile</span>
          <h1>Accessibility Preferences</h1>
          <p>Customise your learning experience. Choose your disability category and preferred accessibility settings.</p>
        </div>
      </section>

      <section className="section-block section-light">
        <div className="cover" style={{ maxWidth: '720px' }}>
          <div className="content-card">
            <h2>
              <i className="fa-solid fa-user-gear" style={{ color: 'var(--blue)' }}></i> Update Profile
            </h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.2rem' }}>
              <label
                className="form-label"
                htmlFor="disabilityType"
                style={{ fontWeight: 600, display: 'block', marginBottom: '.3rem' }}
              >
                Learning Category
              </label>
              <select
                id="disabilityType"
                name="disabilityType"
                className="form-control"
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  padding: '.8rem 1rem',
                  border: '2px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '.95rem',
                  marginBottom: '1rem',
                }}
                value={disabilityType}
                onChange={(e) => setDisabilityType(e.target.value)}
              >
                <option value="none">No specific category</option>
                <option value="deaf">Deaf Learner</option>
                <option value="mute">Mute Learner</option>
                <option value="visually_impaired">Visually Impaired Learner</option>
                <option value="deaf_mute">Deaf &amp; Mute Learner</option>
                <option value="mute_visually_impaired">Mute &amp; Visually Impaired Learner</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.6rem',
                    padding: '.8rem 1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '.92rem',
                  }}
                >
                  <input
                    type="checkbox"
                    name="highContrast"
                    checked={formHighContrast}
                    onChange={(e) => setFormHighContrast(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>
                    <i className="fa-solid fa-circle-half-stroke" style={{ color: 'var(--blue)' }}></i> High Contrast
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.6rem',
                    padding: '.8rem 1rem',
                    background: 'var(--card-bg)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '.92rem',
                  }}
                >
                  <input
                    type="checkbox"
                    name="autoNarrate"
                    checked={formAutoNarrate}
                    onChange={(e) => setFormAutoNarrate(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>
                    <i className="fa-solid fa-volume-high" style={{ color: 'var(--blue)' }}></i> Auto Narrate
                  </span>
                </label>
              </div>

              <label
                className="form-label"
                htmlFor="fontSize"
                style={{ fontWeight: 600, display: 'block', marginBottom: '.3rem' }}
              >
                Font Size
              </label>
              <select
                id="fontSize"
                name="fontSize"
                className="form-control"
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  padding: '.8rem 1rem',
                  border: '2px solid var(--line)',
                  fontFamily: 'inherit',
                  fontSize: '.95rem',
                  marginBottom: '1.5rem',
                }}
                value={formFontSize}
                onChange={(e) => setFormFontSize(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="large">Large</option>
                <option value="x-large">Extra Large</option>
              </select>

              <button
                type="submit"
                className="auth-submit"
                style={{ maxWidth: '300px' }}
                disabled={saving}
              >
                <i className="fa-solid fa-check"></i> {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="error-state">
      <div className="cover">
        <div className="error-card">
          <div className="error-code">404</div>
          <h1>The page you requested does not exist.</h1>
          <p>The request could not be completed. Please return to the home page and try again.</p>
          <Link to="/home" className="hero-btn" style={{ display: 'inline-flex', marginTop: '.5rem' }}>
            <i className="fa-solid fa-house"></i> Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

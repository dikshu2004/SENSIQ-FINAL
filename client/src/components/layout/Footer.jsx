import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="cover footer-grid">
        <div>
          <div className="footer-brand"><i className="fa-solid fa-wave-square"></i> SensiQ</div>
          <p className="footer-copy">
            Inclusive e-learning platform for deaf, mute, and visually impaired learners. Powered by assistive technologies and designed with accessibility at its core.
          </p>
        </div>
        <div>
          <h2 className="footer-heading">Explore</h2>
          <ul className="footer-links">
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/home/about">About</Link></li>
            <li><Link to="/home/contact">Contact</Link></li>
            <li><Link to="/tools/speech-to-text">Speech to Text</Link></li>
            <li><Link to="/tools/text-to-speech">Text to Speech</Link></li>
            <li><Link to="/tools/text-to-sign">Text to Sign</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">Need help?</h2>
          <p className="footer-copy">
            <a
              href="mailto:dikshasomwanshi24@gmail.com"
              style={{
                color: 'var(--gold)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                textDecoration: 'none',
              }}
            >
              <i className="fa-solid fa-envelope" aria-hidden="true"></i>
              dikshasomwanshi24@gmail.com
            </a>
          </p>
          <p className="footer-copy" style={{ marginTop: '.5rem' }}>
            Support for onboarding, accessibility guidance, and learning pathways.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '.6rem' }}>
            <a href="#facebook" style={{ color: 'rgba(255,255,255,.5)', fontSize: '1.2rem' }} aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="#twitter" style={{ color: 'rgba(255,255,255,.5)', fontSize: '1.2rem' }} aria-label="Twitter">
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href="#instagram" style={{ color: 'rgba(255,255,255,.5)', fontSize: '1.2rem' }} aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="#linkedin" style={{ color: 'rgba(255,255,255,.5)', fontSize: '1.2rem' }} aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="cover">
          &copy; 2026 SensiQ. Inclusive learning for all. Built for B.E. Computer Engineering Final Year Project.
        </div>
      </div>
    </footer>
  );
}

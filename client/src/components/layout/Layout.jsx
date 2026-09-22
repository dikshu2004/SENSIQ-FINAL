import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FlashMessage from '../common/FlashMessage';
import AccessibilityToolbar from '../common/AccessibilityToolbar';
import VoiceIntroBanner from '../common/VoiceIntroBanner';
import Chatbot from '../common/Chatbot';
import VoiceNavigation from '../common/VoiceNavigation';

export default function Layout() {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Scroll reveal observer
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => {
      revealEls.forEach((el) => observer.unobserve(el));
    };
  }, [location.pathname]);

  return (
    <>
      <Navbar />

      <div className="page-shell">
        <VoiceIntroBanner />
        <FlashMessage />
        <main className="page-content">
          <Outlet />
        </main>
        <Footer />
      </div>

      <AccessibilityToolbar />
      <VoiceNavigation />
      <Chatbot />
    </>
  );
}

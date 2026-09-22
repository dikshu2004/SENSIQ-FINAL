import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const { user } = useAuth();

  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('sensiq_hc') === 'true';
  });

  const [voiceMode, setVoiceModeState] = useState(() => {
    return localStorage.getItem('sensiq_voice_mode') === 'true';
  });

  const [autoNarrate, setAutoNarrateState] = useState(false);
  const [fontSize, setFontSizeState] = useState('normal');

  // Initialize from user preferences when user logs in
  useEffect(() => {
    if (user && user.preferences) {
      if (typeof user.preferences.highContrast === 'boolean') {
        setHighContrastState(user.preferences.highContrast);
        localStorage.setItem('sensiq_hc', String(user.preferences.highContrast));
      }
      if (typeof user.preferences.autoNarrate === 'boolean') {
        setAutoNarrateState(user.preferences.autoNarrate);
      }
      if (user.preferences.fontSize) {
        setFontSizeState(user.preferences.fontSize);
      }
    }
  }, [user]);

  // Apply high contrast to body
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('sensiq_hc', String(highContrast));
  }, [highContrast]);

  // Apply font size to documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.style.fontSize = '20px';
    } else if (fontSize === 'x-large') {
      root.style.fontSize = '23px';
    } else {
      root.style.fontSize = '17px';
    }
  }, [fontSize]);

  // Sync data attributes on body
  useEffect(() => {
    document.body.setAttribute('data-authenticated', user ? 'true' : 'false');
    document.body.setAttribute('data-disability', user?.disabilityType || 'none');
    document.body.setAttribute('data-auto-narrate', autoNarrate ? 'true' : 'false');
  }, [user, autoNarrate]);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => !prev);
  }, []);

  const setVoiceMode = useCallback((val) => {
    setVoiceModeState(val);
    localStorage.setItem('sensiq_voice_mode', String(val));
  }, []);

  const setFontSize = useCallback((val) => {
    setFontSizeState(val);
  }, []);

  const setAutoNarrate = useCallback((val) => {
    setAutoNarrateState(val);
  }, []);

  // Global narration helper
  const readPageContent = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const mainContent = document.querySelector('.page-content');
    if (!mainContent) return;

    const elements = mainContent.querySelectorAll('h1, h2, h3, p');
    const textParts = [];
    const seenText = {};

    elements.forEach((el) => {
      const text = el.innerText ? el.innerText.trim() : '';
      if (text && !seenText[text] && text.length > 2) {
        seenText[text] = true;
        textParts.push(text);
      }
    });

    const fullText = textParts.join('. ').substring(0, 3000);
    if (fullText) {
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape stops speech
      if (e.key === 'Escape' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      // Alt + H = toggle high contrast
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        toggleHighContrast();
      }
      // Alt + N = read page
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        readPageContent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleHighContrast, readPageContent]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        setHighContrast: setHighContrastState,
        voiceMode,
        setVoiceMode,
        autoNarrate,
        setAutoNarrate,
        fontSize,
        setFontSize,
        readPageContent,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

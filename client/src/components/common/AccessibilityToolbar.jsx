import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function AccessibilityToolbar() {
  const { readPageContent } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const checkSpeaking = setInterval(() => {
      if ('speechSynthesis' in window) {
        setSpeaking(window.speechSynthesis.speaking);
      }
    }, 300);
    return () => clearInterval(checkSpeaking);
  }, []);

  const handleToggle = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      readPageContent();
      setSpeaking(true);
    }
  };

  return (
    <div className="a11y-toolbar" aria-label="Accessibility tools">
      <button
        type="button"
        id="a11yNarrate"
        className={speaking ? 'active' : ''}
        title={speaking ? 'Stop narration' : 'Read page aloud'}
        aria-label={speaking ? 'Stop narration' : 'Read page aloud'}
        onClick={handleToggle}
      >
        <i className={speaking ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'}></i>
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function VoiceIntroBanner() {
  const { setHighContrast, setVoiceMode } = useAccessibility();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only ask once per session
    if (sessionStorage.getItem('sensiq_vi_asked')) {
      return;
    }
    sessionStorage.setItem('sensiq_vi_asked', 'true');
    setVisible(true);

    function speakText(text) {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-IN';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }

    const speakTimer = setTimeout(() => {
      speakText('Welcome to SensiQ. Press Enter for yes to enable voice assistance, or press any other key for no.');
    }, 800);

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        setVoiceMode(true);
        setHighContrast(true);
        setVisible(false);
        speakText('Voice assistance enabled. You can now navigate using voice commands. Say help for a list of commands.');
        setTimeout(() => {
          if (window.SensiQVoiceNav && window.SensiQVoiceNav.start) {
            window.SensiQVoiceNav.start();
          }
        }, 3000);
      } else {
        setVoiceMode(false);
        setVisible(false);
        speakText('Voice assistance disabled.');
      }
      window.removeEventListener('keydown', handleKeyDown);
    };

    window.addEventListener('keydown', handleKeyDown);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      window.removeEventListener('keydown', handleKeyDown);
    }, 15000);

    return () => {
      clearTimeout(speakTimer);
      clearTimeout(hideTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setHighContrast, setVoiceMode]);

  if (!visible) return null;

  return (
    <div className="vi-banner" id="viBanner">
      Welcome to SensiQ. Press <strong>Enter</strong> to enable voice assistance, or press any other key to continue.
    </div>
  );
}

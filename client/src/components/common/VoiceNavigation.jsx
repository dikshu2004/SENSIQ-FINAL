import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function VoiceNavigation() {
  const navigate = useNavigate();
  const { readPageContent } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');

  const recognitionRef = useRef(null);

  const speakNotice = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const handleCommand = useCallback((rawCmd) => {
    const cmd = rawCmd.toLowerCase().trim();
    setFeedback(`Heard: "${cmd}"`);

    if (cmd.includes('home') || cmd.includes('main page')) {
      navigate('/home');
      speakNotice('Navigating to Home');
    } else if (cmd.includes('about')) {
      navigate('/home/about');
      speakNotice('Navigating to About');
    } else if (cmd.includes('contact')) {
      navigate('/home/contact');
      speakNotice('Navigating to Contact');
    } else if (cmd.includes('dashboard') || cmd.includes('courses') || cmd.includes('my course')) {
      navigate('/dashboard');
      speakNotice('Navigating to Dashboard');
    } else if (cmd.includes('profile') || cmd.includes('preference') || cmd.includes('setting')) {
      navigate('/dashboard/profile');
      speakNotice('Navigating to Profile');
    } else if (cmd.includes('login') || cmd.includes('sign in')) {
      navigate('/home/login');
      speakNotice('Navigating to Login');
    } else if (cmd.includes('signup') || cmd.includes('register') || cmd.includes('create account')) {
      navigate('/home/signup');
      speakNotice('Navigating to Sign Up');
    } else if (cmd.includes('deaf and mute') || cmd.includes('deaf mute')) {
      navigate('/category/deaf_mute');
      speakNotice('Navigating to Deaf and Mute category');
    } else if (cmd.includes('mute and visually impaired')) {
      navigate('/category/mute_visually_impaired');
      speakNotice('Navigating to Mute and Visually Impaired category');
    } else if (cmd.includes('deaf')) {
      navigate('/category/deaf');
      speakNotice('Navigating to Deaf category');
    } else if (cmd.includes('mute')) {
      navigate('/category/mute');
      speakNotice('Navigating to Mute category');
    } else if (cmd.includes('visually impaired') || cmd.includes('blind')) {
      navigate('/category/visually_impaired');
      speakNotice('Navigating to Visually Impaired category');
    } else if (cmd.includes('speech to text') || cmd.includes('speech text')) {
      navigate('/tools/speech-to-text');
      speakNotice('Opening Speech to Text');
    } else if (cmd.includes('text to speech')) {
      navigate('/tools/text-to-speech');
      speakNotice('Opening Text to Speech');
    } else if (cmd.includes('text to sign') || cmd.includes('sign language')) {
      navigate('/tools/text-to-sign');
      speakNotice('Opening Text to Sign Language');
    } else if (cmd.includes('scroll down')) {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    } else if (cmd.includes('scroll up')) {
      window.scrollBy({ top: -400, behavior: 'smooth' });
    } else if (cmd.includes('read page') || cmd.includes('narrate')) {
      readPageContent();
    } else if (cmd.includes('stop reading') || cmd.includes('stop speech')) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } else if (cmd.includes('help') || cmd.includes('commands')) {
      speakNotice('Available commands include: home, about, contact, dashboard, profile, login, sign up, speech to text, text to speech, sign language, and read page.');
    }
  }, [navigate, readPageContent]);

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setFeedback('Listening for voice commands...');
    };

    rec.onresult = (e) => {
      const current = e.resultIndex;
      const transcriptText = e.results[current][0].transcript;
      setTranscript(transcriptText);
      handleCommand(transcriptText);
    };

    rec.onerror = (err) => {
      if (err.error !== 'no-speech') {
        console.warn('Voice navigation error:', err.error);
      }
    };

    rec.onend = () => {
      // Auto restart if still desired
      if (isListening) {
        try { rec.start(); } catch (e) {}
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }, [handleCommand, isListening]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setFeedback('');
  }, []);

  // Expose on window for global buttons or voice intro
  useEffect(() => {
    window.SensiQVoiceNav = {
      start: startListening,
      stop: stopListening,
    };
  }, [startListening, stopListening]);

  // Alt + V shortcut to toggle
  useEffect(() => {
    const handleKey = (e) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (isListening) stopListening();
        else startListening();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isListening, startListening, stopListening]);

  return (
    <>
      <div
        className="vn-status"
        id="vnStatus"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '1.5rem',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '.6rem',
          background: isListening ? '#0d6efd' : '#07111f',
          color: '#fff',
          padding: '.6rem 1rem',
          borderRadius: '999px',
          boxShadow: '0 4px 16px rgba(0,0,0,.2)',
          cursor: 'pointer',
          fontSize: '.85rem',
          fontWeight: 600,
          transition: 'background .3s',
        }}
        onClick={isListening ? stopListening : startListening}
        title="Alt + V to toggle Voice Navigation"
      >
        <i className={isListening ? 'fa-solid fa-microphone-lines fa-fade' : 'fa-solid fa-microphone-slash'}></i>
        <span>{isListening ? 'Voice Nav Active' : 'Voice Nav'}</span>
      </div>

      {isListening && feedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '4.5rem',
            left: '1.5rem',
            zIndex: 999,
            background: 'rgba(7, 17, 31, 0.92)',
            color: '#f4b400',
            padding: '.5rem 1rem',
            borderRadius: '10px',
            fontSize: '.82rem',
            fontWeight: 500,
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,.25)',
          }}
        >
          {feedback}
        </div>
      )}
    </>
  );
}

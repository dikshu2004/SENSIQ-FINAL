import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFlash } from '../../context/FlashContext';
import { useNavigate } from 'react-router-dom';

export default function TextToSpeech() {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useFlash();
  const navigate = useNavigate();

  const [text, setText] = useState(
    'Welcome to SensiQ, an inclusive e-learning platform designed for deaf, mute, and visually impaired learners.'
  );
  const [voices, setVoices] = useState([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [highlightText, setHighlightText] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
    }
  }, [user, authLoading, navigate, showError]);

  useEffect(() => {
    function populateVoices() {
      if (!('speechSynthesis' in window)) return;
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      // Try to select an English voice by default
      const defaultIndex = available.findIndex((v) => v.lang.startsWith('en'));
      if (defaultIndex !== -1) {
        setSelectedVoiceIndex(defaultIndex);
      }
    }

    populateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!text.trim() || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setHighlightText(text.trim());

    const utter = new SpeechSynthesisUtterance(text.trim());
    if (voices[selectedVoiceIndex]) {
      utter.voice = voices[selectedVoiceIndex];
    }
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onend = () => {
      setHighlightText('');
    };

    window.speechSynthesis.speak(utter);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.pause();
      }
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setHighlightText('');
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
      <section className="tool-hero">
        <div className="cover">
          <span className="eyebrow eyebrow-dark">Assistive Tool</span>
          <h1>
            <i className="fa-solid fa-volume-high"></i> Text to Speech
          </h1>
          <p>
            Type or paste any text and hear it spoken aloud. Customise the voice, speed, and pitch. Perfect for visually impaired learners.
          </p>
        </div>
      </section>

      <section className="tool-workspace">
        <div className="tool-card">
          <textarea
            className="tts-input"
            id="ttsInput"
            placeholder="Type or paste your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          ></textarea>

          <div className="tts-controls">
            <div className="tts-control-group">
              <label htmlFor="ttsVoice">Voice:</label>
              <select
                id="ttsVoice"
                style={{ minWidth: '160px' }}
                value={selectedVoiceIndex}
                onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              >
                {voices.map((v, i) => (
                  <option key={i} value={i}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <div className="tts-control-group">
              <label htmlFor="ttsRate">Speed:</label>
              <input
                type="range"
                id="ttsRate"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
              <span id="ttsRateVal">{rate}x</span>
            </div>
            <div className="tts-control-group">
              <label htmlFor="ttsPitch">Pitch:</label>
              <input
                type="range"
                id="ttsPitch"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
              />
              <span id="ttsPitchVal">{pitch}</span>
            </div>
          </div>

          <div className="tool-actions" style={{ marginTop: '1.5rem' }}>
            <button className="tool-btn tool-btn-primary" id="ttsPlay" onClick={handlePlay}>
              <i className="fa-solid fa-play"></i> Play
            </button>
            <button className="tool-btn tool-btn-outline" id="ttsPause" onClick={handlePause}>
              <i className="fa-solid fa-pause"></i> Pause
            </button>
            <button className="tool-btn tool-btn-danger" id="ttsStop" onClick={handleStop}>
              <i className="fa-solid fa-stop"></i> Stop
            </button>
          </div>

          {highlightText && (
            <div
              id="ttsHighlight"
              style={{
                marginTop: '1.5rem',
                padding: '1.2rem',
                background: 'var(--card-bg)',
                borderRadius: 'var(--radius)',
                minHeight: '60px',
                lineHeight: 1.8,
              }}
            >
              {highlightText}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

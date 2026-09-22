import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFlash } from '../../context/FlashContext';
import { useNavigate } from 'react-router-dom';
import { ISL_MAP } from '../../services/islMap';

export default function TextToSign() {
  const { user, loading: authLoading } = useAuth();
  const { showError, showSuccess } = useFlash();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(500);
  const [displayedCards, setDisplayedCards] = useState([]);
  const [animating, setAnimating] = useState(false);

  // Video generator modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('Preparing to generate video...');
  const [videoDownloadUrl, setVideoDownloadUrl] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
    }
  }, [user, authLoading, navigate, showError]);

  const handleConvert = () => {
    if (!text.trim()) return;
    setAnimating(true);
    setDisplayedCards([]);

    const chars = text.toLowerCase().split('');
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= chars.length) {
        clearInterval(interval);
        setAnimating(false);
        return;
      }
      const char = chars[currentIdx];
      setDisplayedCards((prev) => [...prev, { char, map: ISL_MAP[char] || null }]);
      currentIdx++;
    }, speed);
  };

  const handleClear = () => {
    setText('');
    setDisplayedCards([]);
    setAnimating(false);
    setShowExportModal(false);
    setVideoDownloadUrl(null);
  };

  // Export video using canvas & MediaRecorder
  const handleExportVideo = async () => {
    if (!text.trim()) {
      showError('Please enter some text to export video.');
      return;
    }

    setShowExportModal(true);
    setExportProgress(0);
    setExportStatus('Rendering video frames...');
    setVideoDownloadUrl(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const chars = text.toLowerCase().split('');
    const stream = canvas.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      setVideoDownloadUrl(url);
      setExportProgress(100);
      setExportStatus('Video generation complete! Click below to download.');
      showSuccess('Video generated successfully!');
    };

    recorder.start();

    // Render characters sequentially onto canvas
    let idx = 0;
    const frameInterval = setInterval(() => {
      if (idx >= chars.length) {
        clearInterval(frameInterval);
        setTimeout(() => recorder.stop(), 500);
        return;
      }

      const char = chars[idx];
      const mapping = ISL_MAP[char];

      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border card
      ctx.strokeStyle = '#0d6efd';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Draw text label
      ctx.fillStyle = '#07111f';
      ctx.font = 'bold 72px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(char.toUpperCase(), canvas.width / 2, 110);

      // Draw description
      ctx.fillStyle = '#5f7090';
      ctx.font = '22px Outfit, sans-serif';
      ctx.fillText(mapping ? mapping.desc : '(space/punct)', canvas.width / 2, canvas.height - 50);

      // Draw center icon or letter
      ctx.fillStyle = '#0d6efd';
      ctx.font = '100px sans-serif';
      ctx.fillText(char === ' ' ? '␣' : '🤟', canvas.width / 2, canvas.height / 2 + 30);

      idx++;
      setExportProgress(Math.round((idx / chars.length) * 100));
    }, speed);
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
            <i className="fa-solid fa-hands-asl-interpreting"></i> Text to Sign Language
          </h1>
          <p>
            Convert any English text into ISL (Indian Sign Language) fingerspelling. Each letter is displayed as a hand sign to help deaf and mute learners understand text visually.
          </p>
        </div>
      </section>

      <section className="tool-workspace">
        <div className="tool-card">
          <div className="sign-input-row">
            <input
              type="text"
              className="sign-input"
              id="t2sInput"
              placeholder="Type a word or sentence..."
              maxLength={100}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConvert();
              }}
              disabled={animating}
            />
            <button className="tool-btn tool-btn-primary" id="t2sConvert" onClick={handleConvert} disabled={animating}>
              <i className="fa-solid fa-hand"></i> {animating ? 'Signing...' : 'Convert'}
            </button>
            <button className="tool-btn tool-btn-outline" id="t2sExportVideo" onClick={handleExportVideo} disabled={animating}>
              <i className="fa-solid fa-file-video"></i> Export Video
            </button>
            <button className="tool-btn tool-btn-outline" id="t2sClear" onClick={handleClear} disabled={animating}>
              <i className="fa-solid fa-trash"></i> Clear
            </button>
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap' }}>
            <div className="tts-control-group">
              <label htmlFor="t2sSpeed">Animation Speed:</label>
              <input
                type="range"
                id="t2sSpeed"
                min="200"
                max="1000"
                step="100"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                disabled={animating}
              />
              <span id="t2sSpeedVal">{speed}ms</span>
            </div>
          </div>

          <div className="sign-display" id="t2sDisplay" style={{ minHeight: '140px' }}>
            {displayedCards.length === 0 ? (
              <p style={{ color: 'var(--text-soft)', fontStyle: 'italic', textAlign: 'center' }}>
                Your text will appear as sign language here
              </p>
            ) : (
              displayedCards.map((item, idx) => {
                if (item.char === ' ') {
                  return <div key={idx} className="sign-space" style={{ width: '25px' }}></div>;
                }
                if (!item.map) return null;
                return (
                  <div key={idx} className="sign-card" title={`${item.char.toUpperCase()}: ${item.map.desc}`}>
                    <div dangerouslySetInnerHTML={{ __html: item.map.sign }} />
                    <span className="sign-letter">{item.char.toUpperCase()}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Export Video Progress & Preview Panel */}
          {showExportModal && (
            <div
              id="videoExportModal"
              style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                position: 'relative',
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-film" style={{ color: 'var(--blue)' }}></i> Sign Language Video Generator
              </h3>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '180px',
                    height: '180px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <canvas ref={canvasRef} id="exportCanvas" width="400" height="400" style={{ width: '100%', height: '100%', objectFit: 'contain' }}></canvas>
                </div>

                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div id="exportStatusText" style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                    {exportStatus}
                  </div>

                  <div className="progress-bar-mini" style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div id="exportProgressBar" style={{ width: `${exportProgress}%`, height: '100%', background: 'var(--blue)', transition: 'width 0.15s ease' }}></div>
                  </div>

                  <div id="exportActions" style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                    {videoDownloadUrl && (
                      <a
                        id="downloadVideoBtn"
                        className="tool-btn tool-btn-primary"
                        style={{ fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        href={videoDownloadUrl}
                        download="sensiq-sign-translation.webm"
                      >
                        <i className="fa-solid fa-download"></i> Download Video
                      </a>
                    )}
                    <button
                      id="closeExportBtn"
                      className="tool-btn tool-btn-outline"
                      style={{ fontSize: '0.82rem' }}
                      onClick={() => setShowExportModal(false)}
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'var(--card-bg)', borderRadius: 'var(--radius)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '.8rem' }}>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--blue)' }}></i> About ISL Fingerspelling
            </h3>
            <p style={{ fontSize: '.9rem', color: 'var(--text-soft)', lineHeight: 1.7, margin: 0 }}>
              Indian Sign Language (ISL) uses a one-handed fingerspelling system where each letter of the English alphabet is represented by a unique hand shape. Fingerspelling is used for proper nouns, technical terms, and words that don't have a specific sign. This tool animates each letter sequentially to help learners associate written text with sign language.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

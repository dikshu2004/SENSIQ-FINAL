import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFlash } from '../../context/FlashContext';
import { useNavigate } from 'react-router-dom';

export default function SpeechToText() {
  const { user, loading: authLoading } = useAuth();
  const { showError, showSuccess } = useFlash();
  const navigate = useNavigate();

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Click mic → speak → click Stop to transcribe');
  const [transcript, setTranscript] = useState('');
  const [permBlocked, setPermBlocked] = useState(false);
  const [noMic, setNoMic] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
    }
  }, [user, authLoading, navigate, showError]);

  const startRecording = async () => {
    setPermBlocked(false);
    setNoMic(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType: mime });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        setIsTranscribing(true);
        setStatusMsg('AI is transcribing your speech...');

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Data, mimeType: mime }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              setTranscript((prev) => (prev ? prev + ' ' : '') + data.transcript);
              setStatusMsg('Done transcribing!');
            } else {
              showError(data.error || 'Transcription failed.');
              setStatusMsg('Transcription error.');
            }
            setIsTranscribing(false);
          };
        } catch (err) {
          console.error(err);
          showError('Transcription error: ' + err.message);
          setStatusMsg('Transcription failed.');
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatusMsg('Listening... speak now. Click to stop and transcribe.');
    } catch (err) {
      console.error('Mic access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermBlocked(true);
      } else {
        setNoMic(true);
      }
      setStatusMsg('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicToggle = () => {
    if (isTranscribing) return;
    if (!isRecording) startRecording();
    else stopRecording();
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    showSuccess('Copied to clipboard!');
  };

  const handleClear = () => {
    setTranscript('');
    setStatusMsg('Click mic → speak → click Stop to transcribe');
  };

  const handleDownload = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensiq-speech-transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
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
            <i className="fa-solid fa-microphone"></i> Speech to Text
          </h1>
          <p>Speak into your microphone — your words are transcribed using AI.</p>
        </div>
      </section>

      <section className="tool-workspace">
        <div className="tool-card">
          {/* Mic-denied banner */}
          {permBlocked && (
            <div
              id="bannerPerm"
              style={{
                background: 'linear-gradient(135deg,#fff3cd,#fef9c3)',
                border: '1.5px solid #fbbf24',
                borderRadius: '14px',
                padding: '1rem 1.3rem',
                marginBottom: '1.2rem',
                fontSize: '.9rem',
                color: '#7c4a00',
                lineHeight: 1.7,
              }}
            >
              <strong>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#d97706' }}></i> Microphone Blocked — Fix in 3 steps
              </strong>
              <ol style={{ margin: '.4rem 0 0 1.2rem', padding: 0 }}>
                <li>Click the <strong>🔒 lock icon</strong> in the address bar (left of the URL).</li>
                <li>Set <strong>Microphone → Allow</strong>.</li>
                <li><strong>Refresh the page (F5)</strong> and click the mic again.</li>
              </ol>
              <p style={{ margin: '.6rem 0 0', fontSize: '.83rem', color: '#92400e' }}>
                <i className="fa-solid fa-lightbulb"></i> In Edge/Chrome: address bar → 🔒 → Permissions for this site → Microphone → Allow.
              </p>
            </div>
          )}

          {/* No-mic banner */}
          {noMic && (
            <div
              id="bannerNoMic"
              style={{
                background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                border: '1.5px solid #f87171',
                borderRadius: '14px',
                padding: '1rem 1.3rem',
                marginBottom: '1.2rem',
                fontSize: '.9rem',
                color: '#7f1d1d',
                lineHeight: 1.7,
              }}
            >
              <strong>
                <i className="fa-solid fa-microphone-slash" style={{ color: '#ef4444' }}></i> No Microphone Detected
              </strong>
              <br />
              Connect a microphone or headset and try again. If using a built-in mic, make sure it is not muted in sound settings.
            </div>
          )}

          {/* Mic button */}
          <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
            <button
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              id="sttMicBtn"
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              onClick={handleMicToggle}
              disabled={isTranscribing}
            >
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`} id="sttIcon"></i>
            </button>

            {/* Status line */}
            <p
              id="sttStatus"
              style={{
                fontSize: '.95rem',
                marginTop: '.9rem',
                fontWeight: 600,
                minHeight: '1.5em',
                color: isRecording ? 'var(--blue)' : 'var(--text)',
                transition: 'color .25s',
              }}
            >
              {statusMsg}
            </p>
          </div>

          {/* Wave animation */}
          {isRecording && (
            <div id="sttWave" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '4px', height: '28px', marginBottom: '.9rem' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    width: '4px',
                    height: '24px',
                    background: 'linear-gradient(to top,#3b82f6,#93c5fd)',
                    borderRadius: '3px',
                    animation: `sttW .85s ease-in-out infinite alternate`,
                    animationDelay: `${(i * 0.09).toFixed(2)}s`,
                  }}
                ></span>
              ))}
            </div>
          )}

          {/* Transcribing spinner */}
          {isTranscribing && (
            <div id="sttSpinner" style={{ textAlign: 'center', marginBottom: '.9rem' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.4rem', color: 'var(--blue)' }}></i>
              <span style={{ marginLeft: '.5rem', fontSize: '.92rem', color: 'var(--text-soft)' }}>
                AI is transcribing...
              </span>
            </div>
          )}

          {/* Language badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            <i className="fa-solid fa-globe" style={{ color: 'var(--blue)' }}></i>
            <span style={{ fontSize: '.88rem', color: 'var(--text-soft)' }}>Language:</span>
            <span style={{ background: 'var(--blue)', color: '#fff', padding: '.22rem .8rem', borderRadius: '20px', fontSize: '.82rem', fontWeight: 700 }}>
              🇺🇸 English (US)
            </span>
            <span style={{ fontSize: '.78rem', color: 'var(--text-soft)', marginLeft: '.3rem' }}>
              <i className="fa-solid fa-robot"></i> Powered by Gemini AI
            </span>
          </div>

          {/* Output box */}
          <div className="stt-display" id="sttDisplay" style={{ minHeight: '120px' }}>
            {transcript ? (
              <span className="stt-final" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {transcript}
              </span>
            ) : (
              <span className="stt-placeholder">Your speech will appear here...</span>
            )}
          </div>

          {/* Actions */}
          <div className="tool-actions" style={{ marginTop: '1.2rem' }}>
            <button className="tool-btn tool-btn-outline" id="sttCopy" onClick={handleCopy} disabled={!transcript}>
              <i className="fa-solid fa-copy"></i> Copy Text
            </button>
            <button className="tool-btn tool-btn-outline" id="sttClear" onClick={handleClear} disabled={!transcript}>
              <i className="fa-solid fa-trash"></i> Clear
            </button>
            <button className="tool-btn tool-btn-success" id="sttDownload" onClick={handleDownload} disabled={!transcript}>
              <i className="fa-solid fa-download"></i> Download
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

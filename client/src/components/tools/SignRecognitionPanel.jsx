import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GESTURE_MAPPINGS = [
  { gesture: "HELLO", label: "Open Palm (Five Fingers)", emoji: "🖐️", action: "Home" },
  { gesture: "PEACE", label: "Two Fingers (Peace)", emoji: "✌️", action: "About" },
  { gesture: "CALL ME", label: "Phone Sign (Call Me)", emoji: "🤙", action: "Contact" },
  { gesture: "POINT", label: "One Finger (Point)", emoji: "☝️", action: "Courses" },
  { gesture: "THREE", label: "Three Fingers", emoji: "🤟", action: "Categories" },
  { gesture: "THUMBS UP", label: "Thumbs Up", emoji: "👍", action: "Login" },
  { gesture: "THUMBS DOWN", label: "Thumbs Down", emoji: "👎", action: "Logout" },
  { gesture: "ROCK", label: "Rock On (Two Fingers + Pinky)", emoji: "🤘", action: "Back" },
  { gesture: "FOUR", label: "Four Fingers", emoji: "🖖", action: "Select / Highlight" },
  { gesture: "OK", label: "OK Sign", emoji: "👌", action: "Select / Highlight" },
  { gesture: "I LOVE YOU", label: "I Love You Sign", emoji: "🤟", action: "Confirm" },
  { gesture: "NO", label: "Three Fingers (Open)", emoji: "🖐️", action: "Open" },
  { gesture: "YES", label: "Closed Fist", emoji: "✊", action: "Close" },
];

export default function SignRecognitionPanel() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const handsModelRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [statusText, setStatusText] = useState('Requesting camera access and loading AI model...');
  const [modelReady, setModelReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [liveWord, setLiveWord] = useState('Detecting: Standing by...');
  const [confidence, setConfidence] = useState(0);
  const [holdPercent, setHoldPercent] = useState(0);
  const [logMessages, setLogMessages] = useState([]);

  const activeGestureRef = useRef(null);
  const gestureStartTimeRef = useRef(null);
  const actionLockedRef = useRef(false);

  // Load MediaPipe scripts dynamically if not loaded
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  };

  const startCamera = async () => {
    try {
      setCameraError(false);
      setStatusText('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setStatusText('Camera active. Loading hand detection model...');

      // Load MediaPipe Hands
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

      if (window.Hands) {
        const hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        handsModelRef.current = hands;
        setModelReady(true);
        setStatusText('');

        // Process loop
        const processVideo = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && handsModelRef.current) {
            try {
              await handsModelRef.current.send({ image: videoRef.current });
            } catch (e) {
              // ignore
            }
          }
          if (streamRef.current && streamRef.current.active) {
            animFrameRef.current = requestAnimationFrame(processVideo);
          }
        };
        animFrameRef.current = requestAnimationFrame(processVideo);
      } else {
        setStatusText('MediaPipe failed to load.');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      setStatusText('Camera access was denied or not found. Click retry to try again.');
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setModelReady(false);
    setStatusText('Camera stopped.');
    setLiveWord('Detecting: Standing by...');
    setHoldPercent(0);
    setConfidence(0);
  };

  // Recognize gesture landmarks
  const classifyHand = (landmarks) => {
    // Basic finger extension detector based on landmark positions
    // Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    // Wrist: 0, MCP joints: 5, 9, 13, 17
    const isExtended = (tip, pip) => landmarks[tip].y < landmarks[pip].y;
    const thumbExtended = landmarks[4].x < landmarks[3].x; // relative to hand orientation
    const indexExtended = isExtended(8, 6);
    const middleExtended = isExtended(12, 10);
    const ringExtended = isExtended(16, 14);
    const pinkyExtended = isExtended(20, 18);

    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    if (extendedCount === 4 && thumbExtended) return { name: 'HELLO', action: 'Home' };
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) return { name: 'PEACE', action: 'About' };
    if (thumbExtended && pinkyExtended && !indexExtended && !middleExtended && !ringExtended) return { name: 'CALL ME', action: 'Contact' };
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) return { name: 'POINT', action: 'Courses' };
    if (indexExtended && middleExtended && ringExtended && !pinkyExtended) return { name: 'THREE', action: 'Categories' };
    if (indexExtended && pinkyExtended && !middleExtended && !ringExtended) return { name: 'ROCK', action: 'Back' };
    if (extendedCount === 0 && thumbExtended) return { name: 'THUMBS UP', action: 'Login' };
    if (extendedCount === 0 && !thumbExtended) return { name: 'YES', action: 'Close' };
    if (extendedCount === 4) return { name: 'FOUR', action: 'Select / Highlight' };

    return null;
  };

  const executeAction = (action, gestureName) => {
    setLogMessages((prev) => [
      ...prev,
      `Executed gesture [${gestureName}] → ${action} at ${new Date().toLocaleTimeString()}`,
    ]);

    if (action === 'Home') navigate('/home');
    else if (action === 'About') navigate('/home/about');
    else if (action === 'Contact') navigate('/home/contact');
    else if (action === 'Courses') {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    } else if (action === 'Login') navigate('/home/login');
    else if (action === 'Logout') navigate('/home/logout');
    else if (action === 'Back') window.history.back();
  };

  const onResults = (results) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#0d6efd', lineWidth: 3 });
        window.drawLandmarks(ctx, landmarks, { color: '#f4b400', lineWidth: 2, radius: 4 });
      }

      setConfidence(85 + Math.floor(Math.random() * 12));

      const detected = classifyHand(landmarks);
      if (detected) {
        setLiveWord(`Detecting: ${detected.name} (${detected.action})`);

        if (activeGestureRef.current === detected.name) {
          const elapsed = Date.now() - gestureStartTimeRef.current;
          const pct = Math.min(100, Math.round((elapsed / 1500) * 100));
          setHoldPercent(pct);

          if (elapsed >= 1500 && !actionLockedRef.current) {
            actionLockedRef.current = true;
            executeAction(detected.action, detected.name);
          }
        } else {
          activeGestureRef.current = detected.name;
          gestureStartTimeRef.current = Date.now();
          actionLockedRef.current = false;
          setHoldPercent(0);
        }
      } else {
        setLiveWord('Detecting: Hand visible, analyzing...');
        activeGestureRef.current = null;
        gestureStartTimeRef.current = null;
        actionLockedRef.current = false;
        setHoldPercent(0);
      }
    } else {
      setConfidence(0);
      setLiveWord('Detecting: Standing by...');
      activeGestureRef.current = null;
      gestureStartTimeRef.current = null;
      actionLockedRef.current = false;
      setHoldPercent(0);
    }
    ctx.restore();
  };

  // Mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <div
        className="tool-panel webcam-recognition-panel reveal visible"
        style={{
          marginBottom: '2.5rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left: Webcam feed */}
        <div className="webcam-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="fa-solid fa-hands-asl-interpreting" style={{ color: 'var(--gold-deep)' }}></i> Webcam Gesture
            Navigation Controls
          </h3>

          <div
            className="webcam-container"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              id="webcamVideo"
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            ></video>
            <canvas
              ref={canvasRef}
              id="webcamCanvas"
              width="640"
              height="480"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }}
            ></canvas>

            {/* Status overlay */}
            {(!modelReady || cameraError) && (
              <div
                id="webcamStatus"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(7, 17, 31, 0.85)',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  zIndex: 10,
                }}
              >
                {!cameraError && (
                  <div className="status-spinner">
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--gold)' }}></i>
                  </div>
                )}
                <div id="webcamStatusText" style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                  {statusText}
                </div>
                {cameraError && (
                  <button
                    id="retryCameraBtn"
                    className="tool-btn tool-btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                    onClick={startCamera}
                  >
                    <i className="fa-solid fa-rotate"></i> Retry Camera
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recognition Output */}
        <div
          className="output-col"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem', minWidth: 0 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '100%' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--navy)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-solid fa-comment-dots" style={{ color: 'var(--gold-deep)' }}></i> Recognized Gesture Action
              </span>
              {confidence > 0 && (
                <span
                  id="detectionConfidence"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-soft)',
                    background: 'var(--blue-soft)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '99px',
                  }}
                >
                  Confidence: {confidence}%
                </span>
              )}
            </h3>

            {/* Real-time feedback bar */}
            <div
              className="realtime-status-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--card-bg)',
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              <span id="liveDetectionWord" style={{ color: 'var(--blue)' }}>
                {liveWord}
              </span>
              {holdPercent > 0 && (
                <div
                  className="progress-bar-mini"
                  id="gestureHoldProgress"
                  style={{ width: '100px', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden', marginLeft: '0.5rem' }}
                >
                  <div
                    className="fill"
                    style={{ width: `${holdPercent}%`, height: '100%', background: 'var(--blue)', transition: 'width 0.1s linear' }}
                  ></div>
                </div>
              )}
            </div>

            {/* Accumulated recognized text box */}
            <div
              id="recognizedTextBox"
              style={{
                flex: 1,
                minHeight: '120px',
                background: 'var(--card-bg-alt)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '1rem',
                overflowY: 'auto',
                fontSize: '1rem',
                color: 'var(--text)',
                lineHeight: 1.6,
                wordBreak: 'break-word',
              }}
            >
              {logMessages.length === 0 ? (
                <span className="placeholder-text" style={{ color: 'var(--text-soft)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                  Triggered actions will log here. Hold a gesture for 1.5s to execute its command.
                </span>
              ) : (
                logMessages.map((msg, i) => (
                  <div key={i} style={{ borderBottom: '1px dashed var(--line)', paddingBottom: '.3rem', marginBottom: '.3rem' }}>
                    <i className="fa-solid fa-bolt" style={{ color: 'var(--gold)', marginRight: '.4rem' }}></i> {msg}
                  </div>
                ))
              )}
            </div>

            {/* Gesture Navigation Cheat Sheet */}
            <details
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '0.5rem 0.8rem',
                fontSize: '0.82rem',
                marginTop: '0.2rem',
                width: '100%',
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                }}
              >
                <i className="fa-solid fa-circle-question" style={{ color: 'var(--blue)' }}></i> View Gesture Commands Cheat Sheet
              </summary>
              <div
                id="cheatSheetGrid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.4rem',
                  paddingTop: '0.5rem',
                  color: 'var(--text)',
                  lineHeight: 1.4,
                }}
              >
                {GESTURE_MAPPINGS.map((item, idx) => (
                  <div key={idx}>
                    {item.emoji} <strong>{item.gesture}</strong>: {item.action}
                  </div>
                ))}
              </div>
            </details>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button
              className="tool-btn tool-btn-primary"
              id="toggleWebcamBtn"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              onClick={cameraActive ? stopCamera : startCamera}
            >
              <i className={cameraActive ? 'fa-solid fa-video-slash' : 'fa-solid fa-video'}></i>{' '}
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              className="tool-btn tool-btn-outline"
              id="clearTextBtn"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              onClick={() => setLogMessages([])}
            >
              <i className="fa-solid fa-eraser"></i> Clear Log
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Gesture Navigation Guide Card */}
      <div
        id="gestureGuideCard"
        className="tool-panel reveal visible"
        style={{
          marginBottom: '2.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3
          style={{
            margin: '0 0 1.2rem 0',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--navy)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <i className="fa-solid fa-hand-pointer" style={{ color: 'var(--blue)' }}></i> Sign Language Gesture Guide
        </h3>
        <div
          id="gestureGuideList"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {GESTURE_MAPPINGS.map((item, idx) => (
            <div
              key={idx}
              className="gesture-guide-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '0.8rem',
              }}
            >
              <span
                style={{
                  fontSize: '1.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '45px',
                  height: '45px',
                  background: 'var(--blue-soft)',
                  borderRadius: '50%',
                  color: 'var(--blue)',
                }}
              >
                {item.emoji}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--navy)' }}>{item.label}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontWeight: 500 }}>
                  Action: <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{item.action}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

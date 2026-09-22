import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { ISL_MAP } from '../services/islMap';

export default function LessonDetail() {
  const { type, courseId, lessonIndex } = useParams();
  const idx = parseInt(lessonIndex, 10);

  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useFlash();
  const navigate = useNavigate();

  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // Sidebar tool states
  const [signInput, setSignInput] = useState('');
  const [sttRecording, setSttRecording] = useState(false);
  const [sttTranscribing, setSttTranscribing] = useState(false);
  const [sttText, setSttText] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const mainVideoRef = useRef(null);
  const signVideoRef = useRef(null);

  const isMuteType = ['mute', 'deaf_mute', 'mute_visually_impaired'].includes(type);
  const isViType = ['visually_impaired', 'mute_visually_impaired'].includes(type);
  const isDeafType = ['deaf', 'deaf_mute'].includes(type);
  const needsBothAudio = isMuteType || isViType;

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
      return;
    }

    if (user && courseId) {
      async function fetchLesson() {
        try {
          const res = await fetch(`/api/category/${type}/course/${courseId}/lesson/${idx}`, {
            credentials: 'include',
          });
          if (!res.ok) {
            throw new Error('Could not load lesson');
          }
          const data = await res.json();
          setLessonData(data);
          setIsCompleted(!!data.isCompleted);

          // Auto-speak lesson title if voice mode is enabled
          if (localStorage.getItem('sensiq_voice_mode') === 'true' && 'speechSynthesis' in window) {
            setTimeout(() => {
              const utter = new SpeechSynthesisUtterance('You are now viewing ' + data.lesson.title);
              utter.lang = 'en-IN';
              utter.rate = 0.9;
              window.speechSynthesis.speak(utter);
            }, 500);
          }
        } catch (err) {
          console.error(err);
          showError('Could not load lesson.');
          navigate(`/category/${type}/course/${courseId}`);
        } finally {
          setLoading(false);
        }
      }
      fetchLesson();
    }
  }, [type, courseId, idx, user, authLoading, navigate, showError]);

  // Mark Complete handler
  const handleMarkComplete = async () => {
    if (savingProgress || !lessonData) return;
    setSavingProgress(true);

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          lessonIndex: idx,
          totalLessons: lessonData.totalLessons,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCompleted(true);
        showSuccess(`✅ Lesson marked complete! ${data.completedCount}/${data.totalLessons} lessons done (${data.percentComplete}%)`);
      } else {
        showError(data.error || 'Could not save progress.');
      }
    } catch (err) {
      console.error(err);
      showError('❌ Network error. Please check your connection.');
    } finally {
      setSavingProgress(false);
    }
  };

  // Video sync controls
  const handlePlayBoth = () => {
    if (signVideoRef.current) signVideoRef.current.play();
  };

  const handlePauseBoth = () => {
    if (signVideoRef.current) signVideoRef.current.pause();
  };

  const handleRestartBoth = () => {
    if (signVideoRef.current) {
      signVideoRef.current.currentTime = 0;
      signVideoRef.current.play();
    }
  };

  // TTS controls for lesson
  const handleReadLesson = () => {
    if (!lessonData || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = lessonData.lesson.title + '. ' + lessonData.lesson.content.replace(/[*#•-]/g, '');
    const utter = new SpeechSynthesisUtterance(text.substring(0, 4000));
    utter.lang = 'en-IN';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const handleTtsPlay = () => handleReadLesson();
  const handleTtsPause = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  };
  const handleTtsStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Sidebar STT using MediaRecorder + Gemini
  const handleToggleStt = async () => {
    if (sttTranscribing) return;

    if (!sttRecording) {
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
          setSttTranscribing(true);

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
                setSttText(data.transcript || 'No speech detected.');
              } else {
                setSttText(data.error || 'Speech transcription failed.');
              }
              setSttTranscribing(false);
            };
          } catch (err) {
            setSttText('Transcription error: ' + err.message);
            setSttTranscribing(false);
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setSttRecording(true);
        setSttText('Listening... speak into your microphone.');
      } catch (err) {
        showError('Microphone access denied or unavailable.');
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setSttRecording(false);
    }
  };

  if (authLoading || loading || !lessonData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--blue)' }}></i>
      </div>
    );
  }

  const { meta, course, lesson, totalLessons, prevLesson, nextLesson } = lessonData;

  // Simple Markdown to JSX parser matching original EJS renderContent
  const renderContentJSX = (rawText) => {
    if (!rawText) return null;

    const paragraphs = rawText.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const trimmed = para.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map((l) => l.replace(/^[•\-]\s*/, '')).filter(Boolean);
        return (
          <ul key={pIdx}>
            {items.map((item, iIdx) => (
              <li key={iIdx} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
            ))}
          </ul>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        const items = trimmed.split('\n').map((l) => l.replace(/^\d+\.\s*/, '')).filter(Boolean);
        return (
          <ol key={pIdx}>
            {items.map((item, iIdx) => (
              <li key={iIdx} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
            ))}
          </ol>
        );
      }
      if (trimmed.startsWith('```')) {
        return <pre key={pIdx}>{trimmed.replace(/```/g, '')}</pre>;
      }
      return <p key={pIdx} dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />;
    });
  };

  const boldify = (s) => {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <>
      <section className="category-hero" style={{ padding: '2.5rem 0 1.5rem' }}>
        <div className="cover">
          <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: '.3rem', fontSize: '.9rem' }}>
            <Link to={`/category/${type}`} style={{ color: 'var(--gold)' }}>
              {meta.label}
            </Link>{' '}
            /{' '}
            <Link to={`/category/${type}/course/${course._id}`} style={{ color: 'rgba(255,255,255,.7)' }}>
              {course.title}
            </Link>{' '}
            / Lesson {idx + 1}
          </p>
          <h1 id="lessonTitle" style={{ fontSize: '1.6rem' }}>
            {lesson.title}
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.6)' }}>
              <i className="fa-solid fa-clock"></i> {lesson.duration}
            </span>
            <span style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.6)' }}>
              <i className="fa-solid fa-book"></i> Lesson {idx + 1} of {totalLessons}
            </span>
            <button
              className="tool-btn tool-btn-primary"
              id="readLessonBtn"
              style={{ fontSize: '.82rem', padding: '.4rem 1rem' }}
              onClick={handleReadLesson}
            >
              <i className="fa-solid fa-volume-high"></i> Read Lesson
            </button>
          </div>
        </div>
      </section>

      {/* Dual Video Section */}
      {(lesson.videoUrl || lesson.signLanguageVideoUrl) && (
        <section style={{ padding: '1.5rem 0 0' }}>
          <div className="cover">
            <div className="video-dual-layout">
              {lesson.videoUrl && (
                <div className="video-panel">
                  <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.6rem' }}>
                    <i className="fa-solid fa-play-circle" style={{ color: 'var(--blue)' }}></i> Course Video
                  </h3>
                  <div className="video-wrapper">
                    <iframe
                      ref={mainVideoRef}
                      id="mainVideoPlayer"
                      src={lesson.videoUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', borderRadius: '12px', width: '100%', height: '100%', minHeight: '260px' }}
                      allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      title="Course Video"
                    ></iframe>
                  </div>
                </div>
              )}

              {lesson.signLanguageVideoUrl && (
                <div className="video-panel">
                  <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.6rem' }}>
                    <i className="fa-solid fa-hands-asl-interpreting" style={{ color: 'var(--gold-deep)' }}></i> Sign Language Interpretation
                  </h3>
                  <div className="video-wrapper">
                    <video
                      ref={signVideoRef}
                      id="signVideoPlayer"
                      src={lesson.signLanguageVideoUrl}
                      controls
                      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>

            {lesson.videoUrl && lesson.signLanguageVideoUrl && (
              <div style={{ textAlign: 'center', marginTop: '.8rem', display: 'flex', gap: '.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="tool-btn tool-btn-primary" id="syncPlayBoth" style={{ fontSize: '.8rem', padding: '.4rem 1rem' }} onClick={handlePlayBoth}>
                  <i className="fa-solid fa-play"></i> Play Sign Video
                </button>
                <button className="tool-btn tool-btn-outline" id="syncPauseBoth" style={{ fontSize: '.8rem', padding: '.4rem 1rem' }} onClick={handlePauseBoth}>
                  <i className="fa-solid fa-pause"></i> Pause Sign Video
                </button>
                <button className="tool-btn tool-btn-outline" id="syncRestart" style={{ fontSize: '.8rem', padding: '.4rem 1rem' }} onClick={handleRestartBoth}>
                  <i className="fa-solid fa-rotate-left"></i> Restart Sign Video
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main content + Sidebar */}
      <section style={{ padding: '2rem 0 3rem' }}>
        <div className="cover">
          <div className="lesson-layout">
            {/* Main content */}
            <div className="lesson-main">
              <div className="lesson-content" id="lessonContent">
                {renderContentJSX(lesson.content)}
              </div>

              <div className="lesson-nav">
                {prevLesson !== null ? (
                  <Link to={`/category/${type}/course/${course._id}/lesson/${prevLesson}`} className="lesson-nav-btn">
                    <i className="fa-solid fa-arrow-left"></i> Previous
                  </Link>
                ) : (
                  <span></span>
                )}

                <button
                  className="lesson-nav-btn primary"
                  id="markCompleteBtn"
                  onClick={handleMarkComplete}
                  disabled={savingProgress}
                  style={
                    isCompleted
                      ? { background: '#10b981', borderColor: '#10b981', color: '#fff' }
                      : {}
                  }
                >
                  {savingProgress ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : isCompleted ? (
                    <>
                      <i className="fa-solid fa-check-double"></i> Completed!
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Mark Complete
                    </>
                  )}
                </button>

                {nextLesson !== null ? (
                  <Link to={`/category/${type}/course/${course._id}/lesson/${nextLesson}`} className="lesson-nav-btn primary">
                    Next <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                ) : (
                  <Link to={`/category/${type}/course/${course._id}`} className="lesson-nav-btn">
                    Back to Course <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                )}
              </div>
            </div>

            {/* Sidebar Tools */}
            <div className="lesson-sidebar">
              {/* Text to Speech */}
              {needsBothAudio && (
                <div className="tool-panel">
                  <h3>
                    <i className="fa-solid fa-volume-high"></i> Text to Speech
                  </h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-soft)', marginBottom: '.8rem' }}>
                    Listen to this lesson read aloud
                  </p>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <button className="tool-btn tool-btn-primary" id="ttsPlayLesson" onClick={handleTtsPlay}>
                      <i className="fa-solid fa-play"></i> Play
                    </button>
                    <button className="tool-btn tool-btn-outline" id="ttsPauseLesson" onClick={handleTtsPause}>
                      <i className="fa-solid fa-pause"></i> Pause
                    </button>
                    <button className="tool-btn tool-btn-outline" id="ttsStopLesson" onClick={handleTtsStop}>
                      <i className="fa-solid fa-stop"></i> Stop
                    </button>
                  </div>
                </div>
              )}

              {/* Text to Sign */}
              {isDeafType && (
                <div className="tool-panel">
                  <h3>
                    <i className="fa-solid fa-hands-asl-interpreting"></i> Text to Sign (ISL)
                  </h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-soft)', marginBottom: '.6rem' }}>
                    Convert text to Indian Sign Language fingerspelling
                  </p>
                  <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.6rem', flexWrap: 'wrap' }}>
                    <button
                      className="tool-btn tool-btn-primary"
                      id="signLessonTitle"
                      style={{ fontSize: '.78rem', padding: '.35rem .7rem' }}
                      onClick={() => setSignInput(lesson.title)}
                    >
                      <i className="fa-solid fa-hand"></i> Sign Lesson Title
                    </button>
                    <button
                      className="tool-btn tool-btn-outline"
                      id="signClearLesson"
                      style={{ fontSize: '.78rem', padding: '.35rem .7rem' }}
                      onClick={() => setSignInput('')}
                    >
                      <i className="fa-solid fa-eraser"></i> Clear
                    </button>
                  </div>
                  <input
                    type="text"
                    className="sign-input"
                    id="lessonSignInput"
                    placeholder="Type any word to see it in sign language..."
                    style={{ width: '100%', marginBottom: '.5rem' }}
                    value={signInput}
                    onChange={(e) => setSignInput(e.target.value)}
                  />
                  <div className="sign-display" id="lessonSignDisplay" style={{ minHeight: '120px', justifyContent: 'flex-start' }}>
                    {signInput ? (
                      signInput
                        .toLowerCase()
                        .split('')
                        .map((char, cIdx) => {
                          if (char === ' ') {
                            return <div key={cIdx} className="sign-space" style={{ width: '20px' }}></div>;
                          }
                          const mapped = ISL_MAP[char];
                          if (!mapped) return null;
                          return (
                            <div key={cIdx} className="sign-card" title={`${char.toUpperCase()}: ${mapped.desc}`}>
                              <div dangerouslySetInnerHTML={{ __html: mapped.sign }} />
                              <span className="sign-letter">{char.toUpperCase()}</span>
                            </div>
                          );
                        })
                    ) : (
                      <span style={{ color: 'var(--text-soft)', fontSize: '.85rem', fontStyle: 'italic' }}>
                        Type or click above to display fingerspelling signs
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-soft)', marginTop: '.4rem', fontStyle: 'italic' }}>
                    <i className="fa-solid fa-info-circle"></i> Each card shows the ISL hand shape for that letter
                  </p>
                </div>
              )}

              {/* Speech to Text */}
              {needsBothAudio && (
                <div className="tool-panel">
                  <h3>
                    <i className="fa-solid fa-microphone"></i> Speech to Text
                  </h3>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-soft)', marginBottom: '.8rem' }}>
                    Speak to interact without typing
                  </p>
                  <button
                    className={`tool-btn ${sttRecording ? 'tool-btn-danger' : 'tool-btn-primary'}`}
                    id="lessonSttBtn"
                    style={{ width: '100%' }}
                    onClick={handleToggleStt}
                    disabled={sttTranscribing}
                  >
                    {sttTranscribing ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Transcribing...
                      </>
                    ) : sttRecording ? (
                      <>
                        <i className="fa-solid fa-stop"></i> Stop &amp; Transcribe
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-microphone"></i> Start Listening
                      </>
                    )}
                  </button>
                  <div className="stt-display" id="lessonSttDisplay" style={{ minHeight: '80px', marginTop: '.5rem', fontSize: '.9rem' }}>
                    {sttText ? (
                      <span>{sttText}</span>
                    ) : (
                      <span style={{ color: 'var(--text-soft)', fontStyle: 'italic' }}>Your speech will appear here...</span>
                    )}
                  </div>
                </div>
              )}

              {/* Lesson list */}
              <div className="tool-panel">
                <h3>
                  <i className="fa-solid fa-list"></i> All Lessons
                </h3>
                {course.lessons.map((l, i) => (
                  <Link
                    key={i}
                    to={`/category/${type}/course/${course._id}/lesson/${i}`}
                    style={{
                      display: 'block',
                      padding: '.5rem .6rem',
                      borderRadius: '10px',
                      fontSize: '.88rem',
                      fontWeight: i === idx ? 700 : 500,
                      color: i === idx ? 'var(--blue)' : 'var(--text)',
                      background: i === idx ? 'var(--blue-soft)' : 'transparent',
                      marginBottom: '.2rem',
                      transition: 'background .2s',
                    }}
                  >
                    {i + 1}. {l.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

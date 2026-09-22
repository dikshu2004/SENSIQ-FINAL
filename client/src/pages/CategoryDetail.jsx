import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import SignRecognitionPanel from '../components/tools/SignRecognitionPanel';

export default function CategoryDetail() {
  const { type } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { showError } = useFlash();
  const navigate = useNavigate();

  const [catData, setCatData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMuteType = ['mute', 'deaf_mute', 'mute_visually_impaired'].includes(type);
  const isViType = ['visually_impaired', 'mute_visually_impaired'].includes(type);
  const isDeafType = ['deaf', 'deaf_mute'].includes(type);
  const needsBothAudio = isMuteType || isViType;
  const isGestureCategory = ['deaf', 'mute', 'deaf_mute'].includes(type);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
      return;
    }

    if (user && type) {
      async function fetchCategory() {
        try {
          const res = await fetch(`/api/category/${type}`, { credentials: 'include' });
          if (!res.ok) {
            throw new Error('Could not load category');
          }
          const data = await res.json();
          setCatData(data);
        } catch (err) {
          console.error(err);
          showError('Could not load category.');
          navigate('/home');
        } finally {
          setLoading(false);
        }
      }
      fetchCategory();
    }
  }, [type, user, authLoading, navigate, showError]);

  if (authLoading || loading || !catData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--blue)' }}></i>
      </div>
    );
  }

  const { meta, courses, progressMap } = catData;

  return (
    <>
      <section className="category-hero">
        <div className="cover">
          <div className="category-hero-inner">
            <div className="category-hero-icon">
              <i className={`fa-solid ${meta.icon}`}></i>
            </div>
            <div>
              <h1>{meta.label}</h1>
              <p>{meta.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <div className="cover">
          {/* Real-time Sign Language Recognition Panel */}
          {isGestureCategory && <SignRecognitionPanel />}

          {/* Tools relevant to this category */}
          <h2>
            <i className="fa-solid fa-toolbox" style={{ color: 'var(--blue)' }}></i> Available Assistive Tools
          </h2>
          <div className="dash-tools" style={{ marginBottom: '2.5rem' }}>
            {isDeafType && (
              <Link to="/tools/text-to-sign" className="dash-tool">
                <div className="dash-tool-icon t2s">
                  <i className="fa-solid fa-hands-asl-interpreting"></i>
                </div>
                <div>
                  <h4>Text to Sign Language</h4>
                  <p>Convert text to ISL fingerspelling</p>
                </div>
              </Link>
            )}

            {needsBothAudio && (
              <>
                <Link to="/tools/text-to-speech" className="dash-tool">
                  <div className="dash-tool-icon tts">
                    <i className="fa-solid fa-volume-high"></i>
                  </div>
                  <div>
                    <h4>Text to Speech</h4>
                    <p>Listen to content read aloud</p>
                  </div>
                </Link>
                <Link to="/tools/speech-to-text" className="dash-tool">
                  <div className="dash-tool-icon stt">
                    <i className="fa-solid fa-microphone"></i>
                  </div>
                  <div>
                    <h4>Speech to Text</h4>
                    <p>Speak to interact without typing</p>
                  </div>
                </Link>
              </>
            )}

            {!isDeafType && !needsBothAudio && (
              <>
                <Link to="/tools/speech-to-text" className="dash-tool">
                  <div className="dash-tool-icon stt">
                    <i className="fa-solid fa-microphone"></i>
                  </div>
                  <div>
                    <h4>Speech to Text</h4>
                    <p>Convert voice to text</p>
                  </div>
                </Link>
                <Link to="/tools/text-to-speech" className="dash-tool">
                  <div className="dash-tool-icon tts">
                    <i className="fa-solid fa-volume-high"></i>
                  </div>
                  <div>
                    <h4>Text to Speech</h4>
                    <p>Listen to content</p>
                  </div>
                </Link>
                <Link to="/tools/text-to-sign" className="dash-tool">
                  <div className="dash-tool-icon t2s">
                    <i className="fa-solid fa-hands-asl-interpreting"></i>
                  </div>
                  <div>
                    <h4>Text to Sign</h4>
                    <p>ISL fingerspelling</p>
                  </div>
                </Link>
              </>
            )}
          </div>

          <h2>
            <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--blue)' }}></i> Courses
          </h2>
          {courses.length === 0 ? (
            <p style={{ color: 'var(--text-soft)' }}>No courses available for this category yet.</p>
          ) : (
            <div className="course-grid">
              {courses.map((course) => {
                const pct = progressMap[course._id] || 0;
                return (
                  <div key={course._id} className="course-card reveal visible">
                    <div className="course-card-icon">
                      <i className={`fa-solid ${course.icon || 'fa-book'}`}></i>
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description ? course.description.substring(0, 120) + '...' : ''}</p>
                    <div className="course-card-meta">
                      <span><i className="fa-solid fa-clock"></i> {course.estimatedDuration}</span>
                      <span><i className="fa-solid fa-signal"></i> {course.difficulty}</span>
                      <span><i className="fa-solid fa-book"></i> {course.lessons ? course.lessons.length : 0} lessons</span>
                    </div>
                    <div className="progress-bar-mini">
                      <div className="fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <Link to={`/category/${type}/course/${course._id}`} className="card-btn">
                      {pct > 0 ? 'Continue' : 'Start Learning'} <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

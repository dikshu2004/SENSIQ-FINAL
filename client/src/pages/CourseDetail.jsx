import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';

export default function CourseDetail() {
  const { type, courseId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { showError } = useFlash();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
      return;
    }

    if (user && courseId) {
      async function fetchCourse() {
        try {
          const res = await fetch(`/api/category/${type}/course/${courseId}`, { credentials: 'include' });
          if (!res.ok) {
            throw new Error('Could not load course');
          }
          const data = await res.json();
          setCourseData(data);

          // Auto-speak course title if voice mode is enabled
          if (localStorage.getItem('sensiq_voice_mode') === 'true' && 'speechSynthesis' in window) {
            setTimeout(() => {
              const utter = new SpeechSynthesisUtterance('You are now viewing ' + data.course.title);
              utter.lang = 'en-IN';
              utter.rate = 0.9;
              window.speechSynthesis.speak(utter);
            }, 500);
          }
        } catch (err) {
          console.error(err);
          showError('Could not load course.');
          navigate(`/category/${type}`);
        } finally {
          setLoading(false);
        }
      }
      fetchCourse();
    }
  }, [type, courseId, user, authLoading, navigate, showError]);

  const handleReadDescription = () => {
    if (!courseData || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = courseData.course.title + '. ' + courseData.course.description;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-IN';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  if (authLoading || loading || !courseData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--blue)' }}></i>
      </div>
    );
  }

  const { meta, course, progress } = courseData;

  return (
    <>
      <section className="category-hero">
        <div className="cover">
          <div className="category-hero-inner">
            <div className="category-hero-icon">
              <i className={`fa-solid ${course.icon || 'fa-book'}`}></i>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,.5)', marginBottom: '.2rem' }}>
                <Link to={`/category/${type}`} style={{ color: 'var(--gold)' }}>
                  {meta.label}
                </Link>{' '}
                / Course
              </p>
              <h1 id="courseTitle">{course.title}</h1>
              <p id="courseDesc">{course.description}</p>
              <button
                className="tool-btn tool-btn-primary"
                id="readDescBtn"
                style={{ marginTop: '.8rem' }}
                onClick={handleReadDescription}
              >
                <i className="fa-solid fa-volume-high"></i> Read Description
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <div className="cover" style={{ maxWidth: '900px' }}>
          <div className="content-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="tech-badge">
                <i className="fa-solid fa-clock"></i> {course.estimatedDuration}
              </span>
              <span className="tech-badge">
                <i className="fa-solid fa-signal"></i> {course.difficulty}
              </span>
              <span className="tech-badge">
                <i className="fa-solid fa-book"></i> {course.lessons ? course.lessons.length : 0} lessons
              </span>
            </div>
            {progress && (
              <>
                <div className="progress-bar-mini" style={{ height: '8px', marginBottom: '.5rem' }}>
                  <div className="fill" style={{ width: `${progress.percentComplete}%` }}></div>
                </div>
                <p style={{ fontSize: '.88rem', color: 'var(--text-soft)' }}>
                  {progress.percentComplete}% complete
                </p>
              </>
            )}
          </div>

          <h2 style={{ marginBottom: '1rem' }}>
            <i className="fa-solid fa-list-ol" style={{ color: 'var(--blue)' }}></i> Lessons
          </h2>

          {course.lessons.map((lesson, idx) => {
            const isCompleted =
              progress &&
              progress.completedLessons &&
              progress.completedLessons.map(String).includes(String(idx));

            return (
              <Link
                key={idx}
                to={`/category/${type}/course/${course._id}/lesson/${idx}`}
                className="course-card reveal visible"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.2rem',
                  marginBottom: '.8rem',
                  padding: '1.2rem 1.5rem',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isCompleted ? '#10b981' : 'var(--blue-soft)',
                    color: isCompleted ? '#fff' : 'var(--blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <i className="fa-solid fa-check"></i> : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 .2rem', fontSize: '1rem' }}>{lesson.title}</h3>
                  <span style={{ fontSize: '.82rem', color: 'var(--text-soft)' }}>
                    <i className="fa-solid fa-clock"></i> {lesson.duration}
                  </span>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: 'var(--text-soft)' }}></i>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

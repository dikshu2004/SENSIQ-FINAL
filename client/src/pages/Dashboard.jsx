import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showError } = useFlash();
  const navigate = useNavigate();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      showError('🔒 Please sign in or create a free account to access learning content and assistive tools.');
      navigate('/home/login');
      return;
    }

    if (user) {
      async function fetchDashboard() {
        try {
          const res = await fetch('/api/dashboard', { credentials: 'include' });
          if (!res.ok) {
            throw new Error('Failed to load dashboard data');
          }
          const data = await res.json();
          setDashData(data);
        } catch (err) {
          console.error(err);
          showError('Could not load dashboard data.');
        } finally {
          setLoading(false);
        }
      }
      fetchDashboard();
    }
  }, [user, authLoading, navigate, showError]);

  if (authLoading || loading || !dashData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--blue)' }}></i>
      </div>
    );
  }

  const {
    dtype,
    catLabel,
    courseStats,
    totalCourses,
    totalCompleted,
    inProgress,
    notStarted,
    totalLessonsAll,
    completedLessonsAll,
    overallPct,
  } = dashData;

  return (
    <>
      <section className="dashboard-header">
        <div className="cover">
          {/* Welcome row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.8rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <h1 style={{ fontSize: '1.55rem', margin: 0 }}>
                Welcome back, <span style={{ color: 'var(--gold)' }}>{user.username}</span>!
              </h1>
              <p style={{ margin: 0, color: 'var(--text-soft)', fontSize: '.92rem' }}>
                <i className="fa-solid fa-tag"></i> {catLabel}
              </p>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="dash-stats" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem' }}>
            {/* Overall progress ring */}
            <div className="dash-stat" style={{ flexDirection: 'column', alignItems: 'center', gap: '.5rem', padding: '1.2rem' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="3"
                    strokeDasharray={`${overallPct} ${100 - overallPct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: 'var(--gold)',
                  }}
                >
                  {overallPct}%
                </span>
              </div>
              <div className="dash-stat-label" style={{ textAlign: 'center' }}>
                Overall Progress
              </div>
            </div>

            <div className="dash-stat">
              <i className="fa-solid fa-book-open"></i>
              <div>
                <div className="dash-stat-value">{totalCourses}</div>
                <div className="dash-stat-label">Courses</div>
              </div>
            </div>

            <div className="dash-stat">
              <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
              <div>
                <div className="dash-stat-value" style={{ color: '#10b981' }}>
                  {totalCompleted}
                </div>
                <div className="dash-stat-label">Completed</div>
              </div>
            </div>

            <div className="dash-stat">
              <i className="fa-solid fa-spinner" style={{ color: 'var(--gold)' }}></i>
              <div>
                <div className="dash-stat-value" style={{ color: 'var(--gold)' }}>
                  {inProgress}
                </div>
                <div className="dash-stat-label">In Progress</div>
              </div>
            </div>

            <div className="dash-stat">
              <i className="fa-solid fa-circle" style={{ color: 'var(--text-soft)' }}></i>
              <div>
                <div className="dash-stat-value" style={{ color: 'var(--text-soft)' }}>
                  {notStarted}
                </div>
                <div className="dash-stat-label">Not Started</div>
              </div>
            </div>

            <div className="dash-stat">
              <i className="fa-solid fa-check-double" style={{ color: 'var(--blue)' }}></i>
              <div>
                <div className="dash-stat-value" style={{ color: 'var(--blue)' }}>
                  {completedLessonsAll}/{totalLessonsAll}
                </div>
                <div className="dash-stat-label">Lessons Done</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <div className="cover">
          {/* ── Assistive Tools ── */}
          <h2>
            <i className="fa-solid fa-toolbox" style={{ color: 'var(--blue)' }}></i> Assistive Tools
          </h2>
          <div className="dash-tools">
            <Link to="/tools/speech-to-text" className="dash-tool">
              <div className="dash-tool-icon stt">
                <i className="fa-solid fa-microphone"></i>
              </div>
              <div>
                <h4>Speech to Text</h4>
                <p>Convert your voice to text in real-time</p>
              </div>
            </Link>
            <Link to="/tools/text-to-speech" className="dash-tool">
              <div className="dash-tool-icon tts">
                <i className="fa-solid fa-volume-high"></i>
              </div>
              <div>
                <h4>Text to Speech</h4>
                <p>Listen to any text content read aloud</p>
              </div>
            </Link>
            <Link to="/tools/text-to-sign" className="dash-tool">
              <div className="dash-tool-icon t2s">
                <i className="fa-solid fa-hands-asl-interpreting"></i>
              </div>
              <div>
                <h4>Text to Sign Language</h4>
                <p>Convert text to ISL fingerspelling</p>
              </div>
            </Link>
          </div>

          {/* ── Course Progress ── */}
          <h2 style={{ marginTop: '2rem' }}>
            <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--blue)' }}></i> Your Courses
          </h2>

          {courseStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-soft)' }}>
              <i className="fa-solid fa-book-open" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block', opacity: 0.4 }}></i>
              <p>No courses available for your category yet.</p>
              <Link to="/home" className="demo-btn" style={{ marginTop: '1rem' }}>
                Browse All <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          ) : (
            <div className="course-grid">
              {courseStats.map((stat) => {
                const { course, pct, totalLessons, completedLessons, remainingLessons, status } = stat;
                const catLink = dtype !== 'none' ? dtype : (course.category[0] || 'deaf');
                const statusColor = status === 'completed' ? '#10b981' : status === 'in-progress' ? 'var(--gold)' : 'var(--text-soft)';
                const statusIcon = status === 'completed' ? 'fa-circle-check' : status === 'in-progress' ? 'fa-spinner' : 'fa-circle';
                const statusLabel = status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Not Started';
                const btnLabel = status === 'completed' ? 'Review' : status === 'in-progress' ? 'Continue' : 'Start Learning';

                return (
                  <div key={course._id} className="course-card reveal visible">
                    {/* Status badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <div className="course-card-icon" style={{ margin: 0 }}>
                        <i className={`fa-solid ${course.icon || 'fa-book'}`}></i>
                      </div>
                      <span
                        style={{
                          fontSize: '.75rem',
                          fontWeight: 700,
                          padding: '.2rem .65rem',
                          borderRadius: '20px',
                          background:
                            status === 'completed'
                              ? 'rgba(16,185,129,.15)'
                              : status === 'in-progress'
                              ? 'rgba(244,180,0,.15)'
                              : 'rgba(255,255,255,.07)',
                          color: statusColor,
                          border: `1px solid ${statusColor}`,
                        }}
                      >
                        <i className={`fa-solid ${statusIcon}`}></i> {statusLabel}
                      </span>
                    </div>

                    <h3>{course.title}</h3>
                    <p>{course.description ? course.description.substring(0, 100) + '...' : ''}</p>

                    {/* Meta */}
                    <div className="course-card-meta">
                      <span><i className="fa-solid fa-clock"></i> {course.estimatedDuration}</span>
                      <span><i className="fa-solid fa-signal"></i> {course.difficulty}</span>
                      <span><i className="fa-solid fa-book"></i> {totalLessons} lessons</span>
                    </div>

                    {/* Lesson progress breakdown */}
                    <div
                      style={{
                        background: 'rgba(255,255,255,.05)',
                        border: '1px solid rgba(255,255,255,.08)',
                        borderRadius: '10px',
                        padding: '.7rem .9rem',
                        margin: '.8rem 0',
                        fontSize: '.83rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                        <span style={{ color: 'var(--text-soft)' }}>Progress</span>
                        <strong style={{ color: statusColor }}>{pct}%</strong>
                      </div>

                      {/* Progress bar */}
                      <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '.6rem' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background:
                              status === 'completed'
                                ? 'linear-gradient(90deg,#10b981,#34d399)'
                                : status === 'in-progress'
                                ? 'linear-gradient(90deg,var(--gold),#fbbf24)'
                                : 'rgba(255,255,255,.2)',
                            borderRadius: '6px',
                            transition: 'width .6s ease',
                          }}
                        ></div>
                      </div>

                      {/* Lesson counts */}
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#10b981' }}>
                          <i className="fa-solid fa-check-circle"></i> <strong>{completedLessons}</strong> Completed
                        </span>
                        <span style={{ color: 'var(--text-soft)' }}>
                          <i className="fa-solid fa-hourglass-half"></i> <strong>{remainingLessons}</strong> Remaining
                        </span>
                        <span style={{ color: 'var(--blue)' }}>
                          <i className="fa-solid fa-layer-group"></i> <strong>{totalLessons}</strong> Total
                        </span>
                      </div>
                    </div>

                    <Link to={`/category/${catLink}/course/${course._id}`} className="card-btn">
                      {btnLabel} <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/dashboard/profile" className="demo-btn">
              <i className="fa-solid fa-user-pen"></i> Edit Profile &amp; Preferences
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

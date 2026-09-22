import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      img: '/images/hero1.jpg',
      alt: 'People communicating with sign language',
      title: <>Learning <span>Without Barriers</span></>,
      desc: 'Accessible for Deaf, Mute & Visually Impaired',
      btnText: 'Learn More',
      btnLink: '/home/about',
    },
    {
      img: '/images/hero2.jpg',
      alt: 'Teacher using sign language in classroom',
      title: <>Empowering <span>Every Learner</span></>,
      desc: 'Sign Language · Speech-to-Text · Text-to-Speech',
      btnText: 'Get Started',
      btnLink: '/home/signup',
    },
    {
      img: '/images/hero3.jpg',
      alt: 'Child learning with sign language',
      title: <>Education for <span>All Abilities</span></>,
      desc: 'Powered by Assistive Technology & AI',
      btnText: 'Explore Pathways',
      btnLink: '#categories',
    },
  ];

  // Carousel timer
  useEffect(() => {
    if (searchQuery) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [searchQuery, slides.length]);

  // Fetch search courses if search query active
  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      try {
        const url = searchQuery
          ? `/api/courses?q=${encodeURIComponent(searchQuery)}`
          : '/api/courses';
        const res = await fetch(url);
        const data = await res.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [searchQuery]);

  return (
    <>
      {/* ======= SEARCH RESULTS (only shown when searching) ======= */}
      {searchQuery.length > 0 && (
        <section className="section-block search-results-section">
          <div className="cover">
            <div className="search-results-header reveal visible">
              <span className="eyebrow eyebrow-blue">Search Results</span>
              <h2>Results for "{searchQuery}"</h2>
              <p>{courses.length} course{courses.length !== 1 ? 's' : ''} found</p>
              <Link to="/home" className="search-clear-btn">
                <i className="fa-solid fa-xmark"></i> Clear Search
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--blue)' }}></i>
              </div>
            ) : courses.length === 0 ? (
              <div className="search-empty reveal visible">
                <i className="fa-solid fa-magnifying-glass"></i>
                <h3>No courses found for "{searchQuery}"</h3>
                <p>Try a different keyword or browse all categories below.</p>
                <Link to="/home" className="demo-btn">
                  Browse All <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            ) : (
              <div className="course-grid">
                {courses.map((course) => (
                  <div key={course._id} className="course-card reveal visible">
                    <div className="course-card-icon">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description ? course.description.substring(0, 100) + '...' : ''}</p>
                    <div className="course-card-meta">
                      <span><i className="fa-solid fa-tag"></i> {Array.isArray(course.category) ? course.category.join(', ') : course.category}</span>
                      <span><i className="fa-solid fa-layer-group"></i> {course.lessons ? course.lessons.length : 0} lessons</span>
                    </div>
                    <Link
                      to={`/category/${Array.isArray(course.category) ? course.category[0] : course.category}`}
                      className="card-btn"
                    >
                      View Course <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ======= HERO CAROUSEL (hidden during search) ======= */}
      {!searchQuery && (
        <section className="hero-carousel" aria-label="Hero slideshow">
          {slides.map((slide, idx) => (
            <div key={idx} className={`slide ${idx === currentSlide ? 'active' : ''}`}>
              <img src={slide.img} alt={slide.alt} />
              <div className="hero-slide-content">
                <h1>{slide.title}</h1>
                <p>{slide.desc}</p>
                {slide.btnLink.startsWith('#') ? (
                  <a href={slide.btnLink} className="hero-btn">
                    {slide.btnText} <i className="fa-solid fa-arrow-right"></i>
                  </a>
                ) : (
                  <Link to={slide.btnLink} className="hero-btn">
                    {slide.btnText} <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                )}
              </div>
            </div>
          ))}

          <button
            className="carousel-arrow carousel-arrow-left"
            aria-label="Previous slide"
            id="carouselPrev"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            aria-label="Next slide"
            id="carouselNext"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <div className="carousel-dots" id="carouselDots">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                data-index={idx}
                onClick={() => setCurrentSlide(idx)}
              ></span>
            ))}
          </div>
        </section>
      )}

      {/* Category Cards */}
      <section className="section-block" id="categories">
        <div className="cover">
          <div className="section-heading reveal visible">
            <span className="eyebrow eyebrow-gold">Learning Pathways</span>
            <h2>Choose Your Learning Category</h2>
            <p>Each pathway is designed with specific assistive technologies tailored to your learning needs.</p>
          </div>

          <div className="category-grid">
            <article className="category-card reveal visible">
              <div className="category-icon"><i className="fa-solid fa-ear-deaf"></i></div>
              <h3>Deaf Learners</h3>
              <p>Video modules with sign language support for better comprehension.</p>
              <Link to="/category/deaf" className="demo-btn">
                Try Demo <i className="fa-solid fa-face-smile"></i>
              </Link>
            </article>

            <article className="category-card reveal visible">
              <div className="category-icon"><i className="fa-solid fa-microphone-lines-slash"></i></div>
              <h3>Mute Learners</h3>
              <p>Text to Speech &amp; Speech to Text — listen to content and interact using your voice.</p>
              <Link to="/category/mute" className="demo-btn">
                Try Demo <i className="fa-solid fa-face-smile"></i>
              </Link>
            </article>

            <article className="category-card reveal visible">
              <div className="category-icon"><i className="fa-solid fa-eye-low-vision"></i></div>
              <h3>Visually Impaired Learners</h3>
              <p>Speech to Text &amp; Text to Speech — dictate and listen for full audio accessibility.</p>
              <Link to="/category/visually_impaired" className="demo-btn">
                Try Demo <i className="fa-solid fa-face-smile"></i>
              </Link>
            </article>

            <article className="category-card reveal visible">
              <div className="category-icon"><i className="fa-solid fa-hands-asl-interpreting"></i></div>
              <h3>Deaf &amp; Mute Learners</h3>
              <p>Video modules with sign language support for better comprehension.</p>
              <Link to="/category/deaf_mute" className="demo-btn">
                Try Demo <i className="fa-solid fa-face-smile"></i>
              </Link>
            </article>

            <article className="category-card reveal visible">
              <div className="category-icon"><i className="fa-solid fa-universal-access"></i></div>
              <h3>Mute &amp; Visually Impaired</h3>
              <p>Full TTS &amp; STT support — listen to content and interact using your voice.</p>
              <Link to="/category/mute_visually_impaired" className="demo-btn">
                Try Demo <i className="fa-solid fa-face-smile"></i>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-block about-section">
        <div className="cover">
          <div className="about-grid">
            <div className="about-text reveal visible">
              <h2>About Us</h2>
              <p className="about-subtitle">Inclusive Education for Everyone</p>
              <p>
                We are building an <strong>Inclusive E-Learning Platform</strong> designed for learners with sensory disabilities. Our mission is to make education <strong>accessible, interactive, and independent</strong> for everyone.
              </p>
              <p>
                Using Assistive Technologies like <strong>Sign Language</strong>, <strong>Text-to-Speech</strong>, <strong>Speech-to-Text</strong>, and <strong>Natural Language Processing</strong>, we make learning more engaging and inclusive.
              </p>

              <div className="tech-badges">
                <span className="tech-badge"><i className="fa-solid fa-universal-access"></i> Accessibility for all</span>
                <span className="tech-badge"><i className="fa-solid fa-hands-asl-interpreting"></i> Sign Language Support</span>
                <span className="tech-badge"><i className="fa-solid fa-headphones"></i> Text-to-Speech</span>
                <span className="tech-badge"><i className="fa-solid fa-microphone"></i> Speech-to-Text</span>
              </div>

              <div className="mission-vision-grid">
                <div className="mv-card">
                  <h4>Our Mission</h4>
                  <p>To ensure that education is accessible to everyone without barriers.</p>
                </div>
                <div className="mv-card">
                  <h4>Our Vision</h4>
                  <p>To use technology for bridging the gap in inclusive learning.</p>
                </div>
              </div>

              <Link to="/home/about" className="hero-btn">
                Learn More <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
            <div className="about-image reveal visible">
              <img src="/images/about.jpg" alt="Inclusive classroom with diverse learners" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

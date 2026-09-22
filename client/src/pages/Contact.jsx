import React, { useState } from 'react';
import { useFlash } from '../context/FlashContext';

export default function Contact() {
  const { showSuccess, showError } = useFlash();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const targetEmail = 'dikshasomwanshi24@gmail.com';
    const emailSubject = `[SensiQ Contact] ${formData.subject || 'Message from ' + formData.name}`;
    const emailBody = `Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject || 'General Inquiry'}

Message:
${formData.message}
`;

    // Optionally notify server in background
    try {
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).catch(() => {});
    } catch (_) {}

    // Open user's email client directly with prefilled information
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;

    showSuccess(`Opening your email client to send your message to ${targetEmail}!`);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  return (
    <>
      <section className="content-hero contact-hero-img">
        <div className="cover contact-hero-inner">
          <div className="cover narrow">
            <span className="eyebrow eyebrow-dark">Contact</span>
            <h1>Support for access, onboarding, and course questions.</h1>
            <p>
              If you need help using SensiQ, reach out through the support details below or browse the common questions.
            </p>
          </div>
          <div className="contact-hero-visual">
            <img
              src="/images/contact_hero.png"
              alt="Support and contact illustration with communication icons"
              className="contact-hero-image"
            />
          </div>
        </div>
      </section>

      <section className="section-block section-light">
        <div className="cover support-layout">
          {/* LEFT: Contact Details + Form */}
          <div>
            {/* Contact Details Card */}
            <div className="content-card reveal visible" style={{ marginBottom: '1.5rem' }}>
              <h2>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--blue)' }}></i> Contact Details
              </h2>
              <a href="mailto:dikshasomwanshi24@gmail.com" className="contact-email-btn">
                <i className="fa-solid fa-envelope"></i> dikshasomwanshi24@gmail.com
              </a>
              <p style={{ marginTop: '1rem' }}>
                <strong>Support focus:</strong> Onboarding, accessibility guidance, and learning pathway questions.
              </p>
              <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'var(--card-bg)', borderRadius: '14px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>
                  <i className="fa-solid fa-keyboard" style={{ color: 'var(--blue)' }}></i> Keyboard Shortcuts
                </h3>
                <p style={{ fontSize: '.88rem', color: 'var(--text-soft)', lineHeight: 1.8, margin: 0 }}>
                  <strong>Alt + H</strong> — Toggle high contrast mode<br />
                  <strong>Alt + N</strong> — Read page content aloud<br />
                  <strong>Alt + V</strong> — Activate voice navigation<br />
                  <strong>Escape</strong> — Stop narration
                </p>
              </div>
            </div>

            {/* Contact Form Card */}
            <div className="content-card reveal visible">
              <h2>
                <i className="fa-solid fa-paper-plane" style={{ color: 'var(--blue)' }}></i> Send Us a Message
              </h2>
              <p style={{ color: 'var(--text-soft)', marginBottom: '1.5rem', marginTop: '.4rem' }}>
                Fill in the form below and we'll get back to you within 24–48 hours.
              </p>

              <form onSubmit={handleSubmit} className="contact-form" id="contactForm" noValidate>
                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label htmlFor="contactName">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="name"
                      placeholder="Your full name"
                      required
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="contact-form-group">
                    <label htmlFor="contactEmail">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contactSubject">Subject</label>
                  <input
                    type="text"
                    id="contactSubject"
                    name="subject"
                    placeholder="What is this about? (optional)"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contactMessage">
                    Message <span className="req">*</span>
                  </label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    rows="5"
                    placeholder="Describe your question or issue in detail..."
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="contact-submit-btn"
                  id="contactSubmitBtn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: FAQ */}
          <div className="content-card reveal visible">
            <h2>
              <i className="fa-solid fa-circle-question" style={{ color: 'var(--blue)' }}></i> Frequently Asked Questions
            </h2>
            <div className="faq-list" style={{ marginTop: '.8rem' }}>
              <details>
                <summary>Who can use SensiQ?</summary>
                <p>SensiQ is designed for learners with hearing, speech, visual, or overlapping sensory accessibility needs.</p>
              </details>
              <details>
                <summary>Are courses self-paced?</summary>
                <p>Yes. The current experience is designed around flexible access so learners can move at their own pace.</p>
              </details>
              <details>
                <summary>What assistive tools are available?</summary>
                <p>SensiQ offers Speech-to-Text, Text-to-Speech, and Text-to-Sign Language (ISL fingerspelling). These tools are integrated into lessons and also available as standalone demo pages.</p>
              </details>
              <details>
                <summary>Does the platform support assistive technologies?</summary>
                <p>The interface prioritises clear semantics, keyboard access, readable contrast, narration-friendly structure, and ARIA labels for screen readers.</p>
              </details>
              <details>
                <summary>Do I need an account?</summary>
                <p>You can explore the public pages and tool demos without an account. Creating an account enables progress tracking and personalised learning preferences.</p>
              </details>
              <details>
                <summary>What is ISL Fingerspelling?</summary>
                <p>Indian Sign Language (ISL) fingerspelling is a system where each letter of the English alphabet is represented by a unique hand shape, used for spelling out words that don't have their own sign.</p>
              </details>
              <details>
                <summary>How long does it take to get a reply?</summary>
                <p>We typically respond within 24–48 hours on working days. You'll receive an auto-confirmation email as soon as you submit the form.</p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

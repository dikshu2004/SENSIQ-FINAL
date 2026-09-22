import React, { useState, useRef, useEffect } from 'react';

const KB = [
  { keywords: ["hello", "hi", "hey"], response: "Hello! 👋 I'm SensiQ AI Assistant. Ask me anything!" },
  { keywords: ["what is sensiq", "about sensiq"], response: "SensiQ is an inclusive e-learning platform for Deaf, Mute, and Visually Impaired learners, powered by AI and assistive technologies." },
  { keywords: ["signup", "sign up", "register"], response: "Click 'Sign up' in the navbar, fill in your username, email, password, and choose your learning category." },
  { keywords: ["login", "log in", "sign in"], response: "Click 'Log in' in the navbar and enter your username and password." },
  { keywords: ["contact", "email", "help", "support"], response: "Need help? Email us at sensiq1991@gmail.com or visit the Contact page for FAQs. We support onboarding, accessibility guidance, and learning pathways." },
  { keywords: ["thank", "thanks"], response: "You're welcome! 😊" },
  { keywords: ["bye", "goodbye"], response: "Goodbye! 👋 Come back anytime." },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi! 👋 I'm the SensiQ AI Assistant powered by Google Gemini. Ask me anything — about SensiQ, courses, accessibility tools, or any general question!",
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fallbackAnswer = (query) => {
    const q = query.toLowerCase();
    for (const item of KB) {
      if (item.keywords.some((kw) => q.includes(kw))) {
        return item.response;
      }
    }
    return "I'm having a little trouble reaching our AI servers right now, but feel free to browse courses, use our assistive tools, or email support at sensiq1991@gmail.com!";
  };

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data && data.reply) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        const fb = fallbackAnswer(text);
        setMessages((prev) => [...prev, { sender: 'bot', text: fb }]);
      }
    } catch (err) {
      console.warn('Chatbot fetch error, using local fallback:', err);
      const fb = fallbackAnswer(text);
      setMessages((prev) => [...prev, { sender: 'bot', text: fb }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        id="chatBotBtn"
        className={`chatbot-btn ${isOpen ? 'hidden' : ''}`}
        aria-label="Open AI Chatbot"
        title="AI Chatbot Support"
        onClick={() => setIsOpen(true)}
      >
        <i className="fa-solid fa-robot"></i>
      </button>

      <div id="chatBotContainer" className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar"><i className="fa-solid fa-robot"></i></div>
            <div>
              <span className="chatbot-name">SensiQ AI Assistant</span>
              <span className="chatbot-status" id="chatBotStatus">● Online • Gemini / GPT Powered</span>
            </div>
          </div>
          <button
            className="chatbot-close"
            id="chatBotClose"
            aria-label="Close chatbot"
            onClick={() => setIsOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="chatbot-messages" id="chatBotMessages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chatbot-msg ${m.sender === 'user' ? 'user' : 'bot'}`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="chatbot-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <input
            type="text"
            id="chatBotInput"
            className="chatbot-input"
            placeholder="Ask me anything..."
            aria-label="Chat message"
            ref={inputRef}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            id="chatBotSend"
            className="chatbot-send"
            aria-label="Send message"
            onClick={handleSend}
            disabled={loading}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
}

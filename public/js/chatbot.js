/* ================================================================
   SensiQ — AI Chatbot Widget
   Calls /api/chat (server-side Gemini / OpenAI) for real answers.
   Falls back to local KB if the server is unavailable.
   ================================================================ */

(function () {
  "use strict";

  /* ── Local fallback KB (used only when API call fails) ── */
  const KB = [
    { keywords: ["hello","hi","hey"],                response: "Hello! 👋 I'm SensiQ AI Assistant. Ask me anything!" },
    { keywords: ["what is sensiq","about sensiq"],   response: "SensiQ is an inclusive e-learning platform for Deaf, Mute, and Visually Impaired learners, powered by AI and assistive technologies." },
    { keywords: ["signup","sign up","register"],      response: "Click 'Sign up' in the navbar, fill in your username, email, password, and choose your learning category." },
    { keywords: ["login","log in","sign in"],         response: "Click 'Log in' in the navbar and enter your username and password." },
    { keywords: ["contact","email","help","support"], response: "Need help? Email us at <a href='mailto:sensiq1991@gmail.com' style='color:var(--gold)'>sensiq1991@gmail.com</a> or visit the Contact page for FAQs. We support onboarding, accessibility guidance, and learning pathways." },
    { keywords: ["thank","thanks"],                   response: "You're welcome! 😊" },
    { keywords: ["bye","goodbye"],                    response: "Goodbye! 👋 Come back anytime." },
  ];

  /* ── State ── */
  let isOpen = false;
  let chatContainer = null;
  let chatMessages  = null;
  let chatInput     = null;

  /* ── Build UI ── */
  function createUI() {
    /* Floating button */
    const chatBtn = document.createElement("button");
    chatBtn.id        = "chatBotBtn";
    chatBtn.className = "chatbot-btn";
    chatBtn.setAttribute("aria-label", "Open AI Chatbot");
    chatBtn.setAttribute("title", "AI Chatbot Support");
    chatBtn.innerHTML = '<i class="fa-solid fa-robot"></i>';
    document.body.appendChild(chatBtn);

    /* Chat container */
    chatContainer = document.createElement("div");
    chatContainer.id        = "chatBotContainer";
    chatContainer.className = "chatbot-container";
    chatContainer.innerHTML =
      '<div class="chatbot-header">' +
        '<div class="chatbot-header-info">' +
          '<div class="chatbot-avatar"><i class="fa-solid fa-robot"></i></div>' +
          '<div>' +
            '<span class="chatbot-name">SensiQ AI Assistant</span>' +
            '<span class="chatbot-status" id="chatBotStatus">● Online • Gemini / GPT Powered</span>' +
          '</div>' +
        '</div>' +
        '<button class="chatbot-close" id="chatBotClose" aria-label="Close chatbot"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>' +
      '<div class="chatbot-messages" id="chatBotMessages"></div>' +
      '<div class="chatbot-input-area">' +
        '<input type="text" id="chatBotInput" class="chatbot-input" placeholder="Ask me anything..." aria-label="Chat message">' +
        '<button id="chatBotSend" class="chatbot-send" aria-label="Send message"><i class="fa-solid fa-paper-plane"></i></button>' +
      '</div>';
    document.body.appendChild(chatContainer);

    chatMessages = document.getElementById("chatBotMessages");
    chatInput    = document.getElementById("chatBotInput");

    /* Events */
    chatBtn.addEventListener("click", toggleChat);
    document.getElementById("chatBotClose").addEventListener("click", toggleChat);
    document.getElementById("chatBotSend").addEventListener("click", sendMessage);
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) sendMessage();
    });

    /* Welcome */
    addBotMessage("Hi! 👋 I'm the SensiQ AI Assistant powered by Google Gemini. Ask me anything — about SensiQ, courses, accessibility tools, or any general question!");
  }

  /* ── Toggle open/close ── */
  function toggleChat() {
    isOpen = !isOpen;
    chatContainer.classList.toggle("open", isOpen);
    document.getElementById("chatBotBtn").classList.toggle("hidden", isOpen);
    if (isOpen) setTimeout(function () { chatInput.focus(); }, 300);
  }

  /* ── Send message ── */
  function sendMessage() {
    var text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = "";
    showTyping();
    callAI(text);
  }

  /* ── Call server-side AI API ── */
  function callAI(message) {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      hideTyping();
      if (data.reply) {
        addBotMessage(data.reply);
      } else if (data.error) {
        addBotMessage("⚠️ " + data.error);
      } else {
        addBotMessage("Sorry, I didn't get a response. Please try again.");
      }
    })
    .catch(function (err) {
      hideTyping();
      console.warn("AI API failed, using local KB:", err);
      /* Fallback to local KB */
      var localReply = getLocalResponse(message);
      addBotMessage(localReply);
    });
  }

  /* ── Local KB fallback ── */
  function getLocalResponse(input) {
    var lower = input.toLowerCase().replace(/[?!.,]/g, "").trim();
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var score = 0;
      for (var j = 0; j < KB[i].keywords.length; j++) {
        if (lower.includes(KB[i].keywords[j])) score += KB[i].keywords[j].length;
      }
      if (score > bestScore) { bestScore = score; best = KB[i]; }
    }
    if (best && bestScore > 2) return best.response;
    return "I'm having trouble connecting to AI right now. Please try again shortly. You can also email us at <a href='mailto:sensiq1991@gmail.com' style='color:var(--gold)'>sensiq1991@gmail.com</a> for help!";
  }

  /* ── Message rendering ── */
  function addUserMessage(text) {
    var msg = document.createElement("div");
    msg.className = "chatbot-msg chatbot-msg-user";
    msg.innerHTML = '<div class="chatbot-msg-bubble">' + escapeHtml(text) + '</div>';
    chatMessages.appendChild(msg);
    scrollBottom();
  }

  function addBotMessage(text) {
    var msg = document.createElement("div");
    msg.className = "chatbot-msg chatbot-msg-bot";
    msg.innerHTML =
      '<div class="chatbot-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
      '<div class="chatbot-msg-bubble">' + formatText(text) + '</div>';
    chatMessages.appendChild(msg);
    scrollBottom();
  }

  function showTyping() {
    var t = document.createElement("div");
    t.className = "chatbot-msg chatbot-msg-bot chatbot-typing";
    t.id = "chatBotTyping";
    t.innerHTML =
      '<div class="chatbot-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
      '<div class="chatbot-msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
    chatMessages.appendChild(t);
    scrollBottom();
  }

  function hideTyping() {
    var t = document.getElementById("chatBotTyping");
    if (t) t.remove();
  }

  function scrollBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function formatText(text) {
    return escapeHtml(text)
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/•/g, "•");
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", createUI);
})();

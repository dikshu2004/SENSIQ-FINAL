/* ================================================================
   SensiQ — Voice Navigation System
   Allows users to navigate the website using voice commands.
   Uses the Web Speech API (SpeechRecognition).
   ================================================================ */

(function () {
  "use strict";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Voice navigation: SpeechRecognition not supported.");
    return;
  }

  /* ── Navigation Map ── */
  const NAV_ROUTES = {
    "home":                     "/home",
    "homepage":                 "/home",
    "main page":                "/home",
    "about":                    "/home/about",
    "about us":                 "/home/about",
    "contact":                  "/home/contact",
    "contact us":               "/home/contact",
    "courses":                  "/dashboard",
    "my courses":               "/dashboard",
    "login":                    "/home/login",
    "log in":                   "/home/login",
    "sign in":                  "/home/login",
    "signup":                   "/home/signup",
    "sign up":                  "/home/signup",
    "register":                 "/home/signup",
    "create account":           "/home/signup",
    "dashboard":                "/dashboard",
    "my dashboard":             "/dashboard",
    "profile":                  "/dashboard/profile",
    "my profile":               "/dashboard/profile",
    "preferences":              "/dashboard/profile",
    "settings":                 "/dashboard/profile",
    "deaf":                     "/category/deaf",
    "deaf learners":            "/category/deaf",
    "mute":                     "/category/mute",
    "mute learners":            "/category/mute",
    "visually impaired":        "/category/visually_impaired",
    "blind":                    "/category/visually_impaired",
    "deaf and mute":            "/category/deaf_mute",
    "deaf mute":                "/category/deaf_mute",
    "mute and visually impaired": "/category/mute_visually_impaired",
    "speech to text":           "/tools/speech-to-text",
    "text to speech":           "/tools/text-to-speech",
    "text to sign":             "/tools/text-to-sign",
    "text to sign language":    "/tools/text-to-sign",
    "sign language":            "/tools/text-to-sign",
    "logout":                   "/home/logout",
    "log out":                  "/home/logout",
    "sign out":                 "/home/logout",
  };

  /* ── Command Map for Fuzzy Matches ── */
  const COMMAND_MAP = {
    "home": ["home", "homepage", "main page", "go home", "go to home", "go to home page", "open home", "open home page"],
    "about": ["about", "about us", "open about", "go to about", "go to about us", "open about us"],
    "contact": ["contact", "contact us", "open contact", "go to contact", "go to contact us", "open contact us"],
    "courses": ["courses", "my courses", "open courses", "go to courses", "go to my courses", "course", "open course"],
    "categories": ["categories", "open categories", "go to categories", "pathways", "explore pathways", "open pathways", "go to pathways"],
    "speech to text": ["speech to text", "speech-to-text", "speech text", "voice to text", "open speech to text", "go to speech to text"],
    "text to speech": ["text to speech", "text-to-speech", "text speech", "read aloud", "open text to speech", "go to text to speech"],
    "sign language": ["sign language", "text to sign", "text to sign language", "sign language recognition", "open sign language", "go to sign language", "open sign language recognition"],
    "login": ["login", "log in", "sign in", "open login", "go to login", "open log in", "open sign in"],
    "logout": ["logout", "log out", "sign out", "open logout", "go to logout", "open log out", "open sign out"],
    "back": ["back", "go back", "previous", "previous page", "history back", "go to previous page"],
    "next": ["next", "next page", "next lesson", "go to next", "go to next page", "go to next lesson"],
    "help": ["help", "commands", "what can i say", "show help", "voice commands"],
    "scroll down": ["scroll down", "go down", "move down"],
    "scroll up": ["scroll up", "go up", "move up"],
    "scroll top": ["scroll top", "scroll to top", "go to top", "top of page"],
    "scroll bottom": ["scroll bottom", "scroll to bottom", "go to bottom", "bottom of page"],
    "read page": ["read page", "read the page", "read content", "read text", "read", "narrate", "start reading"],
    "stop reading": ["stop reading", "stop speaking", "stop narration", "stop", "cancel reading"]
  };

  /* ── State ── */
  let recognition = null;
  let isListening = false;
  let vnButton = null;
  let vnStatus = null;
  let vnOverlay = null;
  let vnTranscript = null;
  let vnToast = null;
  let isSpeakingTTS = false;
  let lastExecutedCommand = "";
  let lastExecutedTime = 0;
  let consecutiveRestartCount = 0;
  let restartTimeout = null;
  const CONFIDENCE_THRESHOLD = 0.4;

  /* ── Levenshtein Distance & Similarity ── */
  function getLevenshteinDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            }
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function getSimilarity(s1, s2) {
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    }
    const distance = getLevenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 0.0;
    return (maxLength - distance) / maxLength;
  }

  function cleanText(t) {
    if (!t) return "";
    return t.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\b2\b/g, "to")
      .replace(/\bto to\b/g, "to")
      .replace(/\bplease\b/g, "")
      .replace(/\bcan you\b/g, "")
      .replace(/\bcould you\b/g, "")
      .replace(/\bnavigate to\b/g, "")
      .replace(/\bgo to\b/g, "")
      .replace(/\bopen\b/g, "")
      .replace(/\btake me to\b/g, "")
      .replace(/\bshow me\b/g, "")
      .trim();
  }

  function matchCommand(rawText) {
    const text = cleanText(rawText);
    if (!text) return null;

    // Check for click command
    const clickMatch = text.match(/^click\s+(.+)/i);
    if (clickMatch) {
      return { type: "click", target: clickMatch[1].trim() };
    }

    let bestKey = null;
    let bestScore = 0;

    // Search in COMMAND_MAP
    for (const [key, variants] of Object.entries(COMMAND_MAP)) {
      for (const variant of variants) {
        const score = getSimilarity(text, variant);
        if (score > bestScore) {
          bestScore = score;
          bestKey = key;
        }
      }
    }

    // Search in NAV_ROUTES
    for (const routeKey of Object.keys(NAV_ROUTES)) {
      const score = getSimilarity(text, routeKey);
      if (score > bestScore) {
        bestScore = score;
        bestKey = routeKey;
      }
    }

    if (bestScore >= 0.75) {
      return { type: "command", key: bestKey, score: bestScore };
    }
    return null;
  }

  /* ── Build floating UI ── */
  function createUI() {
    /* Floating Voice Nav button with label */
    vnButton = document.createElement("button");
    vnButton.id = "voiceNavBtn";
    vnButton.className = "voice-nav-btn";
    vnButton.setAttribute("aria-label", "Start voice navigation");
    vnButton.setAttribute("title", "Voice Navigation (Alt+V)");
    vnButton.innerHTML = '<i class="fa-solid fa-microphone"></i> <span class="voice-nav-btn-label">Voice Nav</span>';
    document.body.appendChild(vnButton);

    /* Detected command toast (always visible when active) */
    vnToast = document.createElement("div");
    vnToast.id = "voiceNavToast";
    vnToast.className = "voice-nav-toast";
    vnToast.innerHTML = '<span class="voice-toast-text" id="voiceToastText"></span>';
    document.body.appendChild(vnToast);

    /* Overlay panel that appears when voice nav is active */
    vnOverlay = document.createElement("div");
    vnOverlay.id = "voiceNavOverlay";
    vnOverlay.className = "voice-nav-overlay";
    vnOverlay.innerHTML =
      '<div class="voice-nav-panel">' +
        '<div class="voice-nav-header">' +
          '<i class="fa-solid fa-microphone voice-nav-pulse-icon"></i>' +
          '<span>🎤 Voice Navigation Active</span>' +
          '<button class="voice-nav-close" id="voiceNavClose" aria-label="Close voice navigation"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="voice-nav-body">' +
          '<p class="voice-nav-status" id="voiceNavStatus">Listening...</p>' +
          '<div class="voice-nav-transcript" id="voiceNavTranscript"></div>' +
          '<div class="voice-nav-commands">' +
            '<h4>Try saying:</h4>' +
            '<div class="voice-nav-cmd-grid">' +
              '<span class="voice-cmd">"Home"</span>' +
              '<span class="voice-cmd">"Courses"</span>' +
              '<span class="voice-cmd">"Contact"</span>' +
              '<span class="voice-cmd">"Back"</span>' +
              '<span class="voice-cmd">"Scroll down"</span>' +
              '<span class="voice-cmd">"Scroll up"</span>' +
              '<span class="voice-cmd">"Read page"</span>' +
              '<span class="voice-cmd">"Stop reading"</span>' +
              '<span class="voice-cmd">"Go to about"</span>' +
              '<span class="voice-cmd">"Go to dashboard"</span>' +
              '<span class="voice-cmd">"Go to speech to text"</span>' +
              '<span class="voice-cmd">"Help"</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(vnOverlay);

    vnStatus = document.getElementById("voiceNavStatus");
    vnTranscript = document.getElementById("voiceNavTranscript");

    /* Event listeners */
    vnButton.addEventListener("click", toggle);
    document.getElementById("voiceNavClose").addEventListener("click", stop);

    /* Keyboard shortcut: Alt + V */
    document.addEventListener("keydown", function (e) {
      if (e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        toggle();
      }
    });
  }

  /* ── Show detected command as toast ── */
  function showToast(message, type) {
    if (!vnToast) return;
    const toastText = document.getElementById("voiceToastText");
    if (toastText) {
      toastText.textContent = message;
    }
    vnToast.className = "voice-nav-toast visible";
    if (type) vnToast.classList.add("toast-" + type);

    /* Auto-hide after 3 seconds */
    setTimeout(function () {
      vnToast.classList.remove("visible");
    }, 3000);
  }

  /* ── Start listening ── */
  function start() {
    if (isListening) return;

    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleOnEnd;

    try {
      recognition.start();
      isListening = true;
      if (vnButton) {
        vnButton.classList.add("active");
        vnButton.innerHTML = '<i class="fa-solid fa-stop"></i> <span class="voice-nav-btn-label">Stop</span>';
      }
      if (vnOverlay) vnOverlay.classList.add("visible");
      updateStatus("Listening...", "listening");

      /* Announce activation */
      speak("Voice navigation activated. Say a command like home, courses, or contact.");
    } catch (e) {
      updateStatus("Could not start microphone: " + e.message, "error");
    }
  }

  /* ── Stop listening ── */
  function stop() {
    isListening = false;
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
    if (recognition) {
      try { recognition.stop(); } catch(e) { /* ignore */ }
      recognition = null;
    }
    if (vnButton) {
      vnButton.classList.remove("active");
      vnButton.innerHTML = '<i class="fa-solid fa-microphone"></i> <span class="voice-nav-btn-label">Voice Nav</span>';
    }
    if (vnOverlay) vnOverlay.classList.remove("visible");
    if (vnTranscript) vnTranscript.textContent = "";

    /* Stop any ongoing speech */
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingTTS = false;
  }

  /* ── Toggle ── */
  function toggle() {
    if (isListening) stop();
    else start();
  }

  /* ── Handle speech results ── */
  function handleResult(event) {
    // Reset consecutive error counts on successful speech input detection
    consecutiveRestartCount = 0;

    // Echo prevention: If TTS is speaking, ignore input unless they try to stop it
    if (isSpeakingTTS) {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.toLowerCase();
        if (text.includes("stop") || text.includes("cancel") || text.includes("pause")) {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          isSpeakingTTS = false;
          updateStatus("Command recognized.", "success");
          if (vnTranscript) vnTranscript.textContent = "";
          return;
        }
      }
      console.log("Ignored feedback speech while TTS is active");
      return;
    }

    let finalText = "";
    let interimText = "";
    let bestMatchProcessed = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        let bestAlternativeMatch = null;
        let bestScore = 0;
        let matchedText = "";

        // Check alternatives for the best match
        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (alternative.confidence > 0 && alternative.confidence < CONFIDENCE_THRESHOLD) {
            continue; // Skip low confidence alternatives
          }
          const match = matchCommand(alternative.transcript);
          if (match && match.score > bestScore) {
            bestScore = match.score;
            bestAlternativeMatch = match;
            matchedText = alternative.transcript;
          }
        }

        if (bestAlternativeMatch) {
          finalText += matchedText;
          if (!bestMatchProcessed) {
            updateStatus("Processing...", "listening");
            const success = processCommand(matchedText);
            if (success) {
              bestMatchProcessed = true;
            }
          }
        } else {
          // Fallback to primary result
          const primaryText = result[0].transcript;
          finalText += primaryText;
          if (!bestMatchProcessed) {
            updateStatus("Processing...", "listening");
            const success = processCommand(primaryText);
            if (!success) {
              updateStatus("Command not recognized.", "error");
              // Reset status after a delay
              setTimeout(function () {
                if (isListening && !isSpeakingTTS) {
                  updateStatus("Listening...", "listening");
                }
              }, 2500);
            } else {
              bestMatchProcessed = true;
            }
          }
        }
      } else {
        interimText += result[0].transcript;
      }
    }

    /* Show what user is saying in real-time */
    if (vnTranscript) {
      vnTranscript.innerHTML =
        (finalText ? '<span class="vn-final">' + finalText + '</span>' : '') +
        (interimText ? '<span class="vn-interim">' + interimText + '</span>' : '');
    }
  }

  /* ── Process the recognized command ── */
  function processCommand(rawText) {
    const match = matchCommand(rawText);
    if (!match) {
      return false;
    }

    if (match.type === "click") {
      showToast('🎤 Click "' + match.target + '"', "detected");
      clickLinkByText(match.target);
      return true;
    }

    const commandKey = match.key;

    // Cooldown check for double execution prevention
    const now = Date.now();
    if (commandKey === lastExecutedCommand && (now - lastExecutedTime < 2500)) {
      console.log("Ignored duplicate execution:", commandKey);
      return true;
    }
    lastExecutedCommand = commandKey;
    lastExecutedTime = now;

    showToast('🎤 "' + rawText + '"', "detected");

    // Clear transcript preview after execution
    setTimeout(function() {
      if (vnTranscript) vnTranscript.textContent = "";
    }, 2000);

    /* ── Execute Navigations/Actions ── */
    if (commandKey === "home") {
      navigateTo("/home", "home");
      return true;
    }
    if (commandKey === "about") {
      navigateTo("/home/about", "about");
      return true;
    }
    if (commandKey === "contact") {
      const contactSection = document.getElementById("contact") || document.querySelector(".site-footer");
      if (contactSection && window.location.pathname === "/home") {
        contactSection.scrollIntoView({ behavior: "smooth" });
        updateStatus("Command recognized.", "success");
        speak("Scrolling to contact section");
      } else {
        navigateTo("/home/contact", "contact");
      }
      return true;
    }
    if (commandKey === "courses" || commandKey === "dashboard") {
      navigateTo("/dashboard", "courses");
      return true;
    }
    if (commandKey === "categories") {
      const categoriesSection = document.getElementById("categories");
      if (categoriesSection && window.location.pathname === "/home") {
        categoriesSection.scrollIntoView({ behavior: "smooth" });
        updateStatus("Command recognized.", "success");
        speak("Opening categories");
      } else {
        navigateTo("/home#categories", "categories");
      }
      return true;
    }
    if (commandKey === "speech to text") {
      navigateTo("/tools/speech-to-text", "speech to text");
      return true;
    }
    if (commandKey === "text to speech") {
      navigateTo("/tools/text-to-speech", "text to speech");
      return true;
    }
    if (commandKey === "sign language" || commandKey === "text to sign" || commandKey === "text to sign language") {
      navigateTo("/tools/text-to-sign", "sign language");
      return true;
    }
    if (commandKey === "login") {
      navigateTo("/home/login", "login");
      return true;
    }
    if (commandKey === "logout") {
      navigateTo("/home/logout", "logout");
      return true;
    }
    if (commandKey === "back") {
      updateStatus("Command recognized.", "success");
      speak("Going back");
      setTimeout(function () { window.history.back(); }, 600);
      return true;
    }
    if (commandKey === "next") {
      const success = handleNextCommand();
      if (success) {
        updateStatus("Command recognized.", "success");
      } else {
        updateStatus("Command not recognized.", "error");
        speak("Next navigation is not available in this context.");
        setTimeout(function () {
          if (isListening && !isSpeakingTTS) {
            updateStatus("Listening...", "listening");
          }
        }, 3000);
      }
      return true;
    }
    if (commandKey === "help") {
      updateStatus("Command recognized.", "success");
      speak("You can say: home, courses, contact, back, next, scroll down, read page, stop, or help.");
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 5000);
      return true;
    }
    if (commandKey === "scroll down") {
      window.scrollBy({ top: 500, behavior: "smooth" });
      updateStatus("Command recognized.", "success");
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 2000);
      return true;
    }
    if (commandKey === "scroll up") {
      window.scrollBy({ top: -500, behavior: "smooth" });
      updateStatus("Command recognized.", "success");
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 2000);
      return true;
    }
    if (commandKey === "scroll top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      updateStatus("Command recognized.", "success");
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 2000);
      return true;
    }
    if (commandKey === "scroll bottom") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      updateStatus("Command recognized.", "success");
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 2000);
      return true;
    }
    if (commandKey === "read page") {
      readPage();
      updateStatus("Command recognized.", "success");
      return true;
    }
    if (commandKey === "stop reading") {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingTTS = false;
      updateStatus("Command recognized.", "success");
      setTimeout(function () {
        if (isListening) {
          updateStatus("Listening...", "listening");
        }
      }, 2000);
      return true;
    }

    // Direct nav routes lookup
    if (NAV_ROUTES[commandKey]) {
      navigateTo(NAV_ROUTES[commandKey], commandKey);
      return true;
    }

    return false;
  }

  /* ── Navigate to a route ── */
  function navigateTo(url, label) {
    updateStatus("Command recognized.", "success");
    showToast("➜ Going to " + label, "navigate");
    speak("Going to " + label);
    /* Small delay so user hears the announcement */
    setTimeout(function () {
      window.location.href = url;
    }, 800);
  }

  /* ── Next section/lesson handler ── */
  function handleNextCommand() {
    // 1. Check if on a lesson page with navigation controls
    const lessonNavNext = document.querySelector(".lesson-nav a.primary") || 
                          Array.from(document.querySelectorAll(".lesson-nav a, .lesson-nav-btn")).find(el => el.textContent.toLowerCase().includes("next") || el.textContent.toLowerCase().includes("back to course"));
    if (lessonNavNext) {
      speak("Going to next");
      setTimeout(() => { lessonNavNext.click(); }, 800);
      return true;
    }

    // 2. Check if a homepage/carousel next button exists
    const carouselNext = document.getElementById("carouselNext");
    if (carouselNext && window.getComputedStyle(carouselNext).display !== "none") {
      carouselNext.click();
      return true;
    }

    // 3. Fallback: search for any visible button/link on the page containing "next"
    const allElements = Array.from(document.querySelectorAll("a, button, [role='button']"));
    const nextBtn = allElements.find(el => {
      if (el.offsetParent === null) return false; // hidden
      const text = el.textContent.trim().toLowerCase();
      return text === "next" || text.includes("next page") || text.includes("next slide") || text.includes("continue");
    });
    if (nextBtn) {
      speak("Next");
      setTimeout(() => { nextBtn.click(); }, 800);
      return true;
    }

    return false;
  }

  /* ── Read main page content aloud ── */
  function readPage() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const content = document.querySelector(".page-content") || document.querySelector("main") || document.body;
    if (!content) return;

    const text = content.innerText.substring(0, 5000);
    speak(text);
    updateStatus("Command recognized.", "success");
  }

  /* ── Click a link by its visible text ── */
  function clickLinkByText(target) {
    const links = document.querySelectorAll("a, button");
    const targetLower = target.toLowerCase();
    let found = false;

    for (let i = 0; i < links.length; i++) {
      const linkText = (links[i].textContent || "").trim().toLowerCase();
      if (linkText.includes(targetLower) || targetLower.includes(linkText)) {
        updateStatus("Command recognized.", "success");
        speak("Clicking " + links[i].textContent.trim());
        setTimeout(function () { links[i].click(); }, 600);
        found = true;
        break;
      }
    }

    if (!found) {
      updateStatus("Command not recognized.", "error");
      speak("Sorry, I couldn't find a link called " + target);
      setTimeout(function () {
        if (isListening && !isSpeakingTTS) {
          updateStatus("Listening...", "listening");
        }
      }, 3000);
    }
  }

  /* ── Speak text (TTS helper) ── */
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = function() {
      isSpeakingTTS = true;
    };
    utterance.onend = function() {
      setTimeout(() => {
        isSpeakingTTS = false;
      }, 400);
    };
    utterance.onerror = function() {
      isSpeakingTTS = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  /* ── Update status display ── */
  function updateStatus(message, type) {
    if (!vnStatus) return;
    vnStatus.textContent = message;
    vnStatus.className = "voice-nav-status";
    if (type) vnStatus.classList.add("vn-" + type);
  }

  /* ── Error handler ── */
  function handleError(event) {
    console.warn("Voice nav error:", event.error);

    if (event.error === "no-speech") {
      updateStatus("Listening...", "listening");
      return;
    }
    if (event.error === "aborted") {
      return;
    }
    
    if (event.error === "not-allowed" || event.error === "permission-denied") {
      updateStatus("Microphone permission denied.", "error");
      speak("Microphone permission denied.");
      stop();
    } else if (event.error === "network") {
      updateStatus("Error: network failure. Retrying...", "error");
    } else if (event.error === "audio-capture") {
      updateStatus("Error: microphone interruption. Retrying...", "error");
    } else {
      updateStatus("Error: " + event.error + ". Retrying...", "error");
    }
  }

  /* ── Restart logic onEnd ── */
  function handleOnEnd() {
    if (!isListening) return;

    if (consecutiveRestartCount >= 5) {
      console.warn("Max consecutive restarts reached. Stopping Speech Recognition.");
      updateStatus("Error: recognition stopped.", "error");
      stop();
      return;
    }

    const backoffDelay = Math.min(500 * Math.pow(2, consecutiveRestartCount), 4000);
    consecutiveRestartCount++;

    restartTimeout = setTimeout(() => {
      if (isListening) {
        try {
          recognition.start();
        } catch(e) {
          console.warn("Could not restart SpeechRecognition:", e);
        }
      }
    }, backoffDelay);
  }

  /* ── Initialize on DOM ready ── */
  document.addEventListener("DOMContentLoaded", createUI);

  /* Expose for external use */
  window.SensiQVoiceNav = { start: start, stop: stop, toggle: toggle };
})();

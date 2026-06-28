/* ================================================================
   SensiQ — Speech-to-Text Engine (Hybrid: Web Speech + Gemini AI Fallback)
   
   Provides:
   - Continuously listening speech recognition in real-time.
   - Punctuation & capitalization handling.
   - Fallback to MediaRecorder + Gemini AI when Web Speech is unsupported or blocked.
   - Robust error handling and automatic recovery loops.
   ================================================================ */

(function () {
  "use strict";

  /* ── Feature detection ─────────────────────────────────────── */
  const hasWebSpeech = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasMediaRecorder = !!(navigator.mediaDevices && window.MediaRecorder);

  if (!hasWebSpeech && !hasMediaRecorder) {
    window.SensiQSTT = null;
    return;
  }

  /* ── Unified State ─────────────────────────────────────────── */
  let activeEngine   = null; // "web" or "media"
  let isListening    = false;
  let currentDisplay = null;
  let onStatus       = null;

  // Transcript accumulators
  let globalFinalTranscript  = "";
  let sessionFinalTranscript = "";

  // Web Speech API references
  let recognition         = null;
  let autoRestart         = true;
  let consecutiveRestarts = 0;
  let lastRestartTime     = 0;

  // MediaRecorder references
  let mediaRecorder       = null;
  let audioChunks         = [];
  let currentStream       = null;
  let mimeType            = "";

  /* ── General Helpers ────────────────────────────────────────── */
  function notify(msg, isErr) {
    if (typeof onStatus === "function") {
      onStatus(msg, !!isErr);
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Cleans spacing, capitalizes sentence beginnings, and formats "I" pronouns.
   */
  function formatTranscript(text) {
    if (!text) return "";
    
    // Normalize spaces
    text = text.replace(/\s+/g, " ").trim();
    
    // Capitalize first letter of the text
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Capitalize after sentence boundary punctuation (. ! ?)
    text = text.replace(/([.!?]\s+)([a-z])/g, function (match, separator, letter) {
      return separator + letter.toUpperCase();
    });
    
    // Capitalize the pronoun 'I' and its common contractions
    text = text.replace(/\bi\b/g, "I");
    text = text.replace(/\bi'm\b/g, "I'm");
    text = text.replace(/\bi'll\b/g, "I'll");
    text = text.replace(/\bi'd\b/g, "I'd");
    text = text.replace(/\bi've\b/g, "I've");
    
    return text;
  }

  function paint(interimText) {
    if (!currentDisplay) return;

    let totalFinal = globalFinalTranscript;
    if (sessionFinalTranscript) {
      totalFinal += (totalFinal ? " " : "") + sessionFinalTranscript;
    }
    totalFinal = formatTranscript(totalFinal);

    let interimHTML = "";
    if (interimText) {
      interimHTML = '<span class="stt-interim" style="color:var(--text-soft);opacity:0.75;font-style:italic"> ' + esc(interimText) + '</span>';
    }

    currentDisplay.innerHTML = '<span class="stt-final" style="color:var(--text);white-space:pre-wrap;line-height:1.7">' + esc(totalFinal) + '</span>' + interimHTML;
  }

  function releaseMic() {
    if (currentStream) {
      currentStream.getTracks().forEach(function (t) { t.stop(); });
      currentStream = null;
    }
  }

  /* ── ENGINE 1: Web Speech API (Real-Time & Continuous) ────── */
  function startWebSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      notify("🎙️ Listening continuously in real time… Speak naturally.", false);
      consecutiveRestarts = 0;
    };

    recognition.onresult = function (event) {
      let currentSessionFinal = "";
      let currentInterim      = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const alt = event.results[i][0];
        if (event.results[i].isFinal) {
          currentSessionFinal += (currentSessionFinal ? " " : "") + alt.transcript;
        } else {
          currentInterim += alt.transcript;
        }
      }

      sessionFinalTranscript = currentSessionFinal;
      paint(currentInterim);
    };

    recognition.onerror = function (event) {
      const error = event.error;
      console.warn("[STT Web Speech Error]", error);

      if (error === "no-speech") {
        // Continuous mode automatically restarts if silent, so ignore here
        return;
      }

      if (error === "not-allowed" || error === "service-not-allowed") {
        isListening = false;
        autoRestart = false;
        notify("mic-denied", true);
        stop();
        return;
      }

      if (error === "network") {
        // If network error happens persistently, try to transition to MediaRecorder
        console.warn("Web Speech network error. Falling back to Gemini server engine.");
        fallbackToMediaRecorder();
        return;
      }

      notify("⚠️ Speech recognition warning: " + error, false);
    };

    recognition.onend = function () {
      // Cleanly merge session transcript on restart boundary
      if (sessionFinalTranscript) {
        globalFinalTranscript += (globalFinalTranscript ? " " : "") + sessionFinalTranscript;
        sessionFinalTranscript = "";
      }

      if (isListening && autoRestart) {
        // Check for rapid loop restarts
        const now = Date.now();
        if (now - lastRestartTime < 1000) {
          consecutiveRestarts++;
        } else {
          consecutiveRestarts = 1;
        }
        lastRestartTime = now;

        if (consecutiveRestarts > 5) {
          console.warn("Too many rapid restarts. Falling back to Gemini server-assisted engine.");
          fallbackToMediaRecorder();
          return;
        }

        try {
          recognition.start();
        } catch (e) {
          console.error("Error restarting SpeechRecognition:", e);
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start SpeechRecognition:", e);
      fallbackToMediaRecorder();
    }
  }

  function fallbackToMediaRecorder() {
    if (recognition) {
      try { recognition.stop(); } catch(e) {}
      recognition = null;
    }
    
    if (hasMediaRecorder) {
      console.log("Switching engine to MediaRecorder + Gemini API fallback.");
      activeEngine = "media";
      
      // Request mic again to obtain a fresh audio stream
      navigator.mediaDevices
        .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
        .then(function (stream) {
          currentStream = stream;
          startMediaRecorder();
        })
        .catch(function (err) {
          isListening = false;
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            notify("mic-denied", true);
          } else {
            notify("❌ Fallback microphone error: " + err.message, true);
          }
        });
    } else {
      notify("❌ Speech recognition is not supported in this browser.", true);
    }
  }

  /* ── ENGINE 2: MediaRecorder + Gemini API (Fallback / Firefox) ── */
  function startMediaRecorder() {
    mimeType = getBestMimeType();
    const options = mimeType ? { mimeType: mimeType } : {};
    try {
      mediaRecorder = new MediaRecorder(currentStream, options);
    } catch (e) {
      mediaRecorder = new MediaRecorder(currentStream);
    }

    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", function (e) {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    });

    mediaRecorder.addEventListener("stop", function () {
      releaseMic();
      if (!isListening) {
        const blob = new Blob(audioChunks, { type: mimeType || "audio/webm" });
        transcribeBlob(blob);
      }
    });

    mediaRecorder.addEventListener("error", function (e) {
      notify("❌ Recording error: " + e.error, true);
      isListening = false;
      releaseMic();
    });

    mediaRecorder.start();
    notify("🎙️ Recording audio (Gemini fallback mode)… Click Stop to transcribe.", false);
  }

  function getBestMimeType() {
    const formats = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/mp4",
    ];
    for (let i = 0; i < formats.length; i++) {
      if (MediaRecorder.isTypeSupported(formats[i])) return formats[i];
    }
    return "";
  }

  function transcribeBlob(blob) {
    if (!blob || blob.size < 500) {
      notify("⚠️ Recording too short — please speak for at least 1 second.", true);
      return;
    }

    notify("⏳ Transcribing speech using Gemini AI…", false);

    const reader = new FileReader();
    reader.onloadend = function () {
      const base64 = reader.result.split(",")[1];
      const mime   = blob.type.split(";")[0] || "audio/webm";

      fetch("/api/stt", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ audio: base64, mimeType: mime }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success && data.transcript) {
            globalFinalTranscript += (globalFinalTranscript ? " " : "") + data.transcript;
            paint("");
            notify("✅ Done. Click mic again to add more speech.", false);
          } else {
            notify("⚠️ " + (data.error || "No speech detected. Try again."), true);
          }
        })
        .catch(function (err) {
          notify("❌ Transcription failed: " + err.message, true);
        });
    };
    reader.readAsDataURL(blob);
  }

  /* ── Public API ─────────────────────────────────────────────── */
  function start(displayEl, statusCallback) {
    if (isListening) stop();

    currentDisplay      = displayEl || null;
    onStatus            = (typeof statusCallback === "function") ? statusCallback : null;
    isListening         = true;
    autoRestart         = true;
    consecutiveRestarts = 0;

    notify("🔓 Requesting microphone access…", false);

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
      .then(function (stream) {
        currentStream = stream;

        if (hasWebSpeech) {
          // Release raw stream handle as Web Speech API manages its own device connection
          releaseMic();
          activeEngine = "web";
          startWebSpeech();
        } else if (hasMediaRecorder) {
          activeEngine = "media";
          startMediaRecorder();
        } else {
          releaseMic();
          notify("❌ Speech recognition is not supported in this browser.", true);
        }
      })
      .catch(function (err) {
        isListening = false;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          notify("mic-denied", true);
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          notify("mic-missing", true);
        } else {
          notify("❌ Microphone error: " + err.message, true);
        }
      });
  }

  function stop() {
    if (!isListening) return;
    isListening = false;
    autoRestart = false;

    if (activeEngine === "web") {
      if (recognition) {
        try { recognition.stop(); } catch(e) {}
        recognition = null;
      }
      
      if (sessionFinalTranscript) {
        globalFinalTranscript += (globalFinalTranscript ? " " : "") + sessionFinalTranscript;
        sessionFinalTranscript = "";
      }
      
      paint("");
      notify("✅ Done. Click mic again to add more speech.", false);
    } else if (activeEngine === "media") {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      } else {
        releaseMic();
      }
    }
  }

  function getTranscript() {
    let total = globalFinalTranscript;
    if (sessionFinalTranscript) {
      total += (total ? " " : "") + sessionFinalTranscript;
    }
    return formatTranscript(total);
  }

  function resetTranscript() {
    globalFinalTranscript  = "";
    sessionFinalTranscript = "";
    if (currentDisplay) {
      currentDisplay.innerHTML = "";
    }
  }

  window.SensiQSTT = {
    start:           start,
    stop:            stop,
    getTranscript:   getTranscript,
    resetTranscript: resetTranscript,
  };

})();

/* ================================================================
   SensiQ — Accessibility Controller
   Manages auto-narration, read-page, and keyboard shortcuts
   ================================================================ */

(function () {
  "use strict";

  const body = document.body;
  const narPref = body.dataset.autoNarrate === "true";

  /* ---- Read Page: extract important content ---- */
  function readPageContent() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const mainContent = document.querySelector(".page-content");
    if (!mainContent) return;

    const elements = mainContent.querySelectorAll("h1, h2, h3, p");
    var textParts = [];
    var seenText = {};

    elements.forEach(function (el) {
      var text = el.innerText.trim();
      if (text && !seenText[text] && text.length > 2) {
        seenText[text] = true;
        textParts.push(text);
      }
    });

    var fullText = textParts.join(". ").substring(0, 3000);

    if (fullText) {
      var narBtn = document.getElementById("a11yNarrate");
      var utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.onend = function () {
        if (narBtn) narBtn.classList.remove("active");
      };
      window.speechSynthesis.speak(utterance);
      if (narBtn) narBtn.classList.add("active");
    }
  }

  /* ---- Toolbar button handlers ---- */
  document.addEventListener("DOMContentLoaded", function () {
    const narBtn = document.getElementById("a11yNarrate");

    if (narBtn) {
      narBtn.addEventListener("click", function () {
        if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          narBtn.classList.remove("active");
          return;
        }
        readPageContent();
      });
    }

    /* ---- Smart Voice Mode: auto-read on page load ---- */
    var voiceMode = localStorage.getItem("sensiq_voice_mode") === "true";
    if (voiceMode && "speechSynthesis" in window) {
      setTimeout(function () {
        var pageTitle = body.dataset.pageTitle || "SensiQ";
        var utter = new SpeechSynthesisUtterance("You are now on the " + pageTitle + " page.");
        utter.lang = "en-IN";
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }, 800);

      setTimeout(function () {
        if (window.SensiQVoiceNav && window.SensiQVoiceNav.start) {
          window.SensiQVoiceNav.start();
        }
      }, 2500);
    }

    /* ---- Keyboard shortcuts ---- */
    document.addEventListener("keydown", function (e) {
      /* Escape stops speech */
      if (e.key === "Escape" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        if (narBtn) narBtn.classList.remove("active");
      }
      /* Alt + N = narrate / read page */
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        if (narBtn) narBtn.click();
      }
    });
  });

  /* Expose for external use */
  window.SensiQA11y = {
    readPage: readPageContent,
  };
})();

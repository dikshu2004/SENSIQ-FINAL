/* ================================================================
   SensiQ — Text-to-Speech Engine (Web SpeechSynthesis API)
   Exposes window.SensiQTTS with speak(), pause(), resume(), stop()
   ================================================================ */

(function () {
  "use strict";

  if (!("speechSynthesis" in window)) {
    window.SensiQTTS = {
      speak: function () {},
      pause: function () {},
      resume: function () {},
      stop: function () {},
    };
    return;
  }

  function speak(text, options) {
    options = options || {};
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || "en-IN";
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    
    if (options.voice) {
      utterance.voice = options.voice;
    }

    if (options.onEnd) {
      utterance.onend = options.onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  function resume() {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  function stop() {
    window.speechSynthesis.cancel();
  }

  window.SensiQTTS = {
    speak: speak,
    pause: pause,
    resume: resume,
    stop: stop,
  };
})();

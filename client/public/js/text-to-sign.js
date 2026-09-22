/* ================================================================
   SensiQ — Text-to-Sign Language (ISL Fingerspelling)
   Full ISL implementation with SVG hand signs for each letter.
   Exposes window.SensiQT2S with render(), animate(), and ISL_MAP.
   ================================================================ */

(function () {
  "use strict";

  /*
   * ISL Fingerspelling mapping — SVG hand sign + description for each letter.
   * Each letter gets a unique, visually distinct hand shape rendered as inline SVG.
   */

  function handSVG(paths, vb) {
    vb = vb || "0 0 64 64";
    return '<svg viewBox="' + vb + '" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--blue)">' + paths + '</svg>';
  }

  var ISL_MAP = {
    a: {
      sign: handSVG('<rect x="20" y="16" width="24" height="32" rx="8"/><circle cx="18" cy="28" r="4" fill="currentColor"/>'),
      desc: "Closed fist, thumb at side"
    },
    b: {
      sign: handSVG('<rect x="18" y="22" width="28" height="26" rx="6"/><line x1="22" y1="22" x2="22" y2="8"/><line x1="28" y1="22" x2="28" y2="6"/><line x1="34" y1="22" x2="34" y2="8"/><line x1="40" y1="22" x2="40" y2="10"/>'),
      desc: "Open palm, fingers together pointing up"
    },
    c: {
      sign: handSVG('<path d="M38 18 C28 12, 18 20, 18 32 C18 44, 28 50, 38 46"/>'),
      desc: "Curved hand forming C-shape"
    },
    d: {
      sign: handSVG('<rect x="20" y="26" width="24" height="22" rx="8"/><line x1="28" y1="26" x2="28" y2="8"/><circle cx="28" cy="6" r="2" fill="currentColor"/>'),
      desc: "Index finger up, others curled into fist"
    },
    e: {
      sign: handSVG('<rect x="18" y="20" width="28" height="28" rx="10"/><path d="M22 20 C22 16, 26 16, 26 20"/><path d="M28 20 C28 16, 32 16, 32 20"/><path d="M34 20 C34 16, 38 16, 38 20"/><path d="M40 20 C40 16, 44 16, 44 20"/>'),
      desc: "Closed fist, fingers bent over"
    },
    f: {
      sign: handSVG('<circle cx="24" cy="36" r="8"/><line x1="28" y1="28" x2="28" y2="10"/><line x1="34" y1="28" x2="34" y2="8"/><line x1="40" y1="28" x2="40" y2="10"/>'),
      desc: "Thumb and index form circle, other fingers up"
    },
    g: {
      sign: handSVG('<rect x="24" y="24" width="20" height="20" rx="6"/><line x1="24" y1="32" x2="8" y2="32"/><circle cx="6" cy="32" r="2" fill="currentColor"/>'),
      desc: "Index finger pointing sideways, thumb out"
    },
    h: {
      sign: handSVG('<rect x="22" y="28" width="22" height="20" rx="6"/><line x1="26" y1="28" x2="14" y2="14"/><line x1="34" y1="28" x2="22" y2="14"/>'),
      desc: "Index and middle finger together, pointing"
    },
    i: {
      sign: handSVG('<rect x="18" y="20" width="24" height="28" rx="8"/><line x1="42" y1="20" x2="42" y2="8"/>'),
      desc: "Pinky finger extended, fist closed"
    },
    j: {
      sign: handSVG('<rect x="18" y="20" width="24" height="28" rx="8"/><path d="M42 8 L42 16 Q42 20 38 22" fill="none"/><circle cx="42" cy="6" r="2" fill="currentColor"/>'),
      desc: "Pinky extended, trace J motion downward"
    },
    k: {
      sign: handSVG('<rect x="22" y="32" width="22" height="18" rx="6"/><line x1="26" y1="32" x2="26" y2="10"/><line x1="38" y1="32" x2="38" y2="12"/><line x1="22" y1="38" x2="14" y2="30"/>'),
      desc: "Index and middle up, thumb between them"
    },
    l: {
      sign: handSVG('<rect x="24" y="28" width="20" height="22" rx="6"/><line x1="28" y1="28" x2="28" y2="8"/><line x1="24" y1="36" x2="10" y2="36"/>'),
      desc: "L-shape: thumb out, index pointing up"
    },
    m: {
      sign: handSVG('<rect x="16" y="24" width="32" height="24" rx="8"/><path d="M20 24 C20 18, 24 18, 24 24"/><path d="M28 24 C28 18, 32 18, 32 24"/><path d="M36 24 C36 18, 40 18, 40 24"/><circle cx="16" cy="36" r="3" fill="currentColor"/>'),
      desc: "Three fingers folded over thumb"
    },
    n: {
      sign: handSVG('<rect x="18" y="24" width="28" height="24" rx="8"/><path d="M24 24 C24 18, 28 18, 28 24"/><path d="M32 24 C32 18, 36 18, 36 24"/><circle cx="18" cy="36" r="3" fill="currentColor"/>'),
      desc: "Two fingers folded over thumb"
    },
    o: {
      sign: handSVG('<ellipse cx="32" cy="32" rx="14" ry="16"/>'),
      desc: "Fingers and thumb form O-shape"
    },
    p: {
      sign: handSVG('<rect x="22" y="28" width="22" height="18" rx="6"/><line x1="26" y1="28" x2="26" y2="46"/><line x1="38" y1="28" x2="38" y2="48"/><line x1="22" y1="34" x2="14" y2="26"/>'),
      desc: "K-shape rotated pointing downward"
    },
    q: {
      sign: handSVG('<rect x="22" y="22" width="22" height="18" rx="6"/><line x1="28" y1="40" x2="28" y2="56"/><line x1="22" y1="30" x2="10" y2="42"/>'),
      desc: "G-shape rotated pointing downward"
    },
    r: {
      sign: handSVG('<rect x="22" y="30" width="22" height="20" rx="6"/><line x1="28" y1="30" x2="34" y2="8"/><line x1="36" y1="30" x2="30" y2="8"/>'),
      desc: "Index and middle fingers crossed"
    },
    s: {
      sign: handSVG('<rect x="18" y="18" width="28" height="30" rx="10"/><circle cx="32" cy="18" r="3" fill="currentColor"/>'),
      desc: "Fist with thumb across front of fingers"
    },
    t: {
      sign: handSVG('<rect x="18" y="18" width="28" height="30" rx="10"/><circle cx="26" cy="22" r="3" fill="currentColor"/>'),
      desc: "Thumb tucked between index and middle finger"
    },
    u: {
      sign: handSVG('<rect x="22" y="30" width="22" height="20" rx="6"/><line x1="28" y1="30" x2="28" y2="8"/><line x1="36" y1="30" x2="36" y2="8"/>'),
      desc: "Index and middle finger together, pointing up"
    },
    v: {
      sign: handSVG('<rect x="22" y="30" width="22" height="20" rx="6"/><line x1="26" y1="30" x2="20" y2="8"/><line x1="40" y1="30" x2="46" y2="8"/>'),
      desc: "Index and middle spread apart (peace sign)"
    },
    w: {
      sign: handSVG('<rect x="20" y="32" width="26" height="18" rx="6"/><line x1="24" y1="32" x2="20" y2="10"/><line x1="32" y1="32" x2="32" y2="8"/><line x1="40" y1="32" x2="44" y2="10"/>'),
      desc: "Three fingers spread apart, pointing up"
    },
    x: {
      sign: handSVG('<rect x="22" y="26" width="22" height="24" rx="8"/><path d="M28 26 C28 16, 36 12, 36 18 L36 26"/>'),
      desc: "Index finger hooked/bent"
    },
    y: {
      sign: handSVG('<rect x="22" y="22" width="22" height="24" rx="8"/><line x1="22" y1="28" x2="10" y2="18"/><line x1="44" y1="22" x2="52" y2="10"/>'),
      desc: "Thumb and pinky extended (shaka sign)"
    },
    z: {
      sign: handSVG('<rect x="22" y="30" width="22" height="20" rx="6"/><line x1="28" y1="30" x2="28" y2="14"/><path d="M20 14 L36 14 L20 26 L36 26" fill="none" stroke="var(--gold)" stroke-width="2"/>'),
      desc: "Index finger traces Z pattern in air"
    }
  };

  /* Render text as sign letters instantly */
  function render(text, container) {
    container.innerHTML = "";
    var chars = text.toLowerCase().split("");
    chars.forEach(function (ch) {
      if (ch === " ") {
        var spacer = document.createElement("div");
        spacer.className = "sign-spacer";
        spacer.style.width = "20px";
        spacer.style.height = "10px";
        container.appendChild(spacer);
        return;
      }
      var mapping = ISL_MAP[ch];
      if (!mapping) return;

      var card = document.createElement("div");
      card.className = "sign-letter visible";
      card.innerHTML =
        '<span class="sign-letter-img">' + mapping.sign + '</span>' +
        '<span class="sign-letter-char">' + ch.toUpperCase() + '</span>';
      card.title = mapping.desc;
      card.setAttribute("aria-label", ch.toUpperCase() + ": " + mapping.desc);
      container.appendChild(card);
    });
  }

  /* Animate letters one by one with delay */
  function animate(text, container, speed) {
    speed = speed || 500;
    container.innerHTML = "";
    var chars = text.toLowerCase().split("");
    var elements = [];

    /* Create all cards (hidden) */
    chars.forEach(function (ch) {
      if (ch === " ") {
        var spacer = document.createElement("div");
        spacer.className = "sign-spacer";
        spacer.style.width = "20px";
        spacer.style.height = "10px";
        container.appendChild(spacer);
        elements.push(null);
        return;
      }
      var mapping = ISL_MAP[ch];
      if (!mapping) {
        elements.push(null);
        return;
      }

      var card = document.createElement("div");
      card.className = "sign-letter";
      card.innerHTML =
        '<span class="sign-letter-img">' + mapping.sign + '</span>' +
        '<span class="sign-letter-char">' + ch.toUpperCase() + '</span>';
      card.title = mapping.desc;
      card.setAttribute("aria-label", ch.toUpperCase() + ": " + mapping.desc);
      container.appendChild(card);
      elements.push(card);
    });

    /* Announce to screen readers */
    if ("speechSynthesis" in window && localStorage.getItem("sensiq_voice_mode") === "true") {
      var utter = new SpeechSynthesisUtterance("Spelling: " + text.split("").join(", "));
      utter.rate = 0.8;
      utter.lang = "en-IN";
      window.speechSynthesis.speak(utter);
    }

    /* Animate sequentially */
    var activeIndex = -1;
    elements.forEach(function (el, i) {
      if (!el) return;
      setTimeout(function () {
        if (activeIndex >= 0 && elements[activeIndex]) {
          elements[activeIndex].classList.remove("active");
        }
        el.classList.add("visible", "active");
        activeIndex = i;

        /* Remove active from last element */
        if (i === elements.length - 1 || elements.slice(i + 1).every(function(e){ return !e; })) {
          setTimeout(function () {
            el.classList.remove("active");
          }, speed);
        }
      }, i * speed);
    });
  }

  /* Export and record sign language video */
  function exportVideo(text, canvasElement, speed, onProgress, onComplete, onError) {
    if (!canvasElement) {
      if (onError) onError(new Error("Canvas element is required for exporting."));
      return;
    }
    
    speed = speed || 500;
    var ctx = canvasElement.getContext("2d");
    var chars = text.toLowerCase().split("");
    
    // Choose MIME type
    var mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
    }
    
    var chunks = [];
    var stream = canvasElement.captureStream(15); // 15 FPS
    var recorder;
    
    try {
      recorder = new MediaRecorder(stream, { mimeType: mimeType });
    } catch (e) {
      if (onError) onError(e);
      return;
    }
    
    recorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    function drawFrame(char, mapping) {
      return new Promise(function(resolve) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        
        if (char === " ") {
          ctx.fillStyle = "#6c757d";
          ctx.font = "500 24px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("[ SPACE ]", canvasElement.width / 2, canvasElement.height / 2 + 10);
          resolve();
          return;
        }
        
        if (!mapping) {
          resolve();
          return;
        }
        
        // Clean and prepare SVG string for drawing
        var styledSvg = mapping.sign
          .replace(/currentColor/g, "#0d6efd")
          .replace('width="48"', 'width="220"')
          .replace('height="48"', 'height="220"')
          .replace('style="color:var(--blue)"', 'style="color:#0d6efd;"')
          .replace('stroke-width="2.5"', 'stroke-width="3"');
        
        var img = new Image();
        var svgBlob = new Blob([styledSvg], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
          ctx.drawImage(img, (canvasElement.width - 220) / 2, (canvasElement.height - 220) / 2 - 20, 220, 220);
          
          ctx.fillStyle = "#07111f";
          ctx.font = "bold 42px 'Outfit', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(char.toUpperCase(), canvasElement.width / 2, canvasElement.height - 40);
          
          URL.revokeObjectURL(url);
          resolve();
        };
        
        img.onerror = function(err) {
          console.error("SVG drawing error", err);
          URL.revokeObjectURL(url);
          resolve();
        };
        
        img.src = url;
      });
    }
    
    recorder.onstart = async function() {
      try {
        for (var i = 0; i < chars.length; i++) {
          var char = chars[i];
          var mapping = ISL_MAP[char];
          
          if (onProgress) {
            onProgress(i + 1, chars.length, char);
          }
          
          await drawFrame(char, mapping);
          await new Promise(function(r) { setTimeout(r, speed); });
        }
        
        // Small buffer frame at the end
        await new Promise(function(r) { setTimeout(r, 500); });
        recorder.stop();
      } catch (err) {
        if (onError) onError(err);
        recorder.stop();
      }
    };
    
    recorder.onstop = function() {
      var blob = new Blob(chunks, { type: "video/webm" });
      var videoUrl = URL.createObjectURL(blob);
      if (onComplete) onComplete(videoUrl);
    };
    
    recorder.start();
  }

  /* Expose API */
  window.SensiQT2S = { render: render, animate: animate, exportVideo: exportVideo, ISL_MAP: ISL_MAP };
})();

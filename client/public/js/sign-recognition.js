/* ================================================================
   SensiQ — Webcam Gesture Navigation Controls
   Uses MediaPipe Hands to capture landmarks and execute site navigation.
   ================================================================ */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Only run if we are on a page containing the webcam elements
    const videoElement = document.getElementById("webcamVideo");
    const canvasElement = document.getElementById("webcamCanvas");
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    const webcamStatus = document.getElementById("webcamStatus");
    const webcamStatusText = document.getElementById("webcamStatusText");
    const retryCameraBtn = document.getElementById("retryCameraBtn");
    const toggleWebcamBtn = document.getElementById("toggleWebcamBtn");
    const clearTextBtn = document.getElementById("clearTextBtn");
    const recognizedTextBox = document.getElementById("recognizedTextBox");
    const liveDetectionWord = document.getElementById("liveDetectionWord");
    const gestureHoldProgress = document.getElementById("gestureHoldProgress");
    const detectionConfidence = document.getElementById("detectionConfidence");

    let stream = null;
    let handsModel = null;
    let active = false;
    let cameraActive = false;
    let modelLoaded = false;

    let activeGesture = null;
    let gestureStartTime = null;
    let actionLocked = false; // Lock to prevent multiple triggers until hand is reset
    let highlightedIndex = -1;

    const HOLD_DURATION = 1500; // 1.5 seconds hold required

    // Global gesture mappings configuration to ensure UI and model are always synchronized
    window.GESTURE_MAPPINGS = [
      { gesture: "HELLO", label: "Open Palm (Five Fingers)", emoji: "🖐️", action: "Home" },
      { gesture: "PEACE", label: "Two Fingers (Peace)", emoji: "✌️", action: "About" },
      { gesture: "CALL ME", label: "Phone Sign (Call Me)", emoji: "🤙", action: "Contact" },
      { gesture: "POINT", label: "One Finger (Point)", emoji: "☝️", action: "Courses" },
      { gesture: "THREE", label: "Three Fingers", emoji: "🤟", action: "Categories" },
      { gesture: "THUMBS UP", label: "Thumbs Up", emoji: "👍", action: "Login" },
      { gesture: "THUMBS DOWN", label: "Thumbs Down", emoji: "👎", action: "Logout" },
      { gesture: "ROCK", label: "Rock On (Two Fingers + Pinky)", emoji: "🤘", action: "Back" },
      { gesture: "FOUR", label: "Four Fingers", emoji: "🖖", action: "Select / Highlight" },
      { gesture: "OK", label: "OK Sign", emoji: "👌", action: "Select / Highlight" },
      { gesture: "I LOVE YOU", label: "I Love You Sign", emoji: "🤟", action: "Confirm" },
      { gesture: "NO", label: "Three Fingers (Open)", emoji: "🖐️", action: "Open" },
      { gesture: "YES", label: "Closed Fist", emoji: "✊", action: "Close" }
    ];

    function populateGestureGuide() {
      const guideList = document.getElementById("gestureGuideList");
      if (guideList && window.GESTURE_MAPPINGS) {
        guideList.innerHTML = "";
        window.GESTURE_MAPPINGS.forEach(item => {
          const itemEl = document.createElement("div");
          itemEl.className = "gesture-guide-item";
          itemEl.style.cssText = "display: flex; align-items: center; gap: 0.8rem; background: var(--card-bg); border: 1px solid var(--line); border-radius: 10px; padding: 0.8rem; transition: transform 0.2s ease, box-shadow 0.2s ease;";
          
          itemEl.addEventListener("mouseenter", () => {
            itemEl.style.transform = "translateY(-2px)";
            itemEl.style.boxShadow = "var(--shadow-sm)";
            itemEl.style.borderColor = "var(--blue-soft)";
          });
          itemEl.addEventListener("mouseleave", () => {
            itemEl.style.transform = "none";
            itemEl.style.boxShadow = "none";
            itemEl.style.borderColor = "var(--line)";
          });

          itemEl.innerHTML = `
            <span style="font-size: 1.8rem; display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; background: var(--blue-soft); border-radius: 50%; color: var(--blue);">${item.emoji}</span>
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              <strong style="font-size: 0.88rem; color: var(--navy);">${item.label}</strong>
              <span style="font-size: 0.78rem; color: var(--text-soft); font-weight: 500;">Action: <span style="color: var(--blue); font-weight: 600;">${item.action}</span></span>
            </div>
          `;
          guideList.appendChild(itemEl);
        });
      }

      const cheatSheetGrid = document.getElementById("cheatSheetGrid");
      if (cheatSheetGrid && window.GESTURE_MAPPINGS) {
        cheatSheetGrid.innerHTML = "";
        window.GESTURE_MAPPINGS.forEach(item => {
          const div = document.createElement("div");
          div.innerHTML = `${item.emoji} <strong>${item.gesture}</strong>: ${item.action}`;
          cheatSheetGrid.appendChild(div);
        });
      }
    }

    // Initialize the guides
    populateGestureGuide();

    // Helper: Calculate Euclidean distance between two 3D landmarks
    function getDistance(p1, p2) {
      return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
      );
    }

    // Heuristics-based gesture classification matching 13 navigation commands
    function classifyGesture(landmarks) {
      if (!landmarks || landmarks.length < 21) return null;

      // Scaling factor: Palm width (Index MCP to Pinky MCP)
      const palmSize = getDistance(landmarks[5], landmarks[17]);
      if (palmSize === 0) return null;

      // Check finger extensions (TIP distance to WRIST vs PIP distance to WRIST)
      const indexExtended = getDistance(landmarks[8], landmarks[0]) > getDistance(landmarks[6], landmarks[0]) * 1.05;
      const middleExtended = getDistance(landmarks[12], landmarks[0]) > getDistance(landmarks[10], landmarks[0]) * 1.05;
      const ringExtended = getDistance(landmarks[16], landmarks[0]) > getDistance(landmarks[14], landmarks[0]) * 1.05;
      const pinkyExtended = getDistance(landmarks[20], landmarks[0]) > getDistance(landmarks[18], landmarks[0]) * 1.05;

      // Thumb: Extended if TIP (4) is far from Middle MCP (9) relative to palm size
      const thumbExtended = getDistance(landmarks[4], landmarks[9]) > palmSize * 0.9;

      // Thumb directions (for up vs down check)
      const thumbPointingUp = landmarks[4].y < landmarks[2].y;
      const thumbPointingDown = landmarks[4].y > landmarks[2].y;

      // Check if Thumb and Index TIPs are touching (OK gesture)
      const thumbIndexTouching = getDistance(landmarks[4], landmarks[8]) < palmSize * 0.35;

      // 1. HOME: HELLO / OPEN PALM
      if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
        return "HELLO";
      }

      // 2. CONFIRM: I LOVE YOU
      if (thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return "I LOVE YOU";
      }

      // 3. CONTACT: CALL ME
      if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return "CALL ME";
      }

      // 4. SELECT: OK
      if (thumbIndexTouching && middleExtended && ringExtended && pinkyExtended) {
        return "OK";
      }

      // 5. ABOUT: PEACE
      if (!thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        return "PEACE";
      }

      // 6. OPEN: NO (3-fingers)
      if (thumbExtended && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        return "NO";
      }

      // 7. COURSES: POINT
      if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        return "POINT";
      }

      // 8. BACK: ROCK
      if (!thumbExtended && indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
        return "ROCK";
      }

      // 9. NEXT: FOUR
      if (!thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
        return "FOUR";
      }

      // 10. LOGIN: THUMBS UP
      if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbPointingUp) {
        return "THUMBS UP";
      }

      // 11. LOGOUT: THUMBS DOWN
      if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbPointingDown) {
        return "THUMBS DOWN";
      }

      // 12. CLOSE: YES / FIST
      if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
        return "YES";
      }

      // 13. CATEGORIES: THREE
      if (!thumbExtended && indexExtended && middleExtended && ringExtended && !pinkyExtended) {
        return "THREE";
      }

      return null;
    }

    // Set up canvas size on frame update
    function adjustCanvasSize() {
      if (videoElement.videoWidth) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      }
    }

    // MediaPipe Results Processing Callback
    function onResults(results) {
      adjustCanvasSize();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      let handDetected = false;
      let score = 0;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handDetected = true;
        
        // Grab the first tracked hand
        const landmarks = results.multiHandLandmarks[0];

        // Draw connections/joints using custom premium colors (SensiQ theme)
        if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
          window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: "#0d6efd", lineWidth: 4 });
          window.drawLandmarks(canvasCtx, landmarks, { color: "#f4b400", lineWidth: 1, radius: 4 });
        }

        // Get model confidence rating
        if (results.multiHandedness && results.multiHandedness.length > 0) {
          score = Math.round(results.multiHandedness[0].score * 100);
          detectionConfidence.innerText = `Confidence: ${score}%`;
          detectionConfidence.style.display = "inline";
        }

        // Classify the gesture
        const gesture = classifyGesture(landmarks);

        if (gesture) {
          if (actionLocked) {
            liveDetectionWord.innerText = `Detected: ${gesture} (Release hand to reset)`;
            liveDetectionWord.style.color = "var(--text-soft)";
            gestureHoldProgress.style.display = "none";
          } else {
            liveDetectionWord.innerText = `Detecting: ${gesture}`;
            liveDetectionWord.style.color = "var(--blue)";

            // Setup hold to execute calculations
            if (activeGesture === gesture) {
              const elapsed = Date.now() - gestureStartTime;
              const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
              
              gestureHoldProgress.style.display = "block";
              gestureHoldProgress.querySelector(".fill").style.width = `${pct}%`;

              if (elapsed >= HOLD_DURATION) {
                gestureHoldProgress.querySelector(".fill").style.width = "0%";
                gestureHoldProgress.style.display = "none";
                executeGestureAction(gesture);
              }
            } else {
              activeGesture = gesture;
              gestureStartTime = Date.now();
              gestureHoldProgress.style.display = "block";
              gestureHoldProgress.querySelector(".fill").style.width = "0%";
            }
          }
        } else {
          liveDetectionWord.innerText = "Detecting: Unknown gesture...";
          liveDetectionWord.style.color = "var(--text-soft)";
          resetGestureState();
          actionLocked = false; // Reset lock if they make an unknown/neutral posture
        }
      } else {
        liveDetectionWord.innerText = "Detecting: No hand detected...";
        liveDetectionWord.style.color = "var(--text-soft)";
        detectionConfidence.style.display = "none";
        resetGestureState();
        actionLocked = false; // Reset lock if hand leaves screen
      }
    }

    function resetGestureState() {
      activeGesture = null;
      gestureStartTime = null;
      gestureHoldProgress.style.display = "none";
      gestureHoldProgress.querySelector(".fill").style.width = "0%";
    }

    // Append log to panel text area
    function appendLog(gesture, message) {
      const placeholder = recognizedTextBox.querySelector(".placeholder-text");
      if (placeholder) {
        recognizedTextBox.innerHTML = "";
      }
      
      const entry = document.createElement("div");
      entry.style.cssText = "margin-bottom: 0.4rem; font-size: 0.92rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.2rem;";
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      entry.innerHTML = `<span style="color:var(--text-soft); font-size: 0.78rem;">[${time}]</span> <span style="background:var(--blue-soft); color:var(--blue); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase;">${gesture}</span> <span style="color:var(--text); margin-left: 0.3rem;">${message}</span>`;
      
      recognizedTextBox.appendChild(entry);
      recognizedTextBox.scrollTop = recognizedTextBox.scrollHeight;
    }

    // Show visual popup feedback for actions
    function showGestureToast(msg) {
      const toast = document.createElement("div");
      toast.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" style="color:var(--gold);margin-right:0.5rem"></i> <strong>Gesture Action:</strong> ${msg}`;
      toast.style.cssText = [
        "position:fixed","top:5rem","left:50%","transform:translateX(-50%)",
        "background:var(--navy)","color:#fff","padding:.75rem 1.5rem","border-radius:12px",
        "font-weight:600","font-size:.92rem","z-index:9999",
        "box-shadow:var(--shadow-lg)","transition:opacity .4s, transform 0.4s",
        "border:2px solid var(--blue)"
      ].join(";");
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(-10px)";
        setTimeout(() => toast.remove(), 400);
      }, 2000);
    }

    // Cycle Highlight elements on page
    function selectNextCard() {
      const items = Array.from(document.querySelectorAll(".course-card, .dash-tool, .nav-link"));
      if (items.length === 0) {
        showGestureToast("No navigable items found on this page.");
        return;
      }

      // Remove previous highlight
      if (highlightedIndex >= 0 && highlightedIndex < items.length) {
        const prevItem = items[highlightedIndex];
        prevItem.style.outline = "none";
        prevItem.style.boxShadow = "none";
        prevItem.style.transform = "none";
      }

      // Select next index
      highlightedIndex = (highlightedIndex + 1) % items.length;
      const currentItem = items[highlightedIndex];

      // Highlight style matching branding
      currentItem.style.outline = "4px solid var(--blue)";
      currentItem.style.outlineOffset = "4px";
      currentItem.style.boxShadow = "0 8px 30px rgba(13, 110, 253, 0.3)";
      currentItem.style.transform = "scale(1.03)";
      currentItem.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
      
      currentItem.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const itemLabel = currentItem.innerText.split('\n')[0].trim() || "Item";
      const logMsg = `Highlighted card: "${itemLabel}"`;
      appendLog("SELECT", logMsg);
      showGestureToast(logMsg);
    }

    // Click/Confirm highlighted element
    function confirmSelection() {
      const items = Array.from(document.querySelectorAll(".course-card, .dash-tool, .nav-link"));
      if (highlightedIndex < 0 || highlightedIndex >= items.length) {
        showGestureToast("No item highlighted. Use OK gesture to select first.");
        return;
      }

      const currentItem = items[highlightedIndex];
      const itemLabel = currentItem.innerText.split('\n')[0].trim() || "Item";
      const logMsg = `Confirming selection: "${itemLabel}"`;
      
      appendLog("CONFIRM", logMsg);
      showGestureToast(logMsg);

      // Trigger click
      setTimeout(() => {
        const anchor = currentItem.tagName === "A" ? currentItem : currentItem.querySelector("a");
        if (anchor) anchor.click();
        else currentItem.click();
      }, 1000);
    }

    // Execute website-specific command actions
    function executeGestureAction(gesture) {
      actionLocked = true; // Lock until neutral state reset
      
      const mapping = window.GESTURE_MAPPINGS.find(m => m.gesture === gesture);
      if (!mapping) {
        actionLocked = false;
        return;
      }

      let logMsg = "";

      switch (mapping.action) {
        case "Home": // Home
          logMsg = "Navigating to Home Page...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          setTimeout(() => { window.location.href = "/home"; }, 1000);
          break;

        case "About": // About
          logMsg = "Navigating to About Page...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          setTimeout(() => { window.location.href = "/home/about"; }, 1000);
          break;

        case "Contact": // Contact
          logMsg = "Navigating to Contact Page...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          setTimeout(() => { window.location.href = "/home/contact"; }, 1000);
          break;

        case "Login": // Login
          logMsg = "Navigating to Login Page...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          setTimeout(() => { window.location.href = "/home/login"; }, 1000);
          break;

        case "Logout": // Logout
          logMsg = "Logging out...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          setTimeout(() => { window.location.href = "/home/logout"; }, 1000);
          break;

        case "Back": // Back
          logMsg = "Going back...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          window.history.back();
          break;

        case "Courses": // Courses (Scroll to Courses)
          logMsg = "Scrolling to Courses Section...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          const courseSection = document.querySelector(".course-grid") || document.querySelector(".dash-section");
          if (courseSection) {
            courseSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          break;

        case "Categories": // Categories (Toggle dropdown)
          logMsg = "Toggling Categories dropdown menu...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          const catToggle = document.getElementById("catDropdownToggle");
          if (catToggle) {
            catToggle.click();
          }
          break;

        case "Close": // Close (Fist)
          logMsg = "Closing active dropdowns/modals...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          const dropdowns = document.querySelectorAll(".nav-dropdown-menu");
          dropdowns.forEach(d => {
            d.style.display = "none";
          });
          break;

        case "Open": // Open (Open first course card)
          logMsg = "Opening first course card...";
          appendLog(gesture, logMsg);
          showGestureToast(logMsg);
          const firstCourse = document.querySelector(".course-card a, .dash-tool");
          if (firstCourse) {
            setTimeout(() => {
              if (firstCourse.tagName === "A") firstCourse.click();
              else {
                const innerA = firstCourse.querySelector("a");
                if (innerA) innerA.click();
                else firstCourse.click();
              }
            }, 1000);
          }
          break;

        case "Select / Highlight": // Select (Cycle selections)
          selectNextCard();
          break;

        case "Confirm": // Confirm
          confirmSelection();
          break;

        default:
          actionLocked = false;
          break;
      }
    }

    // Stop webcam stream tracks
    function stopWebcam() {
      active = false;
      cameraActive = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Update UI
      webcamStatus.style.opacity = "1";
      webcamStatus.style.pointerEvents = "auto";
      webcamStatusText.innerText = "Camera stopped.";
      toggleWebcamBtn.innerHTML = '<i class="fa-solid fa-video"></i> Start Camera';
      toggleWebcamBtn.classList.remove("tool-btn-danger");
      toggleWebcamBtn.classList.add("tool-btn-primary");
      
      liveDetectionWord.innerText = "Detecting: Camera off...";
      liveDetectionWord.style.color = "var(--text-soft)";
      detectionConfidence.style.display = "none";
      resetGestureState();
    }

    // Start webcam stream
    async function startWebcam() {
      if (cameraActive) return;
      
      webcamStatus.style.opacity = "1";
      webcamStatus.style.pointerEvents = "auto";
      webcamStatusText.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--gold); font-size: 1.5rem; margin-bottom: 0.5rem;"></i><br>Starting camera...';
      retryCameraBtn.style.display = "none";

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false
        });
        
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          adjustCanvasSize();
          webcamStatus.style.opacity = "0";
          webcamStatus.style.pointerEvents = "none";
        };

        cameraActive = true;
        active = true;
        
        // Start loop
        requestAnimationFrame(detectionLoop);

        toggleWebcamBtn.innerHTML = '<i class="fa-solid fa-video-slash"></i> Stop Camera';
        toggleWebcamBtn.classList.remove("tool-btn-primary");
        toggleWebcamBtn.classList.add("tool-btn-danger");
      } catch (err) {
        console.error("Webcam startup failed:", err);
        handleCameraError(err);
      }
    }

    // Handle user camera errors
    function handleCameraError(err) {
      cameraActive = false;
      active = false;
      webcamStatus.style.opacity = "1";
      webcamStatus.style.pointerEvents = "auto";
      retryCameraBtn.style.display = "inline-block";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        webcamStatusText.innerText = "❌ Camera permission denied. Please allow camera access in your browser settings to use gesture control.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        webcamStatusText.innerText = "❌ No webcam found. Please connect a camera and click retry.";
      } else {
        webcamStatusText.innerText = `❌ Webcam unavailable. Error: ${err.message || "Unknown error"}. Check if another app is using your camera.`;
      }
    }

    // Frame processing loop
    async function detectionLoop() {
      if (!active || !cameraActive) return;

      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        try {
          if (handsModel) {
            await handsModel.send({ image: videoElement });
          }
        } catch (err) {
          console.error("MediaPipe prediction error:", err);
        }
      }
      
      requestAnimationFrame(detectionLoop);
    }

    // Load MediaPipe model
    function loadModel() {
      try {
        if (typeof window.Hands === "undefined") {
          throw new Error("MediaPipe Hands library not loaded from CDN.");
        }

        handsModel = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsModel.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        handsModel.onResults(onResults);
        modelLoaded = true;
        
        // Start webcam
        startWebcam();
      } catch (err) {
        console.error("Model loading error:", err);
        webcamStatus.style.opacity = "1";
        webcamStatus.style.pointerEvents = "auto";
        webcamStatusText.innerText = "❌ Failed to load AI models. Please check your internet connection and reload the page.";
        retryCameraBtn.style.display = "none";
      }
    }

    // Initialize logic
    setTimeout(loadModel, 250);

    // Event Bindings
    toggleWebcamBtn.addEventListener("click", () => {
      if (cameraActive) {
        stopWebcam();
      } else {
        startWebcam();
      }
    });

    retryCameraBtn.addEventListener("click", () => {
      startWebcam();
    });

    clearTextBtn.addEventListener("click", () => {
      recognizedTextBox.innerHTML = `<span class="placeholder-text" style="color: var(--text-soft); font-style: italic; font-size: 0.95rem;">Triggered actions will log here. Hold a gesture for 1.5s to execute its command.</span>`;
      highlightedIndex = -1;
    });

    // Tear down hooks when unloading page
    window.addEventListener("beforeunload", stopWebcam);
    window.addEventListener("pagehide", stopWebcam);
  });
})();

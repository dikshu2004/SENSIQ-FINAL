/* ================================================================
   SensiQ — Main Client JavaScript
   Hero carousel, Voice intro, dropdown, scroll reveal, nav toggle
   ================================================================ */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /* ---- Hero Carousel ---- */
  const slides = document.querySelectorAll(".hero-carousel .slide");
  const dots = document.querySelectorAll(".carousel-dot");
  let currentSlide = 0;
  let carouselTimer = null;

  function showSlide(index) {
    slides.forEach(function (s) { s.classList.remove("active"); });
    dots.forEach(function (d) { d.classList.remove("active"); });
    currentSlide = (index + slides.length) % slides.length;
    if (slides[currentSlide]) slides[currentSlide].classList.add("active");
    if (dots[currentSlide]) dots[currentSlide].classList.add("active");
  }

  function nextSlide() { showSlide(currentSlide + 1); }
  function prevSlide() { showSlide(currentSlide - 1); }

  if (slides.length > 1) {
    carouselTimer = setInterval(nextSlide, 5000);

    var prevBtn = document.getElementById("carouselPrev");
    var nextBtn = document.getElementById("carouselNext");
    if (prevBtn) prevBtn.addEventListener("click", function () { clearInterval(carouselTimer); prevSlide(); carouselTimer = setInterval(nextSlide, 5000); });
    if (nextBtn) nextBtn.addEventListener("click", function () { clearInterval(carouselTimer); nextSlide(); carouselTimer = setInterval(nextSlide, 5000); });

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        clearInterval(carouselTimer);
        showSlide(parseInt(dot.dataset.index));
        carouselTimer = setInterval(nextSlide, 5000);
      });
    });
  }

  /* ---- Voice Intro Feature (Auto-speak on page load) ---- */
  var viBanner = document.getElementById("viBanner");

  function speakText(text, callback) {
    if (!("speechSynthesis" in window)) {
      if (callback) callback();
      return;
    }
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 0.9;
    if (callback) {
      utter.onend = callback;
    }
    window.speechSynthesis.speak(utter);
  }

  if (viBanner) {
    function handleVoiceResponse(e) {
      if (e.key === "Enter") {
        /* User wants voice assistance — enable voice mode */
        localStorage.setItem("sensiq_voice_mode", "true");
        localStorage.setItem("sensiq_hc", "true");
        document.body.classList.add("high-contrast");
        viBanner.classList.add("hidden");

        speakText("Voice assistance enabled. You can now navigate using voice commands. Say help for a list of commands.");

        /* Auto-activate voice navigation if available */
        setTimeout(function () {
          if (window.SensiQVoiceNav && window.SensiQVoiceNav.start) {
            window.SensiQVoiceNav.start();
          }
        }, 3000);

        document.removeEventListener("keydown", handleVoiceResponse);
      } else {
        /* User declines voice assistance */
        localStorage.setItem("sensiq_voice_mode", "false");
        viBanner.classList.add("hidden");
        speakText("Voice assistance disabled.");
        document.removeEventListener("keydown", handleVoiceResponse);
      }
    }

    /* Only show/speak on first visit per session */
    if (!sessionStorage.getItem("sensiq_vi_asked")) {
      sessionStorage.setItem("sensiq_vi_asked", "true");
      document.addEventListener("keydown", handleVoiceResponse);

      /* Auto-speak the welcome prompt */
      setTimeout(function () {
        speakText("Welcome to SensiQ. Press Enter for yes to enable voice assistance, or press any other key for no.");
      }, 800);

      /* Auto-hide banner after 15 seconds */
      setTimeout(function () {
        viBanner.classList.add("hidden");
        document.removeEventListener("keydown", handleVoiceResponse);
      }, 15000);
    } else {
      viBanner.classList.add("hidden");
    }
  }

  /* ---- Categories Dropdown ---- */
  var catDropdown = document.getElementById("navCatDropdown");
  var catToggle = document.getElementById("catDropdownToggle");

  /* ---- Assistive Tools Dropdown ---- */
  var toolsDropdown = document.getElementById("navToolsDropdown");
  var toolsToggle = document.getElementById("toolsDropdownToggle");

  function closeAllDropdowns() {
    if (catDropdown) catDropdown.classList.remove("open");
    if (toolsDropdown) toolsDropdown.classList.remove("open");
  }

  if (catDropdown && catToggle) {
    catToggle.addEventListener("click", function (e) {
      e.preventDefault();
      var wasOpen = catDropdown.classList.contains("open");
      closeAllDropdowns();
      if (!wasOpen) catDropdown.classList.add("open");
      catToggle.setAttribute("aria-expanded", catDropdown.classList.contains("open"));
    });
  }

  if (toolsDropdown && toolsToggle) {
    toolsToggle.addEventListener("click", function (e) {
      e.preventDefault();
      var wasOpen = toolsDropdown.classList.contains("open");
      closeAllDropdowns();
      if (!wasOpen) toolsDropdown.classList.add("open");
      toolsToggle.setAttribute("aria-expanded", toolsDropdown.classList.contains("open"));
    });
  }

  /* Close dropdowns when clicking outside */
  document.addEventListener("click", function (e) {
    if (catDropdown && !catDropdown.contains(e.target)) catDropdown.classList.remove("open");
    if (toolsDropdown && !toolsDropdown.contains(e.target)) toolsDropdown.classList.remove("open");
  });

  /* Close dropdowns on Escape key */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllDropdowns();
  });


  /* ---- Mobile Nav Toggle ---- */
  var navToggler = document.getElementById("navToggler");
  var navWrap = document.getElementById("navMobileWrap");
  if (navToggler && navWrap) {
    navToggler.addEventListener("click", function () {
      navWrap.classList.toggle("open");
    });
  }

  /* ---- Scroll Reveal Animation ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length > 0) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---- Flash message auto-dismiss ---- */
  var flashBanners = document.querySelectorAll(".flash-banner");
  flashBanners.forEach(function (banner) {
    setTimeout(function () {
      banner.style.transition = "opacity .5s";
      banner.style.opacity = "0";
      setTimeout(function () { banner.remove(); }, 500);
    }, 5000);
  });
});

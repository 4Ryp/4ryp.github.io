document.addEventListener("DOMContentLoaded", () => {

  const preloader = document.getElementById("preloader");

  window.addEventListener("load", () => {
    setTimeout(() => preloader?.classList.add("done"), 1200);
  });

  if (document.readyState === "complete") {
    setTimeout(() => preloader?.classList.add("done"), 1200);
  }

  const cover      = document.getElementById("cover");
  const terminal   = document.getElementById("terminal");
  const panels     = document.querySelectorAll(".panel");
  const prevBtn    = document.getElementById("prevPage");
  const nextBtn    = document.getElementById("nextPage");
  const dotsWrap   = document.getElementById("pageDots");
  const nav        = document.getElementById("mainNav");
  const navLinks   = document.querySelectorAll(".nav-links a[data-page]");
  const openBtn    = document.getElementById("openFileBtn");
  const btnSan     = document.getElementById("btnSanitized");
  const btnRaw     = document.getElementById("btnRaw");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav  = document.querySelector(".nav-links");

  let currentPage  = 0;
  let fileSelected = false;
  let isAnimating  = false;
  const animDuration = 350;

  function setMode(mode) {
    fileSelected = true;

    if (mode === "raw") {
      document.body.classList.add("nobs-mode");
      btnSan?.removeAttribute("data-active");
      btnRaw?.setAttribute("data-active", "true");
      localStorage.setItem("nobs-mode", "true");
    } else {
      document.body.classList.remove("nobs-mode");
      btnRaw?.removeAttribute("data-active");
      btnSan?.setAttribute("data-active", "true");
      localStorage.setItem("nobs-mode", "false");
    }

    openBtn?.classList.add("visible");
  }

  const saved = localStorage.getItem("nobs-mode");
  if (saved === "true") { setMode("raw"); }
  else if (saved === "false") { setMode("sanitized"); }

  btnSan?.addEventListener("click", () => setMode("sanitized"));
  btnRaw?.addEventListener("click", () => setMode("raw"));

  function openFile() {
    if (!fileSelected) return;

    cover?.classList.add("cover-exit");
    openBtn?.classList.remove("visible");

    setTimeout(() => {
      terminal?.classList.add("active");
      nav?.classList.remove("nav-hidden");
      goToPage(0, false);
      panels.forEach(p => triggerReveals(p));
    }, 350);
  }

  openBtn?.addEventListener("click", openFile);

  panels.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "page-dot";
    dot.setAttribute("aria-label", `Page ${i + 1}`);
    dot.addEventListener("click", () => goToPage(i));
    dotsWrap?.appendChild(dot);
  });

  const dots = dotsWrap?.querySelectorAll(".page-dot");

  function goToPage(index, animate = true) {
    if (index < 0 || index >= panels.length) return;
    if (index === currentPage && animate) return;
    if (isAnimating && animate) return;

    const direction = index > currentPage ? 1 : -1;

    if (!animate) {
      panels.forEach((p, i) => {
        p.classList.remove("active", "exit-left");
        p.style.cssText = "";
        if (i === index) {
          p.classList.add("active");
        }
      });
      updateUI(index);
      currentPage = index;
      return;
    }

    isAnimating = true;

    const current = panels[currentPage];
    current.style.transform = `translateX(${-40 * direction}px)`;
    current.style.opacity = "0";

    setTimeout(() => {
      current.classList.remove("active");
      current.style.cssText = "";
    }, animDuration);

    const next = panels[index];
    next.style.transition = "none";
    next.style.transform = `translateX(${40 * direction}px)`;
    next.style.opacity = "0";
    next.classList.add("active");

    void next.offsetWidth;
    next.style.transition = "";
    next.style.transform = "";
    next.style.opacity = "";

    updateUI(index);
    currentPage = index;

    setTimeout(() => {
      isAnimating = false;
    }, animDuration);
  }

  function updateUI(index) {
    dots?.forEach((d, i) => d.classList.toggle("dot-active", i === index));
    navLinks.forEach((l, i) => l.classList.toggle("active", i === index));
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === panels.length - 1;
  }

  prevBtn?.addEventListener("click", () => goToPage(currentPage - 1));
  nextBtn?.addEventListener("click", () => goToPage(currentPage + 1));

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const idx = parseInt(link.dataset.page, 10);
      if (!isNaN(idx)) goToPage(idx);
      menuToggle?.classList.remove("open");
      mobileNav?.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  document.querySelector(".nav-logo")?.addEventListener("click", e => {
    e.preventDefault();
    terminal?.classList.remove("active");
    nav?.classList.add("nav-hidden");
    setTimeout(() => {
      cover?.classList.remove("cover-exit");
      if (fileSelected) openBtn?.classList.add("visible");
      resetNameAnimation();
      setTimeout(runNameAnimation, 400);
    }, 300);
  });

  document.addEventListener("keydown", e => {
    if (!terminal?.classList.contains("active")) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToPage(currentPage - 1);
    }
  });

  let wheelAccum = 0;
  let wheelTimer = null;
  let wheelLocked = false;
  const wheelThreshold = 50;

  document.addEventListener("wheel", e => {
    if (!terminal?.classList.contains("active")) return;
    e.preventDefault();

    if (isAnimating || wheelLocked) {
      wheelAccum = 0;
      clearTimeout(wheelTimer);
      return;
    }

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccum += delta;

    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      if (Math.abs(wheelAccum) >= wheelThreshold) {
        goToPage(currentPage + (wheelAccum > 0 ? 1 : -1));
        wheelLocked = true;
        setTimeout(() => { wheelLocked = false; }, animDuration + 200);
      }
      wheelAccum = 0;
    }, 100);

  }, { passive: false });

  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  document.addEventListener("touchstart", e => {
    if (!terminal?.classList.contains("active")) return;
    if (isAnimating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });

  document.addEventListener("touchmove", e => {
    if (!terminal?.classList.contains("active")) return;
    if (isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (!isSwiping && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      isSwiping = true;
    }
    if (isSwiping) e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", e => {
    if (!terminal?.classList.contains("active")) return;
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) >= 40) {
      goToPage(currentPage + (dx < 0 ? 1 : -1));
    }
    isSwiping = false;
  });

  function triggerReveals(panel) {
    panel.querySelectorAll(".reveal:not(.visible)").forEach(el =>
      el.classList.add("visible")
    );
  }

  document.querySelectorAll(".exhibit").forEach(details => {
    const toggle = details.querySelector(".exhibit-toggle");
    if (toggle) {
      details.addEventListener("toggle", () => {
        toggle.textContent = details.open ? "" : "\u25B8 expand";
      });
    }
  });

  document.querySelectorAll(".exhibit-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const href = link.getAttribute("href");
      if (href && href !== "#") window.open(href, "_blank");
    });
  });

  menuToggle?.addEventListener("click", () => {
    menuToggle.classList.toggle("open");
    mobileNav?.classList.toggle("open");
    document.body.style.overflow = mobileNav?.classList.contains("open") ? "hidden" : "";
  });

  const coverLabel    = document.getElementById("coverLabel");
  const nameLetters   = document.getElementById("nameLetters");
  const coverNameEl   = document.getElementById("coverName");
  const glowLine      = document.getElementById("nameGlowLine");
  const letters       = nameLetters ? nameLetters.querySelectorAll(".letter") : [];

  const glyphPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*<>{}[]=/\\|~^";

  function randomGlyph() {
    return glyphPool[Math.floor(Math.random() * glyphPool.length)];
  }

  function runNameAnimation() {
    if (coverLabel) {
      coverLabel.classList.add("typing");
    }

    const labelDelay = 650;
    const scrambleDuration = 600;
    const scrambleInterval = 40;
    const stagger = 100;

    letters.forEach((el, i) => {
      const finalChar = el.getAttribute("data-char");
      const startTime = labelDelay + i * stagger;

      setTimeout(() => {
        el.classList.add("scrambling");
        el.textContent = randomGlyph();

        const scrambleEnd = performance.now() + scrambleDuration;
        let scrambleRAF;

        function scrambleStep() {
          if (performance.now() < scrambleEnd) {
            el.textContent = randomGlyph();
            scrambleRAF = setTimeout(scrambleStep, scrambleInterval);
          } else {
            el.textContent = finalChar;
            el.classList.remove("scrambling");
            el.classList.add("resolved");

            if (i === letters.length - 1) {
              setTimeout(() => {
                coverNameEl?.classList.add("glitch-flash");
                glowLine?.classList.add("sweep");

                if (coverLabel) {
                  coverLabel.classList.remove("typing");
                  coverLabel.classList.add("typed");
                }

                setTimeout(() => coverNameEl?.classList.remove("glitch-flash"), 700);
              }, 200);
            }
          }
        }

        scrambleStep();
      }, startTime);
    });
  }

  function resetNameAnimation() {
    coverLabel?.classList.remove("typing", "typed");
    coverLabel && (coverLabel.style.width = "");
    coverNameEl?.classList.remove("glitch-flash");
    glowLine?.classList.remove("sweep");
    letters.forEach(el => {
      el.classList.remove("scrambling", "resolved");
      el.textContent = el.getAttribute("data-char");
    });
  }

  let nameAnimScheduled = false;
  function scheduleNameAnim() {
    if (nameAnimScheduled) return;
    nameAnimScheduled = true;
    const delay = 1600;
    setTimeout(runNameAnimation, delay);
  }

  if (document.readyState === "complete") {
    scheduleNameAnim();
  } else {
    window.addEventListener("load", scheduleNameAnim);
  }

});

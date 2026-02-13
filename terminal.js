/* ═══════════════════════════════════════════════════
   RYPTIX.SYS — Terminal Portfolio Scripts
   ═══════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Preloader ───────────────────────────────────── */
  const preloader = document.getElementById("preloader");

  window.addEventListener("load", () => {
    setTimeout(() => preloader?.classList.add("done"), 1200);
  });

  if (document.readyState === "complete") {
    setTimeout(() => preloader?.classList.add("done"), 1200);
  }

  /* ── Elements ────────────────────────────────────── */
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
  const animDuration = 450; // matches --slide-speed

  /* ═══════════════════════════════════════════════════
     FILE VERSION TOGGLE (BS / NO BS)
     ═══════════════════════════════════════════════════ */
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

  // Load saved preference
  const saved = localStorage.getItem("nobs-mode");
  if (saved === "true") { setMode("raw"); }
  else if (saved === "false") { setMode("sanitized"); }

  btnSan?.addEventListener("click", () => setMode("sanitized"));
  btnRaw?.addEventListener("click", () => setMode("raw"));

  /* ═══════════════════════════════════════════════════
     OPEN FILE → Enter Terminal
     ═══════════════════════════════════════════════════ */
  function openFile() {
    if (!fileSelected) return;

    cover?.classList.add("cover-exit");

    setTimeout(() => {
      terminal?.classList.add("active");
      nav?.classList.remove("nav-hidden");
      goToPage(0, false);
    }, 350);
  }

  openBtn?.addEventListener("click", openFile);

  /* ═══════════════════════════════════════════════════
     PANEL NAVIGATION
     ═══════════════════════════════════════════════════ */

  // Build dots
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
      // Instant — no animation (first load)
      panels.forEach((p, i) => {
        p.classList.remove("active", "exit-left");
        p.style.cssText = "";
        if (i === index) {
          p.classList.add("active");
          triggerReveals(p);
        }
      });
      updateUI(index);
      currentPage = index;
      return;
    }

    isAnimating = true;

    // Exit current panel
    const current = panels[currentPage];
    current.style.transform = `translateX(${-50 * direction}px) scale(.98)`;
    current.style.opacity = "0";
    current.style.filter = "blur(6px)";

    setTimeout(() => {
      current.classList.remove("active");
      current.style.cssText = "";
    }, animDuration);

    // Enter new panel
    const next = panels[index];
    // Set starting position
    next.style.transition = "none";
    next.style.transform = `translateX(${50 * direction}px) scale(.98)`;
    next.style.opacity = "0";
    next.style.filter = "blur(6px)";
    next.classList.add("active");

    // Force reflow then animate
    void next.offsetWidth;
    next.style.transition = "";
    next.style.transform = "";
    next.style.opacity = "";
    next.style.filter = "";

    triggerReveals(next);
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

  // Nav tab links
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

  // Logo → back to cover
  document.querySelector(".nav-logo")?.addEventListener("click", e => {
    e.preventDefault();
    terminal?.classList.remove("active");
    nav?.classList.add("nav-hidden");
    setTimeout(() => cover?.classList.remove("cover-exit"), 300);
  });

  // Keyboard nav
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

  /* ── Scroll / wheel navigation ───────────────────── */
  let wheelAccum = 0;
  const wheelThreshold = 80;
  let wheelTimer = null;
  let wheelDragging = false;

  function applyDragOffset(offset) {
    // Live-drag the current panel and peek the next/prev panel
    const cur = panels[currentPage];
    if (!cur) return;

    const clamp = Math.max(-150, Math.min(150, offset));
    const progress = clamp / 150;                         // -1 … 1
    const absP = Math.abs(progress);

    // Current panel shifts, fades and blurs proportionally
    cur.style.transition = "none";
    cur.style.transform = `translateX(${clamp * 0.4}px) scale(${1 - absP * 0.02})`;
    cur.style.opacity = `${1 - absP * 0.35}`;
    cur.style.filter = `blur(${absP * 3}px)`;

    // Peek neighbor
    const neighborIdx = offset < 0 ? currentPage + 1 : currentPage - 1;
    if (neighborIdx >= 0 && neighborIdx < panels.length) {
      const nb = panels[neighborIdx];
      const dir = offset < 0 ? 1 : -1;
      nb.style.transition = "none";
      nb.style.transform = `translateX(${(1 - absP) * 50 * dir}px) scale(${0.98 + absP * 0.02})`;
      nb.style.opacity = `${absP * 0.6}`;
      nb.style.filter = `blur(${(1 - absP) * 6}px)`;
      nb.style.pointerEvents = "none";
      nb.style.zIndex = "5";
      nb.classList.add("active");
    }
  }

  function clearDragStyles() {
    panels.forEach(p => {
      p.style.transition = "";
      p.style.transform = "";
      p.style.opacity = "";
      p.style.filter = "";
      p.style.pointerEvents = "";
      p.style.zIndex = "";
    });
  }

  function snapBack() {
    // Smoothly reset everything
    panels.forEach(p => {
      p.style.transition = `transform .35s cubic-bezier(.4,0,.2,1), opacity .35s ease, filter .35s ease`;
      p.style.transform = "";
      p.style.opacity = "";
      p.style.filter = "";
    });
    setTimeout(() => {
      panels.forEach(p => {
        p.style.transition = "";
        p.style.pointerEvents = "";
        p.style.zIndex = "";
        if (!p.classList.contains("active") || panels[currentPage] !== p) {
          if (p !== panels[currentPage]) {
            p.classList.remove("active");
          }
        }
      });
    }, 360);
  }

  document.addEventListener("wheel", e => {
    if (!terminal?.classList.contains("active")) return;
    if (isAnimating) return;
    e.preventDefault();

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccum += delta;

    // Clamp accumulator so it doesn't fly off
    wheelAccum = Math.max(-200, Math.min(200, wheelAccum));
    wheelDragging = true;

    // Apply live drag
    applyDragOffset(-wheelAccum);

    // After a pause, commit or snap back
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelDragging = false;
      if (Math.abs(wheelAccum) >= wheelThreshold) {
        const dir = wheelAccum > 0 ? 1 : -1;
        const target = currentPage + dir;
        clearDragStyles();
        if (target >= 0 && target < panels.length) {
          // Remove peek neighbor's inline active
          panels.forEach((p, i) => {
            if (i !== currentPage) { p.classList.remove("active"); p.style.cssText = ""; }
          });
          goToPage(target);
        } else {
          snapBack();
        }
      } else {
        snapBack();
      }
      wheelAccum = 0;
    }, 150);

  }, { passive: false });

  /* ── Touch swipe navigation (interactive drag) ───── */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let isSwiping = false;

  document.addEventListener("touchstart", e => {
    if (!terminal?.classList.contains("active")) return;
    if (isAnimating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
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

    if (isSwiping) {
      e.preventDefault();
      touchDeltaX = dx;
      applyDragOffset(touchDeltaX);
    }
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if (!isSwiping) return;
    const swipeThreshold = 50;

    if (Math.abs(touchDeltaX) >= swipeThreshold) {
      const target = touchDeltaX < 0 ? currentPage + 1 : currentPage - 1;
      clearDragStyles();
      panels.forEach((p, i) => {
        if (i !== currentPage) { p.classList.remove("active"); p.style.cssText = ""; }
      });
      if (target >= 0 && target < panels.length) {
        goToPage(target);
      } else {
        snapBack();
      }
    } else {
      snapBack();
    }

    touchDeltaX = 0;
    isSwiping = false;
  });

  /* ── Reveal animations ───────────────────────────── */
  function triggerReveals(panel) {
    panel.querySelectorAll(".reveal:not(.visible)").forEach(el =>
      el.classList.add("visible")
    );
  }

  /* ── Exhibit toggle text ─────────────────────────── */
  document.querySelectorAll(".exhibit").forEach(details => {
    const toggle = details.querySelector(".exhibit-toggle");
    if (toggle) {
      details.addEventListener("toggle", () => {
        toggle.textContent = details.open ? "" : "\u25B8 expand";
      });
    }
  });

  /* ── Mobile menu ─────────────────────────────────── */
  menuToggle?.addEventListener("click", () => {
    menuToggle.classList.toggle("open");
    mobileNav?.classList.toggle("open");
    document.body.style.overflow = mobileNav?.classList.contains("open") ? "hidden" : "";
  });

});

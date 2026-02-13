/* ═══════════════════════════════════════════════════
   CASE FILE: RYPTIX — Dossier Scripts (Book Mode)
   ═══════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Preloader ───────────────────────────────────── */
  const preloader = document.getElementById("preloader");

  window.addEventListener("load", () => {
    setTimeout(() => preloader?.classList.add("done"), 700);
  });

  if (document.readyState === "complete") {
    setTimeout(() => preloader?.classList.add("done"), 700);
  }

  /* ── Elements ────────────────────────────────────── */
  const cover      = document.querySelector(".cover");
  const book       = document.getElementById("book");
  const pages      = document.querySelectorAll(".book-page");
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

  let currentPage = 0;
  let fileSelected = false;

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

    // Show the OPEN FILE button
    openBtn?.classList.add("visible");
  }

  // Load saved preference — but still require the click
  const saved = localStorage.getItem("nobs-mode");
  if (saved === "true") {
    setMode("raw");
    // Reset: don't auto-open, just pre-select
    fileSelected = true;
  } else if (saved === "false") {
    setMode("sanitized");
    fileSelected = true;
  }
  // If nothing saved, nothing is selected, no OPEN button

  btnSan?.addEventListener("click", () => setMode("sanitized"));
  btnRaw?.addEventListener("click", () => setMode("raw"));

  /* ═══════════════════════════════════════════════════
     OPEN FILE → Enter Book Mode
     ═══════════════════════════════════════════════════ */
  function openFile() {
    if (!fileSelected) return;

    // Activate book BEHIND cover (z-50 vs z-100)
    book?.classList.add("active");
    goToPage(0, false);

    // Flip cover open like a case-file page
    requestAnimationFrame(() => {
      cover?.classList.add("cover-exit");
    });

    // Fade-in nav after cover clears midpoint
    setTimeout(() => {
      nav?.classList.remove("nav-hidden");
    }, 650);
  }

  openBtn?.addEventListener("click", openFile);

  /* ═══════════════════════════════════════════════════
     BOOK PAGE NAVIGATION
     ═══════════════════════════════════════════════════ */

  // Build page dots
  pages.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "page-dot";
    dot.setAttribute("aria-label", `Page ${i + 1}`);
    dot.addEventListener("click", () => goToPage(i));
    dotsWrap?.appendChild(dot);
  });

  const dots = dotsWrap?.querySelectorAll(".page-dot");

  let isFlipping = false;
  const flipDuration = 900; // matches --page-speed

  function goToPage(index, animate = true) {
    if (index < 0 || index >= pages.length) return;
    if (index === currentPage && animate) return;
    if (isFlipping && animate) return;

    const direction = index > currentPage ? 1 : -1; // 1 = forward, -1 = backward

    if (!animate) {
      // Instant setup (no animation) — e.g. first load
      pages.forEach((page, i) => {
        page.classList.remove("page-active", "page-turned", "page-upcoming", "page-flipping");
        if (i < index) {
          page.classList.add("page-turned");
        } else if (i === index) {
          page.classList.add("page-active");
          triggerReveals(page);
        } else {
          page.classList.add("page-upcoming");
        }
      });
      updateUI(index);
      currentPage = index;
      return;
    }

    isFlipping = true;

    if (direction === 1) {
      // Forward: flip current page over (turn it to the left)
      // Process each page between current and target
      const pagesToFlip = [];
      for (let i = currentPage; i < index; i++) pagesToFlip.push(i);

      pagesToFlip.forEach((pi, step) => {
        const page = pages[pi];
        setTimeout(() => {
          page.classList.add("page-flipping");
          page.classList.remove("page-active", "page-upcoming");
          page.classList.add("page-turned");

          // Clean up flipping class after animation
          setTimeout(() => page.classList.remove("page-flipping"), flipDuration);
        }, step * 120);
      });

      // After a small delay, set the new active page
      setTimeout(() => {
        pages[index].classList.remove("page-upcoming", "page-turned");
        pages[index].classList.add("page-active");
        triggerReveals(pages[index]);
      }, pagesToFlip.length * 120);

    } else {
      // Backward: flip pages back from turned to active
      const pagesToFlip = [];
      for (let i = currentPage - 1; i >= index; i--) pagesToFlip.push(i);

      // First, demote current page
      pages[currentPage].classList.remove("page-active");
      pages[currentPage].classList.add("page-upcoming");

      pagesToFlip.forEach((pi, step) => {
        const page = pages[pi];
        setTimeout(() => {
          page.classList.add("page-flipping");
          page.classList.remove("page-turned");

          if (pi === index) {
            page.classList.add("page-active");
            triggerReveals(page);
          } else {
            page.classList.add("page-upcoming");
          }

          setTimeout(() => page.classList.remove("page-flipping"), flipDuration);
        }, step * 120);
      });
    }

    updateUI(index);

    // Calculate total animation time
    const totalSteps = Math.abs(index - currentPage);
    const totalTime = totalSteps * 120 + flipDuration;

    setTimeout(() => {
      isFlipping = false;
    }, totalTime);

    currentPage = index;
  }

  function updateUI(index) {
    // Update dots
    dots?.forEach((dot, i) => {
      dot.classList.toggle("dot-active", i === index);
    });

    // Update nav active
    navLinks.forEach((link, i) => {
      link.classList.toggle("active", i === index);
    });

    // Update arrow states
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === pages.length - 1);
  }

  prevBtn?.addEventListener("click", () => goToPage(currentPage - 1));
  nextBtn?.addEventListener("click", () => goToPage(currentPage + 1));

  // Nav links navigate to pages
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = parseInt(link.dataset.page, 10);
      if (!isNaN(idx)) goToPage(idx);
      // Close mobile menu
      menuToggle?.classList.remove("open");
      mobileNav?.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  // Nav logo goes back to cover
  document.querySelector(".nav-logo")?.addEventListener("click", (e) => {
    e.preventDefault();
    // Flip cover back closed
    cover?.classList.remove("cover-exit");
    nav?.classList.add("nav-hidden");
    // Deactivate book after cover settles
    setTimeout(() => {
      book?.classList.remove("active");
    }, 800);
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!book?.classList.contains("active")) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToPage(currentPage - 1);
    }
  });

  /* ── Reveal animations per page ──────────────────── */
  function triggerReveals(page) {
    const reveals = page.querySelectorAll(".reveal:not(.visible)");
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* ── Details toggle text ─────────────────────────── */
  document.querySelectorAll(".exhibit").forEach((details) => {
    const toggleEl = details.querySelector(".exhibit-toggle");
    if (toggleEl) {
      details.addEventListener("toggle", () => {
        toggleEl.textContent = details.open ? "" : "\u25B8 FULL REPORT";
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

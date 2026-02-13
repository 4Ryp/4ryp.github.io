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

    // Slide cover out to the left
    cover?.classList.add("cover-exit");

    // Activate book
    setTimeout(() => {
      book?.classList.add("active");
      nav?.classList.remove("nav-hidden");
      goToPage(0, false);
    }, 300);
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

  function goToPage(index, animate = true) {
    if (index < 0 || index >= pages.length) return;

    pages.forEach((page, i) => {
      page.classList.remove("page-active", "page-left");

      if (i === index) {
        page.classList.add("page-active");
        // Trigger reveal animations on this page
        triggerReveals(page);
      } else if (i < index) {
        page.classList.add("page-left");
      }
      // else: stays at translateX(100%) (default)
    });

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

    currentPage = index;
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
    // Slide book away, bring cover back
    book?.classList.remove("active");
    nav?.classList.add("nav-hidden");
    setTimeout(() => {
      cover?.classList.remove("cover-exit");
    }, 100);
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

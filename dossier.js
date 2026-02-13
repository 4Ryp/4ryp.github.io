/* ═══════════════════════════════════════════════════
   CASE FILE: RYPTIX — Dossier Scripts
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

  /* ── Nav scroll state ────────────────────────────── */
  const nav = document.querySelector("nav");
  const onScroll = () => {
    nav?.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Active nav link ─────────────────────────────── */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a[href^='#']");

  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY + 200;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute("id");
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { passive: true });

  /* ── Mobile menu ─────────────────────────────────── */
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".nav-links");

  menuToggle?.addEventListener("click", () => {
    menuToggle.classList.toggle("open");
    mobileNav?.classList.toggle("open");
    document.body.style.overflow = mobileNav?.classList.contains("open") ? "hidden" : "";
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle?.classList.remove("open");
      mobileNav?.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  /* ── Scroll Reveal ───────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  /* ── Smooth anchor scrolls ───────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ── Details toggle text ─────────────────────────── */
  document.querySelectorAll(".exhibit").forEach((details) => {
    const toggleEl = details.querySelector(".exhibit-toggle");
    if (toggleEl) {
      details.addEventListener("toggle", () => {
        toggleEl.textContent = details.open ? "" : "\u25B8 FULL REPORT";
      });
    }
  });

  /* ═══════════════════════════════════════════════════
     FILE VERSION TOGGLE (BS / NO BS)
     ═══════════════════════════════════════════════════ */
  const btnSanitized = document.getElementById("btnSanitized");
  const btnRaw = document.getElementById("btnRaw");

  function setMode(mode) {
    if (mode === "raw") {
      document.body.classList.add("nobs-mode");
      btnSanitized?.removeAttribute("data-active");
      btnRaw?.setAttribute("data-active", "true");
      localStorage.setItem("nobs-mode", "true");
    } else {
      document.body.classList.remove("nobs-mode");
      btnRaw?.removeAttribute("data-active");
      btnSanitized?.setAttribute("data-active", "true");
      localStorage.setItem("nobs-mode", "false");
    }
  }

  // Load saved preference
  const saved = localStorage.getItem("nobs-mode");
  if (saved === "true") {
    setMode("raw");
  }

  btnSanitized?.addEventListener("click", () => setMode("sanitized"));
  btnRaw?.addEventListener("click", () => setMode("raw"));

});

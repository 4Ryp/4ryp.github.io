/* ═══════════════════════════════════════════════════
   4Ryp — Portfolio Scripts
   ═══════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── Preloader ───────────────────────────────────── */
  const preloader = document.querySelector(".preloader");
  window.addEventListener("load", () => {
    setTimeout(() => {
      preloader?.classList.add("done");
      // Trigger hero animations after preloader fades
      document.querySelectorAll(".hero-enter").forEach((el) => {
        el.classList.add("visible");
      });
    }, 400);
  });

  // Fallback if load already fired
  if (document.readyState === "complete") {
    setTimeout(() => {
      preloader?.classList.add("done");
      document.querySelectorAll(".hero-enter").forEach((el) => {
        el.classList.add("visible");
      });
    }, 400);
  }

  /* ── Cursor Glow ─────────────────────────────────── */
  const glow = document.querySelector(".cursor-glow");
  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (glow && !glow.classList.contains("active")) {
      glow.classList.add("active");
    }
  });

  function animateGlow() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    if (glow) {
      glow.style.left = glowX + "px";
      glow.style.top = glowY + "px";
    }
    requestAnimationFrame(animateGlow);
  }
  animateGlow();

  // Disable cursor glow on touch devices
  if ("ontouchstart" in window) {
    glow?.remove();
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

  const updateActiveLink = () => {
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
  };
  window.addEventListener("scroll", updateActiveLink, { passive: true });

  /* ── Mobile menu ─────────────────────────────────── */
  const toggle = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector(".nav-links");

  toggle?.addEventListener("click", () => {
    toggle.classList.toggle("open");
    mobileNav?.classList.toggle("open");
    document.body.style.overflow = mobileNav?.classList.contains("open") ? "hidden" : "";
  });

  // Close mobile menu on link click
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggle?.classList.remove("open");
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
          revealObserver.unobserve(entry.target); // only animate once
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    revealObserver.observe(el);
  });

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
});

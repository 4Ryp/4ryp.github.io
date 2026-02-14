/* ═══════════════════════════════════════════════════
   RYPTIX.SYS — Interactive Particle Field
   Advanced GPU-friendly canvas particle system
   with mouse proximity forces & connection lines.
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Configuration ───────────────────────────────── */
  const CFG = {
    // Particles
    count:          120,       // base count (scaled by screen area)
    minSize:        1,
    maxSize:        2.5,
    speed:          0.25,
    drift:          0.0003,    // subtle perlin-like drift factor

    // Colors (accent-themed)
    particleColor:  [196, 75, 138],  // accent-light rgb
    particleAlpha:  0.4,
    lineColor:      [196, 75, 138],
    lineAlpha:      0.07,

    // Connections
    linkDist:       140,       // px between particles to draw line
    linkWidth:      0.6,

    // Mouse interaction
    mouseRadius:    200,       // influence radius
    mouseForce:     0.06,      // attraction strength
    mouseLineAlpha: 0.15,      // brighter lines near mouse
    mouseLineDist:  220,       // longer connection radius near mouse
    mouseGlow:      true,      // soft glow around cursor

    // Performance
    fpsCap:         60,
    pauseOffscreen: true,
  };

  /* ── State ───────────────────────────────────────── */
  let W, H, particles = [], mouse = { x: -9999, y: -9999, active: false };
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let animId, lastFrame = 0;
  const frameInterval = 1000 / CFG.fpsCap;

  /* ── Resize ──────────────────────────────────────── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Scale particle count to screen area
    const area = W * H;
    const target = Math.floor(CFG.count * (area / (1920 * 1080)));
    const clamped = Math.max(40, Math.min(200, target));

    while (particles.length < clamped) particles.push(createParticle());
    while (particles.length > clamped) particles.pop();
  }

  /* ── Particle factory ────────────────────────────── */
  function createParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = CFG.speed * (0.3 + Math.random() * 0.7);
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: CFG.minSize + Math.random() * (CFG.maxSize - CFG.minSize),
      alpha: 0.2 + Math.random() * 0.6,
      // Drift phase offset for organic movement
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.002 + Math.random() * 0.003,
    };
  }

  /* ── Mouse tracking ──────────────────────────────── */
  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }
  function onMouseLeave() {
    mouse.active = false;
  }
  function onTouchMove(e) {
    if (e.touches.length) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }
  function onTouchEnd() {
    mouse.active = false;
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd);

  /* ── Core loop ───────────────────────────────────── */
  function tick(timestamp) {
    animId = requestAnimationFrame(tick);

    // FPS cap
    const elapsed = timestamp - lastFrame;
    if (elapsed < frameInterval) return;
    lastFrame = timestamp - (elapsed % frameInterval);

    update();
    draw();
  }

  /* ── Physics update ──────────────────────────────── */
  function update() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Organic drift
      p.phase += p.phaseSpeed;
      p.vx += Math.sin(p.phase) * CFG.drift;
      p.vy += Math.cos(p.phase * 1.3) * CFG.drift;

      // Mouse attraction / repulsion
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CFG.mouseRadius && dist > 1) {
          const force = CFG.mouseForce * (1 - dist / CFG.mouseRadius);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Damping (prevents runaway velocity)
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges with padding
      const pad = 20;
      if (p.x < -pad) p.x = W + pad;
      else if (p.x > W + pad) p.x = -pad;
      if (p.y < -pad) p.y = H + pad;
      else if (p.y > H + pad) p.y = -pad;
    }
  }

  /* ── Render ──────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    const linkDist2 = CFG.linkDist * CFG.linkDist;
    const mouseDist2 = CFG.mouseLineDist * CFG.mouseLineDist;
    const [lr, lg, lb] = CFG.lineColor;
    const [pr, pg, pb] = CFG.particleColor;

    // -- Connection lines --
    ctx.lineWidth = CFG.linkWidth;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > linkDist2) continue;

        const dist = Math.sqrt(d2);
        let alpha = CFG.lineAlpha * (1 - dist / CFG.linkDist);

        // Brighter near mouse
        if (mouse.active) {
          const mx = (a.x + b.x) / 2 - mouse.x;
          const my = (a.y + b.y) / 2 - mouse.y;
          const md = Math.sqrt(mx * mx + my * my);
          if (md < CFG.mouseRadius) {
            alpha += CFG.mouseLineAlpha * (1 - md / CFG.mouseRadius);
          }
        }

        ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Lines to mouse
      if (mouse.active) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouseDist2) {
          const dist = Math.sqrt(d2);
          const alpha = CFG.mouseLineAlpha * (1 - dist / CFG.mouseLineDist);
          ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // -- Mouse glow --
    if (mouse.active && CFG.mouseGlow) {
      const grad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, CFG.mouseRadius * 0.6
      );
      grad.addColorStop(0, `rgba(${pr},${pg},${pb},0.06)`);
      grad.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, CFG.mouseRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // -- Particles --
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let alpha = CFG.particleAlpha * p.alpha;

      // Brighter near mouse
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CFG.mouseRadius) {
          const boost = 1 + 1.5 * (1 - dist / CFG.mouseRadius);
          alpha = Math.min(1, alpha * boost);
        }
      }

      // Soft glow
      const grad = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size * 3
      );
      grad.addColorStop(0, `rgba(${pr},${pg},${pb},${alpha})`);
      grad.addColorStop(0.4, `rgba(${pr},${pg},${pb},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── Visibility API — pause when tab hidden ──────── */
  if (CFG.pauseOffscreen) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastFrame = performance.now();
        animId = requestAnimationFrame(tick);
      }
    });
  }

  /* ── Boot ────────────────────────────────────────── */
  window.addEventListener('resize', resize);
  resize();
  animId = requestAnimationFrame(tick);

})();

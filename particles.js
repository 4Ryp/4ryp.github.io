
(function () {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CFG = {
    count:          120,
    minSize:        1,
    maxSize:        2.5,
    speed:          0.25,
    drift:          0.0003,

    particleColor:  [196, 75, 138],
    particleAlpha:  0.4,
    lineColor:      [196, 75, 138],
    lineAlpha:      0.07,

    linkDist:       140,
    linkWidth:      0.6,

    mouseRadius:    200,
    mouseForce:     0.06,
    mouseLineAlpha: 0.15,
    mouseLineDist:  220,
    mouseGlow:      true,
    shardMax:       18,
    ambientShardIntervalMin: 900,
    ambientShardIntervalMax: 2400,
    shardSpeedMin:  0.12,
    shardSpeedMax:  0.32,
    shardTail:      12,
    cometMax:       3,
    cometTail:      120,
    cometHeadSize:  18,
    cometSpeedMin:  1.8,
    cometSpeedMax:  3.4,
    cometIntervalMin: 1600,
    cometIntervalMax: 4200,

    fpsCap:         120,
    pauseOffscreen: true,
  };

  let W, H, particles = [], mouse = { x: -9999, y: -9999, active: false };
  let comets = [];
  let shards = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let animId, lastFrame = 0;
  let glowOpacity = 1;
  let nextCometAt = 0;
  let nextAmbientShardAt = 0;
  let lastUpdateTs = performance.now();
  const frameInterval = 1000 / CFG.fpsCap;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const rand = (min, max) => min + Math.random() * (max - min);

  function parseRGB(value) {
    if (!value) return null;
    const raw = value.trim();
    if (raw.startsWith('#')) {
      const hex = raw.slice(1);
      const full = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex;
      if (full.length !== 6) return null;
      return [
        parseInt(full.slice(0, 2), 16),
        parseInt(full.slice(2, 4), 16),
        parseInt(full.slice(4, 6), 16),
      ];
    }
    const rgb = raw.match(/\d+/g);
    if (!rgb || rgb.length < 3) return null;
    return [Number(rgb[0]), Number(rgb[1]), Number(rgb[2])];
  }

  function syncThemeColor() {
    const accent = getComputedStyle(document.body).getPropertyValue('--accent-light');
    const parsed = parseRGB(accent);
    if (parsed) {
      CFG.particleColor = parsed;
      CFG.lineColor = parsed;
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = W * H;
    const baseCount = reducedMotion ? 26 : (isMobile ? 64 : CFG.count);
    const target = Math.floor(baseCount * (area / (1920 * 1080)));
    const clamped = Math.max(40, Math.min(200, target));
    const finalCount = reducedMotion ? Math.min(clamped, 30) : (isMobile ? Math.min(clamped, 95) : clamped);

    while (particles.length < finalCount) particles.push(createParticle());
    while (particles.length > finalCount) particles.pop();
  }


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
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.002 + Math.random() * 0.003,
    };
  }

  function spawnComet() {
    if (comets.length >= CFG.cometMax) return;
    const speed = rand(CFG.cometSpeedMin, CFG.cometSpeedMax) * (isMobile ? 0.9 : 1);
    const side = Math.random();
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    if (side < 0.34) {
      x = -60;
      y = Math.random() * H * 0.65;
      vx = speed;
      vy = rand(-0.25, 0.65) * speed;
    } else if (side < 0.68) {
      x = W + 60;
      y = Math.random() * H * 0.65;
      vx = -speed;
      vy = rand(-0.25, 0.65) * speed;
    } else {
      x = Math.random() * W;
      y = -60;
      vx = rand(-0.55, 0.55) * speed;
      vy = speed;
    }
    const life = Math.floor((Math.max(W, H) + 180) / Math.max(0.2, Math.hypot(vx, vy)));
    comets.push({ x, y, vx, vy, life, maxLife: life, tail: [] });
  }

  function spawnAmbientShard() {
    if (reducedMotion || shards.length >= CFG.shardMax) return;
    const side = Math.random();
    let x = 0;
    let y = 0;
    if (side < 0.25) {
      x = -20;
      y = Math.random() * H;
    } else if (side < 0.5) {
      x = W + 20;
      y = Math.random() * H;
    } else if (side < 0.75) {
      x = Math.random() * W;
      y = -20;
    } else {
      x = Math.random() * W;
      y = H + 20;
    }
    const tx = rand(W * 0.2, W * 0.8);
    const ty = rand(H * 0.2, H * 0.8);
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = rand(CFG.shardSpeedMin, CFG.shardSpeedMax) * (isMobile ? 0.9 : 1);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    const maxLife = rand(5200, 12000);
    shards.push({
      x,
      y,
      vx,
      vy,
      life: maxLife,
      maxLife,
      size: rand(0.9, 1.9),
      tail: [],
    });
  }

  function updateEffects(now, dtMs) {
    if (!reducedMotion) {
      if (!nextCometAt) nextCometAt = now + rand(CFG.cometIntervalMin, CFG.cometIntervalMax);
      if (now >= nextCometAt) {
        spawnComet();
        nextCometAt = now + rand(CFG.cometIntervalMin, CFG.cometIntervalMax);
      }
      if (!nextAmbientShardAt) nextAmbientShardAt = now + rand(CFG.ambientShardIntervalMin, CFG.ambientShardIntervalMax);
      if (now >= nextAmbientShardAt) {
        spawnAmbientShard();
        nextAmbientShardAt = now + rand(CFG.ambientShardIntervalMin, CFG.ambientShardIntervalMax);
      }
    }

    const dt = dtMs / 16.67;
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.tail.push({ x: c.x, y: c.y });
      if (c.tail.length > CFG.cometTail) c.tail.shift();
      c.life -= dt;

      if (c.life <= 0 || c.x < -140 || c.x > W + 140 || c.y < -140 || c.y > H + 140) {
        comets.splice(i, 1);
      }
    }

    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.tail.push({ x: s.x, y: s.y });
      if (s.tail.length > CFG.shardTail) s.tail.shift();
      s.life -= dtMs;
      if (s.life <= 0 || s.x < -90 || s.x > W + 90 || s.y < -90 || s.y > H + 90) {
        shards.splice(i, 1);
      }
    }
  }

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

  function drawEffects(pr, pg, pb) {
    const rgb = `${pr},${pg},${pb}`;

    for (let i = 0; i < comets.length; i++) {
      const c = comets[i];
      for (let j = 1; j < c.tail.length; j++) {
        const a = c.tail[j - 1];
        const b = c.tail[j];
        const t = j / c.tail.length;
        ctx.strokeStyle = `rgba(${rgb},${0.34 * t})`;
        ctx.lineWidth = 0.8 + t * 3.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const headRadius = CFG.cometHeadSize;
      const head = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, headRadius);
      head.addColorStop(0, `rgba(${rgb},0.95)`);
      head.addColorStop(0.35, `rgba(${rgb},0.45)`);
      head.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(c.x, c.y, headRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const life = Math.max(0, s.life / s.maxLife);
      if (life <= 0) continue;
      const alpha = Math.min(1, 0.75 * life);
      for (let j = 1; j < s.tail.length; j++) {
        const a = s.tail[j - 1];
        const b = s.tail[j];
        const t = j / s.tail.length;
        ctx.strokeStyle = `rgba(${rgb},${0.22 * t * alpha})`;
        ctx.lineWidth = 0.5 + t * 1.4;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const headRadius = Math.max(2, s.size * 2.8);
      const head = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, headRadius);
      head.addColorStop(0, `rgba(${rgb},${0.9 * alpha})`);
      head.addColorStop(0.55, `rgba(${rgb},${0.38 * alpha})`);
      head.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(s.x, s.y, headRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd);

  function tick(timestamp) {
    animId = requestAnimationFrame(tick);

    const elapsed = timestamp - lastFrame;
    if (elapsed < frameInterval) return;
    lastFrame = timestamp - (elapsed % frameInterval);

    update();
    draw();
  }

  function update() {
    const now = performance.now();
    const dtMs = Math.min(40, Math.max(8, now - lastUpdateTs));
    lastUpdateTs = now;
    const mouseRadius = isMobile ? CFG.mouseRadius * 0.68 : CFG.mouseRadius;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.phase += p.phaseSpeed;
      p.vx += Math.sin(p.phase) * CFG.drift;
      p.vy += Math.cos(p.phase * 1.3) * CFG.drift;

      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 1) {
          const force = CFG.mouseForce * (1 - dist / mouseRadius);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;

      p.x += p.vx;
      p.y += p.vy;

      const pad = 20;
      if (p.x < -pad) p.x = W + pad;
      else if (p.x > W + pad) p.x = -pad;
      if (p.y < -pad) p.y = H + pad;
      else if (p.y > H + pad) p.y = -pad;
    }
    updateEffects(now, dtMs);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const lineDist = isMobile ? CFG.linkDist * 0.82 : CFG.linkDist;
    const mouseRadius = isMobile ? CFG.mouseRadius * 0.68 : CFG.mouseRadius;
    const mouseLineDist = isMobile ? CFG.mouseLineDist * 0.72 : CFG.mouseLineDist;
    const linkDist2 = lineDist * lineDist;
    const mouseDist2 = mouseLineDist * mouseLineDist;
    const [lr, lg, lb] = CFG.lineColor;
    const [pr, pg, pb] = CFG.particleColor;

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
        let alpha = CFG.lineAlpha * (1 - dist / lineDist);

        if (mouse.active) {
          const mx = (a.x + b.x) / 2 - mouse.x;
          const my = (a.y + b.y) / 2 - mouse.y;
          const md = Math.sqrt(mx * mx + my * my);
          if (md < mouseRadius) {
            alpha += CFG.mouseLineAlpha * (1 - md / mouseRadius);
          }
        }

        ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      if (mouse.active) {
        const dx = a.x - mouse.x;
        const dy = a.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouseDist2) {
          const dist = Math.sqrt(d2);
          const alpha = CFG.mouseLineAlpha * (1 - dist / mouseLineDist);
          ctx.strokeStyle = `rgba(${lr},${lg},${lb},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    drawEffects(pr, pg, pb);

    const glowTarget = (mouse.active && CFG.mouseGlow && !window.__onGlassPanel) ? 1 : 0;
    glowOpacity += (glowTarget - glowOpacity) * 0.04;
    if (glowOpacity > 0.005) {
      const grad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, mouseRadius * 0.6
      );
      grad.addColorStop(0, `rgba(${pr},${pg},${pb},${0.06 * glowOpacity})`);
      grad.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouseRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let alpha = CFG.particleAlpha * p.alpha;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius) {
          const boost = 1 + 1.5 * (1 - dist / mouseRadius);
          alpha = Math.min(1, alpha * boost);
        }
      }

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

      ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (CFG.pauseOffscreen) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastFrame = performance.now();
        lastUpdateTs = lastFrame;
        nextAmbientShardAt = lastFrame + rand(CFG.ambientShardIntervalMin, CFG.ambientShardIntervalMax);
        animId = requestAnimationFrame(tick);
      }
    });
  }

  window.addEventListener('resize', resize);
  const observer = new MutationObserver(syncThemeColor);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  syncThemeColor();
  resize();

  // Auto-start particles
  lastFrame = performance.now();
  lastUpdateTs = lastFrame;
  nextCometAt = lastFrame + rand(CFG.cometIntervalMin, CFG.cometIntervalMax);
  nextAmbientShardAt = lastFrame + rand(CFG.ambientShardIntervalMin, CFG.ambientShardIntervalMax);
  animId = requestAnimationFrame(tick);

  // Expose a global starter in case something needs to restart
  window.startParticles = function () {
    if (!animId) {
      lastFrame = performance.now();
      animId = requestAnimationFrame(tick);
    }
  };

})();

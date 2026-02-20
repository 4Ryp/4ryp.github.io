document.addEventListener("DOMContentLoaded", () => {
  const sfx = (() => {
    let ctx = null;
    function unlock() {
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume();
        return;
      }
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
    }
    ["click", "keydown", "pointerdown", "touchstart", "mousedown"].forEach(evt => {
      document.addEventListener(evt, unlock, { passive: true });
    });
    function osc(type, freq, duration, vol = 0.15, detune = 0) {
      if (!ctx || ctx.state !== "running") return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      if (detune) o.detune.value = detune;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + duration);
    }
    function noise(duration, vol = 0.08) {
      if (!ctx || ctx.state !== "running") return;
      const bufSize = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;
      src.connect(filter).connect(g).connect(ctx.destination);
      src.start(ctx.currentTime);
      src.stop(ctx.currentTime + duration);
    }
    function sweep(startFreq, endFreq, duration, type = "sine", vol = 0.12) {
      if (!ctx || ctx.state !== "running") return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(startFreq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + duration);
    }
    return {
      click() {
        osc("square", 1800, 0.06, 0.08);
        osc("sine", 2400, 0.04, 0.04);
      },
      select() {
        osc("sine", 880, 0.1, 0.12);
        setTimeout(() => osc("sine", 1320, 0.1, 0.1), 70);
      },
      whoosh() {
        sweep(300, 1800, 0.28, "sine", 0.09);
        sweep(600, 2200, 0.22, "triangle", 0.04);
        noise(0.25, 0.07);
        setTimeout(() => sweep(1800, 400, 0.18, "sine", 0.04), 80);
      },
      boot() {
        osc("square", 320 + Math.random() * 80, 0.06, 0.04);
      },
      type() {
        osc("square", 3200 + Math.random() * 800, 0.025, 0.04);
      },
      hover() {
        osc("sine", 2200, 0.06, 0.03);
      },
      open() {
        sweep(200, 900, 0.22, "sine", 0.1);
        noise(0.12, 0.03);
      },
      close() {
        sweep(800, 200, 0.2, "sine", 0.08);
      },
      toggle() {
        osc("triangle", 1400, 0.07, 0.1);
        osc("square", 700, 0.04, 0.03);
      },
      resolve() {
        osc("sine", 1600, 0.08, 0.1);
        osc("triangle", 2400, 0.06, 0.05);
      },
      glitch() {
        noise(0.15, 0.12);
        osc("sawtooth", 80, 0.12, 0.08);
        osc("square", 160, 0.08, 0.06, 1200);
      },
      nav() {
        osc("triangle", 600, 0.08, 0.1);
        noise(0.06, 0.03);
      },
      success() {
        osc("sine", 660, 0.12, 0.1);
        setTimeout(() => osc("sine", 880, 0.12, 0.1), 80);
        setTimeout(() => osc("sine", 1100, 0.15, 0.08), 160);
      },
      warn() {
        osc("sawtooth", 220, 0.15, 0.08);
        osc("square", 180, 0.12, 0.05);
      },
      swipe() {
        sweep(600, 1400, 0.12, "triangle", 0.07);
        noise(0.1, 0.03);
      }
    };
  })();
  /* ── ambient glow drift (randomized, never repeats) ── */
  (() => {
    const el = document.documentElement;
    const glows = [
      { x: 50, y: 38, tx: 50, ty: 38, sx: 0.02 + Math.random() * 0.03, sy: 0.015 + Math.random() * 0.025, name: 'glow1' },
      { x: 78, y: 75, tx: 78, ty: 75, sx: 0.015 + Math.random() * 0.025, sy: 0.02 + Math.random() * 0.03, name: 'glow2' },
      { x: 15, y: 22, tx: 15, ty: 22, sx: 0.025 + Math.random() * 0.03, sy: 0.018 + Math.random() * 0.025, name: 'glow3' }
    ];
    const ranges = [
      { xMin: 20, xMax: 75, yMin: 15, yMax: 65 },
      { xMin: 45, xMax: 95, yMin: 40, yMax: 90 },
      { xMin: 5,  xMax: 45, yMin: 8,  yMax: 50 }
    ];
    function pickTarget(i) {
      const r = ranges[i];
      glows[i].tx = r.xMin + Math.random() * (r.xMax - r.xMin);
      glows[i].ty = r.yMin + Math.random() * (r.yMax - r.yMin);
      glows[i].sx = 0.02 + Math.random() * 0.035;
      glows[i].sy = 0.015 + Math.random() * 0.03;
    }
    glows.forEach((_, i) => pickTarget(i));
    let last = performance.now();
    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      for (let i = 0; i < glows.length; i++) {
        const g = glows[i];
        const lx = 1 - Math.pow(1 - g.sx, dt * 8);
        const ly = 1 - Math.pow(1 - g.sy, dt * 8);
        g.x += (g.tx - g.x) * lx;
        g.y += (g.ty - g.y) * ly;
        if (Math.abs(g.tx - g.x) < 0.5 && Math.abs(g.ty - g.y) < 0.5) pickTarget(i);
        el.style.setProperty('--' + g.name + 'x', g.x.toFixed(1) + '%');
        el.style.setProperty('--' + g.name + 'y', g.y.toFixed(1) + '%');
      }
      requestAnimationFrame(tick);
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    requestAnimationFrame(tick);
  })();

  /* ── glass panel mouse glow ── */
  window.__onGlassPanel = false;
  document.querySelectorAll('.panel-glass, .cover-panel').forEach(panel => {
    panel.addEventListener('mousemove', e => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty('--glow-x', (e.clientX - r.left) + 'px');
      panel.style.setProperty('--glow-y', (e.clientY - r.top) + 'px');
      panel.classList.add('glow-active');
      window.__onGlassPanel = true;
    }, { passive: true });
    panel.addEventListener('mouseleave', () => {
      panel.classList.remove('glow-active');
      window.__onGlassPanel = false;
    });
  });

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
  const secretTerminal = document.getElementById("secretTerminal");
  const secretShell = document.getElementById("secretShell");
  const secretOutput = document.getElementById("secretOutput");
  const secretInput = document.getElementById("secretInput");
  const secretClose = document.getElementById("secretClose");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav  = document.querySelector(".nav-links");
  const themeBtns  = document.querySelectorAll(".theme-btn");
  const pageStatus = document.getElementById("pageStatus");
  const statusStrip = document.getElementById("statusStrip");
  let currentPage  = 0;
  let fileSelected = false;
  let isAnimating  = false;
  const animDuration = 350;
  let activePongCleanup = null;
  let activeBurgerCleanup = null;
  let secretAutoScroll = true;
  let tojiActive = false;
  let tojiSlashCleanup = null;
  let tojiSlashMeta = [];
  let disableBurger = null;
  {
    const secret = "burger";
    let secretBuf = "";
    let secretUnlocked = false;
    function onSecretKey(e) {
      if (secretUnlocked) return;
      secretBuf += e.key.toLowerCase();
      if (secretBuf.length > secret.length) {
        secretBuf = secretBuf.slice(-secret.length);
      }
      if (secretBuf === secret) {
        secretUnlocked = true;
        document.removeEventListener("keydown", onSecretKey);
        sfx.open();
        openSecretTerminal();
      }
    }
    document.addEventListener("keydown", onSecretKey);
    disableBurger = () => {
      if (!secretUnlocked) {
        secretUnlocked = true;
        document.removeEventListener("keydown", onSecretKey);
      }
    };
    setTimeout(() => disableBurger(), 10000);
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  function isSecretActive() {
    return !!secretTerminal?.classList.contains("active");
  }
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
  btnSan?.addEventListener("click", () => { sfx.select(); setMode("sanitized"); });
  btnRaw?.addEventListener("click", () => { sfx.select(); setMode("raw"); });
  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.theme === theme));
  }
  const savedTheme = localStorage.getItem("theme") || "crimson";
  setTheme(savedTheme);
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => { sfx.select(); setTheme(btn.dataset.theme || "crimson"); });
  });
  function appendSecretLine(text, cls = "") {
    if (!secretOutput) return;
    const line = document.createElement("div");
    line.className = `secret-line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    secretOutput.appendChild(line);
    scrollSecretToBottom();
  }
  function typewriterLine(text, cls = "", charDelay = 22) {
    if (!secretOutput) return Promise.resolve();
    return new Promise(resolve => {
      const line = document.createElement("div");
      line.className = `secret-line${cls ? ` ${cls}` : ""}`;
      line.textContent = "";
      secretOutput.appendChild(line);
      scrollSecretToBottom();
      let i = 0;
      const tick = setInterval(() => {
        if (!isSecretActive()) {
          clearInterval(tick);
          resolve();
          return;
        }
        if (i < text.length) {
          line.textContent += text[i];
          if (text[i] !== " ") sfx.type();
          i++;
          scrollSecretToBottom();
        } else {
          clearInterval(tick);
          resolve();
        }
      }, charDelay);
    });
  }
  function appendSecretNode(node) {
    if (!secretOutput) return;
    secretOutput.appendChild(node);
    scrollSecretToBottom();
  }
  function scrollSecretToBottom(force = false) {
    if (!secretOutput) return;
    if (!force && !secretAutoScroll) return;
    secretOutput.scrollTop = secretOutput.scrollHeight;
  }
  secretOutput?.addEventListener("scroll", () => {
    if (!secretOutput) return;
    const distance = secretOutput.scrollHeight - secretOutput.scrollTop - secretOutput.clientHeight;
    secretAutoScroll = distance < 24;
  });
  function randomBootLine() {
    const chars = "ABCDEF0123456789";
    let token = "";
    for (let i = 0; i < 18; i++) token += chars[Math.floor(Math.random() * chars.length)];
    return `[${token.slice(0, 6)}:${token.slice(6, 12)}:${token.slice(12)}] stream sync`;
  }
  function fitAsciiBlock(pre, columns, minPx = 5, maxPx = 11) {
    const available = Math.max(220, (secretOutput?.clientWidth || 800) - 18);
    const fs = Math.max(minPx, Math.min(maxPx, Math.floor(available / columns)));
    pre.style.setProperty("--ascii-fs", `${fs}px`);
    pre.style.fontSize = `${fs}px`;
    pre.style.lineHeight = "1.08";
  }
  function cleanupMiniApps() {
    if (activePongCleanup) {
      activePongCleanup();
      activePongCleanup = null;
    }
    if (activeBurgerCleanup) {
      activeBurgerCleanup();
      activeBurgerCleanup = null;
    }
  }
  function resetTojiFx() {
    tojiActive = false;
    tojiSlashMeta = [];
    if (tojiSlashCleanup) {
      tojiSlashCleanup();
      tojiSlashCleanup = null;
    }
    secretTerminal?.classList.remove(
      "toji-sequence", "toji-cut", "toji-whiteout", "toji-vanish",
      "toji-glitch", "toji-shake-1", "toji-shake-2", "toji-shake-3", "toji-redflash"
    );
    secretShell?.querySelector(".toji-crack-layer")?.remove();
    secretOutput?.querySelectorAll(".corrupted").forEach(el => el.classList.remove("corrupted"));
  }
  function ensureTojiLayers() {
    if (!secretShell) return null;
    let slashLayer = secretShell.querySelector(".toji-slash-layer");
    if (!slashLayer) {
      slashLayer = document.createElement("div");
      slashLayer.className = "toji-slash-layer";
      secretShell.appendChild(slashLayer);
    }
    let cutLayer = secretShell.querySelector(".toji-cut-layer");
    if (!cutLayer) {
      cutLayer = document.createElement("div");
      cutLayer.className = "toji-cut-layer";
      secretShell.appendChild(cutLayer);
    }
    return { slashLayer, cutLayer };
  }
  function randomEdgePoint(w, h) {
    const m = 0.03;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: Math.random() * w, y: h * m };
    if (edge === 1) return { x: w * (1 - m), y: Math.random() * h };
    if (edge === 2) return { x: Math.random() * w, y: h * (1 - m) };
    return { x: w * m, y: Math.random() * h };
  }
  function addTojiSlash(index) {
    if (!secretShell) return;
    const slashAudio = new Audio("slash.mp3");
    slashAudio.volume = 0.45;
    slashAudio.play().catch(() => {});
    const layers = ensureTojiLayers();
    if (!layers) return;
    const { slashLayer } = layers;
    const rect = secretShell.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const p1 = randomEdgePoint(w, h);
    const p2 = randomEdgePoint(w, h);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.max(160, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const line = document.createElement("span");
    line.className = "toji-slash";
    line.style.left = `${cx}px`;
    line.style.top = `${cy}px`;
    line.style.setProperty("--toji-len-px", `${len}px`);
    line.style.setProperty("--toji-angle", `${angle}deg`);
    line.style.setProperty("--toji-delay", `${Math.min(40, index * 3)}ms`);
    line.style.setProperty("--toji-dur", `${170 - Math.min(90, index * 4)}ms`);
    slashLayer.appendChild(line);
    const rad = (angle * Math.PI) / 180;
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    tojiSlashMeta.push({
      x: cx,
      y: cy,
      len,
      angle,
      tx: nx * (20 + Math.random() * 38),
      ty: ny * (20 + Math.random() * 38),
      thickness: 7 + Math.random() * 7,
    });
  }
  function applyTojiCutsFromSlashes() {
    if (!secretShell || !tojiSlashMeta.length) return;
    const layers = ensureTojiLayers();
    if (!layers) return;
    const { cutLayer } = layers;
    cutLayer.innerHTML = "";
    tojiSlashMeta.forEach((cut, i) => {
      const frag = document.createElement("span");
      frag.className = "toji-cut-fragment";
      frag.style.left = `${cut.x}px`;
      frag.style.top = `${cut.y}px`;
      frag.style.setProperty("--cut-len", `${cut.len * 0.94}px`);
      frag.style.setProperty("--cut-thickness", `${cut.thickness}px`);
      frag.style.setProperty("--cut-angle", `${cut.angle}deg`);
      frag.style.setProperty("--cut-tx", `${cut.tx}px`);
      frag.style.setProperty("--cut-ty", `${cut.ty}px`);
      frag.style.setProperty("--cut-delay", `${Math.min(200, i * 8)}ms`);
      frag.style.setProperty("--cut-dur", `${560 + Math.random() * 240}ms`);
      cutLayer.appendChild(frag);
    });
    tojiSlashCleanup = () => {
      cutLayer.remove();
      layers.slashLayer.remove();
    };
  }
  async function runSecretBoot() {
    if (!secretOutput || !secretInput) return;
    cleanupMiniApps();
    secretOutput.innerHTML = "";
    secretAutoScroll = true;
    secretInput.disabled = true;
    secretInput.value = "";
    await typewriterLine("intercept:: rerouting session to hidden shell...", "dim", 18);
    if (!isSecretActive()) return;
    await sleep(220);
    for (let i = 0; i < 9; i++) {
      if (!isSecretActive()) return;
      appendSecretLine(randomBootLine(), "dim");
      sfx.boot();
      await sleep(80 + Math.random() * 45);
    }
    if (!isSecretActive()) return;
    await typewriterLine("buffer decode complete", "ok", 20);
    if (!isSecretActive()) return;
    await typewriterLine("four commands available in this mode", "warn", 20);
    if (!isSecretActive()) return;
    await typewriterLine("type `help`", "ok", 25);
    if (!isSecretActive()) return;
    secretInput.disabled = false;
    secretInput.focus();
  }
  function openSecretTerminal() {
    if (!secretTerminal) return;
    secretAutoScroll = true;
    secretTerminal.classList.add("active", "stretch");
    secretTerminal.setAttribute("aria-hidden", "false");
    setTimeout(() => secretTerminal.classList.remove("stretch"), 760);
    runSecretBoot();
  }
  function closeSecretTerminal() {
    if (!secretTerminal) return;
    cleanupMiniApps();
    resetTojiFx();
    secretTerminal.classList.remove("active", "stretch");
    secretTerminal.setAttribute("aria-hidden", "true");
    if (secretInput) secretInput.disabled = false;

  }
  function startPingPong() {
    cleanupMiniApps();
    typewriterLine("launching ping pong , controls r LEFT/RIGHT or A/D", "ok", 18);
    const wrap = document.createElement("div");
    wrap.className = "pingpong-wrap";
    const canvas = document.createElement("canvas");
    canvas.className = "pingpong-canvas";
    wrap.appendChild(canvas);
    appendSecretNode(wrap);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxPlayableW = 560;
    const minPlayableW = 320;
    const outputW = secretOutput?.clientWidth || 720;
    const W = Math.max(minPlayableW, Math.min(maxPlayableW, Math.floor(outputW * 0.72)));
    const H = Math.max(180, Math.floor(W * 0.5));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wrap.style.width = `${W}px`;
    wrap.style.maxWidth = "100%";
    const paddleW = Math.max(70, Math.floor(W * 0.17));
    const paddleH = Math.max(8, Math.floor(H * 0.04));
    const playerY = H - Math.max(16, Math.floor(H * 0.07));
    const aiY = Math.max(8, Math.floor(H * 0.03));
    let playerX = (W - paddleW) / 2;
    let aiX = (W - paddleW) / 2;
    let leftDown = false;
    let rightDown = false;
    let playerScore = 0;
    let aiScore = 0;
    let rafId = 0;
    let lastTs = 0;
    let serveUntil = 0;
    let countdownText = "3";
    const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: Math.max(6, Math.floor(H * 0.03)) };
    function resetBall(direction = 1) {
      ball.x = W / 2;
      ball.y = H / 2;
      const baseSpeed = 220;
      const angle = (Math.random() * 0.8 - 0.4);
      ball.vx = Math.sin(angle) * baseSpeed;
      ball.vy = Math.cos(angle) * baseSpeed * direction;
      serveUntil = performance.now() + 1200;
      countdownText = "3";
    }
    function keyDown(e) {
      if (!isSecretActive()) return;
      const key = e.key.toLowerCase();
      if (e.key === "ArrowLeft" || key === "a") {
        leftDown = true;
        e.preventDefault();
      }
      if (e.key === "ArrowRight" || key === "d") {
        rightDown = true;
        e.preventDefault();
      }
    }
    function keyUp(e) {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") leftDown = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rightDown = false;
    }
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cs = getComputedStyle(document.body);
      const themeA = (cs.getPropertyValue("--accent-light") || "#4aa9da").trim();
      const themeB = (cs.getPropertyValue("--accent-bright") || "#92d8ff").trim();
      const enemyA = "#ff4d6d";
      const enemyB = "#ff7f96";
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "rgba(10, 18, 28, .96)");
      bgGrad.addColorStop(1, "rgba(6, 11, 18, .98)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
      function drawNeonPaddle(x, y, w, h, c1, c2) {
        const strokeGrad = ctx.createLinearGradient(x, y, x + w, y);
        strokeGrad.addColorStop(0, c1);
        strokeGrad.addColorStop(1, c2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = strokeGrad;
        ctx.shadowColor = c1;
        ctx.shadowBlur = 12;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.shadowBlur = 0;
        ctx.fillStyle = c2;
        ctx.fillRect(x + 3, y + h * 0.45, Math.max(8, w * 0.12), Math.max(2, h * 0.2));
        ctx.fillRect(x + w - Math.max(8, w * 0.12) - 3, y + h * 0.45, Math.max(8, w * 0.12), Math.max(2, h * 0.2));
      }
      ctx.strokeStyle = "rgba(255,255,255,.1)";
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawNeonPaddle(playerX, playerY, paddleW, paddleH, themeA, themeB);
      drawNeonPaddle(aiX, aiY, paddleW, paddleH, enemyA, enemyB);
      ctx.fillStyle = "#e6efff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = "#dbe8ff";
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, Math.max(2, ball.r * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,.78)";
      ctx.font = `${Math.max(12, Math.floor(W * 0.028))}px JetBrains Mono`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(`YOU ${playerScore}`, 12, H / 2 + 14);
      ctx.textAlign = "right";
      ctx.fillText(`BOT ${aiScore}`, W - 12, H / 2 - 14);
      ctx.textAlign = "left";
      if (serveUntil > performance.now()) {
        const left = Math.max(0, serveUntil - performance.now());
        countdownText = left > 800 ? "3" : left > 400 ? "2" : "1";
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.font = `${Math.max(14, Math.floor(W * 0.05))}px JetBrains Mono`;
        ctx.textAlign = "center";
        const countdownX = ball.x;
        const countdownY = Math.max(18, ball.y - ball.r - 14);
        ctx.fillText(countdownText, countdownX, countdownY);
        ctx.textAlign = "left";
      }
    }
    function loop(ts = 0) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.03);
      lastTs = ts;
      const playerSpeed = Math.max(260, W * 0.9);
      if (leftDown) playerX -= playerSpeed * dt;
      if (rightDown) playerX += playerSpeed * dt;
      playerX = Math.max(0, Math.min(W - paddleW, playerX));
      aiX += ((ball.x - paddleW / 2) - aiX) * Math.min(1, dt * 7);
      aiX = Math.max(0, Math.min(W - paddleW, aiX));
      if (ts >= serveUntil) {
        const totalDX = ball.vx * dt;
        const totalDY = ball.vy * dt;
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(totalDX), Math.abs(totalDY)) / 4));
        const stepX = totalDX / steps;
        const stepY = totalDY / steps;
        for (let s = 0; s < steps; s++) {
          ball.x += stepX;
          ball.y += stepY;
          if (ball.x <= ball.r) {
            ball.x = ball.r;
            ball.vx = Math.abs(ball.vx);
          } else if (ball.x >= W - ball.r) {
            ball.x = W - ball.r;
            ball.vx = -Math.abs(ball.vx);
          }
          if (
            ball.vy > 0 &&
            ball.y + ball.r >= playerY &&
            ball.y - ball.r <= playerY + paddleH &&
            ball.x >= playerX - ball.r &&
            ball.x <= playerX + paddleW + ball.r
          ) {
            const speed = Math.min(680, Math.hypot(ball.vx, ball.vy) * 1.035);
            const english = ((ball.x - (playerX + paddleW / 2)) / (paddleW / 2)) * 0.85;
            const angle = Math.max(-1.05, Math.min(1.05, english));
            ball.vx = Math.sin(angle) * speed;
            ball.vy = -Math.abs(Math.cos(angle) * speed);
            ball.y = playerY - ball.r - 0.5;
          }
          if (
            ball.vy < 0 &&
            ball.y - ball.r <= aiY + paddleH &&
            ball.y + ball.r >= aiY &&
            ball.x >= aiX - ball.r &&
            ball.x <= aiX + paddleW + ball.r
          ) {
            const speed = Math.min(680, Math.hypot(ball.vx, ball.vy) * 1.03);
            const english2 = ((ball.x - (aiX + paddleW / 2)) / (paddleW / 2)) * 0.65;
            const angle2 = Math.max(-0.95, Math.min(0.95, english2));
            ball.vx = Math.sin(angle2) * speed;
            ball.vy = Math.abs(Math.cos(angle2) * speed);
            ball.y = aiY + paddleH + ball.r + 0.5;
          }
        }
      }
      if (ball.y < -20) {
        playerScore += 1;
        resetBall(1);
      } else if (ball.y > H + 20) {
        aiScore += 1;
        resetBall(-1);
      }
      draw();
      if (playerScore >= 5 || aiScore >= 5) {
        appendSecretLine(playerScore >= 5 ? "you win. gg." : "bot wins. try again.", playerScore >= 5 ? "ok" : "warn");
        return;
      }
      rafId = requestAnimationFrame(loop);
    }
    resetBall(Math.random() > 0.5 ? 1 : -1);
    loop();
    activePongCleanup = () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
    };
  }
  function startBurger() {
    cleanupMiniApps();
    typewriterLine("rendering big burger heh...", "ok", 20);
    const container = document.createElement("div");
    container.style.marginTop = "0.55rem";
    container.style.display = "block";
    container.style.width = "100%";
    const video = document.createElement("video");
    video.src = "https://images-ext-1.discordapp.net/external/nnkfWFULsdExlViGtivv6Ou9VlpDsh61f5U2Fen9Gis/https/media.tenor.com/T1CWkmDjiZgAAAPo/cheeseburger-stacked.mp4";
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.display = "block";
    video.style.width = "min(320px, 72%)";
    video.style.maxWidth = "100%";
    video.style.height = "auto";
    video.style.margin = "0";
    video.style.border = "1px solid rgba(255,255,255,.12)";
    video.style.borderRadius = "8px";
    video.style.background = "#000";
    video.style.boxShadow = "0 0 22px rgba(0,0,0,.35)";
    container.appendChild(video);
    appendSecretNode(container);
    const keepPinned = () => {
      scrollSecretToBottom();
      setTimeout(scrollSecretToBottom, 40);
      setTimeout(scrollSecretToBottom, 140);
    };
    video.addEventListener("loadedmetadata", keepPinned);
    video.addEventListener("loadeddata", keepPinned);
    video.addEventListener("canplay", keepPinned);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        appendSecretLine("autoplay blocked. press space or click the video.", "warn");
      });
    }
    activeBurgerCleanup = () => {
      video.removeEventListener("loadedmetadata", keepPinned);
      video.removeEventListener("loadeddata", keepPinned);
      video.removeEventListener("canplay", keepPinned);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }
  function startDonut() {
    cleanupMiniApps();
    typewriterLine("rendering donut math thing...", "ok", 20);
    const pre = document.createElement("pre");
    pre.className = "ascii-burger";
    pre.style.margin = "0.55rem 0 0";
    appendSecretNode(pre);
    const outputW = secretOutput?.clientWidth || 760;
    const width = Math.max(52, Math.min(92, Math.floor((outputW - 18) / 7)));
    const height = Math.max(16, Math.floor(width * 0.28));
    const shades = ".,-~:;=!*#$@";
    let A = 0;
    let B = 0;
    fitAsciiBlock(pre, width, 6, 12);
    const ticker = setInterval(() => {
      const output = new Array(width * height).fill(" ");
      const zbuffer = new Array(width * height).fill(0);
      for (let j = 0; j < 6.28; j += 0.07) {
        for (let i = 0; i < 6.28; i += 0.02) {
          const c = Math.sin(i);
          const d = Math.cos(j);
          const e = Math.sin(A);
          const f = Math.sin(j);
          const g = Math.cos(A);
          const h = d + 2;
          const D = 1 / (c * h * e + f * g + 5);
          const l = Math.cos(i);
          const m = Math.cos(B);
          const n = Math.sin(B);
          const t = c * h * g - f * e;
          const x = Math.floor(width / 2 + (width * 0.38) * D * (l * h * m - t * n));
          const y = Math.floor(height / 2 + (height * 0.7) * D * (l * h * n + t * m));
          const o = x + width * y;
          const N = Math.floor(8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n));
          if (y > 0 && y < height && x > 0 && x < width && D > zbuffer[o]) {
            zbuffer[o] = D;
            output[o] = shades[N > 0 ? N : 0];
          }
        }
      }
      let frame = "";
      for (let k = 0; k < output.length; k++) {
        frame += (k % width) ? output[k] : "\n";
      }
      pre.textContent = frame;
      A += 0.04;
      B += 0.02;
      scrollSecretToBottom();
    }, 50);
    const onResize = () => fitAsciiBlock(pre, width, 6, 12);
    window.addEventListener("resize", onResize);
    activeBurgerCleanup = () => {
      clearInterval(ticker);
      window.removeEventListener("resize", onResize);
    };
  }
  async function handleSecretCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    appendSecretLine(`> ${raw}`, "secret-cmd");
    sfx.click();
    if (cmd === "help") {
      await typewriterLine("commands:", "ok", 20);
      await typewriterLine("  ping pong  - ping", "", 18);
      await typewriterLine("  burger     - big burger vs small burger", "", 18);
      await typewriterLine("  donut      - math stuff", "", 18);
      await typewriterLine("  toji       - ...?", "", 18);
      return;
    }
    if (cmd === "ping pong" || cmd === "pingpong") {
      startPingPong();
      return;
    }
    if (cmd === "burger") {
      startBurger();
      return;
    }
    if (cmd === "donut") {
      startDonut();
      return;
    }
    if (cmd === "toji") {
      startToji();
      return;
    }
    appendSecretLine(`unknown command: ${cmd}`, "warn");
    await typewriterLine("type `help`", "dim", 25);
  }
  function glitchText(original) {
    const glitchChars = "█▓▒░▄▀▐▌┃┫┣╋╳※¤@#";
    let out = "";
    for (let i = 0; i < original.length; i++) {
      if (original[i] === " ") { out += " "; continue; }
      out += Math.random() < 0.45
        ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
        : original[i];
    }
    return out;
  }
  function appendGlitchLine(text, cls = "warn", iterations = 4, intervalMs = 60) {
    if (!secretOutput) return Promise.resolve();
    const glitchChars = "█▓▒░▄▀▐▌┃┫┣╋╳※¤@#";
    const line = document.createElement("div");
    line.className = `secret-line ${cls}`;
    line.textContent = "";
    secretOutput.appendChild(line);
    scrollSecretToBottom();
    return new Promise(resolve => {
      let ci = 0;
      const typeTimer = setInterval(() => {
        if (!isSecretActive()) {
          clearInterval(typeTimer);
          resolve();
          return;
        }
        if (ci < text.length) {
          if (text[ci] === " ") {
            line.textContent += " ";
          } else {
            line.textContent += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            sfx.type();
          }
          ci++;
          scrollSecretToBottom();
        } else {
          clearInterval(typeTimer);
          let count = 0;
          const iv = setInterval(() => {
            if (!isSecretActive()) {
              clearInterval(iv);
              resolve();
              return;
            }
            count++;
            if (count >= iterations) {
              clearInterval(iv);
              line.textContent = text;
              resolve();
            } else {
              line.textContent = glitchText(text);
              sfx.glitch();
            }
          }, intervalMs);
        }
      }, 22);
    });
  }
  function corruptVisibleLines() {
    if (!secretOutput) return;
    const lines = secretOutput.querySelectorAll(".secret-line");
    const glitchChars = "█▓▒░▄▀┃╋╳";
    lines.forEach(line => {
      if (Math.random() < 0.6) {
        const orig = line.textContent || "";
        let corrupted = "";
        for (let i = 0; i < orig.length; i++) {
          corrupted += Math.random() < 0.35
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : orig[i];
        }
        line.textContent = corrupted;
        line.classList.add("corrupted");
      }
    });
  }
  function addTojiCrack() {
    if (!secretShell) return;
    const layers = ensureTojiLayers();
    if (!layers) return;
    let crackLayer = secretShell.querySelector(".toji-crack-layer");
    if (!crackLayer) {
      crackLayer = document.createElement("div");
      crackLayer.className = "toji-crack-layer";
      secretShell.appendChild(crackLayer);
    }
    const rect = secretShell.getBoundingClientRect();
    const crack = document.createElement("span");
    crack.className = "toji-crack";
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    const angle = Math.random() * 360;
    const len = 60 + Math.random() * 140;
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.setProperty("--crack-angle", `${angle}deg`);
    crack.style.setProperty("--crack-len", `${len}px`);
    crackLayer.appendChild(crack);
  }
  async function startToji() {
    if (!secretTerminal || !secretInput) return;
    cleanupMiniApps();
    resetTojiFx();
    tojiActive = true;
    secretInput.disabled = true;
    const tojiVideoWrap = document.createElement("div");
    tojiVideoWrap.className = "toji-video-wrap";
    const tojiVideo = document.createElement("video");
    tojiVideo.className = "toji-video";
    tojiVideo.src = "toji.mov";
    tojiVideo.playsInline = true;
    tojiVideo.muted = false;
    tojiVideo.preload = "auto";
    tojiVideo.setAttribute("playsinline", "");
    tojiVideoWrap.appendChild(tojiVideo);
    await typewriterLine("...", "dim", 180);
    await sleep(600);
    await appendGlitchLine("Zero code energy detected.", "warn", 5, 55);
    await sleep(600);
    await appendGlitchLine("Could it be...? the one who left no errors behind...?", "dim", 3, 50);
    await sleep(850);
    secretTerminal.classList.add("toji-glitch");
    await sleep(500);
    await appendGlitchLine("Script manipulation? Useless.", "warn corrupted", 6, 40);
    await sleep(1250);
    await typewriterLine("API integrity ████████░░ 78%", "dim", 15);
    await sleep(180);
    await typewriterLine("API integrity ████░░░░░░ 38%", "warn", 15);
    await sleep(140);
    await typewriterLine("API integrity ░░░░░░░░░░  0%", "warn corrupted", 15);
    await sleep(200);
    secretTerminal.classList.add("toji-shake-1");
    await appendGlitchLine("Inverted Spear of Heaven.", "warn", 5, 50);
    await sleep(400);
    corruptVisibleLines();
    await sleep(200);
    secretTerminal.classList.remove("toji-shake-1");
    secretTerminal.classList.add("toji-shake-2");
        secretTerminal.classList.remove("toji-glitch");
    const pace = [
      320, 280, 250, 220, 200, 180, 160, 140, 120, 105,
       92,  80,  70,  58,  48,  40,  34,  30,  26,  22
    ];
    for (let i = 0; i < 20; i++) {
      addTojiSlash(i);
      if (i % 5 === 4) addTojiCrack();
      await sleep(pace[i]);
    }
    secretTerminal.classList.remove("toji-shake-2");
    secretTerminal.classList.add("toji-shake-3");
    secretTerminal.classList.add("toji-sequence");
    corruptVisibleLines();
    await sleep(120);
    applyTojiCutsFromSlashes();
    secretTerminal.classList.add("toji-cut");
    secretTerminal.classList.add("toji-redflash");
    await sleep(60);
    secretTerminal.classList.add("toji-whiteout");
    await sleep(180);
    secretTerminal.classList.add("toji-vanish");
    await sleep(300);
    closeSecretTerminal();
    await sleep(400);
    await tojiCutsceneSiteRampage(tojiVideoWrap, tojiVideo);
  }
  function ensurePageSlashLayers(target) {
    const pos = getComputedStyle(target).position;
    if (pos === "static") target.style.position = "relative";
    let slashLayer = target.querySelector(".toji-page-slash-layer");
    if (!slashLayer) {
      slashLayer = document.createElement("div");
      slashLayer.className = "toji-page-slash-layer";
      target.appendChild(slashLayer);
    }
    let cutLayer = target.querySelector(".toji-page-cut-layer");
    if (!cutLayer) {
      cutLayer = document.createElement("div");
      cutLayer.className = "toji-page-cut-layer";
      target.appendChild(cutLayer);
    }
    return { slashLayer, cutLayer };
  }
  function addPageSlash(target, index, meta) {
    const slashAudio = new Audio("slash.mp3");
    slashAudio.volume = 0.45;
    slashAudio.play().catch(() => {});
    const { slashLayer } = ensurePageSlashLayers(target);
    const rect = target.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const m = 0.05;
    const edgePt = () => {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) return { x: Math.random() * w, y: h * m };
      if (edge === 1) return { x: w * (1 - m), y: Math.random() * h };
      if (edge === 2) return { x: Math.random() * w, y: h * (1 - m) };
      return { x: w * m, y: Math.random() * h };
    };
    const p1 = edgePt();
    const p2 = edgePt();
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.max(120, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const line = document.createElement("span");
    line.className = "toji-slash";
    line.style.left = `${cx}px`;
    line.style.top = `${cy}px`;
    line.style.setProperty("--toji-len-px", `${len}px`);
    line.style.setProperty("--toji-angle", `${angle}deg`);
    line.style.setProperty("--toji-delay", `${Math.min(30, index * 3)}ms`);
    line.style.setProperty("--toji-dur", `${150 - Math.min(80, index * 5)}ms`);
    slashLayer.appendChild(line);
    const rad = (angle * Math.PI) / 180;
    const nx = -Math.sin(rad);
    const ny = Math.cos(rad);
    meta.push({
      x: cx, y: cy, len, angle,
      tx: nx * (15 + Math.random() * 30),
      ty: ny * (15 + Math.random() * 30),
      thickness: 5 + Math.random() * 6,
    });
  }
  function applyPageCuts(target, meta) {
    const { cutLayer } = ensurePageSlashLayers(target);
    cutLayer.innerHTML = "";
    meta.forEach((cut, i) => {
      const frag = document.createElement("span");
      frag.className = "toji-cut-fragment";
      frag.style.left = `${cut.x}px`;
      frag.style.top = `${cut.y}px`;
      frag.style.setProperty("--cut-len", `${cut.len * 0.94}px`);
      frag.style.setProperty("--cut-thickness", `${cut.thickness}px`);
      frag.style.setProperty("--cut-angle", `${cut.angle}deg`);
      frag.style.setProperty("--cut-tx", `${cut.tx}px`);
      frag.style.setProperty("--cut-ty", `${cut.ty}px`);
      frag.style.setProperty("--cut-delay", `${Math.min(150, i * 6)}ms`);
      frag.style.setProperty("--cut-dur", `${450 + Math.random() * 200}ms`);
      cutLayer.appendChild(frag);
    });
  }
  function cleanupPageTojiLayers(target) {
    target.querySelector(".toji-page-slash-layer")?.remove();
    target.querySelector(".toji-page-cut-layer")?.remove();
    target.classList.remove(
      "toji-page-shake", "toji-page-cut", "toji-page-redflash", "toji-page-whiteout", "toji-page-dead"
    );
  }
  async function tojiSlashTarget(target, slashCount = 12, fast = false) {
    const meta = [];
    target.classList.add("toji-page-shake");
    const pace = [];
    for (let i = 0; i < slashCount; i++) {
      pace.push(Math.max(fast ? 10 : 18, (fast ? 120 : 200) - i * (fast ? 10 : 14)));
    }
    for (let i = 0; i < slashCount; i++) {
      addPageSlash(target, i, meta);
      await sleep(pace[i]);
    }
    target.classList.remove("toji-page-shake");
    target.classList.add("toji-page-cut");
    applyPageCuts(target, meta);
    await sleep(fast ? 30 : 80);
    const redFlash = document.createElement("div");
    redFlash.className = "toji-fullscreen-redflash";
    document.body.appendChild(redFlash);
    await sleep(fast ? 20 : 60);
    const whiteFlash = document.createElement("div");
    whiteFlash.className = "toji-fullscreen-whiteout";
    document.body.appendChild(whiteFlash);
    void whiteFlash.offsetWidth; 
    whiteFlash.classList.add("flash-in");
    await sleep(fast ? 150 : 250);
    target.classList.add("toji-page-dead");
    redFlash.remove();
    return whiteFlash;
  }
  async function tojiCutsceneSiteRampage(tojiVideoWrap, tojiVideo) {
    document.body.classList.add("toji-cutscene-active");
    if (cover) {
      cover.classList.remove("cover-exit");
      cover.style.opacity = "1";
      cover.style.visibility = "visible";
      cover.style.pointerEvents = "none";
      cover.style.overflow = "hidden";
      await sleep(300);
      const coverWhite = await tojiSlashTarget(cover, 10, true);
      coverWhite.classList.remove("flash-in");
      coverWhite.classList.add("flash-out");
      await sleep(100);
      cover.style.display = "none";
      cleanupPageTojiLayers(cover);
      await sleep(250);
      coverWhite.remove();
    }
    terminal?.classList.add("active");
    nav?.classList.remove("nav-hidden");
    statusStrip?.classList.remove("nav-hidden");
    const pageOrder = [0, 1, 2, 3]; 
    let prevWhiteFlash = null;
    for (let pi = 0; pi < pageOrder.length; pi++) {
      const idx = pageOrder[pi];
      const panel = panels[idx];
      if (!panel) continue;
      panels.forEach((p, i) => {
        p.style.transition = "none";
        p.classList.remove("active", "exit-left");
        if (i === idx) {
          p.classList.add("active");
        }
      });
      void panel.offsetWidth;
      updateUI(idx);
      currentPage = idx;
      panel.querySelectorAll(".reveal").forEach(el => {
        el.style.transition = "none";
        el.style.transitionDelay = "0s";
        el.classList.add("visible");
      });
      void panel.offsetWidth; 
      if (prevWhiteFlash) {
        prevWhiteFlash.classList.remove("flash-in");
        prevWhiteFlash.classList.add("flash-out");
        await sleep(350);
        prevWhiteFlash.remove();
        prevWhiteFlash = null;
      } else {
        await sleep(350);
      }
      const glass = panel.querySelector(".panel-glass") || panel;
      const whiteFlash = await tojiSlashTarget(glass, pi === 3 ? 14 : 10, true);
      cleanupPageTojiLayers(glass);
      prevWhiteFlash = whiteFlash;
    }
    panels.forEach(p => {
      p.classList.remove("active");
      p.style.cssText = "";
    });
    nav?.classList.add("nav-hidden");
    statusStrip?.classList.add("nav-hidden");
    terminal?.classList.remove("active");
    if (prevWhiteFlash) {
      prevWhiteFlash.classList.remove("flash-in");
      prevWhiteFlash.classList.add("flash-out");
      await sleep(350);
      prevWhiteFlash.remove();
    }
    await sleep(150);
    const siteOverlay = document.createElement("div");
    siteOverlay.className = "toji-site-overlay";
    document.body.appendChild(siteOverlay);
    await sleep(50);
    const whiteScreen = document.createElement("div");
    whiteScreen.className = "toji-final-white";
    document.body.appendChild(whiteScreen);
    await tojiSlashTarget(siteOverlay, 22, true);
    void whiteScreen.offsetWidth;
    whiteScreen.classList.add("active");
    await sleep(100);
    siteOverlay.remove();
    await sleep(600);
    document.body.appendChild(tojiVideoWrap);
    void tojiVideoWrap.offsetWidth;
    tojiVideoWrap.classList.add("active");
    await sleep(300);
    try {
      await tojiVideo.play();
    } catch {
      tojiVideo.muted = true;
      try { await tojiVideo.play(); } catch {  }
    }
    await new Promise(resolve => {
      tojiVideo.addEventListener("ended", resolve, { once: true });
      setTimeout(resolve, (tojiVideo.duration || 30) * 1000 + 2000);
    });
    location.reload();
  }

  secretClose?.addEventListener("click", () => {
    sfx.close();
    closeSecretTerminal();
  });
  secretInput?.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    sfx.click();
    const value = secretInput.value;
    secretInput.value = "";
    handleSecretCommand(value);
  });
  function openFile() {
    if (!fileSelected) return;
    cancelNameAnimation();
    if (disableBurger) disableBurger();
    sfx.open();
    cover?.classList.add("cover-exit");
    openBtn?.classList.remove("visible");
    setTimeout(() => {
      terminal?.classList.add("active");
      nav?.classList.remove("nav-hidden");
      statusStrip?.classList.remove("nav-hidden");
      goToPage(0, false);
      panels.forEach(p => triggerReveals(p));
    }, 350);
  }
  openBtn?.addEventListener("click", openFile);
  panels.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "page-dot";
    dot.setAttribute("aria-label", `Page ${i + 1}`);
    dot.addEventListener("click", () => { sfx.click(); goToPage(i); });
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
    sfx.whoosh();
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
    if (pageStatus) pageStatus.textContent = `${index + 1} / ${panels.length}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === panels.length - 1;
  }
  prevBtn?.addEventListener("click", () => { sfx.nav(); goToPage(currentPage - 1); });
  nextBtn?.addEventListener("click", () => { sfx.nav(); goToPage(currentPage + 1); });
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const idx = parseInt(link.dataset.page, 10);
      if (!isNaN(idx)) { sfx.nav(); goToPage(idx); }
      menuToggle?.classList.remove("open");
      mobileNav?.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
  document.querySelector(".nav-logo")?.addEventListener("click", e => {
    e.preventDefault();
    sfx.close();
    terminal?.classList.remove("active");
    nav?.classList.add("nav-hidden");
    statusStrip?.classList.add("nav-hidden");
    setTimeout(() => {
      cover?.classList.remove("cover-exit");
      if (fileSelected) openBtn?.classList.add("visible");
      resetNameAnimation();
      setTimeout(runNameAnimation, 400);
    }, 300);
  });
  document.addEventListener("keydown", e => {
    if (isSecretActive()) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (tojiActive) return;
        sfx.close();
        closeSecretTerminal();
      }
      return;
    }
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
    if (isSecretActive()) return;
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
    if (isSecretActive()) return;
    if (!terminal?.classList.contains("active")) return;
    if (isAnimating) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (isSecretActive()) return;
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
    if (isSecretActive()) return;
    if (!terminal?.classList.contains("active")) return;
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) >= 40) {
      goToPage(currentPage + (dx < 0 ? 1 : -1));
    }
    isSwiping = false;
  });
  function triggerReveals(panel) {
    panel.querySelectorAll(".reveal:not(.visible)").forEach((el, idx) => {
      el.style.transitionDelay = `${Math.min(idx * 0.08, 0.45)}s`;
      el.classList.add("visible");
    });
  }
  document.querySelectorAll(".exhibit").forEach(details => {
    const toggle = details.querySelector(".exhibit-toggle");
    if (toggle) {
      details.addEventListener("toggle", () => {
        sfx.toggle();
        toggle.textContent = details.open ? "" : "\u25B8 expand";
      });
    }
  });
  document.querySelectorAll(".exhibit-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      sfx.click();
      const href = link.getAttribute("href");
      if (href && href !== "#") window.open(href, "_blank");
    });
  });
  menuToggle?.addEventListener("click", () => {
    sfx.toggle();
    menuToggle.classList.toggle("open");
    mobileNav?.classList.toggle("open");
    const isOpen = mobileNav?.classList.contains("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  const coverLabel    = document.getElementById("coverLabel");
  const nameLetters   = document.getElementById("nameLetters");
  const coverNameEl   = document.getElementById("coverName");
  const glowLine      = document.getElementById("nameGlowLine");
  const letters       = nameLetters ? nameLetters.querySelectorAll(".letter") : [];
  let nameAnimTimers = [];
  let nameAnimCancelled = false;
  const glyphPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*<>{}[]=/\\|~^";
  function randomGlyph() {
    return glyphPool[Math.floor(Math.random() * glyphPool.length)];
  }
  function runNameAnimation() {
    nameAnimCancelled = false;
    nameAnimTimers = [];
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
      const outerTimer = setTimeout(() => {
        if (nameAnimCancelled) return;
        el.classList.add("scrambling");
        el.textContent = randomGlyph();
        const scrambleEnd = performance.now() + scrambleDuration;
        function scrambleStep() {
          if (nameAnimCancelled) return;
          if (performance.now() < scrambleEnd) {
            el.textContent = randomGlyph();
            sfx.type();
            const t = setTimeout(scrambleStep, scrambleInterval);
            nameAnimTimers.push(t);
          } else {
            el.textContent = finalChar;
            el.classList.remove("scrambling");
            el.classList.add("resolved");
            sfx.resolve();
            if (i === letters.length - 1) {
              const t = setTimeout(() => {
                if (nameAnimCancelled) return;
                sfx.glitch();
                coverNameEl?.classList.add("glitch-flash");
                glowLine?.classList.add("sweep");
                if (coverLabel) {
                  coverLabel.classList.remove("typing");
                  coverLabel.classList.add("typed");
                }
                const t2 = setTimeout(() => coverNameEl?.classList.remove("glitch-flash"), 700);
                nameAnimTimers.push(t2);
              }, 200);
              nameAnimTimers.push(t);
            }
          }
        }
        scrambleStep();
      }, startTime);
      nameAnimTimers.push(outerTimer);
    });
  }
  function cancelNameAnimation() {
    nameAnimCancelled = true;
    nameAnimTimers.forEach(t => clearTimeout(t));
    nameAnimTimers = [];
  }
  function resetNameAnimation() {
    cancelNameAnimation();
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
  const hoverTargets = [
    ...document.querySelectorAll(".file-btn, .open-btn, .theme-btn, .nav-tab, .nav-logo"),
    ...document.querySelectorAll(".nav-arrow, .page-dot, .channel-card, .exhibit-link"),
    ...document.querySelectorAll(".exhibit-header, .menu-toggle"),
    ...document.querySelectorAll(".tool-item")
  ];
  hoverTargets.forEach(el => {
    el.addEventListener("mouseenter", () => sfx.hover());
  });
  document.querySelectorAll(".channel-card").forEach(card => {
    card.addEventListener("click", () => sfx.click());
  });
  {
    const bootLines = document.querySelectorAll(".preloader .boot-line");
    bootLines.forEach((line, i) => {
      setTimeout(() => sfx.boot(), 200 + i * 350);
    });
    setTimeout(() => sfx.success(), 1100);
  }
});

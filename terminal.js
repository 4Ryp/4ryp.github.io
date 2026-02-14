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
  const eggBtn     = document.getElementById("eggBtn");
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

  btnSan?.addEventListener("click", () => setMode("sanitized"));
  btnRaw?.addEventListener("click", () => setMode("raw"));

  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.theme === theme));
  }

  const savedTheme = localStorage.getItem("theme") || "crimson";
  setTheme(savedTheme);
  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.theme || "crimson"));
  });

  function appendSecretLine(text, cls = "") {
    if (!secretOutput) return;
    const line = document.createElement("div");
    line.className = `secret-line${cls ? ` ${cls}` : ""}`;
    line.textContent = text;
    secretOutput.appendChild(line);
    scrollSecretToBottom();
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

  async function runSecretBoot() {
    if (!secretOutput || !secretInput) return;
    cleanupMiniApps();
    secretOutput.innerHTML = "";
    secretAutoScroll = true;
    secretInput.disabled = true;
    secretInput.value = "";

    appendSecretLine("intercept:: rerouting session to hidden shell...", "dim");
    await sleep(220);
    for (let i = 0; i < 9; i++) {
      appendSecretLine(randomBootLine(), "dim");
      await sleep(80 + Math.random() * 45);
    }
    appendSecretLine("buffer decode complete", "ok");
    appendSecretLine("two commands available in this mode", "warn");
    appendSecretLine("type `help`", "ok");
    secretInput.disabled = false;
    secretInput.focus();
  }

  function openSecretTerminal() {
    if (!secretTerminal) return;
    secretAutoScroll = true;
    eggBtn?.classList.add("hidden");
    secretTerminal.classList.add("active", "stretch");
    secretTerminal.setAttribute("aria-hidden", "false");
    setTimeout(() => secretTerminal.classList.remove("stretch"), 760);
    runSecretBoot();
  }

  function closeSecretTerminal() {
    if (!secretTerminal) return;
    cleanupMiniApps();
    secretTerminal.classList.remove("active", "stretch");
    secretTerminal.setAttribute("aria-hidden", "true");
    if (!cover?.classList.contains("cover-exit")) {
      eggBtn?.classList.remove("hidden");
    }
  }

  function startPingPong() {
    cleanupMiniApps();
    appendSecretLine("launching ping pong , controls r LEFT/RIGHT or A/D", "ok");

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
    appendSecretLine("rendering big burger heh...", "ok");

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
    appendSecretLine("rendering donut math thing...", "ok");

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

  function handleSecretCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    appendSecretLine(`> ${raw}`, "secret-cmd");

    if (cmd === "help") {
      appendSecretLine("commands:", "ok");
      appendSecretLine("  ping pong  - ping");
      appendSecretLine("  burger     - big burger vs small burger");
      appendSecretLine("  donut      - math stuff");
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

    appendSecretLine(`unknown command: ${cmd}`, "warn");
    appendSecretLine("type `help`", "dim");
  }

  eggBtn?.addEventListener("click", () => {
    openSecretTerminal();
  });

  secretClose?.addEventListener("click", () => {
    closeSecretTerminal();
  });

  secretInput?.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = secretInput.value;
    secretInput.value = "";
    handleSecretCommand(value);
  });

  function openFile() {
    if (!fileSelected) return;

    cover?.classList.add("cover-exit");
    openBtn?.classList.remove("visible");
    eggBtn?.classList.add("hidden");

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
    if (pageStatus) pageStatus.textContent = `${index + 1} / ${panels.length}`;
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
    statusStrip?.classList.add("nav-hidden");
    setTimeout(() => {
      cover?.classList.remove("cover-exit");
      if (fileSelected) openBtn?.classList.add("visible");
      eggBtn?.classList.remove("hidden");
      resetNameAnimation();
      setTimeout(runNameAnimation, 400);
    }, 300);
  });

  document.addEventListener("keydown", e => {
    if (isSecretActive()) {
      if (e.key === "Escape") {
        e.preventDefault();
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
    const isOpen = mobileNav?.classList.contains("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
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

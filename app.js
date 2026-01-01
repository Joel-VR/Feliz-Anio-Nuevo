// =================================
// CONFIG
// =================================
const FORCE_CELEBRATION = true; // ⬅️ SOLO FELIZ AÑO NUEVO
const FINAL_MESSAGE = "¡FELIZ AÑO NUEVO! ✨\nQue este año te suba de nivel 🔥";

// =================================
// UI
// =================================
const $ = (id) => document.getElementById(id);
const hintEl = $("hint");

// =================================
// CANVAS
// =================================
const canvas = $("fx");
const ctx = canvas.getContext("2d");

let W = 0, H = 0;
function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// =================================
// AUDIO (opcional)
// =================================
let audioCtx = null;
$("soundBtn")?.addEventListener("click", async () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await audioCtx.resume();
    }
});

function boom(freq = 180) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.2);
}

// =================================
// FX
// =================================
const particles = [];
const rockets = [];
let startTime = 0;

function rand(a, b) {
    return a + Math.random() * (b - a);
}

function spawnRocket() {
    rockets.push({
        x: rand(W * 0.2, W * 0.8),
        y: H + 20,
        vy: rand(-12, -15),
        life: rand(40, 60),
        t: 0,
        hue: rand(0, 360)
    });
}

function explode(x, y, hue) {
    const particleCount = W < 600 ? 60 : 120;
    for (let i = 0; i < particleCount; i++) {

        const a = rand(0, Math.PI * 2);
        particles.push({
            x, y,
            vx: Math.cos(a) * rand(2, 7),
            vy: Math.sin(a) * rand(2, 7),
            life: rand(60, 120),
            t: 0,
            hue
        });
    }
    boom();
}

function drawMessage() {
    const elapsed = performance.now() - startTime;
    ctx.save();

    // Fade-in suave
    ctx.globalAlpha = Math.min(1, elapsed / 900);

    // ===== SAFE AREA =====
    const safeMargin = W * 0.08; // 8% margen lateral
    const maxTextWidth = W - safeMargin * 2;

    // Tamaño de fuente RESPONSIVE REAL
    const fontSize = Math.min(
        maxTextWidth * 0.12, // depende del ancho
        H * 0.12,            // depende de la altura
        88                   // límite máximo
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont`;
    ctx.fillStyle = "#ffffff";

    const lines = FINAL_MESSAGE.split("\n");
    const lineHeight = fontSize * 1.25;

    // Subimos un poco el bloque en móvil
    const blockHeight = (lines.length - 1) * lineHeight;
    const startY = H * 0.42 - blockHeight / 2;

    // Sombra suave para contraste
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = fontSize * 0.15;

    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, startY + i * lineHeight, maxTextWidth);
    });

    ctx.restore();
}


function loop() {
    ctx.clearRect(0, 0, W, H);

    rockets.forEach((r, i) => {
        r.y += r.vy;
        r.t++;
        if (r.t > r.life) {
            explode(r.x, r.y, r.hue);
            rockets.splice(i, 1);
        }
    });

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.t++;
        ctx.fillStyle = `hsla(${p.hue},100%,60%,0.9)`;
        ctx.beginPath();
        const size = W < 600 ? 1.8 : 2.6;
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);

        ctx.fill();
        if (p.t > p.life) particles.splice(i, 1);
    });

    drawMessage();
    requestAnimationFrame(loop);
}

// =================================
// START CELEBRATION
// =================================
function startCelebration() {
    document.getElementById("headline")?.remove();
    document.querySelector(".timer")?.remove();
    document.querySelector(".actions")?.remove();
    document.querySelector(".topbar")?.remove();

    hintEl.textContent = "🎆 ¡Feliz Año Nuevo!";
    startTime = performance.now();

    for (let i = 0; i < 8; i++) {
        setTimeout(spawnRocket, i * 300);
    }

    setInterval(() => {
        for (let i = 0; i < 2; i++) spawnRocket();
    }, 700);

    loop();
}

if (isNewYearCelebrationTime()) {
  // 🎆 FELIZ AÑO NUEVO hasta las 5 AM
  startCelebration();
} else {
  // ⏳ Empieza la cuenta para el próximo año
  startCountdown();
}


function isNewYearCelebrationTime() {
  const now = new Date();

  // ¿Estamos en 1 de enero?
  const isJanuaryFirst =
    now.getMonth() === 0 && now.getDate() === 1;

  // Hora límite: 5 AM
  const isBeforeFiveAM = now.getHours() < 12;

  return isJanuaryFirst && isBeforeFiveAM;
}
function startCountdown() {
  // Mostrar UI del contador
  document.querySelector(".topbar")?.classList.remove("hidden");
  document.querySelector(".timer")?.classList.remove("hidden");
  document.querySelector(".actions")?.classList.remove("hidden");

  // Mensaje normal
  document.getElementById("headline").textContent = "Falta poco…";
  document.getElementById("hint").textContent =
    "Cuenta regresiva para el próximo Año Nuevo 🎉";

  // Fecha objetivo: próximo año
  targetDate = getNextNewYear();

  // Iniciar contador
  setInterval(tick, 250);
  tick();
}

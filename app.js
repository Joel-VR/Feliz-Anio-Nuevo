// =================================
// CONFIG
// =================================
const FORCE_CELEBRATION = false; // ⬅️ Cambiado a false para que la lógica de fecha funcione por defecto
const FINAL_MESSAGE = "¡FELIZ AÑO NUEVO! ✨\nQue este año te suba de nivel 🔥";

let targetDate = null;
let targetLabel = "Año Nuevo";

// =================================
// UI
// =================================
const $ = (id) => document.getElementById(id);
const hintEl = $("hint");

// =================================
// MODAL LOGIC
// =================================
$("setTargetBtn")?.addEventListener("click", () => {
    $("modal").classList.add("show");
    $("dtInput").value = targetDate.toISOString().slice(0, 16);
    $("labelInput").value = targetLabel;
});

$("closeModal")?.addEventListener("click", () => {
    $("modal").classList.remove("show");
});

$("saveTarget")?.addEventListener("click", () => {
    const newDate = new Date($("dtInput").value);
    const newLabel = $("labelInput").value || "Año Nuevo";
    
    if (!isNaN(newDate.getTime())) {
        targetDate = newDate;
        targetLabel = newLabel;
        $("targetLabel").textContent = targetLabel;
        $("modal").classList.remove("show");
        tick();
    } else {
        alert("Fecha no válida");
    }
});

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

if (FORCE_CELEBRATION || isNewYearCelebrationTime()) {
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

  // Dura todo el día (hasta las 23:59:59)
  return isJanuaryFirst;
}

function getNextNewYear() {
  const now = new Date();
  const nextYear = now.getFullYear() + (now.getMonth() === 0 && now.getDate() === 1 ? 0 : 1);
  return new Date(nextYear, 0, 1, 0, 0, 0);
}

function tick() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    startCelebration();
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  $("days").textContent = d.toString().padStart(2, "0");
  $("hours").textContent = h.toString().padStart(2, "0");
  $("mins").textContent = m.toString().padStart(2, "0");
  $("secs").textContent = s.toString().padStart(2, "0");
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
  targetLabel = "Año Nuevo " + targetDate.getFullYear();
  $("targetLabel").textContent = targetLabel;

  // Iniciar contador
  setInterval(tick, 250);
  tick();
}

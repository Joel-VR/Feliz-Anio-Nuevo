const FORCE_CELEBRATION = true; // ⬅️ CAMBIA A false CUANDO QUIERAS VOLVER AL CONTADOR

let isCelebrating = false;
// ============================
// CONFIG RÁPIDA
// ============================
const FINAL_MESSAGE = "¡FELIZ AÑO NUEVO! ✨\nQue este año te suba de nivel 🔥";
const CELEBRATION_DURATION_MS = 60 * 60 * 1000; // 1 hora

let targetDate = getNextNewYear();
const celebratingNow = checkCelebrationState();
let finished = false;

// ============================
// UI refs
// ============================
const $ = (id) => document.getElementById(id);

const daysEl = $("days");
const hoursEl = $("hours");
const minsEl = $("mins");
const secsEl = $("secs");
const headlineEl = $("headline");
const hintEl = $("hint");
const targetLabelEl = $("targetLabel");

const setTargetBtn = $("setTargetBtn");
const testBtn = $("testBtn");
const modal = $("modal");
const closeModal = $("closeModal");
const saveTarget = $("saveTarget");
const dtInput = $("dtInput");
const labelInput = $("labelInput");
const soundBtn = $("soundBtn");

// ============================
// Canvas FX
// ============================
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

// ============================
// Audio
// ============================
let audioEnabled = false;
let audioCtx = null;

soundBtn.addEventListener("click", async () => {
  audioEnabled = !audioEnabled;
  soundBtn.textContent = audioEnabled ? "🔇 Sonido activado" : "🔊 Activar sonido";
  if (audioEnabled && !audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
  }
});

function beep(freq, dur, type = "sine", vol = 0.05) {
  if (!audioEnabled || !audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

// ============================
// COUNTDOWN
// ============================
function pad2(n) {
  return String(n).padStart(2, "0");
}

function tick() {
  if (finished || isCelebrating) return;

  const diff = targetDate - new Date();
  if (diff <= 0) {
    launchFinale(false);
    return;
  }

  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  daysEl.textContent = pad2(d);
  hoursEl.textContent = pad2(h);
  minsEl.textContent = pad2(m);
  secsEl.textContent = pad2(sec);
}

if (!FORCE_CELEBRATION) {
  setInterval(tick, 250);
  tick();
}

setInterval(tick, 250);
tick();

// ============================
// FX
// ============================
const particles = [];
const rockets = [];
let finaleStartedAt = 0;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function spawnRocket() {
  rockets.push({
    x: rand(W * 0.2, W * 0.8),
    y: H,
    vy: rand(-11, -13),
    t: 0,
    life: rand(40, 60),
    hue: rand(0, 360)
  });
}

function explode(x, y, hue) {
  for (let i = 0; i < 90; i++) {
    const a = rand(0, Math.PI * 2);
    particles.push({
      x, y,
      vx: Math.cos(a) * rand(2, 6),
      vy: Math.sin(a) * rand(2, 6),
      life: rand(60, 100),
      t: 0,
      hue
    });
  }
}

function drawText() {
  const t = performance.now() - finaleStartedAt;
  ctx.globalAlpha = Math.min(1, t / 800);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.min(72, W * 0.07)}px system-ui`;
  ctx.fillStyle = "#fff";
  FINAL_MESSAGE.split("\n").forEach((l, i) => {
    ctx.fillText(l, W / 2, H / 2 + i * 80);
  });
}

function updateFX() {
  ctx.clearRect(0, 0, W, H);

  rockets.forEach((r, i) => {
    r.y += r.vy;
    r.t++;
    if (r.t > r.life) {
      explode(r.x, r.y, r.hue);
      rockets.splice(i, 1);
      beep(220, 0.15);
    }
  });

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.t++;
    ctx.fillStyle = `hsla(${p.hue},100%,60%,0.8)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    if (p.t > p.life) particles.splice(i, 1);
  });

  if (finished) drawText();
  requestAnimationFrame(updateFX);
}
updateFX();

// ============================
// FINAL
// ============================
function launchFinale(isTest) {
  if (finished) return;
  finished = true;

  if (!isTest) {
    localStorage.setItem("newYearCelebrationStart", Date.now());
  }

  document.querySelector(".timer").style.display = "none";
  document.querySelector(".actions").style.display = "none";
  document.querySelector(".topbar").style.display = "none";

  finaleStartedAt = performance.now();
  hintEl.textContent = "🎆 ¡Feliz Año Nuevo!";

  for (let i = 0; i < 6; i++) setTimeout(spawnRocket, i * 200);
}

// ============================
// ESTADO DE CELEBRACIÓN
// ============================
function checkCelebrationState() {
  if (FORCE_CELEBRATION) {
    launchFinale(false);
    return true;
  }

  const start = localStorage.getItem("newYearCelebrationStart");
  if (!start) return false;

  const elapsed = Date.now() - Number(start);

  if (elapsed < CELEBRATION_DURATION_MS) {
    launchFinale(false);
    return true;
  } else {
    localStorage.removeItem("newYearCelebrationStart");
    return false;
  }
}



checkCelebrationState();

// ============================
// HELPERS
// ============================
function getNextNewYear() {
  const y = new Date().getFullYear() + 1;
  return new Date(y, 0, 1, 0, 0, 0);
}

// ============================
// CONFIG RÁPIDA
// ============================
const FINAL_MESSAGE = "¡FELIZ AÑO NUEVO! ✨\nQue este año te suba de nivel 🔥";
let targetDate = getNextNewYear(); // por defecto: próximo 1 de enero a las 00:00

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

// Canvas FX
const canvas = $("fx");
const ctx = canvas.getContext("2d");

let W = 0, H = 0;
function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = Math.floor(window.innerWidth);
    H = Math.floor(window.innerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// ============================
// Audio (opcional, sin autoplay)
// ============================
let audioEnabled = false;
let audioCtx = null;

soundBtn.addEventListener("click", async () => {
    audioEnabled = !audioEnabled;
    soundBtn.textContent = audioEnabled ? "🔇 Sonido activado" : "🔊 Activar sonido";
    if (audioEnabled && !audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        try { await audioCtx.resume(); } catch { }
    }
});

// Beep simple
function beep(freq = 440, duration = 0.08, type = "sine", gain = 0.06) {
    if (!audioEnabled || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + duration);
}

function chord() {
    // mini “boom” musical
    beep(220, 0.14, "triangle", 0.08);
    setTimeout(() => beep(330, 0.14, "triangle", 0.07), 60);
    setTimeout(() => beep(440, 0.18, "sine", 0.06), 120);
}

// ============================
// Countdown logic
// ============================
let finished = false;

function pad2(n) { return String(n).padStart(2, "0"); }

function tick() {
    if (finished) return;

    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
        daysEl.textContent = "00";
        hoursEl.textContent = "00";
        minsEl.textContent = "00";
        secsEl.textContent = "00";
        launchFinale();
        return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    daysEl.textContent = pad2(days);
    hoursEl.textContent = pad2(hours);
    minsEl.textContent = pad2(mins);
    secsEl.textContent = pad2(secs);

    // “click” suave los últimos 10 segundos
    if (days === 0 && hours === 0 && mins === 0 && secs <= 10) {
        beep(520 + (10 - secs) * 20, 0.05, "square", 0.03);
        headlineEl.textContent = secs <= 3 ? "¡YA CASI!" : "Cuenta regresiva…";
        hintEl.textContent = "Prepárate 👀";
    }
}

setInterval(tick, 250);
tick();

// ============================
// Modal target date
// ============================
function openModal() {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    // set default input value
    const dt = new Date(targetDate);
    dtInput.value = toDatetimeLocal(dt);
    labelInput.value = targetLabelEl.textContent || "Año Nuevo";
}
function closeModalFn() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
}
setTargetBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalFn);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModalFn(); });

saveTarget.addEventListener("click", () => {
    const val = dtInput.value;
    if (!val) return;

    // datetime-local no incluye timezone; lo interpretamos como hora local del dispositivo
    targetDate = new Date(val);

    const label = labelInput.value.trim();
    if (label) targetLabelEl.textContent = label;

    finished = false;
    document.body.classList.remove("final", "shake");
    hintEl.textContent = "Listo. Ahora espera el momento 🔥";
    headlineEl.textContent = "Falta poco…";
    closeModalFn();
    tick();
});

testBtn.addEventListener("click", () => {
    // prueba inmediata
    if (!finished) launchFinale(true);
});

// ============================
// Finale FX (fuegos + confetti + mensaje)
// ============================
const particles = [];
const rockets = [];
let finaleStartedAt = 0;

function rand(a, b) { return a + Math.random() * (b - a); }

function spawnRocket() {
    rockets.push({
        x: rand(W * 0.2, W * 0.8),
        y: H + 20,
        vx: rand(-0.6, 0.6),
        vy: rand(-10.5, -12.8),
        t: 0,
        life: rand(45, 65),
        hue: rand(0, 360)
    });
}

function explode(x, y, hue) {
    const count = Math.floor(rand(70, 110));
    for (let i = 0; i < count; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = rand(2, 7.5);
        particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: rand(0.05, 0.12),
            drag: 0.985,
            life: rand(55, 95),
            t: 0,
            size: rand(1, 3),
            hue: (hue + rand(-25, 25) + 360) % 360,
            alpha: 1
        });
    }

    // confetti extra
    for (let i = 0; i < 35; i++) {
        const a = rand(0, Math.PI * 2);
        const sp = rand(1, 5);
        particles.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: rand(0.12, 0.22),
            drag: 0.99,
            life: rand(85, 140),
            t: 0,
            size: rand(2, 5),
            hue: rand(0, 360),
            alpha: 1,
            rect: true,
            rot: rand(0, Math.PI),
            vr: rand(-0.2, 0.2)
        });
    }
}

function drawTextOverlay() {
    const elapsed = performance.now() - finaleStartedAt;

    ctx.save();
    ctx.globalAlpha = Math.min(1, elapsed / 800);

    // vignette
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H));
    g.addColorStop(0, "rgba(0,0,0,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // main text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const pulse = 1 + Math.sin(elapsed / 140) * 0.03;
    const big = Math.min(72, Math.max(38, W * 0.06)) * pulse;

    ctx.font = `900 ${big}px ui-sans-serif, system-ui`;
    ctx.shadowColor = "rgba(0,210,255,.35)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(255,255,255,.95)";
    const lines = FINAL_MESSAGE.split("\n");
    const lh = big * 1.15;
    const startY = H / 2 - ((lines.length - 1) * lh) / 2;

    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2, startY + i * lh);
    });

    ctx.restore();
}

function updateFX() {
    ctx.clearRect(0, 0, W, H);

    // rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t++;
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.12;

        // trail
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = `hsla(${r.hue}, 100%, 65%, 0.9)`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (r.t > r.life || r.y < H * 0.25) {
            explode(r.x, r.y, r.hue);
            rockets.splice(i, 1);
            chord();
        }
    }

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t++;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;

        const lifeRatio = 1 - (p.t / p.life);
        p.alpha = Math.max(0, lifeRatio);

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.rect) {
            p.rot += p.vr || 0;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, 0.9)`;
            ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        } else {
            ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, 0.9)`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        if (p.t > p.life || p.y > H + 80) {
            particles.splice(i, 1);
        }
    }

    if (finished) {
        drawTextOverlay();
    }

    requestAnimationFrame(updateFX);
}
updateFX();

function launchFinale(isTest = false) {
    document.querySelector(".timer").style.display = "none";
    document.querySelector(".actions").style.display = "none";
    document.querySelector(".topbar").style.display = "none";

    finished = true;
    finaleStartedAt = performance.now();

    document.body.classList.add("final", "shake");
    setTimeout(() => document.body.classList.remove("shake"), 650);

    hintEl.textContent = isTest ? "Modo prueba: así se verá el final 🎆" : "🎆 Que empiece lo nuevo…";

    // primera oleada
    for (let i = 0; i < 6; i++) setTimeout(spawnRocket, i * 160);

    // show continua por ~8 segundos
    const showMs = 9000;
    const interval = setInterval(() => {
        for (let i = 0; i < 2; i++) spawnRocket();
    }, 260);

    // “bass boom” inicial
    beep(90, 0.18, "sine", 0.08);
    setTimeout(() => beep(70, 0.22, "sine", 0.07), 120);

    setTimeout(() => {
        clearInterval(interval);
        // último remate
        for (let i = 0; i < 10; i++) setTimeout(spawnRocket, i * 120);
    }, showMs);
}

// ============================
// Helpers
// ============================
function getNextNewYear() {
    const now = new Date();
    const year = now.getFullYear() + 1;
    // 1 de enero 00:00:00 (hora local)
    return new Date(year, 0, 1, 0, 0, 0, 0);
}

function toDatetimeLocal(d) {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

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
    for (let i = 0; i < 120; i++) {
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
    const t = performance.now() - startTime;
    ctx.globalAlpha = Math.min(1, t / 1000);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.min(90, W * 0.08)}px system-ui`;
    ctx.fillStyle = "#fff";

    FINAL_MESSAGE.split("\n").forEach((l, i) => {
        ctx.fillText(l, W / 2, H / 2 + i * 90);
    });
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
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
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

if (FORCE_CELEBRATION) {
    startCelebration();
}

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/assets', { recursive: true });
if (existsSync('public/gangguan.mp3')) {
  copyFileSync('public/gangguan.mp3', 'dist/gangguan.mp3');
}

const html = '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reduce Your Pressure</title><link rel="stylesheet" href="./assets/styles.css"></head><body><div id="app"></div><' + 'script src="./assets/app.js"></' + 'script></body></html>';

const app = String.raw`
const app = document.querySelector('#app');
let value = '';
let page = 'home';
let body = '';
let audio = null;
let lastSoundAt = 0;
let pageCleanup = null;
const SOUND_SPEED = 24;
let state = { x: 120, y: 120, vx: 0, vy: 0, down: false, lx: 0, ly: 0, pressure: 0, axis: 'x' };

function cut(text) { return Array.from(text).slice(0, 8).join(''); }
function cleanupPage() {
  if (pageCleanup) pageCleanup();
  pageCleanup = null;
}
function readyAudio() {
  if (!audio) {
    audio = new Audio('./gangguan.mp3');
    audio.preload = 'auto';
  }
  audio.load();
}
function hitSound(speed) {
  const now = performance.now();
  if (speed < SOUND_SPEED || now - lastSoundAt < 280) return;
  lastSoundAt = now;
  readyAudio();
  audio.currentTime = 0;
  audio.volume = Math.min(1, 0.35 + (speed - SOUND_SPEED) / 55);
  audio.play().catch(function () {});
}
function resizeCanvas(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}
function startDotGrid(canvas) {
  let ctx = resizeCanvas(canvas);
  let live = true;
  const pointer = { x: -9999, y: -9999 };
  const dots = [];
  function makeDots() {
    dots.length = 0;
    const gap = 26;
    for (let y = -gap; y < window.innerHeight + gap; y += gap) {
      for (let x = -gap; x < window.innerWidth + gap; x += gap) {
        dots.push({ x: x, y: y, shift: Math.random() * Math.PI * 2 });
      }
    }
  }
  function move(event) { pointer.x = event.clientX; pointer.y = event.clientY; }
  function leave() { pointer.x = -9999; pointer.y = -9999; }
  function resize() { ctx = resizeCanvas(canvas); makeDots(); }
  function draw(time) {
    if (!live) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const dot of dots) {
      const dx = dot.x - pointer.x;
      const dy = dot.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - dist / 160);
      const wave = (Math.sin(time * 0.0012 + dot.shift) + 1) * 0.5;
      const radius = 1.15 + pull * 3.2 + wave * 0.35;
      const px = dot.x + (dist ? dx / dist : 0) * pull * 10;
      const py = dot.y + (dist ? dy / dist : 0) * pull * 10;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210, 245, 255, ' + (0.16 + pull * 0.58 + wave * 0.08) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  makeDots();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerleave', leave);
  requestAnimationFrame(draw);
  return function () {
    live = false;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerleave', leave);
  };
}
function startBallpit(canvas) {
  let ctx = resizeCanvas(canvas);
  let live = true;
  const pointer = { x: -9999, y: -9999 };
  const balls = [];
  function makeBalls() {
    balls.length = 0;
    const count = Math.max(48, Math.min(96, Math.floor(window.innerWidth / 18)));
    for (let i = 0; i < count; i += 1) {
      balls.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 10 + Math.random() * 24,
        vx: -0.7 + Math.random() * 1.4,
        vy: -0.4 + Math.random() * 1.0,
        hue: 180 + Math.random() * 120
      });
    }
  }
  function move(event) { pointer.x = event.clientX; pointer.y = event.clientY; }
  function leave() { pointer.x = -9999; pointer.y = -9999; }
  function resize() { ctx = resizeCanvas(canvas); makeBalls(); }
  function draw() {
    if (!live) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(5, 8, 20, 0.28)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    for (const ball of balls) {
      const dx = ball.x - pointer.x;
      const dy = ball.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 170 && dist > 0) {
        const force = (170 - dist) / 170;
        ball.vx += (dx / dist) * force * 0.34;
        ball.vy += (dy / dist) * force * 0.34;
      }
      ball.vy += 0.018;
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= 0.996;
      ball.vy *= 0.996;
      if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.86; }
      if (ball.x > window.innerWidth - ball.r) { ball.x = window.innerWidth - ball.r; ball.vx = -Math.abs(ball.vx) * 0.86; }
      if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.86; }
      if (ball.y > window.innerHeight - ball.r) { ball.y = window.innerHeight - ball.r; ball.vy = -Math.abs(ball.vy) * 0.86; }
      const glow = ctx.createRadialGradient(ball.x - ball.r * 0.32, ball.y - ball.r * 0.38, 1, ball.x, ball.y, ball.r);
      glow.addColorStop(0, 'hsla(' + ball.hue + ', 100%, 86%, 0.92)');
      glow.addColorStop(0.58, 'hsla(' + ball.hue + ', 92%, 62%, 0.55)');
      glow.addColorStop(1, 'hsla(' + ball.hue + ', 90%, 45%, 0.08)');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  makeBalls();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerleave', leave);
  requestAnimationFrame(draw);
  return function () {
    live = false;
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerleave', leave);
  };
}
function home() {
  cleanupPage();
  page = 'home';
  app.innerHTML = '<main class="page home-page"><canvas class="dot-canvas" aria-hidden="true"></canvas><section class="home-card"><h1 class="blur-title" aria-label="输入你讨厌的东西！！！"></h1><p class="hint">最多 8 个字符，支持中文。</p><form class="input-row"><input placeholder="例如：ddl" autofocus><button type="submit">完成</button></form></section></main>';
  pageCleanup = startDotGrid(app.querySelector('.dot-canvas'));
  const title = app.querySelector('.blur-title');
  Array.from('输入你讨厌的东西！！！').forEach(function (char, index) {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.animationDelay = index * 0.055 + 's';
    title.appendChild(span);
  });
  const input = app.querySelector('input');
  input.value = value;
  input.addEventListener('input', function () { value = cut(input.value); input.value = value; });
  app.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); readyAudio(); play(value); });
}
function play(text) {
  cleanupPage();
  page = 'play';
  body = text || '空白';
  state = { x: Math.max(60, innerWidth / 2 - 130), y: 120, vx: 0, vy: 0, down: false, lx: 0, ly: 0, pressure: 0, axis: 'x' };
  app.innerHTML = '<main class="page play-page"><canvas class="ballpit-canvas" aria-hidden="true"></canvas><button class="back-button">重新输入</button><div class="play-tip">拖动文字，把它砸向边缘。高速撞墙会播放 gangguan.mp3。</div><div class="pressure-text"><span class="falling-shadow"></span><span class="falling-main"></span></div></main>';
  pageCleanup = startBallpit(app.querySelector('.ballpit-canvas'));
  app.querySelector('.back-button').addEventListener('click', home);
  app.querySelectorAll('.falling-shadow,.falling-main').forEach(function (node) { node.textContent = body; });
  const box = app.querySelector('.pressure-text');
  box.addEventListener('pointerdown', function (event) { readyAudio(); state.down = true; state.lx = event.clientX; state.ly = event.clientY; box.setPointerCapture(event.pointerId); });
  box.addEventListener('pointermove', function (event) {
    if (!state.down) return;
    const dx = event.clientX - state.lx;
    const dy = event.clientY - state.ly;
    state.x += dx;
    state.y += dy;
    state.vx = dx;
    state.vy = dy;
    state.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    state.pressure = Math.min(1.15, Math.hypot(dx, dy) / 18);
    state.lx = event.clientX;
    state.ly = event.clientY;
  });
  function end(event) { state.down = false; try { box.releasePointerCapture(event.pointerId); } catch (error) {} }
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
  tick();
}
function tick() {
  if (page !== 'play') return;
  const box = app.querySelector('.pressure-text');
  if (!box) return;
  if (!state.down) {
    state.vy += 0.65;
    state.x += state.vx;
    state.y += state.vy;
    state.vx *= 0.992;
    state.vy *= 0.998;
  }
  const w = box.offsetWidth || 220;
  const h = box.offsetHeight || 100;
  let hit = false;
  if (state.x < 0) { state.x = 0; state.vx = Math.abs(state.vx) * 0.78; state.axis = 'x'; hit = true; }
  if (state.x > innerWidth - w) { state.x = innerWidth - w; state.vx = -Math.abs(state.vx) * 0.78; state.axis = 'x'; hit = true; }
  if (state.y < 0) { state.y = 0; state.vy = Math.abs(state.vy) * 0.72; state.axis = 'y'; hit = true; }
  if (state.y > innerHeight - h) { state.y = innerHeight - h; state.vy = -Math.abs(state.vy) * 0.72; state.axis = 'y'; hit = true; }
  const speed = Math.hypot(state.vx, state.vy);
  if (hit) hitSound(speed);
  state.pressure = hit ? Math.min(1.2, speed / 35) : state.pressure * 0.9;
  const sx = state.axis === 'x' ? 1 - state.pressure * 0.28 : 1 + state.pressure * 0.18;
  const sy = state.axis === 'y' ? 1 - state.pressure * 0.24 : 1 + state.pressure * 0.16;
  box.style.transform = 'translate3d(' + state.x + 'px,' + state.y + 'px,0) scale(' + sx + ',' + sy + ')';
  box.style.letterSpacing = state.pressure * 0.18 + 'em';
  requestAnimationFrame(tick);
}
home();
`;

const css = String.raw`
* { box-sizing: border-box; }
html, body, #app { width: 100%; height: 100%; margin: 0; }
body {
  overflow: hidden;
  color: #f7fbff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  background: #080b18;
}
button, input { font: inherit; }
.page { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.home-page {
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 25% 20%, rgba(94, 234, 212, .18), transparent 34%),
    radial-gradient(circle at 78% 72%, rgba(167, 139, 250, .22), transparent 35%),
    #080b18;
}
.dot-canvas, .ballpit-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.dot-canvas { z-index: 0; }
.home-card {
  position: relative;
  z-index: 1;
  width: min(720px, 92vw);
  padding: 52px 38px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 32px;
  background: rgba(10, 16, 34, .66);
  box-shadow: 0 28px 90px rgba(0, 0, 0, .38);
  backdrop-filter: blur(18px);
}
.blur-title {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: .05em;
  margin: 0;
  font-size: clamp(38px, 7vw, 78px);
  line-height: 1.05;
  letter-spacing: -.07em;
}
.blur-title span {
  display: inline-block;
  opacity: 0;
  filter: blur(18px);
  transform: translateY(28px) scale(1.06);
  animation: blur-in .72s cubic-bezier(.22, 1, .36, 1) forwards;
}
@keyframes blur-in { to { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); } }
.hint { margin: 24px 0 26px; color: rgba(247, 251, 255, .72); }
.input-row { display: flex; gap: 12px; justify-content: center; }
.input-row input {
  width: min(360px, 60vw);
  padding: 16px 18px;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 18px;
  outline: none;
  background: rgba(255, 255, 255, .09);
}
.input-row button, .back-button {
  cursor: pointer;
  border: 0;
  color: #07111c;
  border-radius: 18px;
  background: linear-gradient(135deg, #67e8f9, #c4b5fd);
  box-shadow: 0 14px 34px rgba(103, 232, 249, .18);
}
.input-row button { padding: 16px 24px; font-weight: 900; }
.play-page {
  background:
    radial-gradient(circle at 50% 20%, rgba(125, 211, 252, .16), transparent 38%),
    linear-gradient(160deg, #090b19, #111827 45%, #1b1231);
}
.ballpit-canvas {
  z-index: 0;
  opacity: .95;
  filter: saturate(1.1);
}
.back-button {
  position: absolute;
  z-index: 3;
  top: 22px;
  left: 22px;
  padding: 11px 16px;
  font-weight: 800;
}
.play-tip {
  position: absolute;
  z-index: 3;
  right: 22px;
  bottom: 22px;
  max-width: min(360px, calc(100vw - 44px));
  padding: 12px 16px;
  color: rgba(247, 251, 255, .72);
  border: 1px solid rgba(255, 255, 255, .13);
  border-radius: 18px;
  background: rgba(8, 11, 24, .46);
  backdrop-filter: blur(14px);
}
.pressure-text {
  position: absolute;
  z-index: 2;
  min-width: 180px;
  padding: 26px 32px;
  user-select: none;
  touch-action: none;
  cursor: grab;
  transform-origin: center;
  will-change: transform, letter-spacing;
}
.pressure-text:active { cursor: grabbing; }
.falling-main, .falling-shadow {
  display: block;
  white-space: nowrap;
  font-size: clamp(58px, 10vw, 142px);
  font-weight: 1000;
  line-height: .9;
  letter-spacing: inherit;
}
.falling-main {
  position: relative;
  color: #f9fcff;
  -webkit-text-stroke: 1px rgba(255, 255, 255, .18);
  text-shadow: 0 4px 0 rgba(0, 0, 0, .22), 0 18px 34px rgba(0, 0, 0, .34);
}
.falling-shadow {
  position: absolute;
  inset: 26px 32px;
  color: transparent;
  -webkit-text-stroke: 18px rgba(103, 232, 249, .15);
  filter: blur(8px);
}
@media (max-width: 620px) {
  .home-card { padding: 38px 22px; }
  .input-row { flex-direction: column; }
  .input-row input, .input-row button { width: 100%; }
  .play-tip { display: none; }
}
`;

writeFileSync('dist/index.html', html);
writeFileSync('dist/assets/app.js', app);
writeFileSync('dist/assets/styles.css', css);

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/assets', { recursive: true });
if (existsSync('public/gangguan.mp3')) {
  copyFileSync('public/gangguan.mp3', 'dist/gangguan.mp3');
}

const html = '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reduce Your Pressure</title><link rel="stylesheet" href="/assets/styles.css"></head><body><div id="app"></div><' + 'script src="/assets/app.js"></' + 'script></body></html>';

const app = `
const app = document.querySelector('#app');
let value = '';
let page = 'home';
let body = '';
let audio = null;
let lastSoundAt = 0;
const SOUND_SPEED = 24;
let state = { x: 120, y: 120, vx: 0, vy: 0, down: false, lx: 0, ly: 0, pressure: 0, axis: 'x' };
function cut(text) { return Array.from(text).slice(0, 8).join(''); }
function readyAudio() {
  if (!audio) {
    audio = new Audio('/gangguan.mp3');
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
  audio.play().catch(() => {});
}
function home() {
  page = 'home';
  app.innerHTML = '<main class="page home-page dot-grid"><section class="home-card"><h1 class="blur-title" aria-label="输入你讨厌的东西！！！"></h1><p class="hint">最多 8 个字符，支持中文。</p><form class="input-row"><input placeholder="例如：ddl" autofocus><button type="submit">完成</button></form></section></main>';
  const title = app.querySelector('.blur-title');
  Array.from('输入你讨厌的东西！！！').forEach((char, index) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.animationDelay = index * 0.055 + 's';
    title.appendChild(span);
  });
  const input = app.querySelector('input');
  input.value = value;
  input.addEventListener('input', () => { value = cut(input.value); input.value = value; });
  app.querySelector('form').addEventListener('submit', (event) => { event.preventDefault(); readyAudio(); play(value); });
}
function play(text) {
  page = 'play';
  body = text || '空白';
  state = { x: Math.max(60, innerWidth / 2 - 130), y: 120, vx: 0, vy: 0, down: false, lx: 0, ly: 0, pressure: 0, axis: 'x' };
  app.innerHTML = '<main class="page play-page"><button class="back-button">重新输入</button><div class="play-tip">拖动文字，把它砸向边缘。高速撞墙会播放 gangguan.mp3。</div><div class="ballpit-css"></div><div class="pressure-text"><span class="falling-shadow"></span><span class="falling-main"></span></div></main>';
  app.querySelector('.back-button').addEventListener('click', home);
  app.querySelectorAll('.falling-shadow,.falling-main').forEach((node) => { node.textContent = body; });
  const box = app.querySelector('.pressure-text');
  box.addEventListener('pointerdown', (event) => { readyAudio(); state.down = true; state.lx = event.clientX; state.ly = event.clientY; box.setPointerCapture(event.pointerId); });
  box.addEventListener('pointermove', (event) => {
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
  function end(event) { state.down = false; try { box.releasePointerCapture(event.pointerId); } catch {} }
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

writeFileSync('dist/index.html', html);
writeFileSync('dist/assets/app.js', app);
writeFileSync('dist/assets/styles.css', `*{box-sizing:border-box}html,body,#app{width:100%;height:100%;margin:0}body{overflow:hidden;color:#f7fbff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif;background:#080b18}button,input{font:inherit}.page{position:relative;width:100vw;height:100vh;overflow:hidden}.home-page{display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 25% 20%,rgba(94,234,212,.18),transparent 34%),radial-gradient(circle at 78% 72%,rgba(167,139,250,.22),transparent 35%),#080b18}.dot-grid:before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.26) 1px,transparent 1.5px);background-size:22px 22px;mask-image:radial-gradient(circle at center,black,transparent 72%);pointer-events:none}.home-card{position:relative;z-index:1;width:min(720px,92vw);padding:52px 38px;text-align:center;border:1px solid rgba(255,255,255,.16);border-radius:32px;background:rgba(10,16,34,.66);box-shadow:0 28px 90px rgba(0,0,0,.38);backdrop-filter:blur(18px)}.blur-title{display:flex;flex-wrap:wrap;justify-content:center;gap:.05em;margin:0;font-size:clamp(38px,7vw,78px);line-height:1.05;letter-spacing:-.07em}.blur-title span{display:inline-block;opacity:0;filter:blur(18px);transform:translateY(28px) scale(1.06);animation:blur-in .72s cubic-bezier(.22,1,.36,1) forwards}@keyframes blur-in{to{opacity:1;filter:blur(0);transform:translateY(0) scale(1)}}.hint{margin:24px 0 26px;color:rgba(247,251,255,.72)}.input-row{display:flex;gap:12px;justify-content:center}.input-row input{width:min(360px,60vw);padding:16px 18px;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:18px;outline:none;background:rgba(255,255,255,.09)}.input-row button,.back-button{cursor:pointer;border:0;color:#07111c;border-radius:18px;background:linear-gradient(135deg,#67e8f9,#c4b5fd);box-shadow:0 14px 34px rgba(103,232,249,.18)}.input-row button{padding:16px 24px;font-weight:900}.play-page{background:radial-gradient(circle at 50% 20%,rgba(125,211,252,.16),transparent 38%),linear-gradient(160deg,#090b19,#111827 45%,#1b1231)}.ballpit-css{position:absolute;inset:-10%;background:radial-gradient(circle at 10% 20%,rgba(103,232,249,.35) 0 22px,transparent 24px),radial-gradient(circle at 75% 30%,rgba(196,181,253,.36) 0 28px,transparent 30px),radial-gradient(circle at 40% 80%,rgba(45,212,191,.28) 0 36px,transparent 38px),radial-gradient(circle at 88% 82%,rgba(244,114,182,.22) 0 24px,transparent 26px);filter:blur(.2px);animation:float-bg 11s ease-in-out infinite alternate}@keyframes float-bg{to{transform:translate3d(-4%,3%,0) scale(1.06)}}.back-button{position:absolute;z-index:3;top:22px;left:22px;padding:11px 16px;font-weight:800}.play-tip{position:absolute;z-index:3;right:22px;bottom:22px;max-width:min(360px,calc(100vw - 44px));padding:12px 16px;color:rgba(247,251,255,.72);border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(8,11,24,.46);backdrop-filter:blur(14px)}.pressure-text{position:absolute;z-index:2;min-width:180px;padding:26px 32px;user-select:none;touch-action:none;cursor:grab;transform-origin:center;will-change:transform,letter-spacing}.pressure-text:active{cursor:grabbing}.falling-main,.falling-shadow{display:block;white-space:nowrap;font-size:clamp(58px,10vw,142px);font-weight:1000;line-height:.9;letter-spacing:inherit}.falling-main{position:relative;color:#f9fcff;-webkit-text-stroke:1px rgba(255,255,255,.18);text-shadow:0 4px 0 rgba(0,0,0,.22),0 18px 34px rgba(0,0,0,.34)}.falling-shadow{position:absolute;inset:26px 32px;color:transparent;-webkit-text-stroke:18px rgba(103,232,249,.15);filter:blur(8px)}@media(max-width:620px){.home-card{padding:38px 22px}.input-row{flex-direction:column}.input-row input,.input-row button{width:100%}.play-tip{display:none}}`);

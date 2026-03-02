const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hpEl = document.getElementById('hp');
const goldEl = document.getElementById('gold');
const waveEl = document.getElementById('wave');
const startBtn = document.getElementById('startBtn');
const selInfo = document.getElementById('selInfo');
const upgradeBtn = document.getElementById('upgradeBtn');
const sellBtn = document.getElementById('sellBtn');
const soundBtn = document.getElementById('soundBtn');

const menu = document.getElementById('menu');
const settings = document.getElementById('settings');

// ensure menu first
menu.classList.remove('hidden');
settings.classList.add('hidden');
const applyBtn = document.getElementById('applyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');

let W=0,H=0;
function resize(){
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize', resize); resize();

const grid = {cols:16, rows:10, size:0};
function gridSize(){grid.size = Math.min(W/grid.cols, H/grid.rows);}

const state = {
  hp:20, gold:100, wave:0,
  towers:[], enemies:[], bullets:[], running:false,
  selectedType:'basic', selectedTower:null,
  difficulty:'easy', speed:1, density:1,
  sound:true
};

// баланс
const costs = {basic:20, slow:28, aoe:38};
const colors = {basic:'#6cf18a', slow:'#6ccff1', aoe:'#f1d36c'};
const ranges = {basic:3.1, slow:3.5, aoe:2.7};
const fireRates = {basic:28, slow:40, aoe:48};
const damages = {basic:7, slow:4, aoe:6};

const path = [
  {x:0,y:4},{x:4,y:4},{x:4,y:2},{x:9,y:2},{x:9,y:7},{x:15,y:7}
];

function cellToPx(c){ return {x:c.x*grid.size, y:c.y*grid.size}; }

// --- Sound (WebAudio) ---
let audioCtx = null;
function beep(freq=440, dur=0.08, type='sine', vol=0.05){
  if(!state.sound) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  }catch(e){}
}

function draw(){
  gridSize();
  ctx.clearRect(0,0,W,H);
  // grid
  ctx.strokeStyle='#1a1f2a';
  for(let x=0;x<=grid.cols;x++){ctx.beginPath();ctx.moveTo(x*grid.size,0);ctx.lineTo(x*grid.size,grid.rows*grid.size);ctx.stroke();}
  for(let y=0;y<=grid.rows;y++){ctx.beginPath();ctx.moveTo(0,y*grid.size);ctx.lineTo(grid.cols*grid.size,y*grid.size);ctx.stroke();}

  // path
  ctx.strokeStyle='#2f3645'; ctx.lineWidth=6;
  ctx.beginPath();
  path.forEach((p,i)=>{
    const px = cellToPx(p);
    const cx = px.x + grid.size/2; const cy = px.y + grid.size/2;
    if(i===0) ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
  });
  ctx.stroke(); ctx.lineWidth=1;

  // towers
  state.towers.forEach(t=>{
    const px = cellToPx(t);
    ctx.fillStyle = colors[t.type] || '#6cf18a';
    ctx.beginPath();
    ctx.arc(px.x+grid.size/2, px.y+grid.size/2, grid.size*0.28, 0, Math.PI*2);
    ctx.fill();
    if(state.selectedTower===t){
      ctx.strokeStyle='#fff'; ctx.beginPath();
      ctx.arc(px.x+grid.size/2, px.y+grid.size/2, ranges[t.type]*grid.size, 0, Math.PI*2);
      ctx.stroke();
    }
  });

  // enemies
  state.enemies.forEach(e=>{
    ctx.fillStyle=e.type==='fast'?'#6ccff1':e.type==='tank'?'#f1d36c':'#f16c6c';
    ctx.beginPath();
    ctx.arc(e.x, e.y, grid.size*0.18, 0, Math.PI*2);
    ctx.fill();
    // hp bar
    const w = grid.size*0.4; const h = 4;
    ctx.fillStyle='#1f2430';
    ctx.fillRect(e.x-w/2, e.y-grid.size*0.28, w, h);
    ctx.fillStyle='#6cf18a';
    ctx.fillRect(e.x-w/2, e.y-grid.size*0.28, w*(e.hp/e.maxHp), h);
  });

  // bullets
  ctx.fillStyle='#fff';
  state.bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5, 0, Math.PI*2);
    ctx.fill();
  });
}

function spawnWave(){
  state.wave++; waveEl.textContent = state.wave;
  const base = 6 + state.wave;
  const count = Math.round(base * state.density);
  for(let i=0;i<count;i++){
    const roll = Math.random();
    const type = roll>0.8?'tank':(roll>0.55?'fast':'normal');
    const hpBase = 18 + state.wave*3;
    const mult = type==='tank'?1.8:(type==='fast'?0.7:1);
    const spd = type==='fast'?1.6:(type==='tank'?0.8:1);
    state.enemies.push({
      t: -i*24, seg:0, speed:(spd + state.wave*0.03) * state.speed,
      hp: hpBase*mult, maxHp: hpBase*mult,
      x:0, y:0, type
    });
  }
  beep(220,0.08,'square',0.06);
}

function updateTowers(){
  state.towers.forEach(t=>{
    t.cooldown = (t.cooldown||0) - 1*state.speed;
    if(t.cooldown>0) return;
    const tx = (t.x+0.5)*grid.size, ty=(t.y+0.5)*grid.size;
    const range = ranges[t.type]*grid.size;
    let target = null;
    for(const e of state.enemies){
      if(e.t<0) continue;
      const d = Math.hypot(e.x-tx, e.y-ty);
      if(d<=range){ target = e; break; }
    }
    if(!target) return;
    t.cooldown = fireRates[t.type];
    state.bullets.push({
      x:tx, y:ty, target, speed:4*state.speed, dmg:damages[t.type], type:t.type
    });
    beep(520,0.03,'sine',0.04);
  });
}

function updateBullets(){
  state.bullets.forEach(b=>{
    if(!b.target || b.target.dead) { b.dead=true; return; }
    const dx = b.target.x - b.x; const dy = b.target.y - b.y;
    const dist = Math.hypot(dx,dy);
    if(dist < 5){
      b.target.hp -= b.dmg;
      if(b.type==='slow') b.target.speed *= 0.9;
      if(b.type==='aoe'){
        state.enemies.forEach(e=>{
          if(e===b.target) return;
          if(Math.hypot(e.x-b.target.x, e.y-b.target.y) < grid.size*0.6) e.hp -= b.dmg*0.6;
        });
      }
      beep(320,0.05,'triangle',0.05);
      b.dead=true; return;
    }
    b.x += (dx/dist)*b.speed; b.y += (dy/dist)*b.speed;
  });
  state.bullets = state.bullets.filter(b=>!b.dead);
}

function updateEnemies(){
  state.enemies.forEach(e=>{
    e.t += 1*state.speed;
    if(e.t < 0) return;
    const a = path[e.seg]; const b = path[e.seg+1];
    if(!b){
      state.hp -= 1; hpEl.textContent=state.hp;
      beep(140,0.1,'square',0.08);
      e.dead = true; return;
    }
    const ax = (a.x+0.5)*grid.size, ay=(a.y+0.5)*grid.size;
    const bx = (b.x+0.5)*grid.size, by=(b.y+0.5)*grid.size;
    const dx = bx-ax, dy = by-ay;
    const dist = Math.hypot(dx,dy);
    e.progress = (e.progress||0) + e.speed;
    const t = e.progress/dist;
    e.x = ax + dx*t; e.y = ay + dy*t;
    if(t>=1){ e.seg++; e.progress=0; }
    if(e.hp<=0){ e.dead=true; state.gold += 6; goldEl.textContent=state.gold; beep(260,0.04,'sine',0.05); }
  });
  state.enemies = state.enemies.filter(e=>!e.dead);
}

function update(){
  if(!state.running){ draw(); requestAnimationFrame(update); return; }
  updateEnemies();
  updateTowers();
  updateBullets();
  draw();
  requestAnimationFrame(update);
}
update();

function selectTower(t){
  state.selectedTower = t;
  if(!t){ selInfo.textContent='Нет выбранной башни'; return; }
  selInfo.textContent = `${t.type.toUpperCase()} · ур. ${t.level||1}`;
}

canvas.addEventListener('click',(ev)=>{
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
  const gx = Math.floor(x / grid.size); const gy = Math.floor(y / grid.size);
  const existing = state.towers.find(t=>t.x===gx && t.y===gy);
  if(existing){ selectTower(existing); return; }
  if(path.some(p=>p.x===gx && p.y===gy)) return;
  const cost = costs[state.selectedType]||20;
  if(state.gold < cost) return;
  state.gold -= cost; goldEl.textContent=state.gold;
  const t={x:gx,y:gy,type:state.selectedType,level:1};
  state.towers.push(t); selectTower(t); beep(480,0.06,'square',0.05);
});

upgradeBtn.addEventListener('click',()=>{
  const t = state.selectedTower; if(!t) return;
  const price = 30 + t.level*10;
  if(state.gold < price) return;
  state.gold -= price; goldEl.textContent=state.gold;
  t.level += 1; damages[t.type] += 2; ranges[t.type] += 0.12; fireRates[t.type] = Math.max(10, fireRates[t.type]-2);
  selectTower(t); beep(620,0.06,'sawtooth',0.05);
});

sellBtn.addEventListener('click',()=>{
  const t = state.selectedTower; if(!t) return;
  state.gold += 10 + t.level*5; goldEl.textContent=state.gold;
  state.towers = state.towers.filter(x=>x!==t);
  selectTower(null); beep(240,0.06,'triangle',0.05);
});

startBtn.addEventListener('click',()=>{
  if(!state.running){ state.running=true; spawnWave(); startBtn.textContent='Волна+'; }
  else spawnWave();
});

soundBtn.addEventListener('click',()=>{
  state.sound = !state.sound; soundBtn.textContent = state.sound?'🔊':'🔇';
  beep(520,0.03,'sine',0.04);
});

// click sound for buttons
[...document.querySelectorAll('button')].forEach(b=>{
  b.addEventListener('click',()=>beep(740,0.02,'triangle',0.03));
});

[...document.querySelectorAll('.tower')].forEach(btn=>{
  btn.addEventListener('click',()=>{state.selectedType=btn.dataset.type;});
});

// menu logic
function setActive(btn){
  const parent = btn.parentElement;
  [...parent.querySelectorAll('.chip')].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

[...menu.querySelectorAll('.chip')].forEach(btn=>btn.addEventListener('click',()=>{
  setActive(btn);
  if(btn.dataset.level) state.difficulty = btn.dataset.level;
  if(btn.dataset.gold) { state.gold = +btn.dataset.gold; goldEl.textContent=state.gold; }
  if(btn.dataset.hp) { state.hp = +btn.dataset.hp; hpEl.textContent=state.hp; }
}));

[...settings.querySelectorAll('.chip')].forEach(btn=>btn.addEventListener('click',()=>{
  setActive(btn);
  if(btn.dataset.speed) state.speed = +btn.dataset.speed;
  if(btn.dataset.density) state.density = +btn.dataset.density;
}));

applyBtn.addEventListener('click',()=>{
  menu.classList.add('hidden');
  settings.classList.add('hidden');
});

settingsBtn.addEventListener('click',()=>{
  menu.classList.add('hidden');
  settings.classList.remove('hidden');
});

backBtn.addEventListener('click',()=>{
  settings.classList.add('hidden');
  menu.classList.remove('hidden');
});

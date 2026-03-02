const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hpEl = document.getElementById('hp');
const goldEl = document.getElementById('gold');
const waveEl = document.getElementById('wave');
const startBtn = document.getElementById('startBtn');

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
  towers:[], enemies:[], running:false,
  selectedType:'basic'
};

const costs = {basic:20, slow:30, aoe:40};
const colors = {basic:'#6cf18a', slow:'#6ccff1', aoe:'#f1d36c'};

const path = [
  {x:0,y:4},{x:4,y:4},{x:4,y:2},{x:9,y:2},{x:9,y:7},{x:15,y:7}
];

function cellToPx(c){ return {x:c.x*grid.size, y:c.y*grid.size}; }

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
  });

  // enemies
  ctx.fillStyle='#f16c6c';
  state.enemies.forEach(e=>{
    ctx.beginPath();
    ctx.arc(e.x, e.y, grid.size*0.18, 0, Math.PI*2);
    ctx.fill();
  });
}

function spawnWave(){
  state.wave++; waveEl.textContent = state.wave;
  const count = 6 + state.wave;
  for(let i=0;i<count;i++){
    state.enemies.push({
      t: -i*30, // spawn delay
      seg:0, speed:1 + state.wave*0.05
    });
  }
}

function update(){
  if(!state.running){ draw(); requestAnimationFrame(update); return; }
  state.enemies.forEach(e=>{
    e.t += 1;
    if(e.t < 0) return;
    // move along path
    const a = path[e.seg]; const b = path[e.seg+1];
    if(!b){
      state.hp -= 1; hpEl.textContent=state.hp;
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
  });
  state.enemies = state.enemies.filter(e=>!e.dead);
  draw();
  requestAnimationFrame(update);
}
update();

canvas.addEventListener('click',(ev)=>{
  const rect = canvas.getBoundingClientRect();
  const x = ev.clientX - rect.left; const y = ev.clientY - rect.top;
  const gx = Math.floor(x / grid.size); const gy = Math.floor(y / grid.size);
  // no build on path
  if(path.some(p=>p.x===gx && p.y===gy)) return;
  if(state.towers.some(t=>t.x===gx && t.y===gy)) return;
  const cost = costs[state.selectedType]||20;
  if(state.gold < cost) return;
  state.gold -= cost; goldEl.textContent=state.gold;
  state.towers.push({x:gx,y:gy,type:state.selectedType});
});

startBtn.addEventListener('click',()=>{
  if(!state.running){ state.running=true; spawnWave(); startBtn.textContent='Волна+'; }
  else spawnWave();
});

[...document.querySelectorAll('.tower')].forEach(btn=>{
  btn.addEventListener('click',()=>{state.selectedType=btn.dataset.type;});
});

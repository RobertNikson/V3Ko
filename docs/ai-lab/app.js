const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const resources = {data:120, compute:80, energy:60, credits:140};
const modelList = document.getElementById('modelList');
const modules = {nlp:1, vision:1, agent:1, memory:1};
let labLevel = 1;

function tierRoll(){
  const r = Math.random();
  return r < 0.7 ? 'Обычная' : r < 0.93 ? 'Редкая' : 'Эпик';
}

function render(){
  for(const k in resources){
    document.getElementById(k).textContent = resources[k];
  }
}
render();

function addModel(){
  const tier = tierRoll();
  const name = ['NLP','Vision','Agent','Memory'][Math.floor(Math.random()*4)] + ' Model';
  const bonus = tier==='Эпик'?'+12% эффективность':tier==='Редкая'?'+8% эффективность':'+5% эффективность';
  const el = document.createElement('div');
  el.className='model';
  el.innerHTML = `<div class="tag">${tier}</div><div><b>${name}</b></div><div class="hint">${bonus}</div>`;
  modelList.prepend(el);
}

function expCost(){
  return {
    data: 10 + labLevel*2,
    compute: 8 + labLevel*2,
    energy: 6 + labLevel*2
  };
}

function canAfford(c){
  return resources.data>=c.data && resources.compute>=c.compute && resources.energy>=c.energy;
}

function applyCost(c){
  resources.data-=c.data; resources.compute-=c.compute; resources.energy-=c.energy;
}

function upgradeCost(type){
  const lvl = modules[type];
  return 15 + lvl*10;
}

document.getElementById('runBtn').addEventListener('click',()=>{
  const cost = expCost();
  if(!canAfford(cost)) return;
  applyCost(cost);
  resources.credits += 5 + Math.floor(labLevel/2);
  // рост лаборатории
  if(Math.random() < 0.25){ labLevel += 1; }
  render();
  addModel();
});

document.querySelectorAll('[data-module]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const type = btn.dataset.module;
    const price = upgradeCost(type);
    if(resources.credits<price) return;
    resources.credits-=price;
    modules[type]+=1;
    // эффект апгрейда
    resources.compute += 2; resources.energy += 2; resources.data += 3;
    render();
  });
});

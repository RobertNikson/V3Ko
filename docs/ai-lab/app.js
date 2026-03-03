const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const resources = {data:120, compute:80, energy:60, credits:140};
const tiers = ['Обычная','Редкая','Эпик'];
const modelList = document.getElementById('modelList');

function render(){
  for(const k in resources){
    document.getElementById(k).textContent = resources[k];
  }
}
render();

function addModel(){
  const tier = tiers[Math.floor(Math.random()*tiers.length)];
  const name = ['NLP','Vision','Agent','Memory'][Math.floor(Math.random()*4)] + ' Model';
  const el = document.createElement('div');
  el.className='model';
  el.innerHTML = `<div class="tag">${tier}</div><div><b>${name}</b></div><div class="hint">+5% эффективность</div>`;
  modelList.prepend(el);
}

document.getElementById('runBtn').addEventListener('click',()=>{
  if(resources.data<10||resources.compute<8||resources.energy<6) return;
  resources.data-=10; resources.compute-=8; resources.energy-=6; resources.credits+=4;
  render();
  addModel();
});

document.querySelectorAll('[data-module]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(resources.credits<20) return;
    resources.credits-=20; resources.compute+=5; resources.energy+=3; resources.data+=4;
    render();
  });
});

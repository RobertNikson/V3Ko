const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API_BASE = 'https://rscczdcmlr.tail3f3f1d.ts.net/openclaw'; // fallback placeholder

const fallback = {
  locations: ['Листвянка','Ольхон','МРС','Малое море','Бухта Песчаная'],
  items: [
    {title:'Квадроциклы 2ч',cat:'equipment',loc:'Листвянка',price:'4500 ₽'},
    {title:'Глэмпинг у воды',cat:'stay',loc:'Ольхон',price:'8900 ₽/ночь'},
    {title:'Экскурсия на катере',cat:'activity',loc:'Малое море',price:'3200 ₽'}
  ]
};

const locationEl = document.getElementById('location');
const listEl = document.getElementById('list');
let selectedCat = 'equipment';

function draw(items){
  listEl.innerHTML='';
  if(!items.length){listEl.innerHTML='<div class="item">Пока нет предложений</div>';return;}
  items.forEach(i=>{
    const d=document.createElement('div');
    d.className='item';
    d.innerHTML=`<b>${i.title}</b><br><small>${i.loc} · ${i.price}</small>`;
    listEl.appendChild(d);
  });
}

function loadFallback(){
  locationEl.innerHTML = fallback.locations.map(x=>`<option>${x}</option>`).join('');
  draw(fallback.items.filter(i=>i.cat===selectedCat));
}

document.querySelectorAll('[data-cat]').forEach(b=>{
  b.onclick=()=>{selectedCat=b.dataset.cat;loadFallback();};
});

document.getElementById('refresh').onclick=loadFallback;

loadFallback();

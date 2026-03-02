const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const CATS = [
  { key:'all', label:'Все' },
  { key:'politics', label:'Политика' },
  { key:'finance', label:'Финансы' },
  { key:'tech', label:'Технологии' },
  { key:'ai', label:'AI' },
  { key:'war', label:'Конфликты' },
  { key:'disasters', label:'Катастрофы' },
];

const tabsEl = document.getElementById('tabs');
const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');

let active = CATS[0];
let feed = { items: [] };

function tabButton(cat){
  const b=document.createElement('button');
  b.className='tab'+(cat.key===active.key?' active':'');
  b.textContent=cat.label;
  b.onclick=()=>{active=cat; [...tabsEl.children].forEach(x=>x.classList.remove('active')); b.classList.add('active'); render();};
  return b;
}

CATS.forEach(c=>tabsEl.appendChild(tabButton(c)));

function getImage(a){
  return a?.image || '';
}

function card(a){
  const c=document.createElement('article');
  c.className='card';
  const img=getImage(a);
  if(img){
    const i=document.createElement('img'); i.src=img; c.appendChild(i);
  }
  const body=document.createElement('div'); body.className='card-body';
  const h=document.createElement('h3'); h.textContent=a.title||'Без заголовка';
  const meta=document.createElement('div'); meta.className='meta';
  meta.textContent=`${a.domain||'Источник'} · ${a.seendate||''}`;
  const link=document.createElement('a'); link.href=a.url; link.textContent='Читать источник'; link.target='_blank';
  link.rel='noreferrer'; link.className='meta';
  body.appendChild(h); body.appendChild(meta); body.appendChild(link);
  c.appendChild(body);
  return c;
}

async function load(){
  statusEl.textContent='Загружаю новости…';
  gridEl.innerHTML='';
  try{
    const res = await fetch('./feed.json?ts=' + Date.now());
    feed = await res.json();
  }catch(e){
    statusEl.textContent='Не удалось загрузить feed.json';
    return;
  }
  render();
}

function render(){
  gridEl.innerHTML='';
  let items = feed.items || [];
  if(active.key !== 'all') items = items.filter(i=>i.category===active.key);
  if(!items.length){
    statusEl.textContent='Нет данных. Попробуйте обновить позже.';
    return;
  }
  statusEl.textContent=`Найдено: ${items.length}`;
  items.forEach(a=>gridEl.appendChild(card(a)));
}

refreshBtn.onclick=load;
load();

const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

const CATS = [
  { key:'all', label:'Все', query:'news OR breaking OR update OR report' },
  { key:'politics', label:'Политика', query:'(politics OR government OR election OR parliament OR president OR санкции OR выборы OR президент)' },
  { key:'finance', label:'Финансы', query:'(finance OR economy OR stock market OR banking OR inflation OR oil OR рынок OR акции OR инфляция OR нефть)' },
  { key:'tech', label:'Технологии', query:'(technology OR software OR startup OR cybersecurity OR технологии OR кибер OR утечка данных)' },
  { key:'ai', label:'AI', query:'("artificial intelligence" OR "machine learning" OR AI OR ИИ OR нейросеть)' },
  { key:'war', label:'Конфликты', query:'(war OR conflict OR strike OR missile OR drone OR ceasefire OR обстрел OR удар OR ракета OR дрон)' },
  { key:'disasters', label:'Катастрофы', query:'(earthquake OR wildfire OR flood OR hurricane OR tornado OR heatwave OR землетрясение OR пожар OR наводнение OR ураган)' },
];

const timespans = ['1d','3d','7d','14d','30d'];
const tabsEl = document.getElementById('tabs');
const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');

let active = CATS[0];

function tabButton(cat){
  const b=document.createElement('button');
  b.className='tab'+(cat.key===active.key?' active':'');
  b.textContent=cat.label;
  b.onclick=()=>{active=cat; [...tabsEl.children].forEach(x=>x.classList.remove('active')); b.classList.add('active'); load();};
  return b;
}

CATS.forEach(c=>tabsEl.appendChild(tabButton(c)));

function jina(url){
  return 'https://r.jina.ai/http://' + url.replace('https://','').replace('http://','');
}

async function fetchWithTimeout(url, ms=8000){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), ms);
  try{
    const res = await fetch(url, {signal: ctrl.signal});
    const text = await res.text();
    return text;
  } finally {
    clearTimeout(t);
  }
}

async function fetchGDELT(query){
  for(const span of timespans){
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&timespan=${span}&mode=artlist&maxrecords=50&format=json&sort=date`;
    try{
      let text = await fetchWithTimeout(jina(url));
      if(text.includes('Markdown Content:')) text = text.split('Markdown Content:')[1].trim();
      const data = JSON.parse(text);
      if(data.articles && data.articles.length) return data.articles;
    }catch(e){/* continue */}
  }
  return [];
}

function getImage(a){
  return a?.socialimage || a?.image || '';
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
  const arts = await fetchGDELT(active.query);
  if(!arts.length){
    statusEl.textContent='Нет данных или таймаут. Нажми «Обновить».';
    return;
  }
  statusEl.textContent=`Найдено: ${arts.length}`;
  const seen=new Set();
  arts.forEach(a=>{
    const key=(a.url||'')+(a.title||'');
    if(seen.has(key)) return; seen.add(key);
    gridEl.appendChild(card(a));
  });
}

refreshBtn.onclick=load;
load();

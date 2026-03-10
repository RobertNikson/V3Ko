const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const params = new URLSearchParams(location.search);
const locName = params.get('location') || 'Листвянка';

const titleLoc = document.getElementById('titleLoc');
const subLoc = document.getElementById('subLoc');
const listEl = document.getElementById('list');
const bundlesEl = document.getElementById('bundles');
const startAtEl = document.getElementById('startAt');
const endAtEl = document.getElementById('endAt');
const slotStatusEl = document.getElementById('slotStatus');
let selectedCat = 'equipment';
let locationId = null;

const session = (() => {
  try { return JSON.parse(localStorage.getItem('baikal_session') || 'null'); } catch { return null; }
})();
const userId = session?.user?.id || null;

titleLoc.textContent = locName;
subLoc.textContent = 'Подбираем предложения…';

async function loadReviewSummary(listingId) {
  try {
    const r = await fetch(`${API}/listings/${listingId}/reviews`);
    const j = await r.json();
    return `${j?.avg?.avg_rating || '—'} ★ (${j?.avg?.total || 0})`;
  } catch { return '—'; }
}

function toIsoFromInput(v){
  if(!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function currentRange(){
  const s = toIsoFromInput(startAtEl.value);
  const e = toIsoFromInput(endAtEl.value);
  return { s, e };
}

async function addFavorite(listingId) {
  if (!userId) return alert('Сначала войди как пользователь на странице auth');
  const r = await fetch(`${API}/users/${userId}/favorites`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ listingId })
  });
  if (r.ok) alert('Добавлено в избранное ❤️');
}

async function addQuickReview(listingId) {
  const text = prompt('Короткий отзыв:');
  if (!text) return;
  const rating = Number(prompt('Оценка 1-5:', '5')) || 5;
  const r = await fetch(`${API}/listings/${listingId}/reviews`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId, rating: Math.max(1, Math.min(5, rating)), text })
  });
  if (r.ok) alert('Отзыв сохранён ✅');
}

function card(item) {
  const image = item.metadata?.image_url || 'https://images.unsplash.com/photo-1531131141161-ecdfb1858dd2?q=80&w=1200&auto=format&fit=crop';
  const desc = item.description || 'Описание скоро добавим';
  const price = item.metadata?.price_label || 'по запросу';

  const div = document.createElement('article');
  div.className = 'offer-card';
  div.innerHTML = `
    <img src="${image}" alt="${item.title}" class="offer-image" />
    <div class="offer-body">
      <h4>${item.title}</h4>
      <p>${desc}</p>
      <div class="offer-meta">${price}</div>
      <div class="offer-meta" id="rev-${item.id}">рейтинг: ...</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="book-btn">Забронировать</button>
        <button class="ghost fav-btn">В избранное</button>
        <button class="ghost rev-btn">Отзыв</button>
      </div>
    </div>
  `;
  div.querySelector('.book-btn').onclick = async () => {
    const { s, e } = currentRange();
    if (!s || !e) return alert('Сначала выбери дату и время начала/конца');
    if (new Date(e) <= new Date(s)) return alert('Конец должен быть позже начала');

    const unit = item.units?.[0];
    if (!unit) return alert('Нет доступного юнита');

    const av = await fetch(`${API}/availability/query?unitId=${unit.id}&startsAt=${encodeURIComponent(s)}&endsAt=${encodeURIComponent(e)}`);
    const avj = await av.json();
    if (!avj.available) return alert('Этот слот уже занят, выбери другое время');

    const priceNum = Number(String(item.metadata?.price_label || '').replace(/[^\d]/g, '')) || 3000;
    const hold = await fetch(`${API}/bookings/hold`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, listingId: item.id, unitId: unit.id, startsAt: s, endsAt: e, price: priceNum })
    });
    const h = await hold.json();
    if (!hold.ok) return alert(h.error || 'Ошибка hold');

    await fetch(`${API}/bookings/${h.id}/pay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'mock' }) });
    await fetch(`${API}/payments/mock/${h.id}/success`, { method: 'POST' });
    alert('Бронь подтверждена ✅');
  };
  div.querySelector('.fav-btn').onclick = () => addFavorite(item.id);
  div.querySelector('.rev-btn').onclick = () => addQuickReview(item.id);

  loadReviewSummary(item.id).then((s) => {
    const el = div.querySelector(`#rev-${item.id}`);
    if (el) el.textContent = `рейтинг: ${s}`;
  });

  return div;
}

async function resolveLocationId() {
  const roots = await (await fetch(`${API}/locations`)).json();
  const children = await (await fetch(`${API}/locations?parentId=${roots[0].id}`)).json();
  const found = children.find(x => x.name.toLowerCase() === locName.toLowerCase());
  return found?.id || children[0]?.id;
}

function renderBundles(rows){
  if(!bundlesEl) return;
  bundlesEl.innerHTML='';
  if(!rows?.length){ bundlesEl.innerHTML='<div class="item">Пакетов пока нет</div>'; return; }
  rows.forEach(b=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<b>${b.title}</b><br><small>${b.description || ''}</small><br><small>${b.price_label || ''}</small>`;
    if (Array.isArray(b.items) && b.items.length) {
      const ul=document.createElement('ul');
      b.items.forEach(i=>{ const li=document.createElement('li'); li.textContent=`${i.title} (${i.category})`; ul.appendChild(li);});
      d.appendChild(ul);
    }
    bundlesEl.appendChild(d);
  });
}

async function loadBundles(){
  if (!locationId || !bundlesEl) return;
  try {
    const rows = await (await fetch(`${API}/bundles?locationId=${locationId}`)).json();
    renderBundles(rows);
  } catch {
    bundlesEl.innerHTML='<div class="item">Не удалось загрузить пакеты</div>';
  }
}

async function loadCatalog() {
  if (!locationId) return;
  const url = `${API}/catalog?locationId=${locationId}&category=${selectedCat}`;
  const rows = await (await fetch(url)).json();
  listEl.innerHTML = '';
  if (!rows.length) {
    listEl.innerHTML = '<div class="item">Пока нет предложений в этой категории</div>';
  } else {
    rows.forEach(r => listEl.appendChild(card(r)));
  }
  await loadBundles();
}

document.querySelectorAll('.cat-btn').forEach((b) => {
  b.onclick = () => {
    selectedCat = b.dataset.cat;
    document.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    loadCatalog();
  };
});

document.getElementById('refresh').onclick = loadCatalog;

function setDefaultRange(){
  const now = new Date();
  const start = new Date(now.getTime() + 60*60*1000);
  const end = new Date(start.getTime() + 2*60*60*1000);
  const fmt = (d)=> new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  startAtEl.value = fmt(start);
  endAtEl.value = fmt(end);
  slotStatusEl.textContent = 'Диапазон выбран: можно бронировать';
}
startAtEl?.addEventListener('change', ()=> slotStatusEl.textContent = 'Диапазон обновлён');
endAtEl?.addEventListener('change', ()=> slotStatusEl.textContent = 'Диапазон обновлён');

(async function init(){
  setDefaultRange();
  try {
    locationId = await resolveLocationId();
    subLoc.textContent = userId ? 'Локация выбрана · пользователь авторизован' : 'Локация выбрана · войди для избранного и отзывов';
    await loadCatalog();
  } catch (e) {
    subLoc.textContent = 'Ошибка загрузки';
    listEl.innerHTML = `<div class="item">${e.message}</div>`;
  }
})();
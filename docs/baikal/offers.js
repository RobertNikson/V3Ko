const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const params = new URLSearchParams(location.search);
const locName = params.get('location') || 'Листвянка';

const titleLoc = document.getElementById('titleLoc');
const subLoc = document.getElementById('subLoc');
const listEl = document.getElementById('list');
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
  div.querySelector('.book-btn').onclick = () => alert('Бронирование: следующий шаг (hold + оплата) уже подключается к API');
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

async function loadCatalog() {
  if (!locationId) return;
  const url = `${API}/catalog?locationId=${locationId}&category=${selectedCat}`;
  const rows = await (await fetch(url)).json();
  listEl.innerHTML = '';
  if (!rows.length) {
    listEl.innerHTML = '<div class="item">Пока нет предложений в этой категории</div>';
    return;
  }
  rows.forEach(r => listEl.appendChild(card(r)));
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

(async function init(){
  try {
    locationId = await resolveLocationId();
    subLoc.textContent = userId ? 'Локация выбрана · пользователь авторизован' : 'Локация выбрана · войди для избранного и отзывов';
    await loadCatalog();
  } catch (e) {
    subLoc.textContent = 'Ошибка загрузки';
    listEl.innerHTML = `<div class="item">${e.message}</div>`;
  }
})();
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

titleLoc.textContent = locName;
subLoc.textContent = 'Подбираем предложения…';

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
      <button class="book-btn">Забронировать</button>
    </div>
  `;
  div.querySelector('.book-btn').onclick = () => alert('Бронирование: следующий шаг (hold + оплата) уже подключается к API');
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
    subLoc.textContent = 'Локация выбрана';
    await loadCatalog();
  } catch (e) {
    subLoc.textContent = 'Ошибка загрузки';
    listEl.innerHTML = `<div class="item">${e.message}</div>`;
  }
})();
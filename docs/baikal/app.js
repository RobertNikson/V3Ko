const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';

const fallback = {
  locations: ['Листвянка', 'Ольхон', 'МРС', 'Малое море', 'Бухта Песчаная'],
  items: [
    { title: 'Квадроциклы 2ч', cat: 'equipment', loc: 'Листвянка', price: '4500 ₽' },
    { title: 'Глэмпинг у воды', cat: 'stay', loc: 'Ольхон', price: '8900 ₽/ночь' },
    { title: 'Экскурсия на катере', cat: 'activity', loc: 'Малое море', price: '3200 ₽' },
  ],
};

const locationEl = document.getElementById('location');
const listEl = document.getElementById('list');
let selectedCat = 'equipment';
let selectedLocationId = null;
let locationMap = new Map();

function draw(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<div class="item">Пока нет предложений</div>';
    return;
  }
  items.forEach((i) => {
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `<b>${i.title}</b><br><small>${i.loc || ''} · ${i.price || ''}</small>`;
    listEl.appendChild(d);
  });
}

function loadFallback() {
  locationEl.innerHTML = fallback.locations.map((x, idx) => `<option value="fb-${idx}">${x}</option>`).join('');
  draw(fallback.items.filter((i) => i.cat === selectedCat));
}

async function loadLocations() {
  try {
    const roots = await (await fetch(`${API}/locations`)).json();
    if (!roots.length) throw new Error('no roots');
    const rootId = roots[0].id;
    const children = await (await fetch(`${API}/locations?parentId=${rootId}`)).json();
    if (!children.length) throw new Error('no child locations');

    locationMap = new Map(children.map((c) => [c.id, c.name]));
    locationEl.innerHTML = children.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    selectedLocationId = children[0].id;
    locationEl.onchange = () => {
      selectedLocationId = locationEl.value;
      loadCatalog();
    };
    await loadCatalog();
  } catch (e) {
    console.warn('fallback mode', e);
    loadFallback();
  }
}

async function loadCatalog() {
  if (!selectedLocationId) return;
  try {
    const url = `${API}/catalog?locationId=${selectedLocationId}&category=${selectedCat}`;
    const rows = await (await fetch(url)).json();
    const items = rows.map((r) => ({
      title: r.title,
      cat: r.category,
      loc: locationMap.get(r.location_id) || 'Байкал',
      price: r.metadata?.price_label || 'по запросу',
    }));
    draw(items);
  } catch (e) {
    console.warn(e);
    loadFallback();
  }
}

document.querySelectorAll('[data-cat]').forEach((b) => {
  b.onclick = () => {
    selectedCat = b.dataset.cat;
    if (selectedLocationId) loadCatalog();
    else loadFallback();
  };
});

document.getElementById('refresh').onclick = () => {
  if (selectedLocationId) loadCatalog();
  else loadFallback();
};

loadLocations();
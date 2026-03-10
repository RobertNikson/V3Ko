const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const locationEl = document.getElementById('location');
const listEl = document.getElementById('list');

let selectedCat = 'equipment';
let selectedLocationId = null;
let locationMap = new Map();
let nameToId = new Map();
let markers = new Map();
let map;

const LOCATION_COORDS = {
  'Листвянка': [51.8538, 104.8691],
  'Ольхон': [53.1550, 107.4100],
  'МРС': [52.9862, 106.9007],
  'Малое море': [53.0310, 106.9760],
  'Бухта Песчаная': [52.2607, 105.7070],
};

function fmtIso(dt) { return new Date(dt).toISOString(); }

async function bookNow(row) {
  try {
    const unit = row.units?.[0];
    if (!unit) return alert('Нет доступных юнитов для брони');
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + (row.category === 'stay' ? 24 : 2) * 60 * 60 * 1000);
    const priceNum = Number(String(row.metadata?.price_label || '').replace(/[^\d]/g, '')) || 3000;

    const hold = await fetch(`${API}/bookings/hold`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ listingId: row.id, unitId: unit.id, startsAt: fmtIso(start), endsAt: fmtIso(end), price: priceNum }),
    });
    const holdJson = await hold.json();
    if (!hold.ok) return alert('Hold ошибка: ' + (holdJson.error || 'unknown'));

    const pay = await fetch(`${API}/bookings/${holdJson.id}/pay`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: 'mock' }),
    });
    const payJson = await pay.json();
    if (!pay.ok) return alert('Оплата ошибка: ' + (payJson.error || 'unknown'));

    await fetch(`${API}/payments/mock/${holdJson.id}/success`, { method: 'POST' });
    tg?.showAlert ? tg.showAlert('Бронь подтверждена ✅') : alert('Бронь подтверждена ✅');
  } catch (e) {
    alert('Ошибка: ' + e.message);
  }
}

function drawItems(rows) {
  listEl.innerHTML = '';
  if (!rows.length) {
    listEl.innerHTML = '<div class="item">Пока нет предложений для выбранной локации/категории</div>';
    return;
  }
  rows.forEach((r) => {
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `<b>${r.title}</b><br><small>${locationMap.get(r.location_id) || 'Байкал'} · ${r.metadata?.price_label || 'по запросу'}</small>`;

    const b = document.createElement('button');
    b.className = 'book-btn';
    b.textContent = 'Забронировать';
    b.onclick = () => bookNow(r);
    d.appendChild(b);

    listEl.appendChild(d);
  });
}

async function loadCatalog() {
  if (!selectedLocationId) return;
  const url = `${API}/catalog?locationId=${selectedLocationId}&category=${selectedCat}`;
  const rows = await (await fetch(url)).json();
  drawItems(rows);
}

function setActiveCat(cat) {
  selectedCat = cat;
  document.querySelectorAll('.cat-btn').forEach((el) => el.classList.toggle('active', el.dataset.cat === cat));
}

function focusMapByLocationName(name) {
  const m = markers.get(name);
  if (m && map) {
    map.setView(m.getLatLng(), 10, { animate: true });
    m.openPopup();
  }
}

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([53.4, 107.8], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
}

function rebuildMarkers(children) {
  markers.forEach((m) => m.remove());
  markers.clear();

  children.forEach((loc) => {
    const coords = LOCATION_COORDS[loc.name];
    if (!coords) return;
    const marker = L.marker(coords).addTo(map).bindPopup(`<b>${loc.name}</b>`);
    marker.on('click', () => {
      selectedLocationId = loc.id;
      locationEl.value = loc.id;
      loadCatalog();
    });
    markers.set(loc.name, marker);
  });
}

async function init() {
  initMap();

  const roots = await (await fetch(`${API}/locations`)).json();
  const children = await (await fetch(`${API}/locations?parentId=${roots[0].id}`)).json();

  locationMap = new Map(children.map((c) => [c.id, c.name]));
  nameToId = new Map(children.map((c) => [c.name, c.id]));
  rebuildMarkers(children);

  locationEl.innerHTML = children.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  selectedLocationId = children[0]?.id;
  focusMapByLocationName(children[0]?.name);

  locationEl.onchange = () => {
    selectedLocationId = locationEl.value;
    focusMapByLocationName(locationMap.get(selectedLocationId));
    loadCatalog();
  };

  document.querySelectorAll('.cat-btn').forEach((b) => {
    b.onclick = () => { setActiveCat(b.dataset.cat); loadCatalog(); };
  });

  document.getElementById('refresh').onclick = loadCatalog;

  setActiveCat('equipment');
  await loadCatalog();
}

init().catch((e) => {
  listEl.innerHTML = `<div class="item">Ошибка загрузки: ${e.message}</div>`;
});
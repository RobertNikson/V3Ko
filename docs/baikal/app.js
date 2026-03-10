const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const locationEl = document.getElementById('location');
const listEl = document.getElementById('list');

let selectedCat = 'equipment';
let selectedLocationId = null;
let locationMap = new Map();
let nameToId = new Map();

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

function activatePinByLocationName(name) {
  document.querySelectorAll('.pin').forEach((p) => p.classList.toggle('active', p.dataset.name === name));
}

async function init() {
  const roots = await (await fetch(`${API}/locations`)).json();
  const children = await (await fetch(`${API}/locations?parentId=${roots[0].id}`)).json();

  locationMap = new Map(children.map((c) => [c.id, c.name]));
  nameToId = new Map(children.map((c) => [c.name, c.id]));

  locationEl.innerHTML = children.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  selectedLocationId = children[0]?.id;
  activatePinByLocationName(children[0]?.name);

  locationEl.onchange = () => {
    selectedLocationId = locationEl.value;
    activatePinByLocationName(locationMap.get(selectedLocationId));
    loadCatalog();
  };

  document.querySelectorAll('.cat-btn').forEach((b) => {
    b.onclick = () => { setActiveCat(b.dataset.cat); loadCatalog(); };
  });

  document.querySelectorAll('.pin').forEach((p) => {
    p.onclick = () => {
      const id = nameToId.get(p.dataset.name);
      if (!id) return;
      selectedLocationId = id;
      locationEl.value = id;
      activatePinByLocationName(p.dataset.name);
      loadCatalog();
    };
  });

  document.getElementById('refresh').onclick = loadCatalog;

  setActiveCat('equipment');
  await loadCatalog();
}

init().catch((e) => {
  listEl.innerHTML = `<div class="item">Ошибка загрузки: ${e.message}</div>`;
});
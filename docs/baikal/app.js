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
let currentRows = [];

function fmtIso(dt) { return new Date(dt).toISOString(); }

async function bookNow(row) {
  try {
    const unit = row.units?.[0];
    if (!unit) return alert('Нет доступных юнитов для брони');

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + (row.category === 'stay' ? 24 : 2) * 60 * 60 * 1000);

    const priceNum = Number(String(row.metadata?.price_label || '').replace(/[^\d]/g, '')) || 3000;

    const hold = await fetch(`${API}/bookings/hold`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        listingId: row.id,
        unitId: unit.id,
        startsAt: fmtIso(start),
        endsAt: fmtIso(end),
        price: priceNum,
      }),
    });

    const holdJson = await hold.json();
    if (!hold.ok) return alert('Не удалось поставить hold: ' + (holdJson.error || 'ошибка'));

    const pay = await fetch(`${API}/bookings/${holdJson.id}/pay`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'mock' }),
    });
    const payJson = await pay.json();
    if (!pay.ok) return alert('Ошибка оплаты: ' + (payJson.error || 'ошибка'));

    await fetch(`${API}/payments/mock/${holdJson.id}/success`, { method: 'POST' });

    if (tg?.showAlert) tg.showAlert('Бронь подтверждена ✅');
    else alert('Бронь подтверждена ✅');
  } catch (e) {
    alert('Ошибка: ' + e.message);
  }
}

function drawItems(rows) {
  listEl.innerHTML = '';
  if (!rows.length) {
    listEl.innerHTML = '<div class="item">Пока нет предложений</div>';
    return;
  }
  rows.forEach((r) => {
    const d = document.createElement('div');
    d.className = 'item';
    d.innerHTML = `<b>${r.title}</b><br><small>${locationMap.get(r.location_id) || 'Байкал'} · ${r.metadata?.price_label || 'по запросу'}</small>`;

    const b = document.createElement('button');
    b.textContent = 'Забронировать';
    b.style.marginTop = '8px';
    b.onclick = () => bookNow(r);

    d.appendChild(b);
    listEl.appendChild(d);
  });
}

function loadFallback() {
  locationEl.innerHTML = fallback.locations.map((x, idx) => `<option value="fb-${idx}">${x}</option>`).join('');
  const rows = fallback.items.filter((i) => i.cat === selectedCat).map((i, idx) => ({
    id: `fb-${idx}`,
    title: i.title,
    location_id: 'fb',
    metadata: { price_label: i.price },
    units: [{ id: `u-${idx}` }],
    category: selectedCat,
  }));
  locationMap.set('fb', locationEl.value);
  drawItems(rows);
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
    currentRows = rows;
    drawItems(rows);
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
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const geoBtn = document.getElementById('geoBtn');
const geoStatus = document.getElementById('geoStatus');
const aiBtn = document.getElementById('aiBtn');
const seasonBg = document.getElementById('seasonBg');
const aiPanel = document.getElementById('aiPanel');
const aiClose = document.getElementById('aiClose');
const aiMsgs = document.getElementById('aiMsgs');
const aiInput = document.getElementById('aiInput');
const aiSend = document.getElementById('aiSend');

const seasonBackgrounds = {
  winter: './assets/bg-winter.jpg',
  spring: './assets/bg-spring.jpg',
  summer: './assets/bg-summer.jpg',
  autumn: './assets/bg-autumn.jpg'
};

function detectSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return 'winter';
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  return 'autumn';
}

const season = detectSeason();
if (seasonBg) seasonBg.style.backgroundImage = `url(${seasonBackgrounds[season]})`;

const suggestions = [
  { k: ['семья', 'дет'], a: 'Для семьи чаще выбирают Листвянку и Малое море: спокойнее логистика и больше баз/экскурсий.' },
  { k: ['роман', 'пара'], a: 'Для пары советую Ольхон или бухту Песчаная — красивый вид и атмосферные размещения.' },
  { k: ['техника', 'квадро', 'снего'], a: 'По технике смотри раздел «Техника»: сначала выбери локацию на карте, затем категорию.' },
  { k: ['как', 'заброни'], a: 'Нажми локацию на карте → откроется страница предложений → выбери карточку и нажми «Забронировать».' },
];

function aiReplyFallback(text) {
  const t = text.toLowerCase();
  for (const s of suggestions) if (s.k.some(x => t.includes(x))) return s.a;
  return 'Подскажу маршрут: выбери локацию на карте (Листвянка, Ольхон, МРС, Малое море, Бухта Песчаная), затем категорию и предложение.';
}

function addMsg(role, text) {
  const d = document.createElement('div');
  d.className = 'ai-msg ' + role;
  d.textContent = text;
  aiMsgs.appendChild(d);
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
}

aiBtn.onclick = () => {
  aiPanel.classList.remove('hidden');
  if (!aiMsgs.children.length) addMsg('bot', 'Привет! Я помогу выбрать локацию и формат отдыха на Байкале.');
};
aiClose.onclick = () => aiPanel.classList.add('hidden');

aiSend.onclick = async () => {
  const text = aiInput.value.trim();
  if (!text) return;
  addMsg('user', text);
  aiInput.value = '';

  try {
    const r = await fetch('https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    if (!r.ok) throw new Error('ai unavailable');
    const j = await r.json();
    addMsg('bot', j.answer || 'Пустой ответ');
  } catch {
    addMsg('bot', aiReplyFallback(text));
  }
};

aiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') aiSend.click();
});

document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('baikal_session');
  location.href = './auth.html';
});

async function detectGeo() {
  geoStatus.textContent = 'Определяем геолокацию…';

  if (!navigator.geolocation) {
    geoStatus.textContent = 'Геолокация не поддерживается на этом устройстве.';
    return;
  }

  // Pre-check permission when available
  try {
    if (navigator.permissions?.query) {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') {
        geoStatus.textContent = 'Доступ к геолокации запрещён. Разреши гео для Telegram в настройках телефона.';
        return;
      }
    }
  } catch {}

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      geoStatus.textContent = `Ваше гео: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}м)`;
      try { tg?.sendData?.(JSON.stringify({ type: 'geo', latitude, longitude, accuracy })); } catch {}
    },
    (err) => {
      if (err?.code === 1) geoStatus.textContent = 'Гео отклонено. Разреши доступ к геолокации для Telegram.';
      else if (err?.code === 2) geoStatus.textContent = 'Геолокация недоступна (слабый сигнал GPS/сети).';
      else if (err?.code === 3) geoStatus.textContent = 'Таймаут геолокации. Попробуй ещё раз на улице или с включённым GPS.';
      else geoStatus.textContent = 'Не удалось получить геолокацию.';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
  );
}

geoBtn.onclick = detectGeo;
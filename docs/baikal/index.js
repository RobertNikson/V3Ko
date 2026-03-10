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
const goalBtns = document.querySelectorAll('.goal-btn');
const activeRange = document.getElementById('activeRange');
const comfortRange = document.getElementById('comfortRange');
const budgetRange = document.getElementById('budgetRange');
const activeVal = document.getElementById('activeVal');
const comfortVal = document.getElementById('comfortVal');
const budgetVal = document.getElementById('budgetVal');
const planPreview = document.getElementById('planPreview');
const planLocation = document.getElementById('planLocation');
const startJourney = document.getElementById('startJourney');

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

let selectedGoal = 'relax';
function goalLabel(g){ return ({relax:'Перезагрузка',active:'Активный weekend',family:'Семейный отдых',romantic:'Для пары'})[g] || 'Маршрут'; }
function buildPlan(){
  const a = Number(activeRange?.value || 50);
  const c = Number(comfortRange?.value || 50);
  const b = Number(budgetRange?.value || 12000);
  activeVal.textContent = String(a);
  comfortVal.textContent = String(c);
  budgetVal.textContent = String(b);

  const day1 = a > 60 ? 'прокат/активность' : 'прогулка и обзорные точки';
  const day2 = c > 60 ? 'комфортное проживание + SPA/баня' : 'бюджетный уютный формат';
  const budgetText = b > 20000 ? 'премиум-сценарий' : b > 10000 ? 'оптимальный баланс' : 'экономный формат';
  planPreview.innerHTML = `<b>${goalLabel(selectedGoal)}</b><br>День 1: ${day1}<br>День 2: ${day2}<br>Рекомендация: ${budgetText}.`;
}

goalBtns.forEach(btn => btn.addEventListener('click', () => {
  selectedGoal = btn.dataset.goal;
  goalBtns.forEach(x => x.classList.remove('active'));
  btn.classList.add('active');
  buildPlan();
}));

[activeRange, comfortRange, budgetRange].forEach(el => el?.addEventListener('input', buildPlan));
startJourney?.addEventListener('click', () => {
  const q = new URLSearchParams({
    location: planLocation.value,
    goal: selectedGoal,
    activity: activeRange.value,
    comfort: comfortRange.value,
    budget: budgetRange.value,
  });
  q.set('appv', '20260310-15');
  location.href = `./offers-v2.html?${q.toString()}`;
});

buildPlan();
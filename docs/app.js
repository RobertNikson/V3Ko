const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// Tabs
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Headline Roulette
const rouletteSamples = [
  'ИИ предсказал: понедельник всё ещё будет понедельником',
  'Метеорологи предупреждают: завтра погода снова будет',
  'Экономисты: рынок снова удивлён тем, что он рынок',
  'Учёные выяснили: кофе по утрам всё ещё работает'
];
const rouletteText = document.getElementById('rouletteText');
document.getElementById('rouletteBtn').onclick = () => {
  rouletteText.textContent = rouletteSamples[Math.floor(Math.random()*rouletteSamples.length)];
};

// Fake or Fact
const quizData = [
  { text: 'Город ввёл неделю без новостей для психогигиены', answer: 'fake' },
  { text: 'В регионе объявили временный запрет на открытый огонь из-за пожаров', answer: 'fact' },
  { text: 'Экономисты снова спорят о влиянии ставок на рынки', answer: 'fact' },
  { text: 'Парламент запретил понедельники', answer: 'fake' }
];
let quizIdx = 0;
const quizText = document.getElementById('quizText');
const quizResult = document.getElementById('quizResult');
const quizNext = document.getElementById('quizNext');

function loadQuiz() {
  const q = quizData[quizIdx % quizData.length];
  quizText.textContent = q.text;
  quizResult.textContent = '';
}
loadQuiz();

document.querySelectorAll('#quiz button[data-answer]').forEach(btn => {
  btn.onclick = () => {
    const q = quizData[quizIdx % quizData.length];
    quizResult.textContent = (btn.dataset.answer === q.answer) ? 'Верно!' : 'Мимо.';
  };
});
quizNext.onclick = () => { quizIdx++; loadQuiz(); };

// Geo quiz
const geoData = [
  { text: 'Вводят временный запрет на открытый огонь из-за засухи', answer: 'США' },
  { text: 'Национальная валюта под давлением из-за роста цен на нефть', answer: 'Иран' },
  { text: 'Выборы проходят на фоне проблем с инфраструктурой после бедствий', answer: 'Непал' }
];
let geoIdx = 0;
const geoText = document.getElementById('geoText');
const geoInput = document.getElementById('geoInput');
const geoResult = document.getElementById('geoResult');

function loadGeo(){
  const g = geoData[geoIdx % geoData.length];
  geoText.textContent = g.text;
  geoInput.value = '';
  geoResult.textContent = '';
}
loadGeo();

document.getElementById('geoCheck').onclick = () => {
  const g = geoData[geoIdx % geoData.length];
  const ok = geoInput.value.trim().toLowerCase() === g.answer.toLowerCase();
  geoResult.textContent = ok ? 'Верно!' : `Нет, это: ${g.answer}`;
};

document.getElementById('geoNext').onclick = () => { geoIdx++; loadGeo(); };

// AI Commentator
const commentText = document.getElementById('commentText');
document.getElementById('commentBtn').onclick = () => {
  const variants = [
    'Если день тихий — это обычно затишье перед лентой.',
    'У новостей есть талант появляться ровно тогда, когда ты уже устал.',
    'Мир стабилен… в своей нестабильности.'
  ];
  commentText.textContent = variants[Math.floor(Math.random()*variants.length)];
};

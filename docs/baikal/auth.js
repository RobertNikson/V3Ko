const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }
const API = 'https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const out = document.getElementById('authOut');

function saveSession(data){
  localStorage.setItem('baikal_session', JSON.stringify(data));
}
function goMain(){ location.href = './index.html'; }

document.getElementById('userRegister').onclick = async () => {
  const fullName = document.getElementById('uName').value.trim();
  const phone = document.getElementById('uPhone').value.trim();
  const body = { fullName, phone };
  const r = await fetch(`${API}/users/register`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)});
  const j = await r.json();
  out.textContent = JSON.stringify(j, null, 2);
  if (r.ok) { saveSession({ role:'user', user:j }); goMain(); }
};

document.getElementById('userAuth').onclick = async () => {
  if (!tg?.initData) { out.textContent = 'Telegram initData не найден'; return; }
  const r = await fetch(`${API}/auth/telegram`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ initData: tg.initData })});
  const j = await r.json();
  out.textContent = JSON.stringify(j, null, 2);
  if (r.ok) { saveSession({ role:'user', user:j.user }); goMain(); }
};

document.getElementById('partnerRegister').onclick = async () => {
  const body = {
    name: document.getElementById('pName').value.trim(),
    partnerType: document.getElementById('pType').value,
    legal: {
      inn: document.getElementById('pInn').value.trim(),
      legalName: document.getElementById('pLegal').value.trim()
    }
  };
  const r = await fetch(`${API}/partners/register`, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)});
  const j = await r.json();
  out.textContent = JSON.stringify(j, null, 2);
  if (r.ok) {
    saveSession({ role:'partner', partner:j });
    location.href = './partner.html';
  }
};

const API='https://rscczdcmlr.tail3f3f1d.ts.net/baikal-api';
const s = JSON.parse(localStorage.getItem('baikal_session') || 'null');
if (!s?.user?.id) location.replace('./auth.html');
const userId = s.user.id;
document.getElementById('uName').textContent = s.user.full_name || 'Пользователь';

function render(containerId, rows, mapFn, empty='Пусто'){
  const el=document.getElementById(containerId); el.innerHTML='';
  if(!rows?.length){el.innerHTML=`<div class="item">${empty}</div>`; return;}
  rows.forEach(r=>{
    const d=document.createElement('div'); d.className='item'; d.innerHTML=mapFn(r); el.appendChild(d);
  });
}

async function load(){
  const [b,f,r] = await Promise.all([
    fetch(`${API}/users/${userId}/bookings`).then(x=>x.json()),
    fetch(`${API}/users/${userId}/favorites`).then(x=>x.json()),
    fetch(`${API}/users/${userId}/reviews`).then(x=>x.json())
  ]);

  render('bookings', b, (x)=>`<b>${x.title || 'Бронь'}</b><br><small>${x.status} · ${x.starts_at ? new Date(x.starts_at).toLocaleString() : ''} → ${x.ends_at ? new Date(x.ends_at).toLocaleString() : ''}</small>`,'Броней пока нет');
  render('favorites', f, (x)=>`<b>${x.title}</b><br><small>${x.category} · ${x.metadata?.price_label || 'по запросу'}</small>`,'Избранное пусто');
  render('reviews', r, (x)=>`<b>${x.listing_title || 'Карточка'}</b><br><small>${x.rating}★ · ${x.text || ''}</small>`,'Отзывов пока нет');
}

load().catch(()=>{
  document.getElementById('bookings').innerHTML='<div class="item">Ошибка загрузки</div>';
});

const tg = window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();}

let tokens = 0;
let brainLevel = 1;
let power = 1;
const skills = {logic:0, memory:0, vision:0, agents:0};
const costs = {logic:50, memory:60, vision:70, agents:80};

const tokensEl = document.getElementById('tokens');
const brainEl = document.getElementById('brain');
const lvlEl = document.getElementById('brainLvl');
const powerEl = document.getElementById('power');

function render(){
  tokensEl.textContent = tokens;
  lvlEl.textContent = brainLevel;
  powerEl.textContent = power;
}
render();

function tap(){
  const gain = 1 + Math.floor(power/5);
  tokens += gain;
  render();
}

brainEl.addEventListener('click', tap);

// skill upgrades
[...document.querySelectorAll('.skill')].forEach(btn=>{
  btn.addEventListener('click',()=>{
    const s = btn.dataset.skill;
    const price = costs[s] + skills[s]*20;
    if(tokens < price) return;
    tokens -= price;
    skills[s] += 1;
    power += 1;
    if(power % 5 === 0) brainLevel += 1;
    btn.querySelector('small').textContent = (costs[s] + skills[s]*20) + ' токенов';
    render();
  });
});

// blockchain placeholder
const linkBtn = document.getElementById('linkBtn');
linkBtn.addEventListener('click',()=>{
  alert('TON Connect будет подключён на этапе листинга');
});

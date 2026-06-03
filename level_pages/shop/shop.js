// ── SKINS ─────────────────────────────────────────────────────────
const SKINS = [
  { id:'normal', name:'Normal',  emoji:'🌿', cost:0,   gems:0   },
  { id:'land',   name:'Land',    emoji:'🏔️', cost:50,  gems:50  },
  { id:'water',  name:'Water',   emoji:'🌊', cost:80,  gems:80  },
  { id:'fire',   name:'Fire',    emoji:'🔥', cost:100, gems:100 },
  { id:'sky',    name:'Sky',     emoji:'☁️', cost:60,  gems:60  },
  { id:'galaxy', name:'Galaxy',  emoji:'🌌', cost:120, gems:120 },
];

// ── STATE (shared via localStorage) ──────────────────────────────
function loadState() {
  return {
    coins:      parseInt(localStorage.getItem('numetrix_coins')  || '0'),
    gems:       parseInt(localStorage.getItem('numetrix_gems')   || '0'),
    hintBag:    parseInt(localStorage.getItem('numetrix_hintBag')|| '0'),
    ownedSkins: JSON.parse(localStorage.getItem('numetrix_ownedSkins') || '["normal"]'),
    activeSkin: localStorage.getItem('numetrix_activeSkin') || 'normal',
  };
}
function saveState(state) {
  localStorage.setItem('numetrix_coins',      state.coins);
  localStorage.setItem('numetrix_gems',       state.gems);
  localStorage.setItem('numetrix_hintBag',    state.hintBag);
  localStorage.setItem('numetrix_ownedSkins', JSON.stringify(state.ownedSkins));
  localStorage.setItem('numetrix_activeSkin', state.activeSkin);
}

let state = loadState();

function updateCurrencyBar() {
  document.getElementById('shopCoins').textContent = state.coins;
  document.getElementById('shopGems').textContent  = state.gems;
  saveState(state);
}

// ── NAVIGATION ────────────────────────────────────────────────────
function goBack() {
  history.back();
}

// ── TABS ──────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.shop-tab').forEach((t, i) => {
    const tabs = ['hints','skips','free','skins','coins','gems'];
    t.classList.toggle('active', tabs[i] === name);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'skins') buildSkinGrid();
}

// ── SHOP FUNCTIONS ────────────────────────────────────────────────
function buyHint(amount, gemCost, cash) {
  if (amount === -1) { showToast('💡 Unlimited hints unlocked! (demo)'); state.hintBag += 999; updateCurrencyBar(); return; }
  if (gemCost > 0 && state.gems < gemCost) { showToast(`Need ${gemCost} 💎 gems!`); return; }
  state.gems -= gemCost; state.hintBag += amount; updateCurrencyBar();
  showToast(`✅ +${amount} hint${amount > 1 ? 's' : ''} added to bag!`);
}

function buyHintBagMonth() {
  if (state.gems < 500) { showToast('Need 500 💎 gems for the monthly bag!'); return; }
  state.gems -= 500; state.hintBag += 150; updateCurrencyBar();
  showToast('✅ Hint Bag (1 month) unlocked! +150 hints added!');
}

function buyGoldenLock(cells) {
  const gemCost = cells * 5;
  if (state.gems < gemCost) { showToast(`Need ${gemCost} 💎 gems!`); return; }
  state.gems -= gemCost; updateCurrencyBar();
  showToast(`✅ ${cells} cell${cells > 1 ? 's' : ''} locked! (💎 ${gemCost} spent)`);
}

function buySkip(amount, coinCost, cash) {
  if (state.coins < coinCost) { showToast(`Need ${coinCost} 🪙 coins!`); return; }
  state.coins -= coinCost; updateCurrencyBar();
  showToast(`✅ +${amount} skip${amount > 1 ? 's' : ''} added!`);
}

function buyVideo(amount, coinCost, cash) {
  if (state.coins < coinCost) { showToast(`Need ${coinCost} 🪙 coins!`); return; }
  state.coins -= coinCost; updateCurrencyBar();
  showToast(`✅ +${amount} video${amount > 1 ? 's' : ''} added!`);
}

function buyCoinTier(amount) { showToast('⚠️ Payment option will be updated soon!'); }
function buyGemTier(amount)  { showToast('⚠️ Payment option will be updated soon!'); }

function convertCoins() {
  if (state.coins < 100) { showToast('Need 100 🪙 coins to convert!'); return; }
  state.coins -= 100; state.gems += 20; updateCurrencyBar();
  showToast('✅ 100 Coins → 20 Gems converted!');
}

function watchAd() {
  showToast('📺 Loading ad...');
  setTimeout(() => {
    state.coins += 10;
    updateCurrencyBar();
    showToast('✅ +10 🪙 coins from ad!');
  }, 1500);
}

function facebookShare() {
  const shareText = 'Check out this amazing Number Sum Puzzle game! 🎮';
  const shareUrl = window.location.origin;
  
  if (navigator.share) {
    navigator.share({
      title: 'Numetrix Puzzle',
      text: shareText,
      url: shareUrl
    })
    .then(() => {
      state.coins += 50;
      updateCurrencyBar();
      showToast('✅ +50 🪙 coins from share!');
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        showToast('❌ Share cancelled');
      }
    });
  } else {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const shareWindow = window.open(facebookUrl, 'facebook-share', 'width=600,height=400');
    
    if (shareWindow) {
      const checkClosed = setInterval(() => {
        if (shareWindow.closed) {
          clearInterval(checkClosed);
          state.coins += 50;
          updateCurrencyBar();
          showToast('✅ +50 🪙 coins from share!');
        }
      }, 500);
    } else {
      showToast('❌ Please allow popups to share');
    }
  }
}

// ── SKINS ─────────────────────────────────────────────────────────
function buildSkinGrid() {
  const grid = document.getElementById('skinGrid'); grid.innerHTML = '';
  SKINS.forEach(sk => {
    const owned  = state.ownedSkins.includes(sk.id);
    const active = state.activeSkin === sk.id;
    const card   = document.createElement('div');
    card.className = 'skin-card' + (owned ? ' owned-skin' : '') + (active ? ' active-skin' : '');
    card.style.background = active ? '#f4eeff' : owned ? '#efffef' : '#f7fbff';
    let badge = '';
    if (active)       badge = '<span class="skin-badge active-badge">ACTIVE</span>';
    else if (owned)   badge = '<span class="skin-badge owned-badge">OWNED</span>';
    else if (sk.cost === 0) badge = '<span class="skin-badge free-badge">FREE</span>';
    card.innerHTML = `${badge}<div class="skin-emoji">${sk.emoji}</div><div class="skin-name">${sk.name}</div><div class="skin-cost">${sk.cost === 0 ? 'Free' : '💎 ' + sk.gems}</div>`;
    card.onclick = () => selectSkin(sk);
    grid.appendChild(card);
  });
}

function selectSkin(sk) {
  if (state.activeSkin === sk.id) { showToast('Already using this skin!'); return; }
  if (state.ownedSkins.includes(sk.id)) {
    state.activeSkin = sk.id; saveState(state); buildSkinGrid();
    showToast(`✅ ${sk.name} skin activated!`); return;
  }
  if (state.gems < sk.gems) { showToast(`Need ${sk.gems} 💎 gems for ${sk.name} skin!`); return; }
  state.gems -= sk.gems; state.ownedSkins.push(sk.id); state.activeSkin = sk.id;
  updateCurrencyBar(); buildSkinGrid();
  showToast(`✅ ${sk.name} skin unlocked!`);
}

// ── TOAST ─────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const tab = new URLSearchParams(location.search).get('tab') || 'hints';
  switchTab(tab);
  updateCurrencyBar();
});

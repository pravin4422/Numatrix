// ── SKINS ─────────────────────────────────────────────────────────
// Prices from PDF: Normal=Free, Land=50gems, Water=80gems, Fire=100gems, Sky=60gems, Galaxy=120gems
const SKINS = [
  { id:'normal', name:'Normal',  emoji:'🌿', cost:0,   gems:0   },
  { id:'land',   name:'Land',    emoji:'🏔️', cost:50,  gems:50  },
  { id:'water',  name:'Water',   emoji:'🌊', cost:80,  gems:80  },
  { id:'fire',   name:'Fire',    emoji:'🔥', cost:100, gems:100 },
  { id:'sky',    name:'Sky',     emoji:'☁️', cost:60,  gems:60  },
  { id:'galaxy', name:'Galaxy',  emoji:'🌌', cost:120, gems:120 },
];

// ── LEVEL DATA ────────────────────────────────────────────────────
const LEVELS = [{
  rows:4, cols:4,
  colTargets:[6,2,5,1], rowTargets:[6,5,1,2],
  grid:[[3,1,1,1],[3,1,1,1],[9,1,1,2],[6,1,2,7]],
  solution:[[1,-1,1,-1],[1,-1,1,-1],[-1,1,-1,-1],[-1,1,-1,-1]],
}];

function computeSolution(level) {
  const {rows,cols,rowTargets,colTargets,grid} = level;
  const sol = Array.from({length:rows},()=>Array(cols).fill(0));
  function tryPlace(r,c){
    if(r===rows){for(let cc=0;cc<cols;cc++){let s=0;for(let rr=0;rr<rows;rr++)if(sol[rr][cc]===1)s+=grid[rr][cc];if(s!==colTargets[cc])return false;}return true;}
    const nextR=c+1===cols?r+1:r, nextC=c+1===cols?0:c+1;
    for(const v of[1,-1]){sol[r][c]=v;if(c===cols-1){let s=0;for(let cc=0;cc<cols;cc++)if(sol[r][cc]===1)s+=grid[r][cc];if(s!==rowTargets[r])continue;}if(tryPlace(nextR,nextC))return true;}
    sol[r][c]=0;return false;
  }
  if(tryPlace(0,0))return sol.map(row=>[...row]);
  return level.solution;
}

// ── GAME STATE ────────────────────────────────────────────────────
let currentLevel=0, lives=3, hints=3, mode='erase';
let cellStates=[], solution=[], levelData=null;
let undoStack=[], undoLeft=5;
let hintBag=0, coins=0, gems=0;
let ownedSkins=['normal'], activeSkin='normal';

function initLevel(idx){
  currentLevel=idx; levelData=LEVELS[idx];
  solution=computeSolution(levelData);
  cellStates=Array.from({length:levelData.rows},()=>Array(levelData.cols).fill(0));
  lives=3; hints=3; undoStack=[]; undoLeft=5; mode='erase';
  document.getElementById('levelTitle').textContent=`Level ${idx+1}`;
  document.getElementById('hintCount').textContent=hints;
  document.getElementById('undoCount').textContent=undoLeft;
  document.getElementById('nextLevelWrap').style.display='none';
  document.getElementById('gameoverOverlay').classList.remove('show');
  updateHearts(); updateModeUI(); updateUndoBtn(); updateCurrencyBar(); renderGrid();
}

function renderGrid(){
  const {rows,cols,rowTargets,colTargets,grid}=levelData;
  const container=document.getElementById('grid');
  container.style.gridTemplateColumns=`repeat(${cols+1},1fr)`;
  container.innerHTML='';
  const rowDone=rowTargets.map((t,r)=>{const s=cellStates[r].reduce((a,v,c)=>a+(v===1?grid[r][c]:0),0);return s===t&&cellStates[r].every(v=>v!==0);});
  const colDone=colTargets.map((t,c)=>{let s=0,all=true;for(let r=0;r<rows;r++){if(cellStates[r][c]===1)s+=grid[r][c];if(cellStates[r][c]===0)all=false;}return s===t&&all;});
  const rowSum=rowTargets.map((_,r)=>cellStates[r].reduce((a,v,c)=>a+(v===1?grid[r][c]:0),0));
  const colSum=colTargets.map((_,c)=>{let s=0;for(let r=0;r<rows;r++)if(cellStates[r][c]===1)s+=grid[r][c];return s;});

  const corner=document.createElement('div'); corner.className='cell header-corner'; container.appendChild(corner);
  colTargets.forEach((t,c)=>{const el=document.createElement('div');if(colDone[c]){el.className='cell header-corner';}else{el.className='cell header-top';el.textContent=t;if(colSum[c]>0){const sup=document.createElement('span');sup.className='hint-super';sup.textContent=colSum[c];el.appendChild(sup);}}container.appendChild(el);});

  for(let r=0;r<rows;r++){
    const rowEl=document.createElement('div');
    if(rowDone[r]){rowEl.className='cell header-corner';}else{rowEl.className='cell header-left';rowEl.textContent=rowTargets[r];if(rowSum[r]>0){const sup=document.createElement('span');sup.className='hint-super';sup.textContent=rowSum[r];rowEl.appendChild(sup);}}
    container.appendChild(rowEl);
    for(let c=0;c<cols;c++){
      const el=document.createElement('div');
      const st=cellStates[r][c];
      let cls='cell grid-cell';
      if(st===1)cls+=' confirmed';
      if(st===-1)cls+=' erased';
      el.className=cls; el.textContent=grid[r][c];
      el.dataset.r=r; el.dataset.c=c;
      el.addEventListener('click',onCellClick);
      container.appendChild(el);
    }
  }
}

function snapshotState(){ return cellStates.map(row=>[...row]); }

function onCellClick(e){
  const r=+e.currentTarget.dataset.r, c=+e.currentTarget.dataset.c;
  const st=cellStates[r][c];
  const snapshot=snapshotState();
  if(mode==='erase'){ cellStates[r][c]=st===-1?0:st===0?-1:0; }
  else { cellStates[r][c]=st===1?0:st===0?1:0; }
  if(cellStates[r][c]!==0&&cellStates[r][c]!==solution[r][c]){
    lives--; updateHearts(); cellStates[r][c]=0; renderGrid();
    document.querySelectorAll('.heart').forEach(h=>{h.classList.remove('shake');void h.offsetWidth;h.classList.add('shake');});
    if(lives<=0){setTimeout(()=>document.getElementById('gameoverOverlay').classList.add('show'),600);}
    return;
  }
  undoStack.push(snapshot); updateUndoBtn();
  renderGrid(); checkWin();
}

function useUndo(){
  if(undoLeft<=0){showToast('No undos left!');return;}
  if(!undoStack.length){showToast('Nothing to undo!');return;}
  cellStates=undoStack.pop(); undoLeft--;
  document.getElementById('undoCount').textContent=undoLeft;
  updateUndoBtn(); renderGrid();
  showToast(`↩️ Undone! (${undoLeft} left)`);
}
function updateUndoBtn(){
  const btn=document.getElementById('undoBtn');
  btn.classList.toggle('disabled',undoLeft<=0||!undoStack.length);
}

function checkWin(){
  const {rows,cols}=levelData;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(cellStates[r][c]===0)return;
  coins+=20; updateCurrencyBar();
  showToast('🎉 Level complete! +20 coins earned!');
  setTimeout(()=>{ document.getElementById('nextLevelWrap').style.display='block'; },300);
}

function updateHearts(){
  const el=document.getElementById('hearts'); el.innerHTML='';
  for(let i=0;i<3;i++){const h=document.createElement('span');h.className='heart'+(i>=lives?' lost':'');h.textContent='❤️';el.appendChild(h);}
}
function setMode(m){ mode=m; updateModeUI(); }
function updateModeUI(){
  document.getElementById('eraseBtn').classList.toggle('active',mode==='erase');
  document.getElementById('confirmBtn').classList.toggle('active',mode==='confirm');
  document.getElementById('modeLabel').textContent=mode==='erase'?'ERASE MODE':'CONFIRM MODE';
}

function useHint(){
  // Hint cost: 2 gems per hint (from PDF)
  const total=hints+hintBag;
  if(total<=0){
    if(gems>=2){
      gems-=2; updateCurrencyBar();
      showToast('💎 Used 2 gems for a hint!');
    } else {
      showToast('No hints! Visit the shop 🛍️ (2 💎 per hint)');
      return;
    }
  }
  const {rows,cols}=levelData;
  const undecided=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(cellStates[r][c]===0) undecided.push([r,c]);
  if(!undecided.length)return;
  const snap=snapshotState();
  const [r,c]=undecided[Math.floor(Math.random()*undecided.length)];
  cellStates[r][c]=solution[r][c];
  undoStack.push(snap); updateUndoBtn();
  if(hints>0){hints--;document.getElementById('hintCount').textContent=hints;}
  else if(hintBag>0){hintBag--;updateCurrencyBar();showToast('💡 Used a bag hint!');}
  renderGrid(); checkWin();
}

function restartGame(){ initLevel(currentLevel); }

// ── CURRENCY ──────────────────────────────────────────────────────
function updateCurrencyBar(){
  document.getElementById('coinBar').textContent=coins;
  document.getElementById('gemBar').textContent=gems;
  document.getElementById('bagBar').textContent=hintBag;
  document.getElementById('bagCount').textContent=hintBag;
  document.getElementById('shopCoins').textContent=coins;
  document.getElementById('shopGems').textContent=gems;
}

// ── SHOP ──────────────────────────────────────────────────────────
function openShop(tab='hints'){
  switchTab(tab);
  updateCurrencyBar();
  buildSkinGrid();
  document.getElementById('shopModal').classList.add('show');
}
function closeShop(){ document.getElementById('shopModal').classList.remove('show'); }

function switchTab(name){
  document.querySelectorAll('.shop-tab').forEach((t,i)=>{
    const tabs=['hints','skips','skins','coins','gems'];
    t.classList.toggle('active',tabs[i]===name);
  });
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
}

// Hint bundles — cost in gems (2 gems per hint per PDF)
function buyHint(amount,gemCost,cash){
  if(amount===-1){showToast('💡 Unlimited hints unlocked! (demo)');hintBag+=999;updateCurrencyBar();return;}
  if(gemCost>0&&gems<gemCost){showToast(`Need ${gemCost} 💎 gems!`);return;}
  gems-=gemCost; hintBag+=amount; updateCurrencyBar();
  showToast(`✅ +${amount} hint${amount>1?'s':''} added to bag!`);
}

// Hint Bag subscription — 500 gems for 1 month
function buyHintBagMonth(){
  if(gems<500){showToast('Need 500 💎 gems for the monthly bag!');return;}
  gems-=500; hintBag+=150; updateCurrencyBar();
  showToast('✅ Hint Bag (1 month) unlocked! +150 hints added!');
}

// Golden Lock — 5 gems per locked cell (up to 20 per level per PDF)
function buyGoldenLock(cells){
  const gemCost=cells*5;
  if(gems<gemCost){showToast(`Need ${gemCost} 💎 gems for ${cells} locked cell${cells>1?'s':''}!`);return;}
  gems-=gemCost; updateCurrencyBar();
  showToast(`✅ ${cells} cell${cells>1?'s':''} locked! (💎 ${gemCost} spent)`);
}

function buySkip(amount,coinCost,cash){
  if(coins<coinCost){showToast(`Need ${coinCost} 🪙 coins!`);return;}
  coins-=coinCost; updateCurrencyBar();
  showToast(`✅ +${amount} skip${amount>1?'s':''} added!`);
}
function buyVideo(amount,coinCost,cash){
  if(coins<coinCost){showToast(`Need ${coinCost} 🪙 coins!`);return;}
  coins-=coinCost; updateCurrencyBar();
  showToast(`✅ +${amount} video${amount>1?'s':''} added!`);
}
function buyCoinTier(amount){ coins+=amount; updateCurrencyBar(); showToast(`✅ +${amount} coins! (demo)`); }
function buyGemTier(amount){ gems+=amount; updateCurrencyBar(); showToast(`✅ +${amount} gems! (demo)`); }

// Coin to Gem conversion: 100 Coins = 20 Gems (per PDF)
function convertCoins(){
  if(coins<100){showToast('Need 100 🪙 coins to convert!');return;}
  coins-=100; gems+=20; updateCurrencyBar();
  showToast('✅ 100 Coins → 20 Gems converted!');
}
function watchAd(){ coins+=10; updateCurrencyBar(); showToast('+10 🪙 coins from ad!'); }
function facebookShare(){ coins+=50; updateCurrencyBar(); showToast('+50 🪙 coins from share!'); }

// ── SKINS ─────────────────────────────────────────────────────────
function buildSkinGrid(){
  const grid=document.getElementById('skinGrid'); grid.innerHTML='';
  SKINS.forEach(sk=>{
    const owned=ownedSkins.includes(sk.id);
    const active=activeSkin===sk.id;
    const card=document.createElement('div');
    card.className='skin-card'+(owned?' owned-skin':'')+(active?' active-skin':'');
    card.style.background=active?'#f4eeff':owned?'#efffef':'#f7fbff';
    let badge='';
    if(active) badge='<span class="skin-badge active-badge">ACTIVE</span>';
    else if(owned) badge='<span class="skin-badge owned-badge">OWNED</span>';
    else if(sk.cost===0) badge='<span class="skin-badge free-badge">FREE</span>';
    card.innerHTML=`${badge}<div class="skin-emoji">${sk.emoji}</div><div class="skin-name">${sk.name}</div><div class="skin-cost">${sk.cost===0?'Free':'💎 '+sk.gems}</div>`;
    card.onclick=()=>selectSkin(sk);
    grid.appendChild(card);
  });
}
function selectSkin(sk){
  if(activeSkin===sk.id){showToast('Already using this skin!');return;}
  if(ownedSkins.includes(sk.id)){ activeSkin=sk.id; buildSkinGrid(); showToast(`✅ ${sk.name} skin activated!`); return; }
  if(gems<sk.gems){showToast(`Need ${sk.gems} 💎 gems for ${sk.name} skin!`);return;}
  gems-=sk.gems; ownedSkins.push(sk.id); activeSkin=sk.id;
  updateCurrencyBar(); buildSkinGrid();
  showToast(`✅ ${sk.name} skin unlocked!`);
}

// ── TOAST ─────────────────────────────────────────────────────────
let toastTimer=null;
function showToast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),2400);
}

document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('shopModal').addEventListener('click',function(e){ if(e.target===this)closeShop(); });
  initLevel(0);
});
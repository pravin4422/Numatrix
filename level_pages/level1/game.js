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
let timerStart=0, timerInterval=null, timerElapsed=0;
let hintsUsedCount=0, undosUsedCount=0, initialHints=3, initialUndos=5;

// ── CURRENCY (localStorage) ───────────────────────────────────────
function loadState(){
  coins   = parseInt(localStorage.getItem('numetrix_coins')   || '0');
  gems    = parseInt(localStorage.getItem('numetrix_gems')    || '0');
  hintBag = parseInt(localStorage.getItem('numetrix_hintBag') || '0');
  timerElapsed = parseInt(localStorage.getItem('numetrix_timer') || '0');
}
function saveState(){
  localStorage.setItem('numetrix_coins',   coins);
  localStorage.setItem('numetrix_gems',    gems);
  localStorage.setItem('numetrix_hintBag', hintBag);
  localStorage.setItem('numetrix_timer',   timerElapsed);
}
function updateCurrencyBar(){
  document.getElementById('coinBar').textContent  = coins;
  document.getElementById('gemBar').textContent   = gems;
  document.getElementById('bagBar').textContent   = hintBag;
  document.getElementById('bagCount').textContent = hintBag;
  saveState();
}

// ── LEVEL INIT ────────────────────────────────────────────────────
function initLevel(idx){
  currentLevel=idx; levelData=LEVELS[idx];
  solution=computeSolution(levelData);
  cellStates=Array.from({length:levelData.rows},()=>Array(levelData.cols).fill(0));
  lives=3; hints=3; undoStack=[]; undoLeft=5; mode='erase';
  timerElapsed=0;
  hintsUsedCount=0; undosUsedCount=0; initialHints=3; initialUndos=5;
  localStorage.setItem('numetrix_timer', '0');
  document.getElementById('levelTitle').textContent=`Level ${idx+1}`;
  document.getElementById('hintCount').textContent=hints;
  document.getElementById('undoCount').textContent=undoLeft;
  document.getElementById('nextLevelWrap').style.display='none';
  document.getElementById('gameoverOverlay').classList.remove('show');
  startTimer();
  updateHearts(); updateModeUI(); updateUndoBtn(); updateCurrencyBar(); renderGrid();
}

function startTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerStart=Date.now()-timerElapsed*1000;
  document.getElementById('timer').textContent='00:00';
  timerInterval=setInterval(()=>{
    timerElapsed=Math.floor((Date.now()-timerStart)/1000);
    const mins=Math.floor(timerElapsed/60).toString().padStart(2,'0');
    const secs=(timerElapsed%60).toString().padStart(2,'0');
    document.getElementById('timer').textContent=`${mins}:${secs}`;
  },1000);
}

function stopTimer(){
  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval=null;
    timerElapsed=Math.floor((Date.now()-timerStart)/1000);
  }
}

function pauseTimer(){
  if(timerInterval){
    clearInterval(timerInterval);
    timerInterval=null;
    timerElapsed=Math.floor((Date.now()-timerStart)/1000);
    localStorage.setItem('numetrix_timer', timerElapsed);
  }
}

function resumeTimer(){
  if(!timerInterval && timerStart>0){
    startTimer();
  }
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
  if(mode==='erase'){
    if(st===-1) return; // Don't toggle back from erased
    cellStates[r][c]=st===0?-1:0;
  }
  else {
    cellStates[r][c]=st===1?0:st===0?1:0;
  }
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
  if(undoLeft<=0){
    // Show purchase modal if gems available
    if(gems>=20){
      document.getElementById('purchaseUndoModal').classList.add('show');
    } else {
      showToast('No undos left! Need 20 💎 gems to buy more');
    }
    return;
  }
  if(!undoStack.length){showToast('Nothing to undo!');return;}
  cellStates=undoStack.pop(); undoLeft--;
  undosUsedCount++;
  document.getElementById('undoCount').textContent=undoLeft;
  updateUndoBtn(); renderGrid();
}

function closePurchaseModal() {
  document.getElementById('purchaseUndoModal').classList.remove('show');
}

function confirmPurchaseUndo() {
  if(gems>=20){
    gems-=20;
    undoLeft=3;
    updateCurrencyBar();
    document.getElementById('undoCount').textContent=undoLeft;
    updateUndoBtn();
    closePurchaseModal();
    showToast('✅ Purchased 3 undos for 20 gems!');
    // Perform the undo action immediately
    if(undoStack.length){
      cellStates=undoStack.pop();
      undoLeft--;
      undosUsedCount++;
      document.getElementById('undoCount').textContent=undoLeft;
      updateUndoBtn();
      renderGrid();
    }
  } else {
    closePurchaseModal();
    showToast('Not enough gems!');
  }
}
function updateUndoBtn(){
  const btn=document.getElementById('undoBtn');
  btn.classList.toggle('disabled',undoLeft<=0||!undoStack.length);
}

function checkWin(){
  const {rows,cols}=levelData;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(cellStates[r][c]===0)return;
  stopTimer();
  const mins=Math.floor(timerElapsed/60);
  const secs=timerElapsed%60;
  
  // Update streak
  updateStreak();
  
  // Update fastest time
  const fastestTime = parseInt(localStorage.getItem('numetrix_fastestTime') || '0');
  const isNewBest = fastestTime === 0 || timerElapsed < fastestTime;
  if (isNewBest) {
    localStorage.setItem('numetrix_fastestTime', timerElapsed);
  }
  
  coins+=20; updateCurrencyBar();
  showToast(`🎉 Complete in ${mins}:${secs.toString().padStart(2,'0')}! +20 coins`);
  
  // Show completion card after 1.5 seconds
  setTimeout(() => showCompletionCard(isNewBest), 1500);
}

function showCompletionCard(isNewBest) {
  const mins = Math.floor(timerElapsed / 60);
  const secs = timerElapsed % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  
  document.getElementById('completionTime').textContent = timeStr;
  
  // Best time
  const fastestTime = parseInt(localStorage.getItem('numetrix_fastestTime') || '0');
  const bestMins = Math.floor(fastestTime / 60);
  const bestSecs = fastestTime % 60;
  const bestTimeStr = `${bestMins}:${bestSecs.toString().padStart(2, '0')}`;
  document.getElementById('completionBestTime').textContent = isNewBest ? timeStr + ' 🆕' : bestTimeStr;
  
  // Calculate score (base 1000, minus time and hints/undos used)
  const score = Math.max(0, 1000 - timerElapsed - (hintsUsedCount * 50) - (undosUsedCount * 10) + (lives * 100));
  document.getElementById('completionScore').textContent = score;
  
  // Update best score
  const bestScore = parseInt(localStorage.getItem('numetrix_bestScore') || '0');
  if (score > bestScore) {
    localStorage.setItem('numetrix_bestScore', score);
  }
  
  // Streak
  const streakDays = parseInt(localStorage.getItem('numetrix_streakDays') || '0');
  document.getElementById('completionStreak').textContent = streakDays;
  
  // Stats
  document.getElementById('hintsUsed').textContent = hintsUsedCount;
  document.getElementById('undosUsed').textContent = undosUsedCount;
  document.getElementById('livesLeft').textContent = lives;
  
  document.getElementById('completionOverlay').classList.add('show');
}

function closeCompletionCard() {
  document.getElementById('completionOverlay').classList.remove('show');
  document.getElementById('nextLevelWrap').style.display = 'block';
}

function shareResults() {
  const mins = Math.floor(timerElapsed / 60);
  const secs = timerElapsed % 60;
  const streakDays = parseInt(localStorage.getItem('numetrix_streakDays') || '0');
  const score = Math.max(0, 1000 - timerElapsed - (hintsUsedCount * 50) - (undosUsedCount * 10) + (lives * 100));
  
  const shareText = `🎉 I completed Numetrix Level ${currentLevel + 1}!\n⏱️ Time: ${mins}:${secs.toString().padStart(2, '0')}\n⭐ Score: ${score}\n🔥 Streak: ${streakDays} days\n💡 Hints: ${hintsUsedCount}\n❤️ Lives: ${lives}\n\nCan you beat my score?`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Numetrix Game',
      text: shareText
    }).catch(() => {});
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('📤 Copied to clipboard!');
    });
  }
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastPlayed = localStorage.getItem('numetrix_lastPlayed');
  let streakDays = parseInt(localStorage.getItem('numetrix_streakDays') || '0');
  
  if (!lastPlayed) {
    streakDays = 1;
  } else if (lastPlayed !== today) {
    const lastDate = new Date(lastPlayed);
    const currentDate = new Date(today);
    const diffTime = currentDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streakDays += 1;
    } else if (diffDays > 1) {
      streakDays = 1;
    }
  }
  
  localStorage.setItem('numetrix_streakDays', streakDays);
  localStorage.setItem('numetrix_lastPlayed', today);
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
  hintsUsedCount++;
  if(hints>0){
    hints--;
    document.getElementById('hintCount').textContent=hints;
    if(hints===0 && hintBag>0){
      showToast('💡 Now using hint bag!');
    }
  }
  else if(hintBag>0){
    hintBag--;
    updateCurrencyBar();
  }
  renderGrid(); checkWin();
}

function restartGame(){ initLevel(currentLevel); }

// ── TOAST ─────────────────────────────────────────────────────────
let toastTimer=null;
function showToast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),2400);
}

document.addEventListener('DOMContentLoaded', function(){
  loadState();
  initLevel(0);
});

// Reload state when returning from shop
window.addEventListener('focus', function(){
  loadState();
  updateCurrencyBar();
  resumeTimer();
});

window.addEventListener('blur', function(){
  pauseTimer();
});

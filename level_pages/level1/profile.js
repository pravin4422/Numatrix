// Streak milestones
const STREAK_BADGES = [
  { days: 5, icon: '🔥', name: 'Fire Starter', desc: '5 Day Streak' },
  { days: 15, icon: '⚡', name: 'Lightning', desc: '15 Day Streak' },
  { days: 30, icon: '🌟', name: 'Rising Star', desc: '30 Day Streak' },
  { days: 50, icon: '💫', name: 'Shooting Star', desc: '50 Day Streak' },
  { days: 75, icon: '🏅', name: 'Bronze Medal', desc: '75 Day Streak' },
  { days: 100, icon: '🥈', name: 'Silver Medal', desc: '100 Day Streak' },
  { days: 150, icon: '🥇', name: 'Gold Medal', desc: '150 Day Streak' },
  { days: 200, icon: '💎', name: 'Diamond', desc: '200 Day Streak' },
  { days: 350, icon: '👑', name: 'Royal Crown', desc: '350 Day Streak' },
  { days: 500, icon: '🏆', name: 'Champion', desc: '500 Day Streak' },
  { days: 750, icon: '🌠', name: 'Legendary', desc: '750 Day Streak' },
  { days: 1000, icon: '🎖️', name: 'Master', desc: '1000 Day Streak' },
];

// Time achievements (for hard levels)
const TIME_BADGES = [
  { time: 60, icon: '⚡', name: 'Speed Demon', desc: 'Under 1 minute' },
  { time: 120, icon: '🚀', name: 'Rocket Fast', desc: 'Under 2 minutes' },
  { time: 180, icon: '💨', name: 'Quick Thinker', desc: 'Under 3 minutes' },
  { time: 300, icon: '⏱️', name: 'Time Master', desc: 'Under 5 minutes' },
];

// Load state from localStorage
function loadProfile() {
  const lastPlayed = localStorage.getItem('numetrix_lastPlayed');
  const streakDays = parseInt(localStorage.getItem('numetrix_streakDays') || '0');
  const fastestTime = parseInt(localStorage.getItem('numetrix_fastestTime') || '0');
  const unlockedBadges = JSON.parse(localStorage.getItem('numetrix_badges') || '[]');
  
  return { lastPlayed, streakDays, fastestTime, unlockedBadges };
}

function saveProfile(data) {
  if (data.streakDays !== undefined) localStorage.setItem('numetrix_streakDays', data.streakDays);
  if (data.lastPlayed !== undefined) localStorage.setItem('numetrix_lastPlayed', data.lastPlayed);
  if (data.fastestTime !== undefined) localStorage.setItem('numetrix_fastestTime', data.fastestTime);
  if (data.unlockedBadges !== undefined) localStorage.setItem('numetrix_badges', JSON.stringify(data.unlockedBadges));
}

// Check and update streak
function updateStreak() {
  const profile = loadProfile();
  const today = new Date().toDateString();
  
  if (!profile.lastPlayed) {
    // First time playing
    profile.streakDays = 1;
    profile.lastPlayed = today;
  } else if (profile.lastPlayed !== today) {
    const lastDate = new Date(profile.lastPlayed);
    const currentDate = new Date(today);
    const diffTime = currentDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      profile.streakDays += 1;
    } else if (diffDays > 1) {
      // Streak broken
      profile.streakDays = 1;
    }
    profile.lastPlayed = today;
  }
  
  saveProfile(profile);
  return profile.streakDays;
}

// Render profile page
function renderProfile() {
  const profile = loadProfile();
  
  // Update stats
  document.getElementById('streakDays').textContent = profile.streakDays;
  
  // Count unlocked badges
  const unlockedCount = profile.unlockedBadges.length;
  document.getElementById('totalBadges').textContent = unlockedCount;
  
  // Show fastest time
  if (profile.fastestTime > 0) {
    const mins = Math.floor(profile.fastestTime / 60);
    const secs = profile.fastestTime % 60;
    document.getElementById('fastestTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Render streak badges
  const streakGrid = document.getElementById('streakBadges');
  streakGrid.innerHTML = '';
  STREAK_BADGES.forEach(badge => {
    const isUnlocked = profile.streakDays >= badge.days;
    const card = document.createElement('div');
    card.className = 'badge-card' + (isUnlocked ? ' unlocked' : '');
    card.innerHTML = `
      ${isUnlocked ? '<div class="unlock-badge">UNLOCKED</div>' : ''}
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    streakGrid.appendChild(card);
  });
  
  // Render time badges
  const timeGrid = document.getElementById('timeBadges');
  timeGrid.innerHTML = '';
  TIME_BADGES.forEach(badge => {
    const isUnlocked = profile.fastestTime > 0 && profile.fastestTime <= badge.time;
    const card = document.createElement('div');
    card.className = 'badge-card' + (isUnlocked ? ' unlocked' : '');
    card.innerHTML = `
      ${isUnlocked ? '<div class="unlock-badge">UNLOCKED</div>' : ''}
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-name">${badge.name}</div>
      <div class="badge-desc">${badge.desc}</div>
    `;
    timeGrid.appendChild(card);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderProfile();
});

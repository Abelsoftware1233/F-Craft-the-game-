/* ═══════════════════════════════════════════
   MARICRAFT – UI.JS
   Screen management, crafting UI, HUD updates
════════════════════════════════════════════ */

'use strict';

/* ─── SCREEN MANAGER ───────────────────────── */
const Screens = {
  current: null,
  show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) { el.classList.add('active'); this.current = id; }
  }
};

/* ─── TOAST NOTIFICATIONS ──────────────────── */
const Toast = (() => {
  let el = null, timer = null;
  function init() {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  function show(msg, duration = 2000) {
    if (!el) init();
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), duration);
  }
  return { show };
})();

/* ─── PIXEL PARTICLE EFFECT ────────────────── */
function spawnParticles(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:${x + (Math.random()-0.5)*30}px;
      top:${y + (Math.random()-0.5)*20}px;
      background:${color};
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

/* ─── HUD UPDATER ──────────────────────────── */
const HUD = {
  update(state) {
    document.getElementById('lives-val').textContent  = state.lives;
    document.getElementById('score-val').textContent  = state.score;
    document.getElementById('coins-val').textContent  = state.coins;
    document.getElementById('level-val').textContent  = state.level;
    document.getElementById('timer-val').textContent  = Math.ceil(state.timer);

    const timerEl = document.getElementById('timer-val');
    timerEl.style.color = state.timer < 30 ? '#ff3333' : '#ff9900';
  }
};

/* ─── HOTBAR MANAGER ───────────────────────── */
const Hotbar = {
  selected: 0,
  slots: ['', '', '', '', ''],
  ITEM_ICONS: {
    'wood':        '🪵',
    'stone':       '🪨',
    'dirt':        '🟫',
    'coal':        '⚫',
    'iron':        '⬛',
    'gold_ore':    '🟡',
    'wood_pickaxe':'⛏️',
    'stone_pickaxe':'⛏',
    'iron_pickaxe': '⚒️',
    'wood_sword':  '🗡️',
    'stone_sword': '⚔️',
    'ladder':      '🪜',
    'torch':       '🔦',
    'mushroom':    '🍄',
    'flower':      '🌸',
  },

  setSlot(index, itemKey) {
    if (index < 0 || index > 4) return;
    this.slots[index] = itemKey;
    const icon = document.getElementById('slot-' + index);
    if (icon) icon.textContent = itemKey ? (this.ITEM_ICONS[itemKey] || '📦') : '';
  },

  select(index) {
    document.querySelectorAll('.hotbar-slot').forEach((s, i) => {
      s.classList.toggle('selected', i === index);
    });
    this.selected = index;
  },

  getSelected() { return this.slots[this.selected]; },

  addItem(itemKey) {
    // Find empty slot or first slot
    let idx = this.slots.findIndex(s => s === '' || s === itemKey);
    if (idx === -1) idx = 0;
    this.setSlot(idx, itemKey);
    Toast.show('+ ' + (this.ITEM_ICONS[itemKey] || '📦') + ' ' + itemKey.toUpperCase());
  }
};

/* ─── CRAFTING SYSTEM ──────────────────────── */
const Crafting = {
  RECIPES: [
    { name: 'Houten Bijl',    key: 'wood_pickaxe',  icon: '⛏️',  needs: { wood: 3 },                result: 'wood_pickaxe',  desc: '3x 🪵' },
    { name: 'Stenen Bijl',    key: 'stone_pickaxe', icon: '⛏',   needs: { stone: 3, wood: 2 },      result: 'stone_pickaxe', desc: '3x🪨 2x🪵' },
    { name: 'IJzeren Bijl',   key: 'iron_pickaxe',  icon: '⚒️',  needs: { iron: 3, wood: 2 },       result: 'iron_pickaxe',  desc: '3x⬛ 2x🪵' },
    { name: 'Houten Zwaard',  key: 'wood_sword',    icon: '🗡️',  needs: { wood: 2 },                result: 'wood_sword',    desc: '2x 🪵' },
    { name: 'Stenen Zwaard',  key: 'stone_sword',   icon: '⚔️',  needs: { stone: 2, wood: 1 },      result: 'stone_sword',   desc: '2x🪨 1x🪵' },
    { name: 'Ladder',         key: 'ladder',        icon: '🪜',   needs: { wood: 4 },                result: 'ladder',        desc: '4x 🪵' },
    { name: 'Toorts',         key: 'torch',         icon: '🔦',   needs: { wood: 1, coal: 1 },       result: 'torch',         desc: '1x🪵 1x⚫' },
  ],

  open(inventory) {
    document.getElementById('crafting-overlay').classList.remove('hidden');
    this.render(inventory);
  },

  close() {
    document.getElementById('crafting-overlay').classList.add('hidden');
  },

  render(inventory) {
    // Inventory list
    const invEl = document.getElementById('crafting-inventory');
    invEl.innerHTML = '';
    const entries = Object.entries(inventory).filter(([,v]) => v > 0);
    if (entries.length === 0) {
      invEl.innerHTML = '<div style="font-size:0.38rem;color:#666;text-align:center;padding:8px;">Geen materialen</div>';
    } else {
      entries.forEach(([key, count]) => {
        const icon = Hotbar.ITEM_ICONS[key] || '📦';
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `<span class="item-icon">${icon}</span><span>${key}</span><span class="item-count">×${count}</span>`;
        invEl.appendChild(div);
      });
    }

    // Recipe list
    const recEl = document.getElementById('crafting-recipes');
    recEl.innerHTML = '';
    this.RECIPES.forEach(recipe => {
      const canCraft = Object.entries(recipe.needs).every(([k,v]) => (inventory[k]||0) >= v);
      const div = document.createElement('div');
      div.className = 'recipe-item ' + (canCraft ? 'craftable' : 'not-craftable');
      div.innerHTML = `
        <span class="item-icon">${recipe.icon}</span>
        <div style="flex:1">
          <div style="font-size:0.38rem">${recipe.name}</div>
          <div style="font-size:0.32rem;color:#888;margin-top:2px">${recipe.desc}</div>
        </div>
        ${canCraft ? '<span style="font-size:0.45rem;color:#0f0">✓</span>' : '<span style="font-size:0.45rem;color:#600">✗</span>'}
      `;
      if (canCraft) {
        div.addEventListener('click', () => {
          if (typeof window.onCraft === 'function') window.onCraft(recipe, inventory);
        });
      }
      recEl.appendChild(div);
    });
  }
};

/* ─── LEVEL SELECT UI ──────────────────────── */
function renderLevelSelect(levels, unlockedUpTo) {
  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '';
  levels.forEach((lvl, i) => {
    const locked = i > unlockedUpTo;
    const saved  = JSON.parse(localStorage.getItem('mc_level_' + i) || '{"stars":0}');
    const card = document.createElement('div');
    card.className = 'level-card' + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="level-num">${locked ? '🔒' : (i + 1)}</div>
      <div class="level-name">${lvl.name}</div>
      <span class="level-world ${lvl.worldClass}">${lvl.world}</span>
      <div class="level-stars">${'⭐'.repeat(saved.stars)}${'☆'.repeat(3 - saved.stars)}</div>
    `;
    if (!locked) {
      card.addEventListener('click', () => {
        if (typeof window.startLevel === 'function') window.startLevel(i);
      });
    }
    grid.appendChild(card);
  });
}

/* ─── MENU PREVIEW CANVAS ──────────────────── */
function drawMenuCharacter() {
  const c = document.getElementById('preview-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);

  // Mario-style pixel character
  const p = [
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,2,2,2,3,3,2,3,0,0,0,0,0,0,0],
    [0,2,3,2,3,3,3,2,3,3,3,0,0,0,0,0],
    [0,2,3,2,2,3,3,3,2,3,3,3,0,0,0,0],
    [0,2,2,3,3,3,3,2,2,2,2,0,0,0,0,0],
    [0,0,0,3,3,3,3,3,3,3,0,0,0,0,0,0],
    [0,0,1,1,4,1,1,1,1,0,0,0,0,0,0,0],
    [0,1,1,1,4,1,1,4,1,1,1,0,0,0,0,0],
    [1,1,1,1,4,4,4,4,1,1,1,1,0,0,0,0],
    [3,3,1,4,5,4,4,5,4,1,3,3,0,0,0,0],
    [3,3,3,4,4,4,4,4,4,3,3,3,0,0,0,0],
    [3,3,4,4,4,0,0,4,4,4,3,3,0,0,0,0],
    [0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0],
    [0,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0],
    [1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0],
  ];
  const colors = ['transparent','#E52222','#8B4513','#FFDAB9','#003399','#FFD700'];
  const s = 4;
  p.forEach((row, y) => row.forEach((v, x) => {
    if (v) {
      ctx.fillStyle = colors[v];
      ctx.fillRect(x*s, y*s, s, s);
    }
  }));

  // Animate: bob
  let frame = 0;
  function animate() {
    const offset = Math.sin(frame * 0.08) * 3;
    ctx.clearRect(0, 0, 64, 64);
    ctx.save();
    ctx.translate(0, offset);
    p.forEach((row, y) => row.forEach((v, x) => {
      if (v) {
        ctx.fillStyle = colors[v];
        ctx.fillRect(x*s, y*s, s, s);
      }
    }));
    ctx.restore();
    frame++;
    requestAnimationFrame(animate);
  }
  animate();
}

/* ─── BIND STATIC BUTTONS ──────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  drawMenuCharacter();

  document.getElementById('btn-start').addEventListener('click', () => Screens.show('levels'));
  document.getElementById('btn-howto').addEventListener('click', () => Screens.show('howto'));
  document.getElementById('btn-back').addEventListener('click', () => Screens.show('menu'));
  document.getElementById('btn-levels-back').addEventListener('click', () => Screens.show('menu'));

  document.getElementById('btn-close-craft').addEventListener('click', () => Crafting.close());
  document.getElementById('btn-pause').addEventListener('click', () => {
    if (typeof window.pauseGame === 'function') window.pauseGame();
  });
  document.getElementById('btn-resume').addEventListener('click', () => {
    if (typeof window.resumeGame === 'function') window.resumeGame();
  });
  document.getElementById('btn-quit').addEventListener('click', () => {
    if (typeof window.quitGame === 'function') window.quitGame();
  });
  document.getElementById('btn-retry').addEventListener('click', () => {
    if (typeof window.retryLevel === 'function') window.retryLevel();
  });
  document.getElementById('btn-next-level').addEventListener('click', () => {
    if (typeof window.nextLevel === 'function') window.nextLevel();
  });
  document.getElementById('btn-end-menu').addEventListener('click', () => {
    if (typeof window.quitGame === 'function') window.quitGame();
  });

  // Hotbar click
  document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
    slot.addEventListener('click', () => Hotbar.select(i));
  });
});

/* ─── END SCREEN ───────────────────────────── */
function showEndScreen(win, score, stars, hasNext) {
  const overlay = document.getElementById('end-overlay');
  const panel   = overlay.querySelector('.end-panel');
  const title   = document.getElementById('end-title');
  const nextBtn = document.getElementById('btn-next-level');

  overlay.classList.remove('hidden');
  document.getElementById('end-score').textContent = score;
  document.getElementById('end-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  if (win) {
    title.textContent = '🎉 GEWONNEN!';
    panel.classList.add('win');
    panel.style.borderColor = '#FFD700';
    nextBtn.style.display = hasNext ? 'block' : 'none';
  } else {
    title.textContent = '💀 GAME OVER';
    panel.classList.remove('win');
    panel.style.borderColor = '#E52222';
    nextBtn.style.display = 'none';
  }
}

function hideEndScreen() {
  document.getElementById('end-overlay').classList.add('hidden');
}

// Export globals
window.Screens   = Screens;
window.Toast     = Toast;
window.HUD       = HUD;
window.Hotbar    = Hotbar;
window.Crafting  = Crafting;
window.spawnParticles   = spawnParticles;
window.renderLevelSelect = renderLevelSelect;
window.showEndScreen    = showEndScreen;
window.hideEndScreen    = hideEndScreen;

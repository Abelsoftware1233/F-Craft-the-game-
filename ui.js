'use strict';

/* ═══════════════════════════════════════════
   FAISELCRAFT - ui.js
   UI initialization, event listeners, screens
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Menu character preview ── */
  drawMenuCharacter();

  /* ── Level select ── */
  const unlocked = parseInt(localStorage.getItem('mc_unlocked') || '0');
  renderLevelSelect(LEVEL_DEFS, unlocked);

  /* ── Screen navigation ── */
  const Screens = {
    show(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const el = document.getElementById('screen-' + id);
      if (el) el.classList.add('active');
    }
  };

  document.getElementById('btn-start').addEventListener('click', () => {
    const unlocked2 = parseInt(localStorage.getItem('mc_unlocked') || '0');
    renderLevelSelect(LEVEL_DEFS, unlocked2);
    Screens.show('levels');
  });
  document.getElementById('btn-howto').addEventListener('click',      () => Screens.show('howto'));
  document.getElementById('btn-back').addEventListener('click',       () => Screens.show('menu'));
  document.getElementById('btn-levels-back').addEventListener('click',() => Screens.show('menu'));

  /* ── Game controls ── */
  document.getElementById('btn-close-craft').addEventListener('click',() => Crafting.close());
  document.getElementById('btn-pause').addEventListener('click',      () => window.pauseGame && window.pauseGame());
  document.getElementById('btn-resume').addEventListener('click',     () => window.resumeGame && window.resumeGame());
  document.getElementById('btn-quit').addEventListener('click',       () => window.quitGame && window.quitGame());
  document.getElementById('btn-retry').addEventListener('click',      () => window.retryLevel && window.retryLevel());
  document.getElementById('btn-next-level').addEventListener('click', () => window.nextLevel && window.nextLevel());
  document.getElementById('btn-end-menu').addEventListener('click',   () => window.quitGame && window.quitGame());

  /* ── Hotbar slots ── */
  document.querySelectorAll('.hotbar-slot').forEach((slot, i) => {
    slot.addEventListener('click', () => Hotbar.select(i));
  });

  /* ── Mobile buttons ── */
  bindMobileBtn('mc-left',  'ArrowLeft');
  bindMobileBtn('mc-right', 'ArrowRight');
  bindMobileBtn('mc-jump',  'z');
  bindMobileBtn('mc-mine',  'x');

  document.getElementById('mc-craft').addEventListener('click', () => {
    if (game && game.state === 'playing') Crafting.open(game.inventory);
  });
  document.getElementById('mc-craft').addEventListener('touchend', e => {
    e.preventDefault();
    if (game && game.state === 'playing') Crafting.open(game.inventory);
  });

  /* ── Keyboard: pause with Escape ── */
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (game && game.state === 'playing')  window.pauseGame();
      else if (game && game.state === 'paused') window.resumeGame();
    }
  });

  /* ── Prevent context menu on canvas (long press mobile) ── */
  const gc = document.getElementById('game-canvas');
  if (gc) gc.addEventListener('contextmenu', e => e.preventDefault());

});

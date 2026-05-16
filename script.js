/* ═══════════════════════════════════════════
   MARICRAFT – SCRIPT.JS
   Full game engine: physics · tilemap · mining
   enemies · coins · crafting · levels
════════════════════════════════════════════ */

'use strict';

/* ─── CONSTANTS ────────────────────────────── */
const TILE   = 32;
const GRAVITY = 0.45;
const JUMP_FORCE = -10.5;
const PLAYER_SPEED = 3.2;
const FPS    = 60;

/* ─── TILE TYPES ───────────────────────────── */
const T = {
  EMPTY:  0,
  GRASS:  1,
  DIRT:   2,
  STONE:  3,
  WOOD:   4,
  LEAVES: 5,
  COAL:   6,
  IRON:   7,
  GOLD:   8,
  CLOUD:  9,
  BRICK:  10,
  PIPE_T: 11,
  PIPE_B: 12,
  COIN_BLOCK: 13,
  FLAG:   14,
  LAVA:   15,
  SAND:   16,
  WATER:  17,
  MUSHROOM: 18,
  FLOWER: 19,
  VINE:   20,
};

const TILE_COLORS = {
  [T.GRASS]:  ['#5aB855','#4a9845','#3a7835'],
  [T.DIRT]:   ['#8B5E3C','#7a5230','#6a4424'],
  [T.STONE]:  ['#8A8A8A','#777777','#666666'],
  [T.WOOD]:   ['#8B6914','#7a5a10','#6a4c0c'],
  [T.LEAVES]: ['#2d7a1e','#256616','#1d5210'],
  [T.COAL]:   ['#333333','#222222','#111111'],
  [T.IRON]:   ['#aaaaaa','#999999','#888888'],
  [T.GOLD]:   ['#FFD700','#e6c000','#ccaa00'],
  [T.CLOUD]:  ['#ffffff','#f0f0f0','#e0e0e0'],
  [T.BRICK]:  ['#cc4422','#bb3311','#aa2200'],
  [T.PIPE_T]: ['#009900','#008800','#007700'],
  [T.PIPE_B]: ['#00aa00','#009900','#008800'],
  [T.COIN_BLOCK]: ['#FFD700','#e6c000','#ccaa00'],
  [T.LAVA]:   ['#FF4400','#FF2200','#FF0000'],
  [T.SAND]:   ['#F4D03F','#e6c030','#d4b028'],
  [T.WATER]:  ['#1a6bbf','#1560ad','#1055a0'],
  [T.VINE]:   ['#2d9955','#228844','#1a7733'],
};

const MINABLE = new Set([T.DIRT,T.STONE,T.WOOD,T.LEAVES,T.COAL,T.IRON,T.GOLD,T.SAND]);
const TILE_DROP = {
  [T.DIRT]:  'dirt',  [T.STONE]: 'stone', [T.WOOD]:  'wood',
  [T.LEAVES]:'wood',  [T.COAL]:  'coal',  [T.IRON]:  'iron',
  [T.GOLD]:  'gold_ore', [T.SAND]: 'dirt',
};
const SOLID = new Set([T.GRASS,T.DIRT,T.STONE,T.WOOD,T.LEAVES,T.COAL,T.IRON,T.GOLD,
                       T.CLOUD,T.BRICK,T.PIPE_T,T.PIPE_B,T.COIN_BLOCK,T.SAND]);

/* ─── LEVEL DEFINITIONS ────────────────────── */
const LEVEL_DEFS = [
  {
    name:'Groene Heuvels', world:'Gras', worldClass:'world-grass',
    timeLimit:300, bgColor:'#5C94FC', bgColor2:'#87CEEB',
    clouds:true, music:'world1',
    map: buildMap1()
  },
  {
    name:'Stenen Grotten', world:'Grot', worldClass:'world-cave',
    timeLimit:240, bgColor:'#1a1a2e', bgColor2:'#0d0d1e',
    clouds:false, music:'cave',
    map: buildMap2()
  },
  {
    name:'Nether Kasteel', world:'Nether', worldClass:'world-nether',
    timeLimit:200, bgColor:'#1a0000', bgColor2:'#330000',
    clouds:false, music:'nether',
    map: buildMap3()
  },
  {
    name:'Sky Kingdom', world:'Gras', worldClass:'world-grass',
    timeLimit:260, bgColor:'#87CEEB', bgColor2:'#ADD8E6',
    clouds:true, music:'sky',
    map: buildMap4()
  },
  {
    name:'Diep Mijnbouw', world:'Grot', worldClass:'world-cave',
    timeLimit:280, bgColor:'#0a0a0a', bgColor2:'#111111',
    clouds:false, music:'mine',
    map: buildMap5()
  },
  {
    name:'Vuur Berg', world:'Nether', worldClass:'world-nether',
    timeLimit:180, bgColor:'#2a0000', bgColor2:'#1a0000',
    clouds:false, music:'fire',
    map: buildMap6()
  },
];

/* ─── MAP BUILDERS ─────────────────────────── */
function emptyMap(w,h) {
  return Array.from({length:h}, () => new Array(w).fill(0));
}

function buildMap1() {
  const W=60, H=20;
  const m = emptyMap(W,H);
  // Ground
  for(let x=0;x<W;x++){ m[H-1][x]=T.DIRT; m[H-2][x]=T.DIRT; m[H-3][x]=T.GRASS; }
  // Platforms
  [[5,14,6],[10,12,5],[18,11,6],[26,13,5],[35,10,7],[44,12,5],[52,11,6]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) m[y][x+i]=T.BRICK;
  });
  // Trees
  [[8,11],[22,11],[40,11]].forEach(([x,y])=>{
    m[y][x]=T.WOOD; m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++) for(let dx=-2;dx<=2;dx++) { if(m[y+dy]) m[y+dy][x+dx]=T.LEAVES; }
  });
  // Coin blocks
  [[12,10],[13,10],[20,9],[36,8]].forEach(([x,y])=>{ if(m[y]) m[y][x]=T.COIN_BLOCK; });
  // Pipes
  [[15,H-4],[30,H-4],[50,H-5]].forEach(([x,y])=>{ m[y][x]=T.PIPE_T; m[y+1][x]=T.PIPE_B; if(m[y+2]) m[y+2][x]=T.PIPE_B; });
  // Clouds
  [[3,4],[14,3],[28,5],[40,3],[52,4]].forEach(([x,y])=>{ for(let i=0;i<4;i++) m[y][x+i]=T.CLOUD; });
  // Flag at end
  m[H-4][W-3]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-5},
    enemies:[{x:12,y:H-4,type:'goomba'},{x:22,y:H-4,type:'goomba'},{x:35,y:11,type:'goomba'},{x:44,y:H-4,type:'koopa'}],
    coins:[{x:7,y:H-5},{x:12,y:9},{x:13,y:9},{x:20,y:8},{x:25,y:H-5},{x:36,y:7},{x:45,y:11},{x:53,y:H-5}],
    stars:[{x:12,y:9},{x:36,y:7}]
  };
}

function buildMap2() {
  const W=55, H=22;
  const m = emptyMap(W,H);
  for(let x=0;x<W;x++) m[H-1][x]=T.STONE;
  // Floor layers
  for(let x=0;x<W;x++){ m[H-2][x]=T.STONE; m[H-3][x]=(x%7===3)?T.COAL:T.STONE; }
  // Ceiling
  for(let x=0;x<W;x++) m[0][x]=T.STONE;
  // Left wall
  for(let y=0;y<H;y++) m[y][0]=T.STONE;
  // Platforms (stone ledges)
  [[4,16,8],[16,14,6],[24,12,8],[36,16,7],[44,10,6]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) m[y][x+i]=T.STONE;
  });
  // Coal & iron veins
  [[8,H-4],[9,H-4],[20,14],[21,14],[30,12],[40,16],[41,16],[50,H-4]].forEach(([x,y])=>{ if(m[y])m[y][x]=T.COAL; });
  [[15,H-3],[25,13],[37,15],[48,H-3]].forEach(([x,y])=>{ if(m[y])m[y][x]=T.IRON; });
  // Stone pillars
  [[12,12],[28,10],[42,14]].forEach(([x,y])=>{ for(let dy=y;dy<H-1;dy++) m[dy][x]=T.STONE; });
  // Torches (flower marker)
  [[6,15],[18,13],[38,15]].forEach(([x,y])=>{ if(m[y]) m[y][x]=T.FLOWER; });
  m[H-4][W-3]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-4},
    enemies:[{x:10,y:H-3,type:'bat'},{x:22,y:15,type:'bat'},{x:35,y:H-3,type:'goomba'},{x:46,y:11,type:'goomba'}],
    coins:[{x:8,y:H-5},{x:16,y:13},{x:24,y:11},{x:36,y:H-5},{x:44,y:9},{x:50,y:H-5}],
    stars:[{x:20,y:13},{x:44,y:9}]
  };
}

function buildMap3() {
  const W=58, H=20;
  const m = emptyMap(W,H);
  for(let x=0;x<W;x++){ m[H-1][x]=T.BRICK; m[H-2][x]=T.BRICK; m[H-3][x]=T.BRICK; }
  // Lava pools
  [[10,H-3,5],[25,H-3,4],[40,H-3,6]].forEach(([x,y,w])=>{ for(let i=0;i<w;i++) m[y][x+i]=T.LAVA; });
  // Brick platforms over lava
  [[8,H-6,3],[22,H-6,5],[38,H-6,4],[50,H-5,4]].forEach(([x,y,w])=>{ for(let i=0;i<w;i++) m[y][x+i]=T.BRICK; });
  // Walls
  [[5,10,8],[18,8,10],[34,6,12],[48,10,8]].forEach(([x,y,h])=>{ for(let dy=0;dy<h;dy++) m[y+dy][x]=T.BRICK; });
  // Iron ore in walls
  [[6,12],[19,10],[35,8],[49,12]].forEach(([x,y])=>{ if(m[y])m[y][x]=T.IRON; });
  // Gold
  [[7,11],[36,9]].forEach(([x,y])=>{ if(m[y])m[y][x]=T.GOLD; });
  m[H-6][W-3]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-5},
    enemies:[{x:14,y:H-4,type:'koopa'},{x:28,y:H-4,type:'koopa'},{x:42,y:H-4,type:'koopa'},{x:52,y:H-5,type:'goomba'}],
    coins:[{x:5,y:H-7},{x:18,y:H-7},{x:34,y:H-7},{x:48,y:H-6},{x:55,y:H-7}],
    stars:[{x:8,y:11},{x:36,y:8}]
  };
}

function buildMap4() {
  const W=62, H=18;
  const m = emptyMap(W,H);
  // Ground
  for(let x=0;x<W;x++) m[H-1][x]=T.GRASS;
  // Cloud platforms (sky level)
  [[2,6,5],[10,4,6],[20,7,4],[30,5,5],[40,3,7],[50,6,4],[56,8,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) m[y][x+i]=T.CLOUD;
  });
  // Trees on some clouds
  [[4,5],[32,4]].forEach(([x,y])=>{
    m[y][x]=T.WOOD; m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++) for(let dx=-1;dx<=1;dx++) if(m[y+dy]) m[y+dy][x+dx]=T.LEAVES;
  });
  // Coin blocks
  [[12,2],[22,5],[42,1]].forEach(([x,y])=>{ if(m[y]) m[y][x]=T.COIN_BLOCK; });
  m[6][W-4]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-3},
    enemies:[{x:11,y:5,type:'goomba'},{x:21,y:8,type:'goomba'},{x:41,y:4,type:'goomba'},{x:51,y:7,type:'koopa'}],
    coins:[{x:3,y:H-3},{x:12,y:1},{x:22,y:4},{x:33,y:4},{x:42,y:0},{x:52,y:5}],
    stars:[{x:12,y:1},{x:42,y:0}]
  };
}

function buildMap5() {
  const W=60, H=24;
  const m = emptyMap(W,H);
  for(let x=0;x<W;x++) m[H-1][x]=T.STONE;
  for(let x=0;x<W;x++) m[0][x]=T.STONE;
  for(let y=0;y<H;y++) { m[y][0]=T.STONE; m[y][W-1]=T.STONE; }
  // Multi-layer cave
  for(let y=H-3;y>=4;y-=4) {
    for(let x=2;x<W-2;x++) {
      if((x+y)%7===0) m[y][x]=T.COAL;
      else if((x*y)%11===0) m[y][x]=T.IRON;
      else if(x%13===0) m[y][x]=T.GOLD;
      else m[y][x]=T.STONE;
    }
  }
  // Shafts
  [[8,3,18],[20,3,18],[35,3,18],[50,3,18]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++) m[y+dy][x]=T.EMPTY;
  });
  // Ledges
  [[4,H-5,5],[12,H-9,5],[22,H-5,6],[30,H-13,6],[38,H-9,5],[46,H-5,6],[54,H-12,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) if(m[y]) m[y][x+i]=T.STONE;
  });
  m[H-6][W-4]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-2},
    enemies:[{x:12,y:H-4,type:'bat'},{x:24,y:H-4,type:'bat'},{x:38,y:H-4,type:'bat'},{x:50,y:H-4,type:'koopa'}],
    coins:[{x:8,y:H-3},{x:20,y:H-6},{x:35,y:H-3},{x:48,y:H-3}],
    stars:[{x:30,y:H-14},{x:54,y:H-13}]
  };
}

function buildMap6() {
  const W=65, H=22;
  const m = emptyMap(W,H);
  for(let x=0;x<W;x++){ m[H-1][x]=T.BRICK; }
  // Lava everywhere with islands
  for(let x=0;x<W;x++) m[H-2][x]=T.LAVA;
  // Brick islands
  [[2,H-4,4],[10,H-5,3],[16,H-4,4],[24,H-6,5],[32,H-4,3],[40,H-5,4],[48,H-7,5],[56,H-4,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) m[y][x+i]=T.BRICK;
  });
  // Walls with gold
  [[8,H-12,8],[22,H-10,7],[38,H-11,8],[54,H-9,6]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++) m[y+dy][x]=T.BRICK;
    m[y+2][x]=T.GOLD;
    m[y+4][x]=T.IRON;
  });
  // Top platforms
  [[5,4,6],[20,3,7],[38,4,6],[54,5,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++) m[y][x+i]=T.BRICK;
  });
  m[H-5][W-4]=T.FLAG;
  return {w:W,h:H,data:m, playerStart:{x:2,y:H-5},
    enemies:[{x:10,y:H-4,type:'koopa'},{x:25,y:H-4,type:'koopa'},{x:40,y:H-4,type:'koopa'},{x:56,y:H-5,type:'goomba'}],
    coins:[{x:5,y:3},{x:20,y:2},{x:38,y:3},{x:54,y:4}],
    stars:[{x:24,y:H-7},{x:48,y:H-8}]
  };
}

/* ─── GAME STATE ───────────────────────────── */
let game = null;

function createGame(levelIdx) {
  const def = LEVEL_DEFS[levelIdx];
  const map = def.map;

  return {
    levelIdx,
    def,
    map,
    state: 'playing',   // playing | paused | win | lose
    score: 0,
    coins: 0,
    lives: 3,
    timer: def.timeLimit,
    timerAcc: 0,

    player: {
      x: map.playerStart.x * TILE,
      y: map.playerStart.y * TILE,
      w: TILE - 4,
      h: TILE * 1.5,
      vx: 0, vy: 0,
      onGround: false,
      facingRight: true,
      mineTimer: 0,
      mineTarget: null,
      invincible: 0,
      dead: false,
      animFrame: 0,
      animTick: 0,
    },

    enemies: map.enemies.map(e => ({
      ...e,
      x: e.x * TILE, y: e.y * TILE,
      w: TILE-2, h: TILE-2,
      vx: e.type==='bat' ? 0 : -1.2,
      vy: e.type==='bat' ? -0.5 : 0,
      alive: true,
      stunned: 0,
      animTick: 0,
    })),

    coinItems: map.coins.map(c => ({ x: c.x*TILE+8, y: c.y*TILE+8, w:14, h:14, collected:false, anim:0 })),
    stars: map.stars.map(s => ({ x: s.x*TILE+4, y: s.y*TILE+4, w:22, h:22, collected:false, anim:0 })),
    starsCollected: 0,
    coinCount: 0,

    inventory: { wood:0, stone:0, dirt:0, coal:0, iron:0, gold_ore:0 },

    cam: { x: 0, y: 0 },

    mineParticleTimer: 0,
    mineBlock: null,
    mineProgress: 0,

    flagReached: false,
    winTimer: 0,

    keys: {},
  };
}

/* ─── CANVAS SETUP ─────────────────────────── */
let canvas, ctx;
let rafId = null;
let lastTime = 0;

function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);
}

/* ─── INPUT ────────────────────────────────── */
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key==='z'||e.key==='Z'||e.key==='ArrowUp'||e.key===' ') e.preventDefault();
  if (e.key==='x'||e.key==='X') e.preventDefault();
  if (e.key==='c'||e.key==='C') {
    if (game && game.state==='playing') Crafting.open(game.inventory);
  }
  for(let i=1;i<=5;i++) if(e.key===String(i)) Hotbar.select(i-1);
});
window.addEventListener('keyup', e => { keys[e.key]=false; });

// Mobile buttons
function bindMobileBtn(id, keyDown, keyUp) {
  const el = document.getElementById(id);
  if (!el) return;
  ['touchstart','mousedown'].forEach(ev => el.addEventListener(ev, e => {
    e.preventDefault(); keys[keyDown]=true; el.classList.add('pressed');
  }, {passive:false}));
  ['touchend','mouseup','mouseleave'].forEach(ev => el.addEventListener(ev, e => {
    e.preventDefault(); keys[keyDown]=false; if(keyUp) keys[keyUp]=false; el.classList.remove('pressed');
  }, {passive:false}));
}

document.addEventListener('DOMContentLoaded', () => {
  bindMobileBtn('mc-left',  'ArrowLeft');
  bindMobileBtn('mc-right', 'ArrowRight');
  bindMobileBtn('mc-jump',  'z');
  bindMobileBtn('mc-mine',  'x');
  document.getElementById('mc-craft').addEventListener('click', () => {
    if (game && game.state==='playing') Crafting.open(game.inventory);
  });
});

/* ─── COLLISION HELPERS ────────────────────── */
function tileAt(mapData, tx, ty) {
  const h = mapData.data.length;
  const w = mapData.data[0].length;
  if (tx<0||ty<0||tx>=w||ty>=h) return T.STONE;
  return mapData.data[ty][tx];
}

function isSolid(t) { return SOLID.has(t) && t !== T.COIN_BLOCK; }

function rectOverlapsTile(x,y,w,h,tx,ty) {
  return x < (tx+1)*TILE && x+w > tx*TILE && y < (ty+1)*TILE && y+h > ty*TILE;
}

function moveX(entity, dx, mapData) {
  entity.x += dx;
  const txL = Math.floor(entity.x / TILE);
  const txR = Math.floor((entity.x + entity.w - 1) / TILE);
  const tyT = Math.floor(entity.y / TILE);
  const tyB = Math.floor((entity.y + entity.h - 1) / TILE);
  for (let ty=tyT; ty<=tyB; ty++) {
    for (let tx=txL; tx<=txR; tx++) {
      if (isSolid(tileAt(mapData, tx, ty))) {
        if (dx > 0) entity.x = tx*TILE - entity.w;
        else        entity.x = (tx+1)*TILE;
        entity.vx = 0;
      }
    }
  }
}

function moveY(entity, dy, mapData) {
  entity.vy = dy;
  entity.y += dy;
  entity.onGround = false;
  const txL = Math.floor(entity.x / TILE);
  const txR = Math.floor((entity.x + entity.w - 1) / TILE);
  const tyT = Math.floor(entity.y / TILE);
  const tyB = Math.floor((entity.y + entity.h - 1) / TILE);
  for (let ty=tyT; ty<=tyB; ty++) {
    for (let tx=txL; tx<=txR; tx++) {
      const tile = tileAt(mapData, tx, ty);
      if (isSolid(tile)) {
        if (dy > 0) { entity.y = ty*TILE - entity.h; entity.vy = 0; entity.onGround = true; }
        else        { entity.y = (ty+1)*TILE; entity.vy = 0;
          // Coin block hit
          if (tile===T.COIN_BLOCK && game) {
            hitCoinBlock(tx, ty);
          }
        }
      }
    }
  }
}

function hitCoinBlock(tx, ty) {
  game.map.data[ty][tx] = T.BRICK; // used up
  game.score += 100;
  game.coinCount += 1;
  HUD.update(getHUDState());
  Toast.show('🪙 +100');
  // Spawn coin pickup animation
  game.coins_anim = game.coins_anim || [];
  game.coins_anim.push({ x: tx*TILE+8, y: ty*TILE-10, vy:-3, life:40 });
}

/* ─── MINING ───────────────────────────────── */
function tryMine(player, mapData) {
  if (!keys['x'] && !keys['X']) { game.mineBlock=null; game.mineProgress=0; return; }
  const cx = player.x + player.w/2;
  const cy = player.y + player.h/2;
  const dir = player.facingRight ? 1 : -1;

  // Build candidates: in front (3 heights) + above player
  const frontTX = Math.floor((cx + dir * TILE * 1.2) / TILE);
  const candidates = [
    [frontTX, Math.floor((player.y) / TILE)],
    [frontTX, Math.floor((player.y + player.h/2) / TILE)],
    [frontTX, Math.floor((player.y + player.h - 1) / TILE)],
    [Math.floor(cx / TILE), Math.floor((player.y - 2) / TILE)],
  ];

  // Find first minable candidate
  let target = null;
  for (const [bx,by] of candidates) {
    const tile = tileAt(mapData, bx, by);
    if (MINABLE.has(tile)) { target = [bx, by]; break; }
  }

  if (!target) { game.mineBlock=null; game.mineProgress=0; return; }

  const [bx, by] = target;
  // Reset progress if we switched to a different block
  if (game.mineBlock && (game.mineBlock[0] !== bx || game.mineBlock[1] !== by)) {
    game.mineProgress = 0;
  }
  game.mineBlock = [bx, by];
  game.mineProgress = (game.mineProgress || 0) + 1;

  const tile = tileAt(mapData, bx, by);
  const needed = tile===T.GOLD ? 90 : tile===T.IRON ? 70 : tile===T.STONE ? 45 : 25;

  if (game.mineProgress >= needed) {
    const drop = TILE_DROP[tile];
    if (drop) {
      game.inventory[drop] = (game.inventory[drop]||0) + 1;
      Hotbar.addItem(drop);
      spawnParticles(
        bx*TILE - game.cam.x + 16,
        by*TILE - game.cam.y + 16,
        TILE_COLORS[tile]?.[0] || '#aaa', 8
      );
    }
    mapData.data[by][bx] = T.EMPTY;
    game.score += 50;
    game.mineBlock = null; game.mineProgress = 0;
    HUD.update(getHUDState());
    if (Crafting.render) Crafting.render(game.inventory);
    Toast.show('⛏ Blok gemijnd! +50');
  }
}

/* ─── CRAFTING CALLBACK ────────────────────── */
window.onCraft = function(recipe, inventory) {
  // Deduct materials
  Object.entries(recipe.needs).forEach(([k,v]) => { inventory[k] -= v; });
  // Add to hotbar
  Hotbar.addItem(recipe.result);
  game.score += 200;
  Toast.show('⚒ Gecraftd: ' + recipe.name + '!');
  Crafting.render(inventory);
  HUD.update(getHUDState());
};

/* ─── CAMERA ───────────────────────────────── */
function updateCamera(player, mapData) {
  const W = canvas.width;
  const H = canvas.height;
  const mapW = mapData.w * TILE;
  const mapH = mapData.h * TILE;
  let cx = player.x + player.w/2 - W/2;
  let cy = player.y + player.h/2 - H/2;
  cx = Math.max(0, Math.min(cx, mapW - W));
  cy = Math.max(0, Math.min(cy, mapH - H));
  game.cam.x += (cx - game.cam.x) * 0.12;
  game.cam.y += (cy - game.cam.y) * 0.12;
}

/* ─── ENEMY UPDATE ─────────────────────────── */
function updateEnemies(dt) {
  game.enemies.forEach(e => {
    if (!e.alive) return;
    e.animTick++;

    if (e.type==='bat') {
      // Fly in sine pattern
      e.x += Math.sin(e.animTick * 0.05) * 1.8;
      e.y += Math.cos(e.animTick * 0.04) * 1.0;
    } else {
      // Walk & bounce off walls
      e.x += e.vx * PLAYER_SPEED * 0.55;
      const txA = Math.floor(e.x / TILE);
      const txB = Math.floor((e.x+e.w) / TILE);
      const ty  = Math.floor((e.y+e.h+2) / TILE);
      const tileAhead = tileAt(game.map, e.vx<0?txA:txB, ty-1);
      if (isSolid(tileAhead) || txA<=0 || txB>=game.map.w-1) e.vx *= -1;

      // Gravity
      e.vy = (e.vy||0) + GRAVITY*0.6;
      e.y += e.vy;
      const tyB = Math.floor((e.y+e.h) / TILE);
      const txM = Math.floor((e.x+e.w/2) / TILE);
      if (isSolid(tileAt(game.map, txM, tyB))) { e.y=tyB*TILE-e.h; e.vy=0; }
    }

    // Bounds
    e.x = Math.max(0, Math.min(e.x, game.map.w*TILE - e.w));
    e.y = Math.max(0, Math.min(e.y, game.map.h*TILE - e.h));
  });
}

/* ─── PLAYER ↔ ENEMY COLLISION ────────────── */
function checkPlayerEnemies() {
  const p = game.player;
  if (p.invincible > 0) { p.invincible--; return; }
  game.enemies.forEach(e => {
    if (!e.alive) return;
    if (p.x+p.w > e.x && p.x < e.x+e.w && p.y+p.h > e.y && p.y < e.y+e.h) {
      // Stomping from above
      if (p.vy > 0 && p.y+p.h < e.y+e.h/2+8) {
        e.alive = false;
        p.vy = JUMP_FORCE * 0.6;
        game.score += 300;
        Toast.show('💀 +300');
        HUD.update(getHUDState());
        spawnParticles(
          e.x - game.cam.x,
          e.y - game.cam.y,
          '#ff6600', 6
        );
      } else {
        // Take damage
        game.lives--;
        p.invincible = 120;
        p.vx = p.facingRight ? -6 : 6;
        p.vy = JUMP_FORCE * 0.5;
        HUD.update(getHUDState());
        Toast.show('💔 Auw!');
        if (game.lives <= 0) { p.dead=true; }
      }
    }
  });
}

/* ─── COIN / STAR COLLECTION ───────────────── */
function checkCollectibles() {
  const p = game.player;
  game.coinItems.forEach(c => {
    if (c.collected) return;
    if (p.x+p.w>c.x && p.x<c.x+c.w && p.y+p.h>c.y && p.y<c.y+c.h) {
      c.collected=true; game.coinCount+=1; game.score+=100;
      HUD.update(getHUDState());
    }
  });
  game.stars.forEach(s => {
    if (s.collected) return;
    if (p.x+p.w>s.x && p.x<s.x+s.w && p.y+p.h>s.y && p.y<s.y+s.h) {
      s.collected=true; game.starsCollected++;
      game.score+=500;
      Toast.show('⭐ STER +500!');
      HUD.update(getHUDState());
    }
  });
}

/* ─── FLAG / LAVA CHECK ────────────────────── */
function checkSpecialTiles() {
  const p = game.player;
  const txL=Math.floor(p.x/TILE), txR=Math.floor((p.x+p.w-1)/TILE);
  const tyT=Math.floor(p.y/TILE), tyB=Math.floor((p.y+p.h-1)/TILE);
  for(let ty=tyT;ty<=tyB;ty++) for(let tx=txL;tx<=txR;tx++) {
    const t = tileAt(game.map, tx, ty);
    if (t===T.FLAG && !game.flagReached) { game.flagReached=true; winLevel(); }
    if (t===T.LAVA && p.invincible===0) {
      game.lives--; p.invincible=120; p.vy=JUMP_FORCE;
      HUD.update(getHUDState());
      if(game.lives<=0) p.dead=true;
    }
  }
}

/* ─── WIN / LOSE ───────────────────────────── */
function winLevel() {
  game.state='win';
  const starsGot = game.starsCollected;
  const timeBonus = Math.floor(game.timer) * 10;
  game.score += timeBonus;
  const totalStars = Math.min(3, starsGot + (game.timer>60?1:0) + (game.lives>1?1:0));

  // Save progress
  const unlocked = parseInt(localStorage.getItem('mc_unlocked')||'0');
  if (game.levelIdx >= unlocked) localStorage.setItem('mc_unlocked', game.levelIdx+1);
  localStorage.setItem('mc_level_'+game.levelIdx, JSON.stringify({stars:totalStars, score:game.score}));

  cancelAnimationFrame(rafId);
  showEndScreen(true, game.score, totalStars, game.levelIdx < LEVEL_DEFS.length-1);
}

function loseLevel() {
  game.state='lose';
  cancelAnimationFrame(rafId);
  showEndScreen(false, game.score, 0, false);
}

/* ─── HUD STATE ────────────────────────────── */
function getHUDState() {
  return { lives:game.lives, score:game.score, coins:game.coinCount,
           level:game.levelIdx+1, timer:game.timer };
}

/* ─── UPDATE LOOP ──────────────────────────── */
function update(dt) {
  if (game.state!=='playing') return;

  const p = game.player;
  const m = game.map;

  // Timer
  game.timerAcc += dt;
  if (game.timerAcc >= 1) { game.timerAcc=0; game.timer--; HUD.update(getHUDState()); }
  if (game.timer<=0) { game.lives=0; p.dead=true; }

  // Dead fall
  if (p.dead) { p.vy+=GRAVITY; p.y+=p.vy; if(p.y>m.h*TILE+100) loseLevel(); return; }

  // Horizontal
  let ax=0;
  if (keys['ArrowLeft'])  { ax=-PLAYER_SPEED; p.facingRight=false; }
  if (keys['ArrowRight']) { ax= PLAYER_SPEED; p.facingRight=true;  }
  p.vx += (ax - p.vx) * 0.25;
  moveX(p, p.vx, m);

  // Jump
  const jumpKey = keys['z']||keys['Z']||keys['ArrowUp']||keys[' '];
  if (jumpKey && p.onGround) { p.vy=JUMP_FORCE; p.onGround=false; }

  // Gravity
  p.vy = Math.min(p.vy + GRAVITY, 16);
  moveY(p, p.vy, m);

  // Out of bounds (fall into pit)
  if (p.y > m.h*TILE) { game.lives--; HUD.update(getHUDState()); if(game.lives<=0){p.dead=true;}else{ p.x=m.playerStart.x*TILE; p.y=m.playerStart.y*TILE; p.vx=0;p.vy=0; p.invincible=120; } }

  // Mine
  tryMine(p, m);

  // Enemies
  updateEnemies(dt);

  // Collisions
  checkPlayerEnemies();
  checkCollectibles();
  checkSpecialTiles();

  // Camera
  updateCamera(p, m);

  // Coin blocks anim
  if (game.coins_anim) {
    game.coins_anim = game.coins_anim.filter(c => { c.y+=c.vy; c.vy+=0.2; c.life--; return c.life>0; });
  }

  // Animate collectibles
  game.coinItems.forEach(c => { if(!c.collected) c.anim=(c.anim||0)+0.1; });
  game.stars.forEach(s => { if(!s.collected) s.anim=(s.anim||0)+0.07; });

  // Player anim
  p.animTick++;
  if (Math.abs(p.vx)>0.3) { if(p.animTick%8===0) p.animFrame=(p.animFrame+1)%4; }
  else p.animFrame=0;
}

/* ─── RENDERER ─────────────────────────────── */
function draw() {
  const W=canvas.width, H=canvas.height;
  const def=game.def;
  ctx.clearRect(0,0,W,H);

  // Sky gradient
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, def.bgColor);
  grad.addColorStop(1, def.bgColor2);
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.translate(-Math.floor(game.cam.x), -Math.floor(game.cam.y));

  const m=game.map;
  const startX=Math.max(0, Math.floor(game.cam.x/TILE)-1);
  const endX  =Math.min(m.w, Math.floor((game.cam.x+W)/TILE)+2);
  const startY=Math.max(0, Math.floor(game.cam.y/TILE)-1);
  const endY  =Math.min(m.h, Math.floor((game.cam.y+H)/TILE)+2);

  // Tiles
  for(let ty=startY;ty<endY;ty++) for(let tx=startX;tx<endX;tx++) {
    const t=m.data[ty][tx];
    if(t===T.EMPTY) continue;
    const px=tx*TILE, py=ty*TILE;
    drawTile(ctx, t, px, py, tx, ty);
  }

  // Mine progress overlay
  if (game.mineBlock) {
    const [bx,by]=game.mineBlock;
    const tile=m.data[by][bx];
    const needed=tile===T.STONE?45:tile===T.IRON?70:tile===T.GOLD?90:25;
    const pct=game.mineProgress/needed;
    ctx.globalAlpha=0.5;
    ctx.fillStyle='#000';
    ctx.fillRect(bx*TILE, by*TILE, TILE*pct, TILE);
    ctx.globalAlpha=1;
    // Crack lines
    ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=1;
    if(pct>0.3){ ctx.beginPath(); ctx.moveTo(bx*TILE+8,by*TILE+4); ctx.lineTo(bx*TILE+16,by*TILE+20); ctx.stroke(); }
    if(pct>0.6){ ctx.beginPath(); ctx.moveTo(bx*TILE+20,by*TILE+8); ctx.lineTo(bx*TILE+12,by*TILE+28); ctx.stroke(); }
  }

  // Coins
  game.coinItems.forEach(c => {
    if(c.collected) return;
    const bob=Math.sin(c.anim)*3;
    ctx.fillStyle='#FFD700';
    ctx.beginPath(); ctx.arc(c.x+7,c.y+7+bob,7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffec6e'; ctx.beginPath(); ctx.arc(c.x+5,c.y+5+bob,3,0,Math.PI*2); ctx.fill();
  });

  // Stars
  game.stars.forEach(s => {
    if(s.collected) return;
    const bob=Math.sin(s.anim)*4;
    const sc=1+Math.sin(s.anim*1.5)*0.15;
    ctx.save();
    ctx.translate(s.x+11, s.y+11+bob);
    ctx.scale(sc,sc);
    drawStar(ctx,'#FFD700',11);
    ctx.restore();
  });

  // Coin block animations
  if(game.coins_anim) game.coins_anim.forEach(c => {
    ctx.globalAlpha=c.life/40;
    ctx.fillStyle='#FFD700';
    ctx.font='bold 16px sans-serif'; ctx.textAlign='center';
    ctx.fillText('🪙',c.x,c.y);
    ctx.globalAlpha=1;
  });

  // Enemies
  game.enemies.forEach(e => { if(e.alive) drawEnemy(ctx,e); });

  // Player
  drawPlayer(ctx, game.player);

  ctx.restore();
}

function drawTile(ctx, t, px, py, tx, ty) {
  const cols = TILE_COLORS[t];
  if(t===T.EMPTY) return;

  if(t===T.GRASS) {
    ctx.fillStyle='#5aB855'; ctx.fillRect(px,py,TILE,8);
    ctx.fillStyle='#4a9845'; ctx.fillRect(px,py+2,TILE,4);
    ctx.fillStyle='#8B5E3C'; ctx.fillRect(px,py+8,TILE,TILE-8);
    return;
  }
  if(t===T.COIN_BLOCK) {
    ctx.fillStyle='#FFD700'; ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
    ctx.fillStyle='#e6c000'; ctx.fillRect(px+2,py+2,TILE-4,4);
    ctx.fillStyle='#8B6914';
    ctx.strokeStyle='#8B6914'; ctx.lineWidth=2;
    ctx.strokeRect(px+1,py+1,TILE-2,TILE-2);
    ctx.fillStyle='#000'; ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText('?',px+TILE/2,py+TILE-8);
    return;
  }
  if(t===T.BRICK) {
    ctx.fillStyle='#cc4422'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#aa2200';
    ctx.fillRect(px,py+8,TILE,2); ctx.fillRect(px,py+22,TILE,2);
    ctx.fillRect(px+8,py,2,8); ctx.fillRect(px+22,py+8,2,14); ctx.fillRect(px+8,py+22,2,10);
    return;
  }
  if(t===T.CLOUD) {
    ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(px+2,py+4,TILE-4,TILE-6);
    ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(px,py+8,TILE,TILE-10);
    return;
  }
  if(t===T.PIPE_T||t===T.PIPE_B) {
    const dark = t===T.PIPE_T;
    ctx.fillStyle=dark?'#00aa00':'#009900'; ctx.fillRect(px+2,py,TILE-4,TILE);
    if(dark){ctx.fillStyle='#00cc00';ctx.fillRect(px,py,TILE,8);}
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(px+4,py+2,4,TILE-4);
    return;
  }
  if(t===T.LAVA) {
    const wave=Math.sin(Date.now()*0.003+tx*0.5)*3;
    ctx.fillStyle='#FF4400'; ctx.fillRect(px,py+wave,TILE,TILE-wave);
    ctx.fillStyle='#FF6600'; ctx.fillRect(px,py+wave,TILE,4);
    return;
  }
  if(t===T.FLAG) {
    // Flagpole
    ctx.fillStyle='#aaa'; ctx.fillRect(px+14,py,4,TILE);
    ctx.fillStyle='#ff0000';
    ctx.beginPath(); ctx.moveTo(px+18,py); ctx.lineTo(px+28,py+8); ctx.lineTo(px+18,py+16); ctx.fill();
    return;
  }
  if(t===T.FLOWER) {
    ctx.fillStyle='#2d7a1e'; ctx.fillRect(px+14,py+12,4,TILE-12);
    ctx.fillStyle='#ff88cc'; ctx.beginPath(); ctx.arc(px+16,py+10,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffff00'; ctx.beginPath(); ctx.arc(px+16,py+10,3,0,Math.PI*2); ctx.fill();
    return;
  }
  if(t===T.LEAVES) {
    ctx.fillStyle='#2d7a1e'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#256616';
    ctx.fillRect(px+2,py,4,6); ctx.fillRect(px+TILE-6,py,4,6);
    ctx.fillRect(px,py+4,TILE,4);
    return;
  }
  if(t===T.WOOD) {
    ctx.fillStyle='#8B6914'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#7a5a10'; ctx.fillRect(px+4,py,TILE-8,TILE);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(px,py+8,TILE,2); ctx.fillRect(px,py+22,TILE,2);
    return;
  }
  if(t===T.COAL) {
    ctx.fillStyle='#555'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#111';
    ctx.fillRect(px+8,py+6,8,8); ctx.fillRect(px+4,py+16,6,6); ctx.fillRect(px+18,py+18,6,5);
    return;
  }
  if(t===T.IRON) {
    ctx.fillStyle='#9a9a9a'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#cccccc';
    ctx.fillRect(px+6,py+4,8,6); ctx.fillRect(px+16,py+14,7,7); ctx.fillRect(px+4,py+18,7,5);
    return;
  }
  if(t===T.GOLD) {
    ctx.fillStyle='#FFD700'; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle='#ffec6e';
    ctx.fillRect(px+6,py+4,8,6); ctx.fillRect(px+16,py+14,7,7);
    ctx.fillStyle='#e6c000';
    ctx.fillRect(px+2,py+2,4,4); ctx.fillRect(px+22,py+22,6,6);
    return;
  }
  if(t===T.STONE||t===T.DIRT||t===T.SAND) {
    ctx.fillStyle=cols[0]; ctx.fillRect(px,py,TILE,TILE);
    ctx.fillStyle=cols[1]; ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
    // Pixel detail
    ctx.fillStyle=cols[2];
    const seed=(tx*31+ty*17)&255;
    for(let i=0;i<4;i++){
      const ox=((seed*i*13)&31)+1, oy=((seed*i*7+11)&31)+1;
      ctx.fillRect(px+ox,py+oy,3,3);
    }
    return;
  }

  // Fallback
  ctx.fillStyle=cols?cols[0]:'#888'; ctx.fillRect(px,py,TILE,TILE);
}

function drawPlayer(ctx, p) {
  const x=Math.floor(p.x), y=Math.floor(p.y);
  const flip=!p.facingRight;
  ctx.save();
  if(flip){ ctx.scale(-1,1); ctx.translate(-(x*2+p.w),0); }

  // Blink when invincible
  if(p.invincible>0 && Math.floor(p.invincible/4)%2===0){ ctx.restore(); return; }

  const bob=(p.onGround && Math.abs(p.vx)>0.5) ? Math.sin(p.animTick*0.5)*2 : 0;

  // Hat
  ctx.fillStyle='#E52222';
  ctx.fillRect(x+2, y+bob, p.w-4, 8);
  ctx.fillRect(x-1, y+6+bob, p.w+2, 4);

  // Face
  ctx.fillStyle='#FFDAB9';
  ctx.fillRect(x+1, y+10+bob, p.w-2, 10);

  // Eyes
  ctx.fillStyle='#000';
  ctx.fillRect(x+5, y+12+bob, 4, 4);
  ctx.fillRect(x+p.w-9, y+12+bob, 4, 4);
  // Eye shine
  ctx.fillStyle='#fff';
  ctx.fillRect(x+6, y+12+bob, 2, 2);
  ctx.fillRect(x+p.w-8, y+12+bob, 2, 2);

  // Mustache
  ctx.fillStyle='#5a2d0c';
  ctx.fillRect(x+2, y+18+bob, p.w-4, 3);

  // Body
  ctx.fillStyle='#003399';
  ctx.fillRect(x+1, y+20+bob, p.w-2, 14);

  // Overall buttons
  ctx.fillStyle='#FFD700';
  ctx.fillRect(x+5, y+22+bob, 4, 4);
  ctx.fillRect(x+p.w-9, y+22+bob, 4, 4);

  // Legs
  const legOff = p.onGround ? Math.sin(p.animTick*0.5)*4 : 0;
  ctx.fillStyle='#E52222';
  ctx.fillRect(x+1, y+34+bob, (p.w-4)/2, 10);
  ctx.fillRect(x+p.w/2+1, y+34+bob-legOff, (p.w-4)/2, 10);

  // Shoes
  ctx.fillStyle='#4a2800';
  ctx.fillRect(x-1, y+42+bob, (p.w+2)/2, 6);
  ctx.fillRect(x+p.w/2-1, y+42+bob-legOff, (p.w+2)/2, 6);

  // Arms
  ctx.fillStyle='#FFDAB9';
  const armY = p.onGround ? Math.sin(p.animTick*0.5)*3 : 0;
  ctx.fillRect(x-4, y+20+bob-armY, 5, 10);
  ctx.fillRect(x+p.w-1, y+20+bob+armY, 5, 10);

  // Mine animation: show pickaxe
  if(keys['x']||keys['X']){
    ctx.fillStyle='#8B5E3C';
    ctx.fillRect(x+p.w+1, y+18+bob, 3, 14);
    ctx.fillStyle='#aaa';
    ctx.fillRect(x+p.w+1, y+14+bob, 10, 5);
  }

  ctx.restore();
}

function drawEnemy(ctx, e) {
  const x=Math.floor(e.x), y=Math.floor(e.y);
  const bob=Math.sin(e.animTick*0.12)*2;

  if(e.type==='goomba') {
    // Body
    ctx.fillStyle='#8B4513'; ctx.fillRect(x,y+2+bob,e.w,e.h-2);
    // Head
    ctx.fillStyle='#a0522d'; ctx.fillRect(x-2,y+bob,e.w+4,e.h/2);
    // Eyes
    ctx.fillStyle='#fff'; ctx.fillRect(x+4,y+6+bob,6,6); ctx.fillRect(x+e.w-10,y+6+bob,6,6);
    ctx.fillStyle='#000'; ctx.fillRect(x+5,y+7+bob,4,4); ctx.fillRect(x+e.w-9,y+7+bob,4,4);
    // Teeth
    ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+e.h/2+bob,5,4); ctx.fillRect(x+e.w-10,y+e.h/2+bob,4,4);
    // Feet
    ctx.fillStyle='#000';
    const legMove=Math.sin(e.animTick*0.15)*3;
    ctx.fillRect(x+2, y+e.h-4+bob-legMove, 8,5);
    ctx.fillRect(x+e.w-10, y+e.h-4+bob+legMove, 8,5);
  } else if(e.type==='koopa') {
    // Shell
    ctx.fillStyle='#009900'; ctx.fillRect(x+2,y+8+bob,e.w-4,e.h-10);
    ctx.fillStyle='#00cc00'; ctx.beginPath(); ctx.ellipse(x+e.w/2,y+e.h/2+bob,e.w/2-3,e.h/2-6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#006600';
    ctx.beginPath(); ctx.moveTo(x+e.w/2,y+8+bob); ctx.lineTo(x+2,y+e.h/2+bob); ctx.lineTo(x+e.w/2,y+e.h-4+bob); ctx.lineTo(x+e.w-2,y+e.h/2+bob); ctx.closePath(); ctx.stroke();
    // Head
    ctx.fillStyle='#FFDAB9'; ctx.fillRect(x+4,y+bob,e.w-8,10);
    ctx.fillStyle='#000'; ctx.fillRect(x+6,y+2+bob,4,4); ctx.fillRect(x+e.w-10,y+2+bob,4,4);
    // Legs
    ctx.fillStyle='#FFDAB9';
    const lm=Math.sin(e.animTick*0.15)*4;
    ctx.fillRect(x+2,y+e.h-8+bob-lm,6,8); ctx.fillRect(x+e.w-8,y+e.h-8+bob+lm,6,8);
  } else if(e.type==='bat') {
    // Wings
    const wFlap=Math.sin(e.animTick*0.3)*8;
    ctx.fillStyle='#444';
    ctx.beginPath();
    ctx.moveTo(x+e.w/2,y+6+bob);
    ctx.quadraticCurveTo(x,y-wFlap+bob,x-6,y+12+bob);
    ctx.quadraticCurveTo(x+e.w/2,y+14+bob,x+e.w+6,y+12+bob);
    ctx.quadraticCurveTo(x+e.w,y-wFlap+bob,x+e.w/2,y+6+bob);
    ctx.fill();
    // Body
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.ellipse(x+e.w/2,y+10+bob,7,7,0,0,Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle='#ff0000'; ctx.fillRect(x+e.w/2-5,y+7+bob,3,3); ctx.fillRect(x+e.w/2+2,y+7+bob,3,3);
    // Fangs
    ctx.fillStyle='#fff'; ctx.fillRect(x+e.w/2-3,y+14+bob,2,4); ctx.fillRect(x+e.w/2+1,y+14+bob,2,4);
  }
}

function drawStar(ctx, color, r) {
  ctx.fillStyle=color;
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5 - Math.PI/2;
    const b=a+Math.PI/5;
    const x1=Math.cos(a)*r, y1=Math.sin(a)*r;
    const x2=Math.cos(b)*(r*0.45), y2=Math.sin(b)*(r*0.45);
    if(i===0) ctx.moveTo(x1,y1); else ctx.lineTo(x1,y1);
    ctx.lineTo(x2,y2);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(-r*0.2,-r*0.2,r*0.25,0,Math.PI*2); ctx.fill();
}

/* ─── MAIN LOOP ────────────────────────────── */
function loop(ts) {
  const dt = Math.min((ts - lastTime)/1000, 0.05) * FPS;
  lastTime = ts;
  update(dt);
  draw();
  if(game && game.state==='playing') rafId=requestAnimationFrame(loop);
}

/* ─── PUBLIC GAME CONTROLS ─────────────────── */
window.startLevel = function(idx) {
  cancelAnimationFrame(rafId);
  Screens.show('game');
  setTimeout(() => {
    initCanvas();
    game = createGame(idx);
    game.state='playing';
    hideEndScreen();
    document.getElementById('pause-overlay').classList.add('hidden');
    HUD.update(getHUDState());
    // Fill hotbar with starting gear based on level
    Hotbar.setSlot(0,'wood_pickaxe');
    if(idx>=2) Hotbar.setSlot(1,'stone_pickaxe');
    if(idx>=4) Hotbar.setSlot(2,'iron_pickaxe');
    Hotbar.select(0);
    lastTime=performance.now();
    rafId=requestAnimationFrame(loop);
  }, 50);
};

window.pauseGame = function() {
  if(!game||game.state!=='playing') return;
  game.state='paused';
  cancelAnimationFrame(rafId);
  document.getElementById('pause-overlay').classList.remove('hidden');
};

window.resumeGame = function() {
  if(!game||game.state!=='paused') return;
  document.getElementById('pause-overlay').classList.add('hidden');
  game.state='playing';
  lastTime=performance.now();
  rafId=requestAnimationFrame(loop);
};

window.quitGame = function() {
  cancelAnimationFrame(rafId);
  game=null;
  document.getElementById('pause-overlay').classList.add('hidden');
  hideEndScreen();
  Crafting.close();
  const unlocked=parseInt(localStorage.getItem('mc_unlocked')||'0');
  renderLevelSelect(LEVEL_DEFS, unlocked);
  Screens.show('menu');
};

window.retryLevel = function() {
  const idx=game?game.levelIdx:0;
  hideEndScreen();
  window.startLevel(idx);
};

window.nextLevel = function() {
  const idx=(game?game.levelIdx:0)+1;
  hideEndScreen();
  if(idx<LEVEL_DEFS.length) window.startLevel(idx);
};

/* ─── INIT ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const unlocked=parseInt(localStorage.getItem('mc_unlocked')||'0');
  renderLevelSelect(LEVEL_DEFS, unlocked);
  Screens.show('menu');
});

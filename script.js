'use strict';

/* ═══════════════════════════════════════════
   FAISELCRAFT - script.js
   Game engine, physics, enemies, power-ups
   ═══════════════════════════════════════════ */

/* ═══ CONSTANTS ═══ */
const TILE = 32;
const GRAVITY = 0.45;
const JUMP_FORCE = -11;
const PLAYER_SPEED = 3.2;
const FPS = 60;

/* ═══ TILE TYPES ═══ */
const T = {
  EMPTY:0, GRASS:1, DIRT:2, STONE:3, WOOD:4, LEAVES:5,
  COAL:6, IRON:7, GOLD:8, CLOUD:9, BRICK:10, PIPE_T:11,
  PIPE_B:12, COIN_BLOCK:13, FLAG:14, LAVA:15, SAND:16,
  WATER:17, MUSHROOM:18, FLOWER:19, VINE:20,
  ICE:21, SNOW:22, CRYSTAL:23, MUSHROOM_BLOCK:24, JUNGLE_LEAF:25,
  CACTUS:26, SANDSTONE:27, CORAL:28, OBSIDIAN:29, GLOWSTONE:30,
};

/* ═══ TILE COLORS ═══ */
const TILE_COLORS = {
  [T.GRASS]:   ['#5aB855','#4a9845','#3a7835'],
  [T.DIRT]:    ['#8B5E3C','#7a5230','#6a4424'],
  [T.STONE]:   ['#8A8A8A','#777','#666'],
  [T.WOOD]:    ['#8B6914','#7a5a10','#6a4c0c'],
  [T.LEAVES]:  ['#2d7a1e','#256616','#1d5210'],
  [T.COAL]:    ['#333','#222','#111'],
  [T.IRON]:    ['#aaa','#999','#888'],
  [T.GOLD]:    ['#FFD700','#e6c000','#ccaa00'],
  [T.CLOUD]:   ['#fff','#f0f0f0','#e0e0e0'],
  [T.BRICK]:   ['#cc4422','#bb3311','#aa2200'],
  [T.PIPE_T]:  ['#009900','#008800','#007700'],
  [T.PIPE_B]:  ['#00aa00','#009900','#008800'],
  [T.COIN_BLOCK]:['#FFD700','#e6c000','#ccaa00'],
  [T.LAVA]:    ['#FF4400','#FF2200','#FF0000'],
  [T.SAND]:    ['#F4D03F','#e6c030','#d4b028'],
  [T.WATER]:   ['#1a6bbf','#1560ad','#1055a0'],
  [T.ICE]:     ['#b0e8ff','#8dd4f5','#6bc0eb'],
  [T.SNOW]:    ['#e8f4ff','#d0e8f8','#b8dced'],
  [T.CRYSTAL]: ['#00ffee','#00ddcc','#00bbaa'],
  [T.MUSHROOM_BLOCK]:['#cc3399','#aa2277','#882255'],
  [T.JUNGLE_LEAF]:['#1a8830','#156624','#104d1a'],
  [T.CACTUS]:  ['#2d8b1e','#246618','#1b4d12'],
  [T.SANDSTONE]:['#dbb85a','#c9a648','#b79436'],
  [T.CORAL]:   ['#ff6688','#ee4466','#dd2244'],
  [T.OBSIDIAN]:['#1a0a2e','#100620','#080314'],
  [T.GLOWSTONE]:['#ffcc44','#ffaa22','#ff8800'],
};

/* ═══ SETS ═══ */
const MINABLE = new Set([
  T.DIRT, T.STONE, T.WOOD, T.LEAVES, T.COAL, T.IRON, T.GOLD, T.SAND,
  T.ICE, T.SNOW, T.CRYSTAL, T.MUSHROOM_BLOCK, T.JUNGLE_LEAF,
  T.SANDSTONE, T.OBSIDIAN, T.GLOWSTONE, T.BRICK,
]);
const TILE_DROP = {
  [T.DIRT]:'dirt',  [T.STONE]:'stone', [T.WOOD]:'wood',
  [T.LEAVES]:'wood',[T.COAL]:'coal',   [T.IRON]:'iron',
  [T.GOLD]:'gold_ore',[T.SAND]:'dirt',
  [T.ICE]:'stone',  [T.SNOW]:'dirt',   [T.CRYSTAL]:'gold_ore',
  [T.MUSHROOM_BLOCK]:'wood',[T.JUNGLE_LEAF]:'wood',
  [T.SANDSTONE]:'stone',[T.OBSIDIAN]:'stone',[T.GLOWSTONE]:'coal',
  [T.BRICK]:'stone',
};
const SOLID = new Set([
  T.GRASS, T.DIRT, T.STONE, T.WOOD, T.LEAVES, T.COAL, T.IRON, T.GOLD,
  T.CLOUD, T.BRICK, T.PIPE_T, T.PIPE_B, T.COIN_BLOCK, T.SAND,
  T.ICE, T.SNOW, T.CRYSTAL, T.MUSHROOM_BLOCK, T.JUNGLE_LEAF, T.CACTUS,
  T.SANDSTONE, T.CORAL, T.OBSIDIAN, T.GLOWSTONE,
]);

/* ═══ MINE HARDNESS ═══ */
const MINE_TIME = {
  [T.GOLD]:90, [T.CRYSTAL]:90, [T.OBSIDIAN]:110,
  [T.IRON]:70, [T.GLOWSTONE]:70, [T.STONE]:45,
  [T.SANDSTONE]:40, [T.BRICK]:35, [T.COAL]:30,
  [T.WOOD]:25, [T.LEAVES]:15, [T.DIRT]:20,
  [T.SAND]:18, [T.ICE]:20, [T.SNOW]:15,
  [T.CRYSTAL]:85, [T.MUSHROOM_BLOCK]:25, [T.JUNGLE_LEAF]:15,
};
function getMineTime(tile, pickaxe) {
  let base = MINE_TIME[tile] || 25;
  if (pickaxe === 'iron_pickaxe') base = Math.floor(base * 0.4);
  else if (pickaxe === 'stone_pickaxe') base = Math.floor(base * 0.65);
  else if (pickaxe === 'gold_pickaxe') base = Math.floor(base * 0.3);
  else if (pickaxe === 'wood_pickaxe') base = Math.floor(base * 0.85);
  return Math.max(5, base);
}

/* ═══════════════════════════════
   LEVEL MAP BUILDERS
   ═══════════════════════════════ */
function emptyMap(w, h) {
  return Array.from({length: h}, () => new Array(w).fill(0));
}

function buildMap1() {
  const W=70,H=20,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.DIRT;m[H-2][x]=T.DIRT;m[H-3][x]=T.GRASS;}
  for(let x=0;x<W;x++){if(x%5===2)m[H-4][x]=T.COAL;}
  [[5,14,6],[10,12,5],[18,11,6],[26,13,5],[35,10,7],[44,12,6],[52,11,6],[60,13,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;
  });
  [[8,12],[22,12],[40,12],[58,12]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++)for(let dx=-2;dx<=2;dx++){if(m[y+dy])m[y+dy][x+dx]=T.LEAVES;}
  });
  [[12,10],[13,10],[20,9],[28,11],[36,8],[45,10],[53,9]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  [[15,H-4],[30,H-4],[50,H-5],[65,H-4]].forEach(([x,y])=>{m[y][x]=T.PIPE_T;if(m[y+1])m[y+1][x]=T.PIPE_B;if(m[y+2])m[y+2][x]=T.PIPE_B;});
  [[3,4],[14,3],[28,5],[42,3],[54,4],[64,3]].forEach(([x,y])=>{for(let i=0;i<4;i++)m[y][x+i]=T.CLOUD;});
  m[H-4][W-3]=T.FLAG;
  const enemies=[
    {x:10,y:H-4,type:'goomba'},{x:18,y:H-4,type:'goomba'},{x:28,y:H-4,type:'goomba'},
    {x:35,y:11,type:'goomba'},{x:44,y:H-4,type:'koopa'},{x:52,y:H-4,type:'goomba'},
    {x:60,y:H-4,type:'koopa'},{x:67,y:H-4,type:'spiny'},
  ];
  const coins=[
    {x:7,y:H-5},{x:11,y:9},{x:13,y:9},{x:15,y:H-5},{x:20,y:8},{x:25,y:H-5},
    {x:28,y:10},{x:30,y:H-5},{x:36,y:7},{x:40,y:H-5},{x:45,y:9},{x:50,y:H-5},
    {x:53,y:8},{x:58,y:H-5},{x:63,y:H-5},{x:66,y:H-5},
  ];
  const stars=[{x:12,y:9},{x:36,y:7},{x:53,y:8}];
  const powerups=[{x:20,y:9,type:'mushroom'},{x:45,y:9,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-5},enemies,coins,stars,powerups};
}

function buildMap2() {
  const W=65,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++)m[H-1][x]=T.STONE;
  for(let x=0;x<W;x++){m[H-2][x]=T.STONE;m[H-3][x]=(x%7===3)?T.COAL:T.STONE;}
  for(let x=0;x<W;x++)m[0][x]=T.STONE;
  for(let y=0;y<H;y++)m[y][0]=T.STONE;
  [[4,16,8],[16,14,6],[24,12,8],[36,16,7],[44,10,6],[54,14,7]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.STONE;
  });
  [[8,H-4],[9,H-4],[10,H-4],[20,14],[21,14],[30,12],[31,12],[40,16],[41,16],[55,H-4],[56,H-4]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COAL;});
  [[15,H-3],[25,13],[37,15],[48,H-3],[60,H-3]].forEach(([x,y])=>{if(m[y])m[y][x]=T.IRON;});
  [[20,H-3],[38,14],[55,13]].forEach(([x,y])=>{if(m[y])m[y][x]=T.GOLD;});
  [[12,12],[28,10],[42,14],[58,12]].forEach(([x,y])=>{for(let dy=y;dy<H-1;dy++)m[dy][x]=T.STONE;});
  m[H-4][W-3]=T.FLAG;
  const enemies=[
    {x:10,y:H-3,type:'bat'},{x:22,y:15,type:'bat'},{x:30,y:13,type:'bat'},
    {x:35,y:H-3,type:'goomba'},{x:45,y:11,type:'skull'},{x:56,y:H-3,type:'bat'},
  ];
  const coins=[
    {x:8,y:H-5},{x:10,y:H-5},{x:16,y:13},{x:18,y:13},{x:24,y:11},{x:26,y:11},
    {x:36,y:H-5},{x:38,y:H-5},{x:44,y:9},{x:46,y:9},{x:54,y:13},{x:56,y:13},
  ];
  const stars=[{x:20,y:13},{x:44,y:9},{x:54,y:13}];
  const powerups=[{x:36,y:H-5,type:'mushroom'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-4},enemies,coins,stars,powerups};
}

function buildMap3() {
  const W=68,H=20,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.BRICK;m[H-2][x]=T.BRICK;m[H-3][x]=T.BRICK;}
  [[10,H-3,5],[25,H-3,4],[40,H-3,6],[55,H-3,4]].forEach(([x,y,w])=>{for(let i=0;i<w;i++)m[y][x+i]=T.LAVA;});
  [[8,H-6,3],[22,H-6,5],[38,H-6,4],[50,H-5,4],[60,H-6,5]].forEach(([x,y,w])=>{for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;});
  [[5,10,8],[18,8,10],[34,6,12],[48,10,8],[60,8,10]].forEach(([x,y,h])=>{for(let dy=0;dy<h;dy++)m[y+dy][x]=T.BRICK;});
  [[12,9],[28,7],[44,9],[62,7]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[H-6][W-3]=T.FLAG;
  const enemies=[
    {x:14,y:H-4,type:'koopa'},{x:28,y:H-4,type:'koopa'},{x:42,y:H-4,type:'koopa'},
    {x:52,y:H-5,type:'goomba'},{x:62,y:H-5,type:'skull'},{x:66,y:H-5,type:'spiny'},
  ];
  const coins=[
    {x:5,y:H-7},{x:8,y:H-7},{x:18,y:H-7},{x:22,y:H-7},{x:34,y:H-7},{x:38,y:H-7},
    {x:48,y:H-6},{x:52,y:H-6},{x:60,y:H-7},{x:64,y:H-7},
  ];
  const stars=[{x:8,y:11},{x:36,y:8},{x:60,y:9}];
  const powerups=[{x:13,y:8,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-5},enemies,coins,stars,powerups};
}

function buildMap4() {
  const W=72,H=18,m=emptyMap(W,H);
  for(let x=0;x<W;x++)m[H-1][x]=T.GRASS;
  [[2,6,5],[10,4,6],[20,7,4],[30,5,5],[40,3,7],[50,6,4],[58,4,5],[66,7,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.CLOUD;
  });
  [[4,5],[12,3],[32,4],[52,5],[60,3]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;if(m[y-1])m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++)for(let dx=-1;dx<=1;dx++){if(m[y+dy])m[y+dy][x+dx]=T.LEAVES;}
  });
  [[12,2],[22,5],[42,1],[52,4],[62,2]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[6][W-4]=T.FLAG;
  const enemies=[
    {x:11,y:5,type:'goomba'},{x:21,y:8,type:'goomba'},{x:31,y:6,type:'bat'},
    {x:41,y:4,type:'goomba'},{x:51,y:7,type:'koopa'},{x:59,y:5,type:'spiny'},{x:67,y:8,type:'goomba'},
  ];
  const coins=[
    {x:3,y:H-3},{x:12,y:1},{x:22,y:4},{x:33,y:4},{x:35,y:4},{x:42,y:0},
    {x:52,y:3},{x:53,y:5},{x:62,y:1},{x:68,y:H-3},
  ];
  const stars=[{x:12,y:1},{x:42,y:0},{x:62,y:1}];
  const powerups=[{x:22,y:4,type:'mushroom'},{x:52,y:3,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-3},enemies,coins,stars,powerups};
}

function buildMap5() {
  const W=65,H=24,m=emptyMap(W,H);
  for(let x=0;x<W;x++)m[H-1][x]=T.STONE;
  for(let x=0;x<W;x++)m[0][x]=T.STONE;
  for(let y=0;y<H;y++){m[y][0]=T.STONE;m[y][W-1]=T.STONE;}
  for(let y=H-3;y>=4;y-=4){
    for(let x=2;x<W-2;x++){
      if((x+y)%7===0)m[y][x]=T.COAL;
      else if((x*y)%11===0)m[y][x]=T.IRON;
      else if(x%13===0)m[y][x]=T.GOLD;
      else m[y][x]=T.STONE;
    }
  }
  [[8,3,18],[20,3,18],[35,3,18],[50,3,18]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)if(m[y+dy])m[y+dy][x]=T.EMPTY;
  });
  [[4,H-5,5],[12,H-9,5],[22,H-5,6],[30,H-13,6],[38,H-9,5],[46,H-5,6],[54,H-12,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)if(m[y])m[y][x+i]=T.STONE;
  });
  m[H-6][W-4]=T.FLAG;
  const enemies=[
    {x:12,y:H-4,type:'bat'},{x:24,y:H-4,type:'bat'},{x:38,y:H-4,type:'skull'},
    {x:50,y:H-4,type:'koopa'},{x:55,y:H-13,type:'bat'},
  ];
  const coins=[
    {x:8,y:H-3},{x:10,y:H-3},{x:20,y:H-6},{x:22,y:H-6},{x:35,y:H-3},{x:37,y:H-3},
    {x:48,y:H-3},{x:50,y:H-3},{x:54,y:H-13},
  ];
  const stars=[{x:30,y:H-14},{x:54,y:H-13}];
  const powerups=[{x:30,y:H-14,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-2},enemies,coins,stars,powerups};
}

function buildMap6() {
  const W=75,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.BRICK;}
  for(let x=0;x<W;x++)m[H-2][x]=T.LAVA;
  [[2,H-4,4],[10,H-5,3],[16,H-4,4],[24,H-6,5],[32,H-4,3],[40,H-5,4],[48,H-7,5],[56,H-4,5],[65,H-5,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;
  });
  [[8,H-12,8],[22,H-10,7],[38,H-11,8],[54,H-9,6],[68,H-10,7]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.BRICK;
    if(m[y+2])m[y+2][x]=T.GOLD;
    if(m[y+4])m[y+4][x]=T.IRON;
  });
  [[5,4,6],[20,3,7],[38,4,6],[54,5,5],[68,4,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;
  });
  m[H-5][W-4]=T.FLAG;
  const enemies=[
    {x:10,y:H-4,type:'koopa'},{x:25,y:H-4,type:'koopa'},{x:40,y:H-4,type:'skull'},
    {x:56,y:H-5,type:'goomba'},{x:65,y:H-4,type:'koopa'},{x:72,y:H-5,type:'spiny'},
  ];
  const coins=[
    {x:5,y:3},{x:7,y:3},{x:20,y:2},{x:22,y:2},{x:38,y:3},{x:40,y:3},
    {x:54,y:4},{x:56,y:4},{x:68,y:3},{x:70,y:3},
  ];
  const stars=[{x:24,y:H-7},{x:48,y:H-8},{x:68,y:5}];
  const powerups=[{x:8,y:H-13,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-5},enemies,coins,stars,powerups};
}

function buildMap7() {
  const W=74,H=20,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.SNOW;m[H-2][x]=T.ICE;m[H-3][x]=T.SNOW;}
  [[4,H-5,6],[12,H-7,5],[22,H-5,6],[32,H-8,5],[42,H-5,6],[52,H-7,4],[62,H-5,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.ICE;
  });
  [[6,H-4],[14,H-6],[24,H-4],[34,H-7],[44,H-4],[54,H-6],[64,H-4]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;if(m[y-1])m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++)for(let dx=-1;dx<=1;dx++){if(m[y+dy])m[y+dy][x+dx]=T.LEAVES;}
  });
  [[8,H-6],[18,H-8],[28,H-6],[38,H-9],[48,H-6],[58,H-8]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[H-6][W-3]=T.FLAG;
  const enemies=[
    {x:10,y:H-4,type:'spiny'},{x:22,y:H-6,type:'koopa'},{x:32,y:H-4,type:'spiny'},
    {x:42,y:H-9,type:'goomba'},{x:52,y:H-4,type:'skull'},{x:62,y:H-8,type:'bat'},
  ];
  const coins=[
    {x:6,y:H-6},{x:8,y:H-6},{x:14,y:H-8},{x:16,y:H-8},{x:26,y:H-6},{x:28,y:H-6},
    {x:36,y:H-9},{x:38,y:H-9},{x:46,y:H-6},{x:56,y:H-8},{x:64,y:H-6},
  ];
  const stars=[{x:18,y:H-9},{x:38,y:H-10},{x:58,y:H-9}];
  const powerups=[{x:28,y:H-7,type:'mushroom'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-4},enemies,coins,stars,powerups};
}

function buildMap8() {
  const W=68,H=24,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.SAND;m[H-2][x]=T.CORAL;m[H-3][x]=T.SAND;}
  for(let x=0;x<W;x++){m[0][x]=T.WATER;m[1][x]=T.WATER;m[2][x]=T.WATER;}
  [[4,H-5,4],[12,H-8,4],[22,H-5,5],[30,H-10,4],[40,H-5,5],[50,H-7,4],[60,H-5,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.CORAL;
  });
  [[6,H-7,5],[16,H-4,4],[26,H-7,5],[36,H-4,5],[46,H-9,4],[56,H-4,5]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.SANDSTONE;
  });
  m[H-6][W-4]=T.FLAG;
  const enemies=[
    {x:8,y:H-4,type:'bat'},{x:20,y:H-9,type:'bat'},{x:32,y:H-4,type:'skull'},
    {x:42,y:H-6,type:'bat'},{x:52,y:H-8,type:'koopa'},{x:62,y:H-4,type:'bat'},
  ];
  const coins=[
    {x:5,y:H-6},{x:12,y:H-9},{x:22,y:H-6},{x:30,y:H-11},{x:40,y:H-6},
    {x:50,y:H-8},{x:60,y:H-6},{x:64,y:H-6},
  ];
  const stars=[{x:12,y:H-10},{x:30,y:H-12},{x:60,y:H-7}];
  const powerups=[{x:22,y:H-7,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-4},enemies,coins,stars,powerups};
}

function buildMap9() {
  const W=72,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.DIRT;m[H-2][x]=T.GRASS;m[H-3][x]=T.JUNGLE_LEAF;}
  [[4,H-5,4],[10,H-8,5],[20,H-5,5],[30,H-9,4],[40,H-5,5],[52,H-8,4],[62,H-5,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.JUNGLE_LEAF;
  });
  [[6,H-7],[12,H-4],[22,H-7],[32,H-4],[42,H-7],[54,H-4],[64,H-7]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;m[y-1][x]=T.WOOD;m[y-2][x]=T.WOOD;
    for(let dy=-5;dy<=-3;dy++)for(let dx=-2;dx<=2;dx++){if(m[y+dy])m[y+dy][x+dx]=T.JUNGLE_LEAF;}
  });
  [[14,H-9],[24,H-6],[36,H-10],[44,H-6],[56,H-9]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[H-6][W-4]=T.FLAG;
  const enemies=[
    {x:8,y:H-4,type:'goomba'},{x:22,y:H-9,type:'koopa'},{x:32,y:H-4,type:'spiny'},
    {x:42,y:H-8,type:'skull'},{x:54,y:H-4,type:'bat'},{x:64,y:H-8,type:'koopa'},
  ];
  const coins=[
    {x:5,y:H-6},{x:10,y:H-9},{x:20,y:H-6},{x:30,y:H-10},{x:40,y:H-6},
    {x:52,y:H-9},{x:62,y:H-6},{x:68,y:H-6},
  ];
  const stars=[{x:24,y:H-7},{x:44,y:H-7},{x:64,y:H-9}];
  const powerups=[{x:14,y:H-10,type:'mushroom'},{x:56,y:H-10,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-4},enemies,coins,stars,powerups};
}

function buildMap10() {
  const W=74,H=20,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.SAND;m[H-2][x]=T.SANDSTONE;m[H-3][x]=T.SAND;}
  [[3,H-5,3],[8,H-4,2],[15,H-7,4],[24,H-5,3],[32,H-8,4],[42,H-5,3],[52,H-7,4],[62,H-5,3]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.SANDSTONE;
  });
  [[5,H-3],[18,H-3],[35,H-3],[55,H-3]].forEach(([x,y])=>{m[y][x]=T.CACTUS;m[y-1][x]=T.CACTUS;});
  [[10,H-5],[26,H-9],[44,H-6],[64,H-6]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[H-5][W-3]=T.FLAG;
  const enemies=[
    {x:10,y:H-4,type:'spiny'},{x:20,y:H-8,type:'goomba'},{x:34,y:H-4,type:'skull'},
    {x:44,y:H-9,type:'koopa'},{x:55,y:H-4,type:'spiny'},{x:65,y:H-8,type:'goomba'},
  ];
  const coins=[
    {x:4,y:H-6},{x:16,y:H-8},{x:24,y:H-6},{x:32,y:H-9},{x:42,y:H-6},
    {x:52,y:H-8},{x:62,y:H-6},{x:70,y:H-6},
  ];
  const stars=[{x:26,y:H-10},{x:44,y:H-7},{x:64,y:H-7}];
  const powerups=[{x:10,y:H-6,type:'mushroom'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-4},enemies,coins,stars,powerups};
}

function buildMap11() {
  const W=70,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.MUSHROOM_BLOCK;m[H-2][x]=T.MUSHROOM_BLOCK;}
  [[3,H-4,4],[10,H-7,4],[20,H-4,5],[30,H-9,4],[40,H-4,5],[50,H-7,4],[60,H-4,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.MUSHROOM_BLOCK;
  });
  [[6,H-6],[12,H-9],[22,H-6],[32,H-11],[42,H-6],[52,H-9],[62,H-6]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;if(m[y-1])m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++)for(let dx=-1;dx<=1;dx++){if(m[y+dy])m[y+dy][x+dx]=T.MUSHROOM_BLOCK;}
  });
  m[H-5][W-4]=T.FLAG;
  const enemies=[
    {x:8,y:H-3,type:'goomba'},{x:22,y:H-5,type:'skull'},{x:32,y:H-3,type:'spiny'},
    {x:42,y:H-10,type:'bat'},{x:52,y:H-3,type:'skull'},{x:62,y:H-5,type:'koopa'},
  ];
  const coins=[
    {x:5,y:H-5},{x:12,y:H-8},{x:22,y:H-5},{x:30,y:H-10},{x:40,y:H-5},
    {x:50,y:H-8},{x:60,y:H-5},{x:66,y:H-5},
  ];
  const stars=[{x:12,y:H-10},{x:32,y:H-12},{x:52,y:H-10}];
  const powerups=[{x:22,y:H-7,type:'star'},{x:52,y:H-10,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-3},enemies,coins,stars,powerups};
}

function buildMap12() {
  const W=66,H=26,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.OBSIDIAN;m[H-2][x]=T.CRYSTAL;}
  for(let y=6;y<H-2;y+=5){
    for(let x=2;x<W-2;x++){
      if((x*3+y*7)%9===0)m[y][x]=T.CRYSTAL;
      else if((x+y)%5===0)m[y][x]=T.OBSIDIAN;
      else m[y][x]=T.STONE;
    }
  }
  [[6,3,20],[16,3,20],[28,3,20],[42,3,20],[54,3,20]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++){if(m[y+dy])m[y+dy][x]=T.EMPTY;if(x+1<W-1&&m[y+dy])m[y+dy][x+1]=T.EMPTY;}
  });
  [[4,H-7,5],[12,H-11,4],[20,H-6,5],[30,H-14,5],[38,H-10,4],[46,H-7,5],[56,H-13,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)if(m[y])m[y][x+i]=T.CRYSTAL;
  });
  [[8,H-4],[18,H-4],[32,H-4],[44,H-4],[58,H-4]].forEach(([x,y])=>{if(m[y])m[y][x]=T.GLOWSTONE;});
  m[H-8][W-4]=T.FLAG;
  const enemies=[
    {x:10,y:H-3,type:'bat'},{x:22,y:H-7,type:'skull'},{x:32,y:H-3,type:'bat'},
    {x:40,y:H-11,type:'skull'},{x:50,y:H-3,type:'koopa'},{x:58,y:H-14,type:'bat'},
  ];
  const coins=[
    {x:6,y:H-4},{x:8,y:H-4},{x:14,y:H-12},{x:16,y:H-12},{x:28,y:H-5},{x:30,y:H-15},
    {x:38,y:H-11},{x:40,y:H-11},{x:54,y:H-5},{x:58,y:H-14},
  ];
  const stars=[{x:16,y:H-12},{x:30,y:H-15},{x:58,y:H-14}];
  const powerups=[{x:30,y:H-16,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-2},enemies,coins,stars,powerups};
}

function buildMap13() {
  const W=80,H=18,m=emptyMap(W,H);
  for(let x=0;x<W;x++)m[H-1][x]=T.GRASS;
  [[2,4,8],[14,6,7],[25,3,9],[38,5,7],[50,3,8],[62,6,7],[72,4,7]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++){m[y][x+i]=T.CLOUD;if(m[y+1])m[y+1][x+i]=T.CLOUD;}
  });
  [[8,8,4],[20,10,4],[32,7,3],[44,9,4],[56,7,3],[68,9,4]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.CLOUD;
  });
  [[4,3],[26,2],[52,2],[72,3]].forEach(([x,y])=>{
    m[y][x]=T.WOOD;if(m[y-1])m[y-1][x]=T.WOOD;
    for(let dy=-3;dy<=-1;dy++)for(let dx=-1;dx<=1;dx++){if(m[y+dy])m[y+dy][x+dx]=T.LEAVES;}
  });
  [[8,6],[15,4],[27,1],[40,3],[52,1],[64,4],[73,2]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[4][W-5]=T.FLAG;
  const enemies=[
    {x:5,y:5,type:'goomba'},{x:15,y:7,type:'skull'},{x:26,y:4,type:'bat'},
    {x:39,y:6,type:'koopa'},{x:51,y:4,type:'goomba'},{x:63,y:7,type:'spiny'},
    {x:73,y:5,type:'koopa'},
  ];
  const coins=[
    {x:3,y:H-3},{x:8,y:5},{x:15,y:3},{x:27,y:0},{x:38,y:4},{x:40,y:4},
    {x:51,y:0},{x:52,y:2},{x:64,y:3},{x:73,y:1},{x:77,y:H-3},
  ];
  const stars=[{x:8,y:5},{x:27,y:0},{x:64,y:3}];
  const powerups=[{x:15,y:3,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-3},enemies,coins,stars,powerups};
}

function buildMap14() {
  const W=72,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.BRICK;m[H-2][x]=T.LAVA;}
  for(let x=0;x<W;x++)if(x%4!==0)m[H-3][x]=T.LAVA;
  [[2,H-5,3],[8,H-6,3],[16,H-4,3],[22,H-7,4],[30,H-5,3],[38,H-7,4],[46,H-5,3],[54,H-7,4],[62,H-5,3],[68,H-6,3]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.STONE;
  });
  [[6,H-15,10],[20,H-12,8],[38,H-14,10],[54,H-12,8],[66,H-13,8]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.OBSIDIAN;
    if(m[y+3])m[y+3][x]=T.GOLD;
    if(m[y+6])m[y+6][x]=T.IRON;
  });
  [[4,3,5],[18,4,5],[36,2,6],[52,4,5],[66,3,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;
  });
  m[H-6][W-4]=T.FLAG;
  const enemies=[
    {x:8,y:H-5,type:'skull'},{x:22,y:H-8,type:'koopa'},{x:38,y:H-6,type:'skull'},
    {x:46,y:H-5,type:'spiny'},{x:55,y:H-8,type:'skull'},{x:64,y:H-5,type:'koopa'},
    {x:70,y:H-6,type:'goomba'},
  ];
  const coins=[
    {x:3,y:2},{x:5,y:2},{x:18,y:3},{x:20,y:3},{x:36,y:1},{x:38,y:1},
    {x:52,y:3},{x:54,y:3},{x:66,y:2},{x:68,y:2},
  ];
  const stars=[{x:36,y:1},{x:4,y:2},{x:66,y:2}];
  const powerups=[{x:18,y:3,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-7},enemies,coins,stars,powerups};
}

function buildMap15() {
  const W=74,H=24,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.OBSIDIAN;m[H-2][x]=T.OBSIDIAN;}
  for(let x=0;x<W;x++)m[0][x]=T.OBSIDIAN;
  for(let y=0;y<H;y++){m[y][0]=T.OBSIDIAN;m[y][W-1]=T.OBSIDIAN;}
  [[5,4,16],[18,2,18],[32,4,16],[48,2,18],[62,4,14]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.OBSIDIAN;
    if(m[y+4])m[y+4][x]=T.EMPTY;
    if(m[y+8])m[y+8][x]=T.EMPTY;
    if(m[y+12])m[y+12][x]=T.EMPTY;
  });
  [[2,H-6,6],[10,H-9,5],[18,H-6,6],[26,H-9,5],[34,H-6,6],[42,H-11,6],[50,H-6,5],[58,H-9,6],[66,H-6,5]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.BRICK;
  });
  [[6,H-8],[19,H-6],[33,H-9],[49,H-7],[63,H-8]].forEach(([x,y])=>{if(m[y])m[y][x]=T.GOLD;});
  [[6,H-12],[19,H-10],[33,H-13],[49,H-11],[63,H-12]].forEach(([x,y])=>{if(m[y])m[y][x]=T.IRON;});
  [[8,H-5],[22,H-5],[38,H-5],[54,H-5],[70,H-5]].forEach(([x,y])=>{if(m[y])m[y][x]=T.GLOWSTONE;});
  [[11,H-10],[28,H-10],[44,H-12],[60,H-10]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  m[H-12][W-5]=T.FLAG;
  const enemies=[
    {x:10,y:H-5,type:'skull'},{x:20,y:H-10,type:'skull'},{x:30,y:H-5,type:'bat'},
    {x:40,y:H-12,type:'skull'},{x:50,y:H-5,type:'spiny'},{x:60,y:H-10,type:'skull'},
    {x:70,y:H-5,type:'bat'},
  ];
  const coins=[
    {x:4,y:H-7},{x:11,y:H-11},{x:20,y:H-7},{x:28,y:H-11},{x:36,y:H-7},
    {x:44,y:H-13},{x:52,y:H-7},{x:60,y:H-11},{x:68,y:H-7},
  ];
  const stars=[{x:28,y:H-11},{x:44,y:H-13},{x:60,y:H-11}];
  const powerups=[{x:11,y:H-11,type:'fireflower'},{x:44,y:H-13,type:'star'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-3},enemies,coins,stars,powerups};
}

function buildMap16() {
  const W=80,H=22,m=emptyMap(W,H);
  for(let x=0;x<W;x++){m[H-1][x]=T.DIRT;m[H-2][x]=T.GOLD;m[H-3][x]=T.GOLD;}
  for(let step=0;step<5;step++){
    const sw=10-step*2,sy=H-4-step;
    for(let i=0;i<sw;i++)m[sy][step+i+5]=T.GOLD;
  }
  [[2,H-18,14],[W-3,H-18,14]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.GOLD;
    if(m[y+2])m[y+2][x]=T.COIN_BLOCK;
    if(m[y+6])m[y+6][x]=T.COIN_BLOCK;
    if(m[y+10])m[y+10][x]=T.COIN_BLOCK;
  });
  [[8,H-7,6],[20,H-10,7],[34,H-7,6],[46,H-12,7],[58,H-7,6],[68,H-10,6]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.GOLD;
  });
  [[10,H-8],[22,H-11],[36,H-8],[48,H-13],[60,H-8],[70,H-11]].forEach(([x,y])=>{if(m[y])m[y][x]=T.COIN_BLOCK;});
  [[15,2,8],[35,2,8],[55,2,8]].forEach(([x,y,w])=>{
    for(let i=0;i<w;i++)m[y][x+i]=T.GOLD;
    for(let i=0;i<w;i++)if(m[y+1])m[y+1][x+i]=T.GOLD;
    if(m[y-1])m[y-1][x+(w/2|0)]=T.COIN_BLOCK;
  });
  [[12,H-16,12],[38,H-16,12],[62,H-16,12]].forEach(([x,y,h])=>{
    for(let dy=0;dy<h;dy++)m[y+dy][x]=T.IRON;
    if(m[y+4])m[y+4][x]=T.GOLD;
  });
  m[H-13][W-4]=T.FLAG;
  const enemies=[
    {x:10,y:H-4,type:'skull'},{x:22,y:H-11,type:'skull'},{x:36,y:H-4,type:'spiny'},
    {x:48,y:H-13,type:'skull'},{x:58,y:H-4,type:'bat'},{x:68,y:H-11,type:'skull'},
    {x:76,y:H-4,type:'goomba'},{x:16,y:3,type:'bat'},{x:36,y:3,type:'bat'},{x:56,y:3,type:'bat'},
  ];
  const coins=[
    {x:4,y:H-5},{x:8,y:H-9},{x:16,y:1},{x:22,y:H-12},{x:34,y:H-9},{x:36,y:1},
    {x:46,y:H-14},{x:50,y:H-14},{x:56,y:1},{x:60,y:H-9},{x:68,y:H-12},{x:76,y:H-5},
  ];
  const stars=[{x:16,y:1},{x:46,y:H-14},{x:68,y:H-12}];
  const powerups=[{x:22,y:H-12,type:'star'},{x:60,y:H-10,type:'fireflower'}];
  return {w:W,h:H,data:m,playerStart:{x:2,y:H-5},enemies,coins,stars,powerups};
}

/* ═══ LEVEL DEFINITIONS ═══ */
const LEVEL_DEFS = [
  {name:'Groene Heuvels',   world:'Gras',       worldClass:'world-grass',    timeLimit:300, bgColor:'#5C94FC', bgColor2:'#87CEEB', clouds:true,  map:buildMap1()},
  {name:'Stenen Grotten',   world:'Grot',       worldClass:'world-cave',     timeLimit:240, bgColor:'#1a1a2e', bgColor2:'#0d0d1e', clouds:false, map:buildMap2()},
  {name:'Nether Kasteel',   world:'Nether',     worldClass:'world-nether',   timeLimit:200, bgColor:'#1a0000', bgColor2:'#330000', clouds:false, map:buildMap3()},
  {name:'Sky Kingdom',      world:'Lucht',      worldClass:'world-sky',      timeLimit:260, bgColor:'#87CEEB', bgColor2:'#ADD8E6', clouds:true,  map:buildMap4()},
  {name:'Diep Mijnbouw',    world:'Grot',       worldClass:'world-cave',     timeLimit:280, bgColor:'#0a0a0a', bgColor2:'#111',    clouds:false, map:buildMap5()},
  {name:'Vuur Berg',        world:'Nether',     worldClass:'world-nether',   timeLimit:180, bgColor:'#2a0000', bgColor2:'#1a0000', clouds:false, map:buildMap6()},
  {name:'IJzig Woud',       world:'Sneeuw',     worldClass:'world-snow',     timeLimit:270, bgColor:'#a8d4f0', bgColor2:'#c0e0ff', clouds:true,  map:buildMap7()},
  {name:'Oceaan Diepte',    world:'Oceaan',     worldClass:'world-ocean',    timeLimit:240, bgColor:'#0a2a5a', bgColor2:'#0d3a6a', clouds:false, map:buildMap8()},
  {name:'Jungle Tempel',    world:'Jungle',     worldClass:'world-jungle',   timeLimit:220, bgColor:'#0d3a0d', bgColor2:'#1a5e1a', clouds:true,  map:buildMap9()},
  {name:'Woestijn Piramide',world:'Woestijn',   worldClass:'world-desert',   timeLimit:200, bgColor:'#d4a830', bgColor2:'#f0c840', clouds:false, map:buildMap10()},
  {name:'Paddenstoel Land', world:'Paddenstoel',worldClass:'world-mushroom',  timeLimit:260, bgColor:'#2a0a3e', bgColor2:'#3a1050', clouds:false, map:buildMap11()},
  {name:'Kristal Grot',     world:'Kristal',    worldClass:'world-crystal',  timeLimit:230, bgColor:'#001a2e', bgColor2:'#002a3e', clouds:false, map:buildMap12()},
  {name:'Wolken Eiland',    world:'Lucht',      worldClass:'world-sky',      timeLimit:290, bgColor:'#5090e0', bgColor2:'#70b0f8', clouds:true,  map:buildMap13()},
  {name:'Vulkaan Kern',     world:'Vulkaan',    worldClass:'world-volcano',  timeLimit:160, bgColor:'#1a0000', bgColor2:'#2a0800', clouds:false, map:buildMap14()},
  {name:'Obsidiaan Fort',   world:'Nether',     worldClass:'world-nether',   timeLimit:170, bgColor:'#0a000a', bgColor2:'#150015', clouds:false, map:buildMap15()},
  {name:'Gouden Paleis',    world:'Gras',       worldClass:'world-grass',    timeLimit:250, bgColor:'#c8a820', bgColor2:'#e0c040', clouds:true,  map:buildMap16()},
];

/* ═══ GAME STATE ═══ */
let game = null;

function createGame(levelIdx) {
  const def = LEVEL_DEFS[levelIdx];
  const map = def.map;
  return {
    levelIdx, def, map,
    state: 'playing',
    score: 0, coins: 0, lives: 3,
    timer: def.timeLimit, timerAcc: 0,
    player: {
      x: map.playerStart.x * TILE,
      y: map.playerStart.y * TILE,
      w: TILE - 4, h: TILE * 1.5,
      vx: 0, vy: 0,
      onGround: false, facingRight: true,
      invincible: 0, dead: false,
      animFrame: 0, animTick: 0,
      jumpBuffer: 0, coyoteTime: 0,
      powered: false,   // mushroom power
      starPower: 0,     // star timer
      firePower: false, // fire flower
    },
    enemies: map.enemies.map(e => ({
      ...e,
      x: e.x * TILE, y: e.y * TILE,
      w: TILE - 2, h: TILE - 2,
      vx: (e.type === 'bat' || e.type === 'skull') ? 0 : -1.2,
      vy: 0,
      alive: true, stunned: 0, animTick: 0,
      startX: e.x * TILE,
    })),
    coinItems: (map.coins || []).map(c => ({
      x: c.x * TILE + 8, y: c.y * TILE + 8,
      w: 16, h: 16, collected: false, anim: 0,
    })),
    starItems: (map.stars || []).map(s => ({
      x: s.x * TILE + 4, y: s.y * TILE + 4,
      w: 24, h: 24, collected: false, anim: 0,
    })),
    powerupItems: (map.powerups || []).map(p => ({
      x: p.x * TILE, y: p.y * TILE,
      w: TILE, h: TILE, collected: false,
      type: p.type, anim: 0,
      vy: 0, active: true,
    })),
    fireballs: [],
    starsCollected: 0, coinCount: 0,
    inventory: {wood:0, stone:0, dirt:0, coal:0, iron:0, gold_ore:0},
    cam: {x:0, y:0},
    mineBlock: null, mineProgress: 0, mineNeeded: 1,
    flagReached: false,
    coins_anim: [],
    floatTexts: [],
  };
}

/* ═══ CANVAS ═══ */
let canvas, ctx, rafId = null, lastTime = 0;

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

/* ═══ INPUT ═══ */
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['z','Z','ArrowUp',' '].includes(e.key)) e.preventDefault();
  if (['x','X'].includes(e.key)) e.preventDefault();
  if (['c','C'].includes(e.key)) {
    if (game && game.state === 'playing') Crafting.open(game.inventory);
  }
  for (let i = 1; i <= 5; i++) if (e.key === String(i)) Hotbar.select(i - 1);
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function bindMobileBtn(id, keyName) {
  const el = document.getElementById(id);
  if (!el) return;
  ['touchstart','mousedown'].forEach(ev => el.addEventListener(ev, e => {
    e.preventDefault(); keys[keyName] = true; el.classList.add('pressed');
  }, {passive:false}));
  ['touchend','mouseup','mouseleave'].forEach(ev => el.addEventListener(ev, e => {
    e.preventDefault(); keys[keyName] = false; el.classList.remove('pressed');
  }, {passive:false}));
}

/* ═══ TILE HELPERS ═══ */
function tileAt(mapData, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= mapData.w || ty >= mapData.h) return T.STONE;
  return mapData.data[ty][tx];
}
function isSolid(t) {
  return SOLID.has(t);
}

/* ═══ MOVEMENT ═══ */
function moveX(entity, dx, mapData) {
  entity.x += dx;
  const txL = Math.floor(entity.x / TILE);
  const txR = Math.floor((entity.x + entity.w - 1) / TILE);
  const tyT = Math.floor(entity.y / TILE);
  const tyB = Math.floor((entity.y + entity.h - 1) / TILE);
  for (let ty = tyT; ty <= tyB; ty++) {
    for (let tx = txL; tx <= txR; tx++) {
      if (isSolid(tileAt(mapData, tx, ty))) {
        if (dx > 0) entity.x = tx * TILE - entity.w;
        else entity.x = (tx + 1) * TILE;
        entity.vx = 0;
        return;
      }
    }
  }
}

function moveY(entity, dy, mapData) {
  entity.y += dy;
  entity.onGround = false;
  const txL = Math.floor(entity.x / TILE);
  const txR = Math.floor((entity.x + entity.w - 1) / TILE);
  const tyT = Math.floor(entity.y / TILE);
  const tyB = Math.floor((entity.y + entity.h - 1) / TILE);
  for (let ty = tyT; ty <= tyB; ty++) {
    for (let tx = txL; tx <= txR; tx++) {
      const tile = tileAt(mapData, tx, ty);
      if (isSolid(tile)) {
        if (dy > 0) {
          entity.y = ty * TILE - entity.h;
          entity.vy = 0;
          entity.onGround = true;
        } else {
          entity.y = (ty + 1) * TILE;
          entity.vy = 0;
          if (tile === T.COIN_BLOCK && game && entity === game.player) {
            hitCoinBlock(tx, ty);
          }
        }
      }
    }
  }
  if (entity === game?.player) {
    if (entity.onGround) entity.coyoteTime = 8;
    else if (entity.coyoteTime > 0) entity.coyoteTime--;
  }
}

/* ═══ COIN BLOCK HIT ═══ */
function hitCoinBlock(tx, ty) {
  game.map.data[ty][tx] = T.BRICK;
  game.score += 100;
  game.coinCount += 1;
  HUD.update(getHUDState());
  addFloat(tx * TILE + 16 - game.cam.x, ty * TILE - game.cam.y - 4, '🪙+100');
  game.coins_anim.push({x: tx * TILE + 8, y: ty * TILE - 10, vy: -3, life: 40});
}

/* ═══ MINING ═══ */
function tryMine(player, mapData) {
  const mineKey = keys['x'] || keys['X'];
  if (!mineKey) {
    game.mineBlock = null;
    game.mineProgress = 0;
    showMiningBar(false, 0);
    return;
  }
  const cx = player.x + player.w / 2;
  const dir = player.facingRight ? 1 : -1;

  // First check if we can attack enemies (X button)
  let attacked = false;
  const attackRange = TILE * 1.5;
  game.enemies.forEach(e => {
    if (!e.alive) return;
    const distX = Math.abs((player.x + player.w / 2) - (e.x + e.w / 2));
    const distY = Math.abs((player.y + player.h / 2) - (e.y + e.h / 2));
    if (distX < attackRange && distY < TILE * 1.2) {
      // Spiny can't be killed by X-attack without star power
      if (e.type === 'spiny' && !player.starPower) {
        // Damage player instead
        hurtPlayer('🌵 Stekel!');
        attacked = true;
        return;
      }
      killEnemy(e, 300, true);
      attacked = true;
    }
  });
  if (attacked) { game.mineBlock = null; game.mineProgress = 0; showMiningBar(false, 0); return; }

  // Find minable block
  const candidates = [
    [Math.floor((cx + dir * TILE * 1.3) / TILE), Math.floor(player.y / TILE)],
    [Math.floor((cx + dir * TILE * 1.3) / TILE), Math.floor((player.y + player.h / 2) / TILE)],
    [Math.floor((cx + dir * TILE * 1.3) / TILE), Math.floor((player.y + player.h - 1) / TILE)],
    [Math.floor(cx / TILE), Math.floor((player.y - 2) / TILE)],
    [Math.floor(cx / TILE), Math.floor((player.y + player.h + 2) / TILE)],
  ];

  let target = null;
  for (const [bx, by] of candidates) {
    const tile = tileAt(mapData, bx, by);
    if (MINABLE.has(tile)) { target = [bx, by]; break; }
  }
  if (!target) { game.mineBlock = null; game.mineProgress = 0; showMiningBar(false, 0); return; }

  const [bx, by] = target;
  if (game.mineBlock && (game.mineBlock[0] !== bx || game.mineBlock[1] !== by)) {
    game.mineProgress = 0;
  }
  game.mineBlock = [bx, by];
  const tile = tileAt(mapData, bx, by);
  const pickaxe = Hotbar.getSelected();
  const needed = getMineTime(tile, pickaxe);
  game.mineNeeded = needed;
  game.mineProgress = (game.mineProgress || 0) + 1;

  showMiningBar(true, game.mineProgress / needed);

  if (game.mineProgress >= needed) {
    const drop = TILE_DROP[tile];
    if (drop) {
      game.inventory[drop] = (game.inventory[drop] || 0) + 1;
      Hotbar.addItem(drop, game.inventory[drop]);
      spawnParticles(bx * TILE - game.cam.x + 16, by * TILE - game.cam.y + 16, TILE_COLORS[tile]?.[0] || '#aaa', 8);
      addFloat(bx * TILE - game.cam.x + 16, by * TILE - game.cam.y, '⛏ +' + drop);
      updateInvDisplay();
    }
    mapData.data[by][bx] = T.EMPTY;
    game.score += 50;
    game.mineBlock = null;
    game.mineProgress = 0;
    showMiningBar(false, 0);
    HUD.update(getHUDState());
    if (Crafting._open) Crafting.render(game.inventory);
  }
}

function showMiningBar(visible, progress) {
  const container = document.getElementById('mining-bar-container');
  const bar = document.getElementById('mining-bar');
  if (!container || !bar) return;
  if (visible) {
    container.classList.remove('hidden');
    bar.style.width = Math.min(100, progress * 100) + '%';
  } else {
    container.classList.add('hidden');
    bar.style.width = '0%';
  }
}

/* ═══ FIREBALL ═══ */
function shootFireball() {
  if (!game.player.firePower) return;
  const p = game.player;
  game.fireballs.push({
    x: p.x + (p.facingRight ? p.w : -8),
    y: p.y + p.h / 2 - 4,
    w: 10, h: 10,
    vx: p.facingRight ? 7 : -7,
    vy: -2,
    life: 90, alive: true,
  });
}

/* ═══ INVENTORY DISPLAY ═══ */
function updateInvDisplay() {
  const el = document.getElementById('hud-inv');
  if (!el || !game) return;
  const inv = game.inventory;
  const parts = [];
  if (inv.wood    > 0) parts.push('🪵' + inv.wood);
  if (inv.stone   > 0) parts.push('🪨' + inv.stone);
  if (inv.coal    > 0) parts.push('⚫' + inv.coal);
  if (inv.iron    > 0) parts.push('⬛' + inv.iron);
  if (inv.gold_ore> 0) parts.push('🟡' + inv.gold_ore);
  el.textContent = parts.join(' ');
}

function addFloat(x, y, text) {
  game.floatTexts.push({x, y, text, life: 60, vy: -1.2});
}

/* ═══ CRAFTING CALLBACK ═══ */
window.onCraft = function(recipe, inventory) {
  Object.entries(recipe.needs).forEach(([k, v]) => { inventory[k] -= v; });
  Hotbar.addItem(recipe.result, 1);
  game.score += 200;
  addFloat(canvas.width / 2, canvas.height / 2, '⚒ ' + recipe.name);
  Crafting.render(inventory);
  HUD.update(getHUDState());
  updateInvDisplay();
};

/* ═══ CAMERA ═══ */
function updateCamera(player, mapData) {
  const W = canvas.width, H = canvas.height;
  const mapW = mapData.w * TILE, mapH = mapData.h * TILE;
  let cx = player.x + player.w / 2 - W / 2;
  let cy = player.y + player.h / 2 - H / 2;
  cx = Math.max(0, Math.min(cx, mapW - W));
  cy = Math.max(0, Math.min(cy, mapH - H));
  game.cam.x += (cx - game.cam.x) * 0.12;
  game.cam.y += (cy - game.cam.y) * 0.12;
}

/* ═══ ENEMY AI ═══ */
function updateEnemies(dt) {
  game.enemies.forEach(e => {
    if (!e.alive) return;
    e.animTick++;

    if (e.type === 'bat') {
      e.x += Math.sin(e.animTick * 0.05) * 1.8;
      e.y += Math.cos(e.animTick * 0.04) * 1.0;
      e.x = Math.max(TILE, Math.min(e.x, game.map.w * TILE - TILE));
      e.y = Math.max(TILE, Math.min(e.y, game.map.h * TILE - TILE));

    } else if (e.type === 'skull') {
      // Floating skull - follows player loosely
      const p = game.player;
      const dx = (p.x + p.w / 2) - (e.x + e.w / 2);
      const dy = (p.y + p.h / 2) - (e.y + e.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TILE * 8 && dist > 4) {
        e.x += (dx / dist) * 1.4;
        e.y += (dy / dist) * 1.4;
      } else {
        e.x += Math.sin(e.animTick * 0.03) * 1.5;
        e.y += Math.cos(e.animTick * 0.04) * 1.0;
      }
      e.x = Math.max(TILE, Math.min(e.x, game.map.w * TILE - TILE));
      e.y = Math.max(TILE, Math.min(e.y, game.map.h * TILE - TILE));

    } else if (e.type === 'spiny') {
      // Spiny - walks like goomba but faster, bounces off walls
      e.x += e.vx * PLAYER_SPEED * 0.7;
      const txA = Math.floor(e.x / TILE);
      const txB = Math.floor((e.x + e.w) / TILE);
      const tyMid = Math.floor((e.y + e.h / 2) / TILE);
      const txCheck = e.vx < 0 ? txA : txB;
      if (isSolid(tileAt(game.map, txCheck, tyMid)) || txA <= 0 || txB >= game.map.w - 1) e.vx *= -1;
      const tyFloor = Math.floor((e.y + e.h + 2) / TILE);
      const floorAhead = tileAt(game.map, e.vx < 0 ? txA : txB, tyFloor);
      if (!isSolid(floorAhead) && e.onGround) e.vx *= -1;
      e.vy = (e.vy || 0) + GRAVITY * 0.6;
      e.y += e.vy;
      const tyB2 = Math.floor((e.y + e.h) / TILE);
      const txM = Math.floor((e.x + e.w / 2) / TILE);
      if (isSolid(tileAt(game.map, txM, tyB2))) { e.y = tyB2 * TILE - e.h; e.vy = 0; e.onGround = true; }
      else e.onGround = false;
      e.x = Math.max(0, Math.min(e.x, game.map.w * TILE - e.w));
      e.y = Math.max(0, Math.min(e.y, game.map.h * TILE - e.h));

    } else {
      // goomba / koopa
      e.x += e.vx * PLAYER_SPEED * 0.55;
      const txA = Math.floor(e.x / TILE);
      const txB = Math.floor((e.x + e.w) / TILE);
      const tyMid = Math.floor((e.y + e.h / 2) / TILE);
      const txCheck = e.vx < 0 ? txA : txB;
      if (isSolid(tileAt(game.map, txCheck, tyMid)) || txA <= 0 || txB >= game.map.w - 1) e.vx *= -1;
      const tyFloor = Math.floor((e.y + e.h + 2) / TILE);
      const floorAhead = tileAt(game.map, e.vx < 0 ? txA : txB, tyFloor);
      if (!isSolid(floorAhead) && e.onGround) e.vx *= -1;
      e.vy = (e.vy || 0) + GRAVITY * 0.6;
      e.y += e.vy;
      const tyB2 = Math.floor((e.y + e.h) / TILE);
      const txM = Math.floor((e.x + e.w / 2) / TILE);
      if (isSolid(tileAt(game.map, txM, tyB2))) { e.y = tyB2 * TILE - e.h; e.vy = 0; e.onGround = true; }
      else e.onGround = false;
      e.x = Math.max(0, Math.min(e.x, game.map.w * TILE - e.w));
      e.y = Math.max(0, Math.min(e.y, game.map.h * TILE - e.h));
    }
  });
}

/* ═══ KILL ENEMY ═══ */
function killEnemy(e, points, fromX) {
  e.alive = false;
  game.score += points;
  addFloat(e.x - game.cam.x, e.y - game.cam.y - 20, '💀+' + points);
  HUD.update(getHUDState());
  const col = e.type === 'koopa' ? '#00cc00' : e.type === 'skull' ? '#aa00cc' : '#ff6600';
  spawnParticles(e.x - game.cam.x + e.w / 2, e.y - game.cam.y, col, 8);
}

/* ═══ HURT PLAYER ═══ */
function hurtPlayer(msg) {
  const p = game.player;
  if (p.invincible > 0 || p.starPower > 0) return;
  if (p.powered) {
    // Lose power-up, not a life
    p.powered = false;
    p.firePower = false;
    p.invincible = 120;
    addFloat(p.x - game.cam.x, p.y - game.cam.y - 20, '💔 powerup lost!');
    HUD.update(getHUDState());
    updatePowerupHUD();
    spawnParticles(p.x - game.cam.x + p.w / 2, p.y - game.cam.y, '#ff4444', 5);
    return;
  }
  game.lives--;
  p.invincible = 150;
  p.vx = p.facingRight ? -5 : 5;
  p.vy = JUMP_FORCE * 0.5;
  HUD.update(getHUDState());
  addFloat(p.x - game.cam.x, p.y - game.cam.y - 20, msg || '💔-1');
  if (game.lives <= 0) p.dead = true;
}

/* ═══ PLAYER-ENEMY COLLISION ═══ */
function checkPlayerEnemies() {
  const p = game.player;
  if (p.starPower > 0) {
    // Star power kills all touching enemies
    game.enemies.forEach(e => {
      if (!e.alive) return;
      if (p.x + p.w > e.x && p.x < e.x + e.w && p.y + p.h > e.y && p.y < e.y + e.h) {
        killEnemy(e, 500, true);
      }
    });
    return;
  }
  if (p.invincible > 0) { p.invincible--; return; }
  game.enemies.forEach(e => {
    if (!e.alive) return;
    if (p.x + p.w <= e.x || p.x >= e.x + e.w) return;
    if (p.y + p.h <= e.y || p.y >= e.y + e.h) return;
    const playerFeet = p.y + p.h;
    const enemyTop = e.y + e.h * 0.3;
    // Stomp - player falling onto enemy
    if (p.vy > 0 && playerFeet <= e.y + e.h * 0.55 && p.y < e.y) {
      if (e.type === 'spiny') {
        // Spiny hurts player even on stomp
        hurtPlayer('🌵 Stekel!');
        p.vy = JUMP_FORCE * 0.4;
        return;
      }
      killEnemy(e, 300, false);
      p.vy = JUMP_FORCE * 0.6;
      p.onGround = false;
    } else {
      hurtPlayer('💔-1');
    }
  });
}

/* ═══ FIREBALL COLLISION ═══ */
function updateFireballs() {
  game.fireballs.forEach(fb => {
    if (!fb.alive) return;
    fb.vy += GRAVITY * 0.5;
    fb.x += fb.vx;
    fb.y += fb.vy;
    fb.life--;
    if (fb.life <= 0) { fb.alive = false; return; }
    // Wall collision
    const tx = Math.floor(fb.x / TILE), ty = Math.floor(fb.y / TILE);
    if (isSolid(tileAt(game.map, tx, ty))) { fb.alive = false; return; }
    // Enemy collision
    game.enemies.forEach(e => {
      if (!e.alive || !fb.alive) return;
      if (fb.x + fb.w > e.x && fb.x < e.x + e.w && fb.y + fb.h > e.y && fb.y < e.y + e.h) {
        killEnemy(e, 200, true);
        fb.alive = false;
      }
    });
  });
  game.fireballs = game.fireballs.filter(fb => fb.alive);
}

/* ═══ COLLECTIBLES ═══ */
function checkCollectibles() {
  const p = game.player;
  game.coinItems.forEach(c => {
    if (c.collected) return;
    if (p.x + p.w > c.x && p.x < c.x + c.w && p.y + p.h > c.y && p.y < c.y + c.h) {
      c.collected = true;
      game.coinCount += 1;
      game.score += 100;
      addFloat(c.x - game.cam.x, c.y - game.cam.y - 16, '🪙+100');
      HUD.update(getHUDState());
      // 100 coins = extra life
      if (game.coinCount % 100 === 0) {
        game.lives++;
        HUD.update(getHUDState());
        addFloat(p.x - game.cam.x, p.y - game.cam.y - 40, '❤️ EXTRA LEVEN!');
        Toast.show('💯 100 munten! Extra leven!');
      }
    }
  });
  game.starItems.forEach(s => {
    if (s.collected) return;
    if (p.x + p.w > s.x && p.x < s.x + s.w && p.y + p.h > s.y && p.y < s.y + s.h) {
      s.collected = true;
      game.starsCollected++;
      game.score += 500;
      addFloat(s.x - game.cam.x, s.y - game.cam.y - 20, '⭐+500!');
      HUD.update(getHUDState());
    }
  });
  // Power-ups
  game.powerupItems.forEach(pu => {
    if (pu.collected) return;
    // Mushroom slides forward
    if (pu.type === 'mushroom') {
      pu.vy = (pu.vy || 0) + GRAVITY * 0.5;
      pu.x += 1.5;
      pu.y += pu.vy;
      const tx = Math.floor((pu.x + pu.w / 2) / TILE);
      const ty = Math.floor((pu.y + pu.h) / TILE);
      if (isSolid(tileAt(game.map, tx, ty))) { pu.y = ty * TILE - pu.h; pu.vy = 0; }
      if (pu.x > game.map.w * TILE) pu.collected = true;
    }
    if (p.x + p.w > pu.x && p.x < pu.x + pu.w && p.y + p.h > pu.y && p.y < pu.y + pu.h) {
      pu.collected = true;
      applyPowerup(pu.type);
    }
  });
}

function applyPowerup(type) {
  const p = game.player;
  switch (type) {
    case 'mushroom':
      p.powered = true;
      game.score += 1000;
      addFloat(p.x - game.cam.x, p.y - game.cam.y - 30, '🍄 GROTER!');
      Toast.show('🍄 Super Mario!');
      break;
    case 'star':
      p.starPower = 600; // 10 seconds
      game.score += 1000;
      addFloat(p.x - game.cam.x, p.y - game.cam.y - 30, '⭐ STER MACHT!');
      Toast.show('⭐ Ster macht! Onkwetsbaar!');
      break;
    case 'fireflower':
      p.powered = true;
      p.firePower = true;
      game.score += 1000;
      addFloat(p.x - game.cam.x, p.y - game.cam.y - 30, '🌸 VUUR!');
      Toast.show('🌸 Vuur bloem! Gooi vuurbal met X!');
      break;
  }
  updatePowerupHUD();
  spawnParticles(p.x - game.cam.x + p.w / 2, p.y - game.cam.y, '#FFD700', 12);
  HUD.update(getHUDState());
}

function updatePowerupHUD() {
  const el = document.getElementById('hud-powerup');
  if (!el || !game) return;
  const p = game.player;
  let txt = '';
  if (p.starPower > 0) txt = '⭐ ' + Math.ceil(p.starPower / 60) + 's';
  else if (p.firePower) txt = '🌸';
  else if (p.powered) txt = '🍄';
  el.textContent = txt;
}

/* ═══ SPECIAL TILES ═══ */
function checkSpecialTiles() {
  const p = game.player;
  const txL = Math.floor(p.x / TILE), txR = Math.floor((p.x + p.w - 1) / TILE);
  const tyT = Math.floor(p.y / TILE), tyB = Math.floor((p.y + p.h - 1) / TILE);
  for (let ty = tyT; ty <= tyB; ty++) {
    for (let tx = txL; tx <= txR; tx++) {
      const t = tileAt(game.map, tx, ty);
      if (t === T.FLAG && !game.flagReached) { game.flagReached = true; winLevel(); }
      if (t === T.LAVA) hurtPlayer('🔥 LAVA!');
      if (t === T.CACTUS) hurtPlayer('🌵 CACTUS!');
    }
  }
}

/* ═══ WIN / LOSE ═══ */
function winLevel() {
  game.state = 'win';
  const timeBonus = Math.floor(game.timer) * 10;
  game.score += timeBonus;
  const totalStars = Math.min(3,
    game.starsCollected + (game.timer > 60 ? 1 : 0) + (game.lives > 1 ? 1 : 0));
  const unlocked = parseInt(localStorage.getItem('mc_unlocked') || '0');
  if (game.levelIdx >= unlocked)
    localStorage.setItem('mc_unlocked', String(game.levelIdx + 1));
  localStorage.setItem('mc_level_' + game.levelIdx, JSON.stringify({stars: totalStars, score: game.score}));
  cancelAnimationFrame(rafId);
  showMiningBar(false, 0);
  showEndScreen(true, game.score, totalStars, game.levelIdx < LEVEL_DEFS.length - 1);
}
function loseLevel() {
  game.state = 'lose';
  cancelAnimationFrame(rafId);
  showMiningBar(false, 0);
  showEndScreen(false, game.score, 0, false);
}
function getHUDState() {
  return {lives: game.lives, score: game.score, coins: game.coinCount, level: game.levelIdx + 1, timer: game.timer};
}

/* ═══ MAIN UPDATE ═══ */
let fireballCooldown = 0;

function update(dt) {
  if (game.state !== 'playing') return;
  const p = game.player;
  const m = game.map;

  // Timer
  game.timerAcc += dt;
  if (game.timerAcc >= FPS) {
    game.timerAcc = 0;
    game.timer--;
    HUD.update(getHUDState());
  }
  if (game.timer <= 0) { game.lives = 0; p.dead = true; }

  // Dead fall
  if (p.dead) {
    p.vy += GRAVITY;
    p.y += p.vy;
    if (p.y > m.h * TILE + 100) loseLevel();
    return;
  }

  // Star power countdown
  if (p.starPower > 0) {
    p.starPower--;
    if (p.starPower === 0) {
      addFloat(p.x - game.cam.x, p.y - game.cam.y - 30, '⭐ weg!');
      updatePowerupHUD();
    }
  }

  // Horizontal movement
  let ax = 0;
  if (keys['ArrowLeft'])  { ax = -PLAYER_SPEED; p.facingRight = false; }
  if (keys['ArrowRight']) { ax =  PLAYER_SPEED; p.facingRight = true;  }
  p.vx += (ax - p.vx) * 0.25;
  moveX(p, p.vx, m);

  // Jump
  const jumpKey = keys['z'] || keys['Z'] || keys['ArrowUp'] || keys[' '];
  if (jumpKey) p.jumpBuffer = 8;
  if (p.jumpBuffer > 0) p.jumpBuffer--;
  if (p.jumpBuffer > 0 && (p.onGround || p.coyoteTime > 0)) {
    p.vy = JUMP_FORCE;
    p.onGround = false;
    p.coyoteTime = 0;
    p.jumpBuffer = 0;
  }
  if (!jumpKey && p.vy < -4) p.vy *= 0.85; // variable jump height
  p.vy = Math.min(p.vy + GRAVITY, 16);
  moveY(p, p.vy, m);

  // Fall pit
  if (p.y > m.h * TILE) {
    if (p.starPower > 0) {
      // Still dies to pit
      p.starPower = 0;
    }
    game.lives--;
    HUD.update(getHUDState());
    if (game.lives <= 0) { p.dead = true; }
    else {
      p.x = m.playerStart.x * TILE;
      p.y = m.playerStart.y * TILE;
      p.vx = 0; p.vy = 0;
      p.invincible = 150;
      showMiningBar(false, 0);
    }
  }

  // Fireball
  if (fireballCooldown > 0) fireballCooldown--;
  if ((keys['x'] || keys['X']) && p.firePower && fireballCooldown === 0 && !isMiningNearby()) {
    shootFireball();
    fireballCooldown = 20;
  }

  // Mining (only if not fire-powering)
  tryMine(p, m);

  updateEnemies(dt);
  updateFireballs();
  checkPlayerEnemies();
  checkCollectibles();
  checkSpecialTiles();
  updateCamera(p, m);

  // Coins animation
  game.coins_anim = game.coins_anim.filter(c => {
    c.y += c.vy; c.vy += 0.2; c.life--; return c.life > 0;
  });
  game.floatTexts = game.floatTexts.filter(f => { f.y += f.vy; f.life--; return f.life > 0; });
  game.coinItems.forEach(c => { if (!c.collected) c.anim += 0.1; });
  game.starItems.forEach(s => { if (!s.collected) s.anim += 0.07; });
  game.powerupItems.forEach(pu => { if (!pu.collected) pu.anim += 0.08; });

  // Player animation
  p.animTick++;
  if (Math.abs(p.vx) > 0.3) {
    if (p.animTick % 8 === 0) p.animFrame = (p.animFrame + 1) % 4;
  } else p.animFrame = 0;
}

function isMiningNearby() {
  if (!game) return false;
  const p = game.player;
  const dir = p.facingRight ? 1 : -1;
  const cx = p.x + p.w / 2;
  const candidates = [
    [Math.floor((cx + dir * TILE * 1.3) / TILE), Math.floor(p.y / TILE)],
    [Math.floor((cx + dir * TILE * 1.3) / TILE), Math.floor((p.y + p.h / 2) / TILE)],
  ];
  return candidates.some(([bx, by]) => MINABLE.has(tileAt(game.map, bx, by)));
}

/* ═══ DRAW ═══ */
function draw() {
  const W = canvas.width, H = canvas.height;
  const def = game.def;
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, def.bgColor);
  grad.addColorStop(1, def.bgColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Background clouds
  if (def.clouds) {
    const cloudColor = game.player.starPower > 0 ? 'rgba(255,255,100,0.15)' : 'rgba(255,255,255,0.15)';
    ctx.fillStyle = cloudColor;
    for (let i = 0; i < 8; i++) {
      const cx2 = ((i * 137 + game.cam.x * 0.3) % (W + 120)) - 60;
      const cy2 = 40 + i * 20;
      ctx.beginPath(); ctx.ellipse(cx2, cy2, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx2 + 30, cy2 - 8, 25, 14, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(-Math.floor(game.cam.x), -Math.floor(game.cam.y));

  // Visible tile range
  const startTX = Math.max(0, Math.floor(game.cam.x / TILE));
  const endTX = Math.min(game.map.w - 1, Math.ceil((game.cam.x + W) / TILE));
  const startTY = Math.max(0, Math.floor(game.cam.y / TILE));
  const endTY = Math.min(game.map.h - 1, Math.ceil((game.cam.y + H) / TILE));

  for (let ty = startTY; ty <= endTY; ty++) {
    for (let tx = startTX; tx <= endTX; tx++) {
      const t = game.map.data[ty][tx];
      if (t !== T.EMPTY) drawTile(ctx, t, tx * TILE, ty * TILE, tx, ty);
    }
  }

  // Mining progress overlay
  if (game.mineBlock) {
    const [bx, by] = game.mineBlock;
    const progress = game.mineProgress / game.mineNeeded;
    ctx.fillStyle = `rgba(0,0,0,${progress * 0.7})`;
    ctx.fillRect(bx * TILE, by * TILE, TILE, TILE);
    // Crack lines
    ctx.strokeStyle = `rgba(255,255,255,${progress * 0.8})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < Math.floor(progress * 5); i++) {
      ctx.beginPath();
      ctx.moveTo(bx * TILE + 8 + i * 4, by * TILE + 4);
      ctx.lineTo(bx * TILE + 4 + i * 3, by * TILE + TILE - 4);
      ctx.stroke();
    }
  }

  // Coins
  game.coinItems.forEach(c => {
    if (c.collected) return;
    const bob = Math.sin(c.anim) * 3;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8 + bob, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffec6e';
    ctx.beginPath(); ctx.arc(c.x + 6, c.y + 6 + bob, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8960c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x + 8, c.y + 8 + bob, 8, 0, Math.PI * 2); ctx.stroke();
  });

  // Stars
  game.starItems.forEach(s => {
    if (s.collected) return;
    const bob = Math.sin(s.anim) * 5;
    const sc  = 1 + Math.sin(s.anim * 1.5) * 0.18;
    ctx.save(); ctx.translate(s.x + 12, s.y + 12 + bob); ctx.scale(sc, sc);
    drawStarShape(ctx, '#FFD700', 12); ctx.restore();
  });

  // Power-ups
  game.powerupItems.forEach(pu => {
    if (pu.collected) return;
    const bob = Math.sin(pu.anim) * 3;
    ctx.save(); ctx.translate(pu.x, pu.y + bob);
    if (pu.type === 'mushroom') {
      // Mushroom
      ctx.fillStyle = '#dd2211'; ctx.fillRect(2, 14, TILE - 4, 18);
      ctx.fillStyle = '#cc1100'; ctx.beginPath(); ctx.arc(TILE / 2, 12, 14, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(8, 10, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(24, 8, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcccc'; ctx.fillRect(8, 18, 6, 6);
    } else if (pu.type === 'star') {
      ctx.translate(TILE / 2, TILE / 2);
      const pulse = 1 + Math.sin(pu.anim * 3) * 0.15;
      ctx.scale(pulse, pulse);
      drawStarShape(ctx, '#FFD700', 14);
      ctx.fillStyle = 'rgba(255,255,200,0.8)';
      ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI * 2); ctx.fill();
    } else if (pu.type === 'fireflower') {
      // Fire flower
      ctx.fillStyle = '#228833'; ctx.fillRect(14, 16, 4, 16);
      const petals = [[-8,-4],[8,-4],[0,-12],[0,2]];
      petals.forEach(([ox, oy]) => {
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.arc(16 + ox, 14 + oy, 6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath(); ctx.arc(16, 12, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  });

  // Fireballs
  game.fireballs.forEach(fb => {
    const pulse = Math.sin(Date.now() * 0.02) * 2;
    ctx.fillStyle = '#FF6600';
    ctx.beginPath(); ctx.arc(fb.x + 5, fb.y + 5, 5 + pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(fb.x + 5, fb.y + 5, 3, 0, Math.PI * 2); ctx.fill();
  });

  // Coin animations
  game.coins_anim.forEach(c => {
    ctx.globalAlpha = c.life / 40;
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🪙', c.x, c.y); ctx.globalAlpha = 1;
  });

  // Enemies
  game.enemies.forEach(e => { if (e.alive) drawEnemy(ctx, e); });

  // Player
  drawPlayer(ctx, game.player);

  ctx.restore();

  // Float texts (screen space)
  ctx.save();
  game.floatTexts.forEach(f => {
    const alpha = Math.min(1, f.life / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#000';
    ctx.font = 'bold 11px "Press Start 2P", monospace';
    ctx.textAlign = 'center'; ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1; ctx.restore();
}

/* ═══ TILE RENDERING ═══ */
function drawTile(ctx, t, px, py, tx, ty) {
  if (t === T.EMPTY) return;
  const cols = TILE_COLORS[t];

  switch(t) {
    case T.GRASS:
      ctx.fillStyle='#5aB855'; ctx.fillRect(px,py,TILE,8);
      ctx.fillStyle='#4a9845'; ctx.fillRect(px,py+2,TILE,4);
      ctx.fillStyle='#8B5E3C'; ctx.fillRect(px,py+8,TILE,TILE-8);
      ctx.fillStyle='#6dd65a';
      for(let i=0;i<4;i++){const bx=px+4+i*7;ctx.fillRect(bx,py-3,2,4);}
      return;
    case T.COIN_BLOCK:
      ctx.fillStyle='#FFD700'; ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
      ctx.fillStyle='#e6c000'; ctx.fillRect(px+2,py+2,TILE-4,4);
      ctx.strokeStyle='#8B6914'; ctx.lineWidth=2; ctx.strokeRect(px+1,py+1,TILE-2,TILE-2);
      ctx.fillStyle='#000'; ctx.font='bold 16px monospace'; ctx.textAlign='center';
      ctx.fillText('?',px+TILE/2,py+TILE-8); return;
    case T.BRICK:
      ctx.fillStyle='#cc4422'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#aa2200';
      ctx.fillRect(px,py+8,TILE,2); ctx.fillRect(px,py+22,TILE,2);
      ctx.fillRect(px+8,py,2,8); ctx.fillRect(px+22,py+8,2,14); ctx.fillRect(px+8,py+22,2,10);
      return;
    case T.CLOUD:
      ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fillRect(px+2,py+4,TILE-4,TILE-6);
      ctx.fillStyle='rgba(255,255,255,0.75)'; ctx.fillRect(px,py+8,TILE,TILE-10);
      ctx.fillStyle='rgba(220,240,255,0.5)'; ctx.fillRect(px+4,py+6,8,4); return;
    case T.PIPE_T:
    case T.PIPE_B: {
      const dark=t===T.PIPE_T;
      ctx.fillStyle=dark?'#00aa00':'#009900'; ctx.fillRect(px+2,py,TILE-4,TILE);
      if(dark){ctx.fillStyle='#00cc00';ctx.fillRect(px,py,TILE,8);}
      ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(px+4,py+2,4,TILE-4); return;
    }
    case T.LAVA: {
      const wave=Math.sin(Date.now()*0.003+tx*0.5)*3;
      ctx.fillStyle='#FF4400'; ctx.fillRect(px,py+wave,TILE,TILE-wave);
      ctx.fillStyle='#FF6600'; ctx.fillRect(px,py+wave,TILE,4);
      ctx.fillStyle='rgba(255,120,0,0.5)';
      ctx.beginPath(); ctx.ellipse(px+TILE/2,py+wave-2,TILE/3,6,0,0,Math.PI*2); ctx.fill(); return;
    }
    case T.FLAG:
      ctx.fillStyle='#aaa'; ctx.fillRect(px+14,py,4,TILE);
      ctx.fillStyle='#ff0000';
      ctx.beginPath(); ctx.moveTo(px+18,py); ctx.lineTo(px+30,py+8); ctx.lineTo(px+18,py+18); ctx.fill();
      ctx.fillStyle='#888'; ctx.fillRect(px+10,py+TILE-6,12,6); return;
    case T.LEAVES:
      ctx.fillStyle='#2d7a1e'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#1d5210'; ctx.fillRect(px+2,py,4,6); ctx.fillRect(px+TILE-6,py,4,6);
      ctx.fillRect(px,py+4,TILE,4); ctx.fillStyle='#3a8a24'; ctx.fillRect(px+8,py+8,12,8); return;
    case T.WOOD:
      ctx.fillStyle='#8B6914'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#7a5a10'; ctx.fillRect(px+4,py,TILE-8,TILE);
      ctx.fillStyle='rgba(0,0,0,0.15)';
      ctx.fillRect(px,py+8,TILE,2); ctx.fillRect(px,py+22,TILE,2); return;
    case T.COAL:
      ctx.fillStyle='#555'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#111';
      ctx.fillRect(px+8,py+6,8,8); ctx.fillRect(px+4,py+16,6,6); ctx.fillRect(px+18,py+18,6,5);
      ctx.fillStyle='rgba(80,80,80,0.4)'; ctx.fillRect(px+2,py+2,4,4); return;
    case T.IRON:
      ctx.fillStyle='#9a9a9a'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#cccccc';
      ctx.fillRect(px+6,py+4,8,6); ctx.fillRect(px+16,py+14,7,7); ctx.fillRect(px+4,py+18,7,5); return;
    case T.GOLD:
      ctx.fillStyle='#FFD700'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#ffec6e'; ctx.fillRect(px+6,py+4,8,6); ctx.fillRect(px+16,py+14,7,7);
      ctx.fillStyle='#e6c000'; ctx.fillRect(px+2,py+2,4,4); ctx.fillRect(px+22,py+22,6,6); return;
    case T.ICE:
      ctx.fillStyle='#b0e8ff'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.fillRect(px+2,py+2,TILE-4,8);
      ctx.fillStyle='rgba(100,200,255,0.4)'; ctx.fillRect(px+6,py+12,TILE-12,TILE-16);
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.fillRect(px+4,py+4,6,2); ctx.fillRect(px+18,py+8,4,4); return;
    case T.SNOW:
      ctx.fillStyle='#e8f4ff'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(px+2,py,TILE-4,8);
      ctx.fillStyle='#c0d8f0'; ctx.fillRect(px,py+10,TILE,TILE-10);
      ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.fillRect(px+8,py+14,3,3); ctx.fillRect(px+18,py+20,3,3); return;
    case T.CRYSTAL:
      ctx.fillStyle='#00ccbb'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='rgba(0,255,238,0.6)';
      ctx.beginPath(); ctx.moveTo(px+TILE/2,py+2); ctx.lineTo(px+TILE-4,py+TILE-4); ctx.lineTo(px+4,py+TILE-4); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(px+10,py+6,4,12);
      ctx.fillStyle='rgba(200,255,255,0.8)'; ctx.fillRect(px+4,py+4,4,4); return;
    case T.MUSHROOM_BLOCK:
      ctx.fillStyle='#cc3399'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#ff66cc';
      ctx.beginPath(); ctx.arc(px+8,py+8,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px+22,py+12,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px+12,py+22,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ee44aa'; ctx.fillRect(px+2,py+2,TILE-4,6); return;
    case T.JUNGLE_LEAF:
      ctx.fillStyle='#1a8830'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#22aa40'; ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
      ctx.fillStyle='#156624';
      ctx.fillRect(px,py+TILE/2,TILE,2); ctx.fillRect(px+TILE/2,py,2,TILE);
      ctx.fillStyle='rgba(50,200,80,0.4)'; ctx.fillRect(px+4,py+4,8,8); return;
    case T.CACTUS:
      ctx.fillStyle='#2d8b1e'; ctx.fillRect(px+8,py,TILE-16,TILE);
      ctx.fillStyle='#246618'; ctx.fillRect(px+10,py+2,TILE-20,TILE-4);
      ctx.fillStyle='#1b4d12';
      ctx.fillRect(px+2,py+6,6,2); ctx.fillRect(px+TILE-8,py+6,6,2);
      ctx.fillRect(px+2,py+18,6,2); ctx.fillRect(px+TILE-8,py+18,6,2);
      ctx.fillRect(px+2,py+12,8,TILE-12); ctx.fillRect(px+TILE-10,py+12,8,TILE-12); return;
    case T.SANDSTONE:
      ctx.fillStyle='#dbb85a'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#c9a648'; ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
      ctx.fillStyle='rgba(180,130,40,0.5)';
      ctx.fillRect(px,py+8,TILE,2); ctx.fillRect(px,py+20,TILE,2);
      ctx.fillStyle='rgba(255,220,100,0.3)'; ctx.fillRect(px+2,py+2,TILE-4,4); return;
    case T.CORAL:
      ctx.fillStyle='#ff6688'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#ff88aa';
      ctx.fillRect(px+12,py+4,6,TILE-4);
      ctx.fillRect(px+4,py+8,8,4); ctx.fillRect(px+18,py+10,8,4);
      ctx.fillStyle='#ee4466'; ctx.fillRect(px+2,py+2,4,4); ctx.fillRect(px+TILE-6,py+6,4,4);
      ctx.fillStyle='rgba(255,200,220,0.5)'; ctx.fillRect(px+14,py+6,4,6); return;
    case T.OBSIDIAN:
      ctx.fillStyle='#1a0a2e'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#2a1040'; ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
      ctx.fillStyle='rgba(120,60,180,0.3)';
      ctx.fillRect(px+6,py+4,8,6); ctx.fillRect(px+18,py+16,8,8);
      ctx.fillStyle='rgba(150,80,220,0.2)'; ctx.fillRect(px+2,py+2,4,4); return;
    case T.GLOWSTONE: {
      const pulse=Math.sin(Date.now()*0.004+tx*0.8)*0.2+0.8;
      ctx.fillStyle='#ffcc44'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle=`rgba(255,200,50,${pulse})`; ctx.fillRect(px+2,py+2,TILE-4,TILE-4);
      ctx.fillStyle='rgba(255,255,200,0.9)';
      ctx.fillRect(px+8,py+6,8,8); ctx.fillRect(px+12,py+4,4,20); ctx.fillRect(px+4,py+12,24,4);
      ctx.fillStyle=`rgba(255,220,0,${0.3*pulse})`;
      ctx.beginPath(); ctx.arc(px+TILE/2,py+TILE/2,TILE*0.6,0,Math.PI*2); ctx.fill(); return;
    }
    case T.VINE:
      ctx.fillStyle='rgba(40,140,80,0.3)'; ctx.fillRect(px,py,TILE,TILE);
      ctx.fillStyle='#2d9955'; ctx.fillRect(px+12,py,4,TILE);
      ctx.fillStyle='#1a7733';
      for(let vy2=2;vy2<TILE-2;vy2+=8){ctx.fillRect(px+6,py+vy2,6,3);ctx.fillRect(px+16,py+vy2+4,6,3);}
      return;
    default:
      if (t === T.STONE || t === T.DIRT || t === T.SAND) {
        ctx.fillStyle = cols[0]; ctx.fillRect(px,py,TILE,TILE);
        ctx.fillStyle = cols[1]; ctx.fillRect(px+1,py+1,TILE-2,TILE-2);
        ctx.fillStyle = cols[2];
        const seed = (tx * 31 + ty * 17) & 255;
        for(let i=0;i<4;i++){
          const ox=((seed*i*13)&31)+1, oy=((seed*i*7+11)&31)+1;
          ctx.fillRect(px+ox, py+oy, 3, 3);
        }
      } else if (cols) {
        ctx.fillStyle = cols[0]; ctx.fillRect(px, py, TILE, TILE);
      }
  }
}

/* ═══ PLAYER DRAW ═══ */
function drawPlayer(ctx, p) {
  const x = Math.floor(p.x), y = Math.floor(p.y);
  const flip = !p.facingRight;
  ctx.save();
  if (flip) { ctx.scale(-1, 1); ctx.translate(-(x * 2 + p.w), 0); }
  if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) { ctx.restore(); return; }

  // Star power rainbow effect
  if (p.starPower > 0) {
    const hue = (Date.now() / 5) % 360;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = `hsl(${hue},100%,70%)`;
    ctx.fillRect(x - 4, y - 4, p.w + 8, p.h + 8);
    ctx.globalAlpha = 1;
  }

  const bob = (p.onGround && Math.abs(p.vx) > 0.5) ? Math.sin(p.animTick * 0.5) * 2 : 0;
  const hatColor = p.firePower ? '#ffffff' : '#E52222';
  const overallColor = p.starPower > 0 ? `hsl(${(Date.now()/8)%360},100%,60%)` : '#E52222';

  // Hat
  ctx.fillStyle = hatColor; ctx.fillRect(x+2, y+bob, p.w-4, 8);
  ctx.fillRect(x-1, y+6+bob, p.w+2, 4);
  // Face
  ctx.fillStyle='#FFDAB9'; ctx.fillRect(x+1, y+10+bob, p.w-2, 10);
  ctx.fillStyle='#000'; ctx.fillRect(x+5, y+12+bob, 4, 4); ctx.fillRect(x+p.w-9, y+12+bob, 4, 4);
  ctx.fillStyle='#fff'; ctx.fillRect(x+6, y+12+bob, 2, 2); ctx.fillRect(x+p.w-8, y+12+bob, 2, 2);
  // Mustache
  ctx.fillStyle='#5a2d0c'; ctx.fillRect(x+2, y+18+bob, p.w-4, 3);
  // Body
  ctx.fillStyle='#003399'; ctx.fillRect(x+1, y+20+bob, p.w-2, 14);
  // Buttons
  ctx.fillStyle='#FFD700'; ctx.fillRect(x+5, y+22+bob, 4, 4); ctx.fillRect(x+p.w-9, y+22+bob, 4, 4);
  // Legs
  const legOff = p.onGround ? Math.sin(p.animTick * 0.5) * 4 : 0;
  ctx.fillStyle = overallColor;
  ctx.fillRect(x+1, y+34+bob, (p.w-4)/2, 10);
  ctx.fillRect(x+p.w/2+1, y+34+bob-legOff, (p.w-4)/2, 10);
  // Shoes
  ctx.fillStyle='#4a2800';
  ctx.fillRect(x-1, y+42+bob, (p.w+2)/2, 6);
  ctx.fillRect(x+p.w/2-1, y+42+bob-legOff, (p.w+2)/2, 6);
  // Arms
  ctx.fillStyle='#FFDAB9';
  const armY = p.onGround ? Math.sin(p.animTick * 0.5) * 3 : 0;
  ctx.fillRect(x-4, y+20+bob-armY, 5, 10);
  ctx.fillRect(x+p.w-1, y+20+bob+armY, 5, 10);

  // Pickaxe / sword animation when mining or attacking
  if (keys['x'] || keys['X']) {
    const swing = Math.sin(p.animTick * 0.4) * 20;
    ctx.save(); ctx.translate(x+p.w+2, y+18+bob); ctx.rotate(swing * Math.PI / 180);
    ctx.fillStyle='#8B5E3C'; ctx.fillRect(0, 0, 3, 14);
    ctx.fillStyle='#bbb'; ctx.fillRect(-2, 0, 11, 5);
    ctx.fillStyle='#999'; ctx.fillRect(8, -2, 4, 4); ctx.restore();
  }

  // Fire power flower effect
  if (p.firePower && (keys['x'] || keys['X'])) {
    ctx.fillStyle = '#FF6600';
    ctx.beginPath(); ctx.arc(x + p.w + 6, y + 24 + bob, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

/* ═══ ENEMY DRAW ═══ */
function drawEnemy(ctx, e) {
  const x = Math.floor(e.x), y = Math.floor(e.y);
  const bob = Math.sin(e.animTick * 0.12) * 2;

  if (e.type === 'goomba') {
    ctx.fillStyle='#8B4513'; ctx.fillRect(x,y+2+bob,e.w,e.h-2);
    ctx.fillStyle='#a0522d'; ctx.fillRect(x-2,y+bob,e.w+4,e.h/2);
    ctx.fillStyle='#fff'; ctx.fillRect(x+4,y+6+bob,6,6); ctx.fillRect(x+e.w-10,y+6+bob,6,6);
    ctx.fillStyle='#000'; ctx.fillRect(x+5,y+7+bob,4,4); ctx.fillRect(x+e.w-9,y+7+bob,4,4);
    ctx.fillStyle='#000'; ctx.fillRect(x+4,y+5+bob,7,2); ctx.fillRect(x+e.w-11,y+5+bob,7,2);
    ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+e.h/2+bob,5,4); ctx.fillRect(x+e.w-10,y+e.h/2+bob,4,4);
    ctx.fillStyle='#000';
    const lm = Math.sin(e.animTick*0.15)*3;
    ctx.fillRect(x+2,y+e.h-4+bob-lm,8,5); ctx.fillRect(x+e.w-10,y+e.h-4+bob+lm,8,5);

  } else if (e.type === 'koopa') {
    ctx.fillStyle='#009900'; ctx.fillRect(x+2,y+8+bob,e.w-4,e.h-10);
    ctx.fillStyle='#00cc00';
    ctx.beginPath(); ctx.ellipse(x+e.w/2,y+e.h/2+bob,e.w/2-3,e.h/2-6,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#006600'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x+e.w/2,y+8+bob); ctx.lineTo(x+2,y+e.h/2+bob); ctx.lineTo(x+e.w/2,y+e.h-4+bob); ctx.lineTo(x+e.w-2,y+e.h/2+bob); ctx.closePath(); ctx.stroke();
    ctx.fillStyle='#FFDAB9'; ctx.fillRect(x+4,y+bob,e.w-8,10);
    ctx.fillStyle='#000'; ctx.fillRect(x+6,y+2+bob,4,4); ctx.fillRect(x+e.w-10,y+2+bob,4,4);
    const lm = Math.sin(e.animTick*0.15)*4;
    ctx.fillStyle='#FFDAB9';
    ctx.fillRect(x+2,y+e.h-8+bob-lm,6,8); ctx.fillRect(x+e.w-8,y+e.h-8+bob+lm,6,8);

  } else if (e.type === 'bat') {
    const wFlap = Math.sin(e.animTick * 0.3) * 10;
    ctx.fillStyle='#553388';
    ctx.beginPath();
    ctx.moveTo(x+e.w/2,y+8+bob);
    ctx.quadraticCurveTo(x-4,y-wFlap+bob,x-10,y+14+bob);
    ctx.quadraticCurveTo(x+e.w/2,y+16+bob,x+e.w+10,y+14+bob);
    ctx.quadraticCurveTo(x+e.w+4,y-wFlap+bob,x+e.w/2,y+8+bob);
    ctx.fill();
    ctx.fillStyle='rgba(180,100,220,0.3)';
    ctx.beginPath(); ctx.moveTo(x+e.w/2,y+8+bob); ctx.quadraticCurveTo(x,y-wFlap*.5+bob,x-8,y+14+bob); ctx.fill();
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.ellipse(x+e.w/2,y+10+bob,8,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff0000'; ctx.fillRect(x+e.w/2-6,y+7+bob,4,4); ctx.fillRect(x+e.w/2+2,y+7+bob,4,4);
    ctx.fillStyle='#fff'; ctx.fillRect(x+e.w/2-3,y+15+bob,2,5); ctx.fillRect(x+e.w/2+1,y+15+bob,2,5);

  } else if (e.type === 'skull') {
    // Floating flying skull - purple ghost-like
    const glow = Math.sin(e.animTick * 0.1) * 5;
    ctx.fillStyle = `rgba(140,0,200,0.3)`;
    ctx.beginPath(); ctx.ellipse(x+e.w/2,y+e.h/2+bob,e.w/2+glow,e.h/2+glow,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath(); ctx.ellipse(x+e.w/2,y+e.h/2-2+bob,e.w/2-2,e.h/2-2,0,0,Math.PI*2); ctx.fill();
    // Eye sockets
    ctx.fillStyle = '#220033';
    ctx.beginPath(); ctx.ellipse(x+8,y+10+bob,5,6,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+e.w-8,y+10+bob,5,6,0,0,Math.PI*2); ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#cc00ff';
    ctx.beginPath(); ctx.arc(x+8,y+10+bob,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+e.w-8,y+10+bob,3,0,Math.PI*2); ctx.fill();
    // Nose holes
    ctx.fillStyle = '#220033';
    ctx.fillRect(x+e.w/2-3,y+e.h/2+1+bob,3,3); ctx.fillRect(x+e.w/2+1,y+e.h/2+1+bob,3,3);
    // Teeth
    ctx.fillStyle = '#fff';
    for(let i=0;i<4;i++) ctx.fillRect(x+4+i*6,y+e.h-6+bob,4,6);
    ctx.fillStyle = '#220033';
    for(let i=0;i<3;i++) ctx.fillRect(x+7+i*6,y+e.h-6+bob,2,4);

  } else if (e.type === 'spiny') {
    // Spiny - round with spikes
    ctx.fillStyle = '#cc2200';
    ctx.beginPath(); ctx.arc(x+e.w/2,y+e.h/2+bob,e.w/2-1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff4422';
    ctx.beginPath(); ctx.arc(x+e.w/2,y+e.h/2-2+bob,e.w/2-4,0,Math.PI*2); ctx.fill();
    // Spikes
    ctx.fillStyle = '#ffcc00';
    const spikeCount = 6;
    for(let i=0;i<spikeCount;i++){
      const angle = (i/spikeCount)*Math.PI*2 + e.animTick*0.05;
      const sx = x+e.w/2 + Math.cos(angle)*(e.w/2-2);
      const sy = y+e.h/2+bob + Math.sin(angle)*(e.h/2-2);
      const ex2 = x+e.w/2 + Math.cos(angle)*(e.w/2+5);
      const ey2 = y+e.h/2+bob + Math.sin(angle)*(e.h/2+5);
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex2,ey2); ctx.lineWidth=3; ctx.strokeStyle='#ffcc00'; ctx.stroke();
    }
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x+8,y+e.h/2-1+bob,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+e.w-8,y+e.h/2-1+bob,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(x+9,y+e.h/2-1+bob,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+e.w-7,y+e.h/2-1+bob,2,0,Math.PI*2); ctx.fill();
  }
}

/* ═══ STAR SHAPE ═══ */
function drawStarShape(ctx, color, r) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 - Math.PI / 2;
    const b = a + Math.PI / 5;
    const x1 = Math.cos(a) * r, y1 = Math.sin(a) * r;
    const x2 = Math.cos(b) * (r * 0.45), y2 = Math.sin(b) * (r * 0.45);
    if (i === 0) ctx.moveTo(x1, y1); else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.2, r * 0.25, 0, Math.PI * 2); ctx.fill();
}

/* ═══ MAIN LOOP ═══ */
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05) * FPS;
  lastTime = ts;
  update(dt);
  draw();
  if (game && game.state === 'playing') rafId = requestAnimationFrame(loop);
}

/* ═══ TOAST ═══ */
const Toast = (() => {
  let el = null, timer = null;
  function init() { el = document.getElementById('toast'); }
  function show(msg, duration = 2500) {
    if (!el) init();
    if (!el) return;
    el.textContent = msg; el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => el.classList.remove('show'), duration);
  }
  return {show};
})();

/* ═══ PARTICLES ═══ */
function spawnParticles(x, y, color, count = 5) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `left:${x + (Math.random() - .5) * 30}px;top:${y + (Math.random() - .5) * 20}px;background:${color};`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

/* ═══ HUD ═══ */
const HUD = {
  update(state) {
    const lv = document.getElementById('lives-val');
    const sv = document.getElementById('score-val');
    const cv = document.getElementById('coins-val');
    const lvl= document.getElementById('level-val');
    const tv = document.getElementById('timer-val');
    if(lv) lv.textContent = state.lives;
    if(sv) sv.textContent = state.score;
    if(cv) cv.textContent = state.coins;
    if(lvl)lvl.textContent = state.level;
    if(tv) {
      tv.textContent = Math.ceil(state.timer);
      tv.style.color = state.timer < 30 ? '#ff3333' : '#ff9900';
    }
  }
};

/* ═══ HOTBAR ═══ */
const Hotbar = {
  selected: 0,
  slots: ['', '', '', '', ''],
  counts: [0, 0, 0, 0, 0],
  ITEM_ICONS: {
    'wood':'🪵','stone':'🪨','dirt':'🟫','coal':'⚫','iron':'⬛','gold_ore':'🟡',
    'wood_pickaxe':'⛏️','stone_pickaxe':'⛏','iron_pickaxe':'⚒️','gold_pickaxe':'✨',
    'wood_sword':'🗡️','stone_sword':'⚔️','iron_sword':'🔪','ladder':'🪜','torch':'🔦',
  },
  setSlot(index, itemKey, count) {
    if (index < 0 || index > 4) return;
    this.slots[index] = itemKey;
    this.counts[index] = count || 0;
    const icon  = document.getElementById('slot-' + index);
    const cnt   = document.getElementById('count-' + index);
    if (icon) icon.textContent = itemKey ? (this.ITEM_ICONS[itemKey] || '📦') : '';
    if (cnt)  cnt.textContent  = (itemKey && count > 1) ? count : '';
  },
  select(index) {
    document.querySelectorAll('.hotbar-slot').forEach((s, i) =>
      s.classList.toggle('selected', i === index));
    this.selected = index;
  },
  getSelected() { return this.slots[this.selected]; },
  addItem(itemKey, count) {
    // Update existing slot
    let idx = this.slots.findIndex(s => s === itemKey);
    if (idx !== -1) {
      this.counts[idx] = count || (this.counts[idx] + 1);
      this.setSlot(idx, itemKey, this.counts[idx]);
      return;
    }
    // Find empty slot
    idx = this.slots.findIndex(s => s === '');
    if (idx === -1) idx = 0;
    this.setSlot(idx, itemKey, count || 1);
  },
  updateAllCounts(inventory) {
    this.slots.forEach((item, i) => {
      if (item && inventory[item] !== undefined) {
        this.counts[i] = inventory[item];
        const cnt = document.getElementById('count-' + i);
        if (cnt) cnt.textContent = inventory[item] > 1 ? inventory[item] : '';
      }
    });
  }
};

/* ═══ CRAFTING ═══ */
const Crafting = {
  _open: false,
  RECIPES: [
    {name:'Houten Bijl',   key:'wood_pickaxe', icon:'⛏️', needs:{wood:3},           result:'wood_pickaxe',  desc:'3x🪵'},
    {name:'Stenen Bijl',   key:'stone_pickaxe',icon:'⛏',  needs:{stone:3,wood:2},    result:'stone_pickaxe', desc:'3x🪨 2x🪵'},
    {name:'IJzeren Bijl',  key:'iron_pickaxe', icon:'⚒️', needs:{iron:3,wood:2},     result:'iron_pickaxe',  desc:'3x⬛ 2x🪵'},
    {name:'Gouden Bijl',   key:'gold_pickaxe', icon:'✨',  needs:{gold_ore:3,wood:2}, result:'gold_pickaxe',  desc:'3x🟡 2x🪵'},
    {name:'Houten Zwaard', key:'wood_sword',   icon:'🗡️', needs:{wood:2},            result:'wood_sword',    desc:'2x🪵'},
    {name:'Stenen Zwaard', key:'stone_sword',  icon:'⚔️', needs:{stone:2,wood:1},    result:'stone_sword',   desc:'2x🪨 1x🪵'},
    {name:'IJzeren Zwaard',key:'iron_sword',   icon:'🔪', needs:{iron:2,wood:1},     result:'iron_sword',    desc:'2x⬛ 1x🪵'},
    {name:'Ladder',        key:'ladder',       icon:'🪜',  needs:{wood:4},            result:'ladder',        desc:'4x🪵'},
    {name:'Toorts',        key:'torch',        icon:'🔦',  needs:{wood:1,coal:1},     result:'torch',         desc:'1x🪵 1x⚫'},
  ],
  open(inventory) {
    document.getElementById('crafting-overlay').classList.remove('hidden');
    this._open = true;
    this.render(inventory);
  },
  close() {
    document.getElementById('crafting-overlay').classList.add('hidden');
    this._open = false;
  },
  render(inventory) {
    // Inventory display
    const invEl = document.getElementById('crafting-inventory');
    invEl.innerHTML = '';
    const entries = Object.entries(inventory).filter(([, v]) => v > 0);
    if (!entries.length) {
      invEl.innerHTML = '<div style="font-size:.38rem;color:#666;text-align:center;padding:8px">Geen materialen</div>';
    } else {
      entries.forEach(([key, count]) => {
        const icon = Hotbar.ITEM_ICONS[key] || '📦';
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `<span class="item-icon">${icon}</span><span>${key}</span><span class="item-count">×${count}</span>`;
        invEl.appendChild(div);
      });
    }
    // Recipes
    const recEl = document.getElementById('crafting-recipes');
    recEl.innerHTML = '';
    this.RECIPES.forEach(recipe => {
      const canCraft = Object.entries(recipe.needs).every(([k, v]) => (inventory[k] || 0) >= v);
      const div = document.createElement('div');
      div.className = 'recipe-item ' + (canCraft ? 'craftable' : 'not-craftable');
      div.innerHTML = `
        <span class="item-icon">${recipe.icon}</span>
        <div style="flex:1">
          <div style="font-size:.38rem">${recipe.name}</div>
          <div style="font-size:.32rem;color:#888;margin-top:2px">${recipe.desc}</div>
        </div>
        ${canCraft ? '<span style="font-size:.45rem;color:#0f0">✓</span>' : '<span style="font-size:.45rem;color:#600">✗</span>'}
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

/* ═══ END SCREEN ═══ */
function showEndScreen(win, score, stars, hasNext) {
  const overlay = document.getElementById('end-overlay');
  const panel = overlay.querySelector('.end-panel');
  overlay.classList.remove('hidden');
  document.getElementById('end-score').textContent = score;
  document.getElementById('end-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  if (win) {
    document.getElementById('end-title').textContent = '🎉 GEWONNEN!';
    panel.classList.add('win'); panel.style.borderColor = '#FFD700';
    document.getElementById('btn-next-level').style.display = hasNext ? 'block' : 'none';
  } else {
    document.getElementById('end-title').textContent = '💀 GAME OVER';
    panel.classList.remove('win'); panel.style.borderColor = '#E52222';
    document.getElementById('btn-next-level').style.display = 'none';
  }
}
function hideEndScreen() { document.getElementById('end-overlay').classList.add('hidden'); }

/* ═══ LEVEL SELECT RENDER ═══ */
function renderLevelSelect(levels, unlockedUpTo) {
  const grid = document.getElementById('levels-grid');
  grid.innerHTML = '';
  levels.forEach((lvl, i) => {
    const locked = i > unlockedUpTo;
    const saved = JSON.parse(localStorage.getItem('mc_level_' + i) || '{"stars":0}');
    const card = document.createElement('div');
    card.className = 'level-card' + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="level-num">${locked ? '🔒' : (i + 1)}</div>
      <div class="level-name">${lvl.name}</div>
      <span class="level-world ${lvl.worldClass}">${lvl.world}</span>
      <div class="level-stars">${'⭐'.repeat(saved.stars)}${'☆'.repeat(3 - saved.stars)}</div>
    `;
    if (!locked) {
      card.addEventListener('click', () => window.startLevel(i));
      card.addEventListener('touchend', e => { e.preventDefault(); window.startLevel(i); });
    }
    grid.appendChild(card);
  });
}

/* ═══ MENU CHARACTER PREVIEW ═══ */
function drawMenuCharacter() {
  const c = document.getElementById('preview-canvas');
  if (!c) return;
  const ctx2 = c.getContext('2d');
  const p = [
    [0,0,0,1,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,0],
    [0,0,2,2,2,3,3,2,3,0,0,0],[0,2,3,2,3,3,3,2,3,3,3,0],
    [0,2,3,2,2,3,3,3,2,3,3,3],[0,2,2,3,3,3,3,2,2,2,2,0],
    [0,0,0,3,3,3,3,3,3,3,0,0],[0,0,1,1,4,1,1,1,1,0,0,0],
    [0,1,1,1,4,1,1,4,1,1,1,0],[1,1,1,1,4,4,4,4,1,1,1,1],
    [3,3,1,4,5,4,4,5,4,1,3,3],[3,3,3,4,4,4,4,4,4,3,3,3],
    [3,3,4,4,4,0,0,4,4,4,3,3],[0,0,1,1,0,0,0,0,1,1,0,0],
    [0,1,1,1,0,0,0,0,1,1,1,0],[1,1,1,0,0,0,0,0,0,1,1,1],
  ];
  const colors = ['transparent','#E52222','#8B4513','#FFDAB9','#003399','#FFD700'];
  const s = 4; let frame = 0;
  function animate() {
    const offset = Math.sin(frame * 0.08) * 3;
    ctx2.clearRect(0, 0, 64, 64); ctx2.save(); ctx2.translate(0, offset);
    p.forEach((row, y) => row.forEach((v, x) => {
      if (v) { ctx2.fillStyle = colors[v]; ctx2.fillRect(x * s, y * s, s, s); }
    }));
    ctx2.restore(); frame++; requestAnimationFrame(animate);
  }
  animate();
}

/* ═══ GLOBAL FUNCTIONS ═══ */
window.startLevel = function(idx) {
  cancelAnimationFrame(rafId);
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-game').classList.add('active');
  setTimeout(() => {
    initCanvas();
    game = createGame(idx);
    game.state = 'playing';
    hideEndScreen();
    document.getElementById('pause-overlay').classList.add('hidden');
    Crafting.close();
    HUD.update(getHUDState());
    // Give starting tools based on level
    Hotbar.slots = ['', '', '', '', ''];
    Hotbar.counts = [0, 0, 0, 0, 0];
    for(let i=0;i<5;i++){
      const icon = document.getElementById('slot-'+i);
      const cnt  = document.getElementById('count-'+i);
      if(icon)icon.textContent='';
      if(cnt)cnt.textContent='';
    }
    Hotbar.setSlot(0, 'wood_pickaxe', 1);
    if (idx >= 2) Hotbar.setSlot(1, 'stone_pickaxe', 1);
    if (idx >= 4) Hotbar.setSlot(2, 'iron_pickaxe', 1);
    if (idx >= 7) Hotbar.setSlot(3, 'gold_pickaxe', 1);
    Hotbar.select(0);
    updateInvDisplay();
    updatePowerupHUD();
    showMiningBar(false, 0);
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
    Toast.show('Level ' + (idx + 1) + ': ' + LEVEL_DEFS[idx].name);
  }, 50);
};

window.pauseGame = function() {
  if (!game || game.state !== 'playing') return;
  game.state = 'paused';
  cancelAnimationFrame(rafId);
  document.getElementById('pause-overlay').classList.remove('hidden');
};

window.resumeGame = function() {
  if (!game || game.state !== 'paused') return;
  document.getElementById('pause-overlay').classList.add('hidden');
  game.state = 'playing';
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
};

window.quitGame = function() {
  cancelAnimationFrame(rafId);
  game = null;
  showMiningBar(false, 0);
  document.getElementById('pause-overlay').classList.add('hidden');
  hideEndScreen();
  Crafting.close();
  const unlocked = parseInt(localStorage.getItem('mc_unlocked') || '0');
  renderLevelSelect(LEVEL_DEFS, unlocked);
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-menu').classList.add('active');
};

window.retryLevel = function() {
  const idx = game ? game.levelIdx : 0;
  hideEndScreen();
  window.startLevel(idx);
};

window.nextLevel = function() {
  const idx = (game ? game.levelIdx : 0) + 1;
  hideEndScreen();
  if (idx < LEVEL_DEFS.length) window.startLevel(idx);
};

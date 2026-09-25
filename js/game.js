'use strict';

const GRAV = 760, JUMP_V = 282, DJUMP_V = 248;
const TOKI_SX = 76;
const SOGAS_PER_LIFE = 50;
const MAX_HEARTS = 5;

const LEVELS = [
  {
    theme: 'sierras', name: 'SIERRAS DE CÓRDOBA', music: 'sierras',
    tip: '¡Cuidado con los arroyos\ny las nubes de lluvia!',
    length: 5600, speed: 92, speedMax: 114,
  },
  {
    theme: 'docta', name: 'BARRIO DOCTA', music: 'docta',
    tip: '¡Ojo con los charcos, los\naspersores y las fuentes!',
    length: 6400, speed: 100, speedMax: 126,
  },
];

const Game = {
  state: 'boot', t: 0, stateT: 0, fade: 0,
  levelIndex: 0, score: 0, sogas: 0, hearts: 3,
  levelStartScore: 0, levelStartSogas: 0, levelStartHearts: 3,
  high: +(localStorage.getItem('toki_high') || 0),
  combo: 0, comboT: 0, shake: 0, flash: 0, speed: 90,
};

let L = null;
let camX = 0;
const toki = {};
let particles = [];
let texts = [];
const DECO_IMG = {};

function saveHigh() {
  if (Game.score > Game.high) {
    Game.high = Game.score;
    localStorage.setItem('toki_high', String(Game.high));
  }
}

// ================= Nivel =================
function newGame() {
  Game.score = 0; Game.sogas = 0; Game.hearts = 3;
  startLevel(0);
}

function startLevel(i) {
  Game.levelIndex = i;
  const def = LEVELS[i % LEVELS.length];
  Game.levelStartScore = Game.score;
  Game.levelStartSogas = Game.sogas;
  Game.levelStartHearts = Game.hearts;
  L = {
    def, theme: def.theme, loop: Math.floor(i / LEVELS.length), length: def.length,
    objects: [], plats: [], gaps: [], nextGen: 320, nextDeco: -40,
    finishPlaced: false, finished: false, damage: false, animals: 0, sogas: 0, bonus: 0,
    lastPower: 0, lastPat: null,
  };
  Object.assign(toki, {
    x: 0, y: GROUND, vy: 0, onGround: true, jumps: 0, coyote: 0, buffer: 0, anim: 0,
    invuln: 0, barkT: 0, barkCd: 0, umbrella: 0, wetT: 0, dustT: 0,
  });
  camX = toki.x - TOKI_SX;
  particles = []; texts = [];
  Game.combo = 0; Game.comboT = 0; Game.speed = def.speed;
  addObj({ type: 'deco', kind: def.theme === 'sierras' ? 'signSierras' : 'signDocta', x: 30, w: 70 });
  generate();
  setState('levelIntro');
  Sound.play(def.music);
}

function retryLevel() {
  Game.score = Game.levelStartScore;
  Game.sogas = Game.levelStartSogas;
  Game.hearts = Math.max(3, Game.levelStartHearts);
  startLevel(Game.levelIndex);
}

// ================= Constructores =================
function addObj(o) { L.objects.push(o); return o; }
function addSoga(x, y) { addObj({ type: 'soga', x, y, t: Math.random() * 6, w: 12 }); }
function addSogaArc(x, n, w, h, base = GROUND - 10) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    addSoga(x + t * w, base - Math.sin(t * Math.PI) * h);
  }
}
function addSogaLine(x, n, y, sp = 11) { for (let i = 0; i < n; i++) addSoga(x + i * sp, y); }
function addPuddle(x, w) { addObj({ type: 'puddle', x, w }); }
function addPlat(kind, x, w, h, drawH) {
  const p = { type: 'plat', kind, x, w, h, top: GROUND - h, drawH: drawH || h };
  L.plats.push(p);
  return addObj(p);
}
function addGap(x, w) { L.gaps.push({ x0: x, x1: x + w }); addObj({ type: 'gap', x, w }); }
function addCloud(x, d) { addObj({ type: 'cloud', x, y: randi(30, 42), k: 0.42 + Math.min(1, d) * 0.25, t: rand(0, 0.8), w: 42, active: false }); }
function addTub(x) { addObj({ type: 'tub', x, w: 28, t: 0 }); }
function addSprinkler(x) { addObj({ type: 'sprinkler', x, w: 10, t: rand(0, 1) }); }
function addFountain(x) { addObj({ type: 'fountain', x, w: 46, t: rand(0, 3), jetH: 0 }); }
function addPower(x, y, kind) { addObj({ type: 'power', x, y, kind, t: 0, w: 16 }); }
function addAnimal(x, y, kind, opt = {}) {
  addObj({
    type: 'animal', kind, x, y, baseY: y, groundY: y, state: 'idle', t: Math.random() * 3,
    vx: opt.flying ? -22 : 0, vy: 0, flying: !!opt.flying, pal: randi(0, 2), w: 24,
  });
}

function inGap(x0, x1) { return L.gaps.some((g) => x1 > g.x0 && x0 < g.x1); }
function overGap(x) { return L.gaps.find((g) => x - 3 > g.x0 && x + 3 < g.x1); }

function groundAnimals() {
  return L.theme === 'sierras'
    ? ['cat', 'hornero', 'hornero', 'cotorra', 'liebre', 'liebre']
    : ['cat', 'cat', 'paloma', 'paloma', 'cotorra', 'hornero'];
}
function skyBird() { return L.theme === 'sierras' ? choice(['hornero', 'cotorra']) : choice(['paloma', 'paloma', 'cotorra']); }

// ================= Patrones =================
const PAT = {
  sogaArc(x) { addSogaArc(x, 5, 56, 34); return 60; },
  sogaLine(x) { addSogaLine(x, 6, GROUND - 8, 11); return 66; },
  sogaHigh(x) { addSogaArc(x, 5, 64, 62); addSogaLine(x + 8, 3, GROUND - 8, 20); return 68; },
  puddle(x, d) {
    const w = randi(18, 26 + Math.floor(d * 12));
    addPuddle(x + 20, w);
    addSogaArc(x + 10, 4, w + 20, 34);
    return w + 40;
  },
  puddle2(x) {
    const w1 = randi(16, 24), w2 = randi(16, 26);
    addPuddle(x + 10, w1);
    addPuddle(x + 10 + w1 + 36, w2);
    addSogaLine(x + w1 + 22, 2, GROUND - 8, 10);
    return w1 + w2 + 56;
  },
  rock(x) {
    const w = randi(34, 60), h = randi(14, 22);
    addPlat('rock', x, w, h);
    addSogaLine(x + 6, Math.floor((w - 6) / 11), GROUND - h - 8, 11);
    if (Math.random() < 0.45) addAnimal(x + w - 10, GROUND - h, choice(['cat', 'hornero', 'cotorra']));
    return w;
  },
  rockStairs(x) {
    addPlat('rock', x, 30, 14);
    addPlat('rock', x + 48, 36, 28);
    addSogaArc(x + 26, 3, 26, 18, GROUND - 24);
    addSogaLine(x + 54, 3, GROUND - 36, 10);
    return 86;
  },
  arroyo(x, d) {
    const w = randi(34, 44 + Math.floor(d * 14));
    addGap(x + 10, w);
    addSogaArc(x + 4, 5, w + 12, 40);
    return w + 20;
  },
  arroyoStone(x) {
    const w = randi(76, 92);
    addGap(x + 10, w);
    const sx = Math.round(x + 10 + w / 2 - 10);
    addPlat('rock', sx, 20, 5, 18);
    addSogaArc(x + 4, 3, w / 2 - 6, 30);
    addSogaArc(sx + 16, 3, w / 2 - 6, 30);
    return w + 20;
  },
  cloud(x, d) { addCloud(x + 70, d); addSogaLine(x, 5, GROUND - 8, 13); return 80; },
  animals(x) {
    const kinds = groundAnimals();
    const n = randi(1, 3);
    const k = choice(kinds);
    for (let i = 0; i < n; i++) addAnimal(x + i * 22, GROUND, Math.random() < 0.6 ? k : choice(kinds));
    return n * 22 + 10;
  },
  flying(x) {
    const n = randi(2, 3), k = skyBird();
    for (let i = 0; i < n; i++) addAnimal(x + 40 + i * 28, GROUND - randi(36, 60), k, { flying: true });
    addSogaLine(x, 3, GROUND - 8, 12);
    return n * 28 + 40;
  },
  tub(x) { addTub(x + 12); addSogaArc(x, 4, 52, 42); return 52; },
  power(x) {
    if (x - L.lastPower < 1500) return PAT.sogaArc(x);
    L.lastPower = x;
    addSogaArc(x, 4, 54, 28);
    addPower(x + 27, GROUND - 52, Game.hearts < 3 && Math.random() < 0.7 ? 'bone' : 'umbrella');
    return 60;
  },
  hedge(x) {
    const w = randi(30, 56), h = randi(12, 18);
    addPlat('hedge', x, w, h);
    addSogaLine(x + 5, Math.floor((w - 4) / 11), GROUND - h - 8, 11);
    if (Math.random() < 0.5) addAnimal(x + w - 10, GROUND - h, choice(['cat', 'cat', 'paloma']));
    return w;
  },
  bench(x) {
    addPlat('bench', x, 28, 10);
    addSogaArc(x - 6, 4, 40, 28, GROUND - 14);
    if (Math.random() < 0.5) addAnimal(x + 14, GROUND - 10, 'paloma');
    return 30;
  },
  container(x) {
    addPlat('container', x, 26, 20);
    addSogaLine(x + 4, 2, GROUND - 28, 11);
    addSogaArc(x + 32, 3, 30, 24);
    return 64;
  },
  sprinkler(x, d) {
    addSprinkler(x + 24);
    if (Math.random() < 0.4 + d * 0.3) { addSprinkler(x + 84); addSogaLine(x + 46, 2, GROUND - 8, 12); return 104; }
    return 50;
  },
  fountain(x) { addFountain(x + 12); addSogaArc(x + 2, 5, 66, 52); return 72; },
};

const HAZARDS = new Set(['puddle', 'puddle2', 'arroyo', 'arroyoStone', 'cloud', 'tub', 'sprinkler', 'fountain']);
const WEIGHTS = {
  sierras: [
    ['sogaArc', 3, 0], ['sogaLine', 2, 0], ['sogaHigh', 1, 0.2], ['puddle', 3, 0], ['puddle2', 1.5, 0.35],
    ['rock', 3, 0], ['rockStairs', 1.5, 0.15], ['arroyo', 3, 0.05], ['arroyoStone', 1.2, 0.35],
    ['cloud', 2.5, 0.1], ['animals', 3.5, 0], ['flying', 2, 0], ['tub', 1.2, 0.25], ['power', 0.8, 0.12],
  ],
  docta: [
    ['sogaArc', 3, 0], ['sogaLine', 2, 0], ['sogaHigh', 1, 0], ['puddle', 3, 0], ['puddle2', 2, 0.2],
    ['hedge', 3, 0], ['bench', 1.5, 0], ['container', 1.5, 0], ['sprinkler', 2.5, 0], ['fountain', 2, 0.1],
    ['cloud', 3, 0], ['animals', 3.5, 0], ['flying', 2, 0], ['tub', 1.5, 0.1], ['power', 0.8, 0.1],
  ],
};

function pickPattern(d) {
  const list = WEIGHTS[L.theme]
    .filter(([n, , min]) => d >= min && n !== L.lastPat)
    .map(([n, w]) => [n, HAZARDS.has(n) ? w * (0.7 + d * 0.7) : w]);
  const name = weighted(list);
  L.lastPat = name;
  return PAT[name];
}

function generate() {
  const limit = camX + W + 140;
  while (L.nextGen < limit && !L.finishPlaced) {
    if (L.nextGen > L.length - 180) { placeFinish(); break; }
    const d = Math.min(1.4, (L.nextGen / L.length) * 0.8 + L.loop * 0.3);
    const len = pickPattern(d)(L.nextGen, d);
    L.nextGen += len + randi(44, 92) - Math.floor(Math.min(d, 1) * 24);
  }
  while (L.nextDeco < camX + W + 80) {
    spawnDeco(L.nextDeco);
    L.nextDeco += randi(50, 130);
  }
}

function placeFinish() {
  L.finishPlaced = true;
  addSogaLine(L.length - 130, 6, GROUND - 8, 12);
  addObj({ type: 'finish', kind: L.theme, x: L.length, w: 130 });
}

function spawnDeco(x) {
  if (inGap(x - 24, x + 24)) return;
  if (L.finishPlaced && x > L.length - 40) return;
  const kind = L.theme === 'sierras'
    ? weighted([['espinillo', 3], ['palm', 2], ['cardon', 1], ['pasto', 3], ['stone', 1.5]])
    : weighted([['lamp', 2], ['lapacho', 2.5], ['bush', 3], ['tree', 2]]);
  addObj({ type: 'deco', kind, x, w: 40 });
}

// ================= Partículas y textos =================
function spawn(x, y, vx, vy, life, col, opt = {}) {
  particles.push({ x, y, vx, vy, life, max: life, col, g: opt.g || 0, size: opt.size || 1, kind: opt.kind || 'px', floor: !!opt.floor });
}
function splash(x, y, n = 14) {
  for (let i = 0; i < n; i++) spawn(x, y, rand(-70, 70), rand(-160, -60), rand(0.4, 0.8), choice(['#8cc8f4', '#3f7fd0', '#ffffff']), { g: 500, kind: 'drop' });
}
function sparkle(x, y, n = 6, col = '#fff4a0') {
  for (let i = 0; i < n; i++) spawn(x, y, rand(-50, 50), rand(-60, 30), rand(0.25, 0.5), i % 2 ? col : '#ffffff', { kind: 'star' });
}
function floatText(x, y, str, col = '#ffffff', life = 0.9) { texts.push({ x, y, str, col, life, max: life }); }

function updateParticles(dt) {
  for (const p of particles) {
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.floor && p.y >= GROUND) {
      p.life = 0;
      if (Math.random() < 0.3) spawn(p.x, GROUND - 1, rand(-20, 20), rand(-40, -15), 0.2, '#b8e0ff', { g: 300 });
    }
  }
  particles = particles.filter((p) => p.life > 0);
  for (const t of texts) { t.life -= dt; t.y -= 18 * dt; }
  texts = texts.filter((t) => t.life > 0);
}

function drawParticles(cx) {
  for (const p of particles) {
    const x = Math.round(p.x - cx), y = Math.round(p.y);
    ctx.fillStyle = p.col;
    const k = p.life / p.max;
    switch (p.kind) {
      case 'star':
        ctx.fillRect(x, y, 1, 1);
        if (k > 0.4) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
        break;
      case 'drop': ctx.fillRect(x, y, 1, 2); break;
      case 'rain': ctx.fillRect(x, y, 1, 3); break;
      case 'dust': {
        const s = Math.max(1, Math.round(p.size * k));
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
        ctx.globalAlpha = 1;
        break;
      }
      case 'bubble':
        ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
        break;
      case 'feather': ctx.fillRect(x, y, 2, 1); break;
      default: ctx.fillRect(x, y, p.size, p.size);
    }
  }
}

function drawTexts(cx) {
  for (const t of texts) {
    if (t.life < 0.2 && Math.floor(t.life * 30) % 2) continue;
    drawText(t.str, Math.round(t.x - cx), Math.round(t.y), t.col, { align: 'center', outline: '#1a1020' });
  }
}

// ================= Toki =================
function tokiBox() { return [toki.x - 8, toki.y - 14, toki.x + 10, toki.y]; }
function hitToki(x0, y0, x1, y1) {
  const [a0, b0, a1, b1] = tokiBox();
  return a1 > x0 && a0 < x1 && b1 > y0 && b0 < y1;
}

function updateToki(dt, control) {
  const T = toki;
  T.invuln = Math.max(0, T.invuln - dt);
  T.wetT = Math.max(0, T.wetT - dt);
  T.barkT = Math.max(0, T.barkT - dt);
  T.barkCd = Math.max(0, T.barkCd - dt);
  if (T.umbrella > 0) {
    T.umbrella -= dt;
    if (T.umbrella <= 0) floatText(T.x, T.y - 30, 'SIN PARAGUAS', '#ffd0a0');
  }

  // avance y paredes
  let nx = T.x + Game.speed * dt;
  for (const p of L.plats) {
    if (T.y > p.top + 2 && T.x + 9 <= p.x + 1 && nx + 9 > p.x) nx = p.x - 9;
  }
  T.x = nx;

  // salto
  T.buffer -= dt;
  T.coyote -= dt;
  if (control && Input.jumpPressed) T.buffer = 0.13;
  if (T.buffer > 0) {
    if (T.onGround || T.coyote > 0) {
      T.vy = -JUMP_V; T.onGround = false; T.coyote = 0; T.jumps = 1; T.buffer = 0;
      Sound.sfx('jump');
      for (let i = 0; i < 5; i++) spawn(T.x - 4, T.y - 1, rand(-40, 10), rand(-20, 0), 0.3, '#d8c8a8', { kind: 'dust', size: 3 });
    } else if (T.jumps < 2) {
      T.vy = -DJUMP_V; T.jumps = 2; T.buffer = 0;
      Sound.sfx('djump');
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; spawn(T.x, T.y - 4, Math.cos(a) * 50, Math.sin(a) * 25, 0.3, '#ffffff', { kind: 'star' }); }
    }
  }
  if (!(control && Input.jumpHeld) && T.vy < -110) T.vy = -110;

  // ladrido
  if (control && Input.barkPressed && T.barkCd <= 0) bark();
  if (T.barkT > 0.12) {
    for (const o of L.objects) {
      if (o.type === 'animal' && o.state === 'idle') {
        const dx = o.x - T.x;
        if (dx > -16 && dx < 100 && Math.abs(o.y - T.y) < 70) scareAnimal(o, 'bark');
      }
    }
  }

  // gravedad y aterrizaje
  T.vy = Math.min(420, T.vy + GRAV * dt);
  const prevY = T.y;
  T.y += T.vy * dt;
  let landed = false;
  if (T.vy >= 0) {
    for (const p of L.plats) {
      if (T.x + 7 > p.x && T.x - 7 < p.x + p.w && prevY <= p.top + 1 && T.y >= p.top) {
        T.y = p.top; landed = true; break;
      }
    }
    if (!landed && T.y >= GROUND && prevY <= GROUND + 4 && !overGap(T.x)) { T.y = GROUND; landed = true; }
  }
  if (landed) {
    if (!T.onGround && T.vy > 160) {
      Sound.sfx('land');
      for (let i = 0; i < 4; i++) spawn(T.x + rand(-6, 6), T.y - 1, rand(-30, 30), rand(-20, -5), 0.3, '#d8c8a8', { kind: 'dust', size: 3 });
    }
    T.vy = 0; T.onGround = true; T.jumps = 0;
  } else {
    if (T.onGround) T.coyote = 0.09;
    T.onGround = false;
  }

  // caída al arroyo
  const g = overGap(T.x);
  if (g && T.y > GROUND + 10) {
    splash(T.x, GROUND + 6, 22);
    Sound.sfx('splash');
    damage(true);
    T.x = g.x1 + 12; T.y = GROUND - 20; T.vy = -220; T.jumps = 1; T.onGround = false;
  }

  // animación y polvo
  T.anim += dt * Game.speed / 9;
  if (T.onGround) {
    T.dustT -= dt;
    if (T.dustT <= 0) {
      T.dustT = 0.12;
      spawn(T.x - 7, T.y - 1, rand(-30, -10), rand(-12, -4), 0.35, L.theme === 'sierras' ? '#c89a6a' : '#d0ccc4', { kind: 'dust', size: 3 });
    }
  }
  if (T.wetT > 0 && Math.random() < 0.3) spawn(T.x + rand(-6, 8), T.y - rand(4, 14), 0, 20, 0.4, '#8cc8f4', { g: 300, kind: 'drop' });
}

function bark() {
  const T = toki;
  T.barkT = 0.32; T.barkCd = 0.4;
  Sound.sfx('bark');
  floatText(T.x + 18, T.y - 30, choice(['¡GUAU!', '¡GUAU!', '¡WOF!']), '#ffffff', 0.55);
}

function damage(fromGap) {
  const T = toki;
  if (L.finished) return;
  if (T.invuln > 0 && !fromGap) return;
  if (T.umbrella > 0) {
    Sound.sfx('umbrella');
    if (!fromGap) floatText(T.x, T.y - 32, '¡PARAGUAS!', '#f8d040', 0.6);
    T.invuln = Math.max(T.invuln, 0.5);
    return;
  }
  if (T.invuln > 0) return;
  Game.hearts--;
  L.damage = true;
  T.invuln = 1.7; T.wetT = 1.4;
  Game.shake = 0.35;
  Sound.sfx('splash'); Sound.sfx('hurt');
  splash(T.x, T.y - 8, 16);
  floatText(T.x, T.y - 30, choice(['¡PUAJ!', '¡AGUA NO!', '¡BRRR!', '¡QUÉ ASCO!', '¡NOOO!']), '#8cc8f4', 1);
  if (Game.hearts <= 0) gameOver();
}

function scareAnimal(o, how) {
  if (o.state !== 'idle') return;
  o.state = o.flying ? 'flee' : 'alert';
  o.t = 0;
  if (o.flying) startFlee(o);
  Game.combo = Game.comboT > 0 ? Math.min(5, Game.combo + 1) : 1;
  Game.comboT = 2.5;
  const pts = 50 * Game.combo;
  Game.score += pts;
  L.animals++;
  floatText(o.x, o.y - 22, Game.combo > 1 ? '+' + pts + ' X' + Game.combo : '+' + pts, '#ffe070');
  if (o.kind === 'cat') Sound.sfx('cat');
  else if (o.kind === 'liebre') Sound.sfx('hare');
  else Sound.sfx('bird');
  if (o.kind !== 'cat' && o.kind !== 'liebre') {
    const col = { hornero: '#b07040', paloma: '#b0b4c4', cotorra: '#5cb848' }[o.kind];
    for (let i = 0; i < 5; i++) spawn(o.x, o.y - 5, rand(-40, 40), rand(-50, 0), 0.8, col, { g: 60, kind: 'feather' });
  }
}

function startFlee(o) {
  if (o.kind === 'cat') { o.vx = Game.speed + 110; o.vy = -170; o.groundY = GROUND; }
  else if (o.kind === 'liebre') { o.vx = Game.speed + 130; o.vy = -160; o.groundY = GROUND; }
  else { o.vx = Game.speed * 0.5 + rand(20, 50); o.vy = -50; }
}

function collectSoga(o) {
  o.dead = true;
  Game.sogas++; L.sogas++;
  Game.score += 10;
  Sound.sfx('soga');
  sparkle(o.x, o.y);
  if (Game.sogas % SOGAS_PER_LIFE === 0) {
    if (Game.hearts < MAX_HEARTS) { Game.hearts++; floatText(toki.x, toki.y - 34, '¡+1 VIDA!', '#ff8090', 1.2); Sound.sfx('heart'); }
    else { Game.score += 500; floatText(toki.x, toki.y - 34, '+500', '#ffe070', 1.2); }
  }
}

// ================= Actualización de objetos =================
const UPD = {
  soga(o, dt) {
    o.t += dt;
    if (Math.abs(o.x - (toki.x + 2)) < 12 && o.y > toki.y - 22 && o.y < toki.y + 5) collectSoga(o);
  },
  power(o, dt) {
    o.t += dt;
    if (Math.abs(o.x - (toki.x + 2)) < 14 && o.y > toki.y - 26 && o.y < toki.y + 8) {
      o.dead = true;
      sparkle(o.x, o.y, 12, '#ffd040');
      if (o.kind === 'umbrella') {
        toki.umbrella = 9;
        Sound.sfx('power');
        floatText(toki.x, toki.y - 34, '¡PARAGUAS!', '#f8d040', 1.2);
      } else {
        Sound.sfx('heart');
        if (Game.hearts < MAX_HEARTS) { Game.hearts++; floatText(toki.x, toki.y - 34, '¡HUESO! +1 VIDA', '#ff8090', 1.2); }
        else { Game.score += 300; floatText(toki.x, toki.y - 34, '+300', '#ffe070', 1.2); }
      }
    }
  },
  puddle(o) {
    if (toki.y > GROUND - 3 && hitToki(o.x + 3, GROUND - 3, o.x + o.w - 3, GROUND + 2)) {
      if (toki.invuln <= 0 && toki.umbrella <= 0) splash(toki.x, GROUND - 2, 10);
      damage();
    }
  },
  tub(o, dt) {
    o.t += dt;
    if (Math.random() < dt * 3) spawn(o.x + rand(6, 20), GROUND - 16, rand(-5, 5), -15, 0.8, '#ffffff', { kind: 'bubble' });
    if (hitToki(o.x + 3, GROUND - 13, o.x + 25, GROUND)) damage();
  },
  cloud(o, dt) {
    o.x += Game.speed * o.k * dt;
    if (o.x < camX + W - 20) o.active = true;
    if (!o.active) return;
    o.t += dt;
    const cyc = o.t % 3.2;
    o.phase = cyc < 1.3 ? 'idle' : cyc < 1.8 ? 'warn' : 'rain';
    const rx0 = o.x + 6, rx1 = o.x + 36;
    if (o.phase === 'warn' && Math.random() < 0.35) spawn(rand(rx0, rx1), o.y + 16, 0, 200, 1, '#b8e0ff', { kind: 'rain', floor: true });
    if (o.phase === 'rain') {
      for (let i = 0; i < 2; i++) spawn(rand(rx0, rx1), o.y + 16, -8, 240, 1, i ? '#8cc8f4' : '#dff2ff', { kind: 'rain', floor: true });
      if (hitToki(rx0 + 2, o.y + 16, rx1 - 2, GROUND)) damage();
    }
  },
  sprinkler(o, dt) {
    o.t += dt;
    const cyc = o.t % 2.6;
    o.on = cyc > 1.3;
    if (cyc > 1.0 && cyc < 1.3 && Math.random() < 0.3) spawn(o.x, GROUND - 7, rand(-10, 10), -40, 0.3, '#8cc8f4', { g: 300, kind: 'drop' });
    if (o.on) {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + rand(-1.1, 1.1);
        const s = rand(70, 100);
        spawn(o.x, GROUND - 7, Math.cos(a) * s * 0.5, Math.sin(a) * s, 0.55, i ? '#8cc8f4' : '#ffffff', { g: 320, kind: 'drop', floor: true });
      }
      if (hitToki(o.x - 12, GROUND - 26, o.x + 12, GROUND)) damage();
    }
  },
  fountain(o, dt) {
    o.t += dt;
    o.jetH = Math.round(6 + 30 * Math.max(0, Math.sin(o.t * 2.1)));
    const cx = o.x + o.w / 2;
    if (Math.random() < 0.6) spawn(cx + rand(-2, 2), GROUND - 14 - o.jetH, rand(-40, 40), rand(-30, 0), 0.5, '#bfe4ff', { g: 300, kind: 'drop' });
    if (hitToki(o.x + 3, GROUND - 7, o.x + o.w - 3, GROUND) || hitToki(cx - 3, GROUND - 14 - o.jetH, cx + 3, GROUND - 8)) damage();
  },
  animal(o, dt) {
    o.t += dt;
    if (o.state === 'idle') {
      if (o.flying) { o.x += o.vx * dt; o.y = o.baseY + Math.sin(o.t * 3) * 3; }
      if (hitToki(o.x - 8, o.y - 12, o.x + 8, o.y)) scareAnimal(o, 'chase');
    } else if (o.state === 'alert') {
      if (o.t > 0.22) { o.state = 'flee'; o.t = 0; startFlee(o); }
    } else {
      if (o.kind === 'cat' || o.kind === 'liebre') {
        o.vy += GRAV * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        if (o.y >= o.groundY) { o.y = o.groundY; o.vy = o.kind === 'liebre' ? -150 : -60; }
      } else {
        o.vy -= 70 * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
      }
      if (o.x > camX + W + 40 || o.y < -30) o.dead = true;
    }
  },
};

// ================= Mundo =================
function updateWorld(dt, control) {
  const prog = clamp(toki.x / L.length, 0, 1);
  Game.speed = (L.def.speed + (L.def.speedMax - L.def.speed) * prog) * (1 + 0.12 * L.loop);
  if (Game.comboT > 0) { Game.comboT -= dt; if (Game.comboT <= 0) Game.combo = 0; }
  updateToki(dt, control);
  camX = toki.x - TOKI_SX;
  generate();
  for (const o of L.objects) { const f = UPD[o.type]; if (f) f(o, dt); }
  L.objects = L.objects.filter((o) => !o.dead && o.x + (o.w || 30) > camX - 100);
  L.plats = L.plats.filter((p) => p.x + p.w > camX - 100);
  L.gaps = L.gaps.filter((g) => g.x1 > camX - 100);
  updateParticles(dt);
  Game.shake = Math.max(0, Game.shake - dt);

  if (!L.finished && toki.x >= L.length + 16) levelComplete();
}

function levelComplete() {
  L.finished = true;
  L.bonus = L.damage ? 0 : 500;
  Game.score += L.bonus;
  saveHigh();
  Sound.stop();
  Sound.sfx('levelDone');
  setState('levelDone');
}

function gameOver() {
  saveHigh();
  Sound.stop();
  Sound.sfx('gameover');
  setState('gameover');
}

// ================= Dibujo =================
function drawLayerImg(img, f, cx, y = 0) {
  const w = img.width;
  const ox = -Math.round((((cx * f) % w) + w) % w);
  for (let x = ox; x < W; x += w) ctx.drawImage(img, x, y);
}

function drawBG(theme, cx, t) {
  const B = ART.bg[theme];
  ctx.drawImage(B.sky, 0, 0);
  for (const l of B.layers) drawLayerImg(l.img, l.f, cx + (l.drift ? (t * l.drift) / l.f : 0));
}

function drawGround(theme, cx, gaps) {
  const vis = gaps.filter((g) => g.x1 > cx && g.x0 < cx + W);
  ctx.save();
  if (vis.length) {
    ctx.beginPath();
    let start = 0;
    for (const g of vis) {
      const a = Math.round(g.x0 - cx);
      if (a > start) ctx.rect(start, GROUND - 2, a - start, H);
      start = Math.max(start, Math.round(g.x1 - cx));
    }
    if (start < W) ctx.rect(start, GROUND - 2, W - start, H);
    ctx.clip();
  }
  drawLayerImg(ART.bg[theme].ground, 1, cx, GROUND - 2);
  ctx.restore();
}

const DRAW = {
  deco(o, cx) {
    const img = DECO_IMG[o.kind];
    ctx.drawImage(img, Math.round(o.x - cx - img.width / 2), GROUND + 1 - img.height);
  },
  gap(o, cx) {
    const x = Math.round(o.x - cx), w = o.w;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, GROUND - 2, w, H); ctx.clip();
    ctx.fillStyle = '#4a2c18'; ctx.fillRect(x, GROUND - 2, w, 8);
    ctx.fillStyle = '#2e6aa8'; ctx.fillRect(x, GROUND + 6, w, H);
    ctx.fillStyle = '#3f86c8'; ctx.fillRect(x, GROUND + 6, w, 3);
    ctx.fillStyle = '#285c94';
    for (let y = GROUND + 12; y < H; y += 4) ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = '#9ad2f6';
    const off = Math.floor(Game.t * 12);
    for (let i = -6; i < w + 6; i += 7) {
      ctx.fillRect(x + i + (off % 7), GROUND + 6 + ((i / 7 + Math.floor(Game.t * 3)) & 1), 3, 1);
      ctx.fillRect(x + i + ((off + 3) % 7), GROUND + 14, 2, 1);
    }
    ctx.fillStyle = '#6e4228'; ctx.fillRect(x, GROUND - 2, 2, 12); ctx.fillRect(x + w - 2, GROUND - 2, 2, 12);
    ctx.restore();
    ctx.drawImage(ART.stone, x - 8, GROUND + 3);
    ctx.drawImage(ART.stone, x + w - 8, GROUND + 4);
  },
  puddle(o, cx) {
    const x = Math.round(o.x - cx), w = o.w, y = GROUND;
    ctx.fillStyle = '#23487e'; ctx.fillRect(x + 2, y - 1, w - 4, 1); ctx.fillRect(x, y, w, 3); ctx.fillRect(x + 2, y + 3, w - 4, 1);
    ctx.fillStyle = '#3f7fd0'; ctx.fillRect(x + 2, y, w - 4, 3);
    ctx.fillStyle = '#8cc8f4'; ctx.fillRect(x + 4, y, w - 12, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3 + Math.floor((Game.t * 14 + o.x) % Math.max(1, w - 8)), y + 1, 2, 1);
  },
  plat(o, cx) { ctx.drawImage(platImage(o.kind, o.w, o.drawH), Math.round(o.x - cx) - 1, o.top - 1); },
  tub(o, cx) { ctx.drawImage(ART.tub, Math.round(o.x - cx), GROUND - 18); },
  sprinkler(o, cx) { ctx.drawImage(ART.sprinkler, Math.round(o.x - cx) - 5, GROUND - 7); },
  fountain(o, cx) {
    const x = Math.round(o.x - cx), w = o.w, y = GROUND;
    const mid = x + Math.floor(w / 2);
    ctx.fillStyle = '#8cc8f4'; ctx.fillRect(mid - 2, y - 14 - o.jetH, 4, o.jetH + 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(mid - 1, y - 14 - o.jetH, 1, o.jetH + 4);
    ctx.fillStyle = '#20141a'; ctx.fillRect(mid - 3, y - 15, 6, 8);
    ctx.fillStyle = '#b8b0a4'; ctx.fillRect(mid - 2, y - 14, 4, 7);
    ctx.fillStyle = '#20141a'; ctx.fillRect(x - 1, y - 10, w + 2, 11);
    ctx.fillStyle = '#c8c0b4'; ctx.fillRect(x, y - 9, w, 9);
    ctx.fillStyle = '#e4dcd0'; ctx.fillRect(x, y - 9, w, 1);
    ctx.fillStyle = '#9a9288'; ctx.fillRect(x, y - 2, w, 2);
    for (let i = 6; i < w; i += 8) ctx.fillRect(x + i, y - 8, 1, 6);
    ctx.fillStyle = '#3f7fd0'; ctx.fillRect(x + 2, y - 8, w - 4, 2);
    ctx.fillStyle = '#9ad2f6'; ctx.fillRect(x + 3 + Math.floor((Game.t * 10) % (w - 8)), y - 8, 3, 1);
  },
  finish(o, cx) {
    const img = o.kind === 'sierras' ? DECO_IMG.signEnd : DECO_IMG.home;
    ctx.drawImage(img, Math.round(o.x - cx) - 10, GROUND + 1 - img.height);
  },
  soga(o, cx) {
    const w = Math.max(2, Math.round(12 * Math.abs(Math.cos(o.t * 3))));
    const y = Math.round(o.y + Math.sin(o.t * 4) * 1.5);
    ctx.drawImage(ART.soga, Math.round(o.x - cx - w / 2), y - 6, w, 12);
  },
  power(o, cx) {
    const img = o.kind === 'umbrella' ? ART.umbrella : ART.bone;
    const x = Math.round(o.x - cx), y = Math.round(o.y + Math.sin(o.t * 3) * 3);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const a = o.t * 2 + (i * Math.PI) / 3;
      if ((i + Math.floor(o.t * 6)) % 2) ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(y + Math.sin(a) * 12), 1, 1);
    }
    ctx.drawImage(img, x - (img.width >> 1), y - (img.height >> 1));
  },
  animal(o, cx) {
    const x = Math.round(o.x - cx), y = Math.round(o.y);
    let img, ax, ay;
    if (o.kind === 'cat') {
      const c = ART.cats[o.pal];
      if (o.state === 'flee') { img = c.run[Math.floor(o.t * 12) % 2]; ax = 11; ay = 12; }
      else { img = c.sit[Math.floor(o.t * 1.5) % 2]; ax = 9; ay = 13; }
    } else if (o.kind === 'liebre') {
      if (o.state === 'flee') { img = ART.hare.run[o.y < GROUND - 4 ? 0 : 1]; ax = 11; ay = 12; }
      else { img = ART.hare.sit[Math.floor(o.t) % 3 === 0 ? 1 : 0]; ax = 9; ay = 15; }
    } else {
      const b = ART.birds[o.kind];
      if (o.state === 'flee') { img = b.fly[Math.floor(o.t * 14) % 2]; ax = 7; ay = 6; }
      else if (o.flying) { img = flipH0(b.fly[Math.floor(o.t * 8) % 2]); ax = 7; ay = 6; }
      else { img = b.sit[Math.floor(o.t * 2) % 3 === 0 ? 1 : 0]; ax = 6; ay = 10; }
    }
    ctx.drawImage(img, x - ax, y - ay);
    if (o.state === 'alert' || (o.state === 'flee' && o.t < 0.3)) drawText('!', x, y - ay - 9, '#ff4050', { outline: '#1a1020', align: 'center' });
  },
};

const flipCache = new Map();
function flipH0(img) {
  if (!flipCache.has(img)) flipCache.set(img, flipH(img));
  return flipCache.get(img);
}

function tokiFrame() {
  const T = toki, S = ART.toki;
  const bark = T.barkT > 0, wet = T.wetT > 0;
  if (Game.state === 'levelIntro') return bark ? S.idleBark : S.idle[Math.floor(Game.t * 4) % 2];
  if (!T.onGround) {
    if (T.vy < 0) return bark ? S.jumpBark : wet ? S.wetJump : S.jump;
    return bark ? S.fallBark : wet ? S.wetFall : S.fall;
  }
  const f = Math.floor(T.anim) % 4;
  return bark ? S.runBark[f] : wet ? S.wetRun[f] : S.run[f];
}

function drawToki(cx) {
  const T = toki;
  const x = Math.round(T.x - cx), y = Math.round(T.y);
  if (T.barkT > 0) {
    ctx.fillStyle = '#ffffff';
    const k = 0.32 - T.barkT;
    for (let r = 0; r < 3; r++) {
      const rad = 5 + r * 5 + k * 40;
      for (let a = -0.7; a <= 0.7; a += 0.12) ctx.fillRect(Math.round(x + 14 + Math.cos(a) * rad), Math.round(y - 16 + Math.sin(a) * rad), 1, 1);
    }
  }
  const blink = T.invuln > 0 && Math.floor(T.invuln * 14) % 2 === 0;
  if (!blink) ctx.drawImage(tokiFrame(), x - 14, y - 21);
  if (T.umbrella > 0 && (T.umbrella > 2 || Math.floor(T.umbrella * 8) % 2)) {
    ctx.drawImage(ART.umbrella, x - 4, y - 36 + Math.round(Math.sin(Game.t * 6)));
  }
}

function drawWorld() {
  const sx = Game.shake > 0 ? Math.round(rand(-2, 2)) : 0;
  const sy = Game.shake > 0 ? Math.round(rand(-2, 2)) : 0;
  const cx = Math.round(camX);
  ctx.save();
  ctx.translate(sx, sy);
  drawBG(L.theme, cx, Game.t);
  const obj = L.objects;
  for (const o of obj) if (o.type === 'deco') DRAW.deco(o, cx);
  drawGround(L.theme, cx, L.gaps);
  for (const o of obj) if (o.type === 'gap' || o.type === 'puddle' || o.type === 'finish') DRAW[o.type](o, cx);
  for (const o of obj) if (o.type === 'plat' || o.type === 'tub' || o.type === 'sprinkler' || o.type === 'fountain') DRAW[o.type](o, cx);
  for (const o of obj) if (o.type === 'soga' || o.type === 'power') DRAW[o.type](o, cx);
  for (const o of obj) if (o.type === 'animal') DRAW.animal(o, cx);
  drawToki(cx);
  for (const o of obj) {
    if (o.type === 'cloud') ctx.drawImage(o.phase === 'rain' || o.phase === 'warn' ? ART.cloudRain : ART.cloud, Math.round(o.x - cx), o.y);
  }
  drawParticles(cx);
  drawTexts(cx);
  ctx.restore();
}

// ================= HUD =================
function hudButtons() {
  return {
    pause: { x: W - 16, y: 3, w: 13, h: 13 },
    sound: { x: W - 32, y: 3, w: 13, h: 13 },
  };
}
function inRect(p, r) { return p.x >= r.x - 3 && p.x <= r.x + r.w + 3 && p.y >= r.y - 3 && p.y <= r.y + r.h + 3; }

function drawButtonFrame(r) {
  ctx.fillStyle = '#1a1020'; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#f0e0c0'; ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.fillStyle = '#3a2a5a'; ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
}

function drawSoundButton(r) {
  drawButtonFrame(r);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(r.x + 3, r.y + 5, 2, 3); ctx.fillRect(r.x + 5, r.y + 4, 1, 5); ctx.fillRect(r.x + 6, r.y + 3, 1, 7);
  if (Sound.muted) {
    ctx.fillStyle = '#ff5060';
    for (let i = 0; i < 3; i++) { ctx.fillRect(r.x + 8 + i, r.y + 5 + i, 1, 1); ctx.fillRect(r.x + 10 - i, r.y + 5 + i, 1, 1); }
  } else {
    ctx.fillRect(r.x + 8, r.y + 5, 1, 3); ctx.fillRect(r.x + 10, r.y + 4, 1, 5);
  }
}

function drawHUD() {
  const n = Math.max(3, Game.hearts);
  for (let i = 0; i < n; i++) ctx.drawImage(i < Game.hearts ? ART.heart : ART.heartEmpty, 3 + i * 9, 3);
  ctx.drawImage(ART.soga, 3, 12);
  drawText('X' + Game.sogas, 16, 15, '#fff4d8', { outline: '#1a1020' });

  drawText(String(Game.score).padStart(6, '0'), W / 2, 4, '#ffe070', { align: 'center', outline: '#1a1020' });
  const prog = clamp(toki.x / L.length, 0, 1);
  const bw = 70, bx = Math.round(W / 2 - bw / 2), by = 14;
  ctx.fillStyle = '#1a1020'; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
  ctx.fillStyle = '#4a3a5a'; ctx.fillRect(bx, by, bw, 3);
  ctx.fillStyle = '#f0a040'; ctx.fillRect(bx, by, Math.round(bw * prog), 3);
  const px = bx + Math.round(bw * prog);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(px - 3, by - 3, 6, 9);
  ctx.fillStyle = TK.B; ctx.fillRect(px - 2, by - 2, 4, 7);
  ctx.fillStyle = TK.W; ctx.fillRect(px - 1, by - 2, 1, 3);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + bw + 3, by - 4, 1, 8);
  ctx.fillStyle = '#ff5060'; ctx.fillRect(bx + bw + 4, by - 4, 4, 3);

  if (toki.umbrella > 0) {
    ctx.drawImage(ART.umbrella, 3, 24);
    ctx.fillStyle = '#1a1020'; ctx.fillRect(20, 30, 32, 4);
    ctx.fillStyle = '#f8d040'; ctx.fillRect(21, 31, Math.round(30 * toki.umbrella / 9), 2);
  }
  if (Game.combo > 1 && Game.comboT > 0) {
    drawText('COMBO X' + Game.combo, W / 2, 22, '#ff9ad0', { align: 'center', outline: '#1a1020' });
  }

  const b = hudButtons();
  drawButtonFrame(b.pause);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(b.pause.x + 4, b.pause.y + 3, 2, 7); ctx.fillRect(b.pause.x + 7, b.pause.y + 3, 2, 7);
  drawSoundButton(b.sound);

  if (IS_TOUCH && Game.state === 'play') {
    ctx.globalAlpha = Input.barkFlash > 0 ? 0.7 : 0.32;
    ctx.drawImage(ART.btnBark, 6, H - 40);
    ctx.globalAlpha = Input.jumpHeld ? 0.7 : 0.32;
    ctx.drawImage(ART.btnJump, W - 40, H - 40);
    ctx.globalAlpha = 1;
  }
}

// ================= Carteles y meta =================
function woodSign(lines) {
  const tw = Math.max(...lines.map((l) => textWidth(l))) + 8, th = lines.length * 9 + 4;
  const w = tw + 2, h = th + 22;
  const c = sprite(w, h, (P) => {
    P.r(4, th, 2, 21, '#6a4428'); P.r(w - 7, th, 2, 21, '#6a4428');
    P.r(1, 1, tw, th, '#a8703e'); P.r(1, 1, tw, 1, '#c88a52');
    for (let y = 4; y < th; y += 4) P.r(1, y, tw, 1, '#94602e');
    P.r(1, th, tw, 1, '#6a4428');
  }, '#2a1a0e');
  const g = c.getContext('2d');
  lines.forEach((l, i) => drawText(l, Math.floor(w / 2), 4 + i * 9, '#fff4d8', { align: 'center', ctx: g, shadow: '#5a3418' }));
  return c;
}

function buildGameArt() {
  Object.assign(DECO_IMG, {
    espinillo: ART.espinillo, palm: ART.palm, cardon: ART.cardon, pasto: ART.pasto, stone: ART.stone,
    lamp: ART.lamp, lapacho: ART.lapacho, tree: ART.tree, bush: ART.bush,
  });
  DECO_IMG.signSierras = woodSign(['SIERRAS DE', 'CÓRDOBA']);
  DECO_IMG.signEnd = woodSign(['BARRIO', 'DOCTA >']);

  const sd = sprite(56, 34, (P) => {
    P.r(2, 2, 52, 22, '#5a5e66'); P.r(2, 2, 52, 1, '#7a7e86'); P.r(2, 23, 52, 1, '#44474e');
    P.r(4, 24, 48, 9, '#9a948a'); P.r(4, 24, 48, 1, '#b4aea4');
    P.e(8, 31, 6, 3, '#3a7a36'); P.e(48, 31, 6, 3, '#3a7a36'); P.e(28, 32, 8, 2, '#4f9a44');
    P.p(7, 29, '#f0e060'); P.p(47, 30, '#f070a0'); P.p(30, 31, '#f0e060');
  }, '#16181c');
  drawText('BARRIO', 28, 6, '#ffffff', { align: 'center', ctx: sd.getContext('2d') });
  drawText('DOCTA', 28, 15, '#9ad26a', { align: 'center', ctx: sd.getContext('2d') });
  DECO_IMG.signDocta = sd;

  const home = sprite(124, 68, (P) => {
    P.r(62, 6, 7, 14, '#9a4232'); P.r(61, 5, 9, 2, '#6a2a20');
    for (let i = 0; i < 17; i++) {
      const hw = Math.round(3 + i * 2.5);
      P.r(42 - hw, 8 + i, hw * 2, 1, i % 2 ? '#a84a30' : '#c05a3a');
    }
    P.r(6, 25, 72, 40, '#f4ecdc'); P.r(6, 25, 72, 2, '#d8ccb8'); P.r(6, 61, 72, 4, '#b8ae9e');
    const win = (x, y) => {
      P.r(x - 1, y - 1, 18, 16, '#ffffff'); P.r(x, y, 16, 14, '#2e3e52');
      for (let i = 0; i < 6; i++) { P.p(x + 3 + i, y + 8 - i, '#7aa0c8'); P.p(x + 9 + i, y + 12 - i, '#7aa0c8'); }
      P.r(x + 7, y, 2, 14, '#ffffff'); P.r(x - 2, y + 14, 20, 2, '#c05a3a');
    };
    win(12, 33); win(58, 33);
    P.r(34, 39, 16, 26, '#8a3a2a'); P.r(35, 40, 14, 24, '#a24a34'); P.p(46, 52, '#f0d060');
    P.r(38, 43, 8, 6, '#8a3a2a');
    P.e(81, 61, 4, 1.5, '#4a7ad0'); P.r(79, 59, 5, 1, '#f6eedc');
    P.r(90, 50, 26, 15, '#c0503a'); P.r(90, 50, 26, 1, '#d8684c');
    for (let i = 0; i < 12; i++) { const hw = Math.round(2 + i * 1.3); P.r(103 - hw, 38 + i, hw * 2, 1, '#7a2a1e'); }
    P.e(103, 57, 5, 4, '#2a1410'); P.r(98, 57, 11, 8, '#2a1410');
    P.r(92, 41, 23, 9, '#f4e8c8');
  }, '#22140e');
  drawText('TOKI', 104, 42, '#8a2e22', { align: 'center', ctx: home.getContext('2d') });
  DECO_IMG.home = home;
}

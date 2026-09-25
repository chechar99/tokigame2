'use strict';

const ART = {};
const OUT = '#22140e';

// ================= TOKI =================
const TK = {
  B: '#c77a3e', D: '#8e4a22', L: '#e3a462', W: '#f7f2e8', G: '#d4c8b6',
  N: '#3e201a', E: '#140a06', T: '#ee6f7e', M: '#5a1c1c',
};

function tokiLeg(P, xTop, leg, col, isBack, by) {
  const [dx, lift] = leg;
  const y0 = 13 + by, y1 = 18 - lift;
  const len = Math.max(1, y1 - y0);
  for (let i = 0; i <= len; i++) {
    const x = Math.round(xTop + (dx * i) / len);
    let c = col;
    if (isBack && i < 2) c = col === TK.W ? TK.B : TK.D;
    P.r(x, y0 + i, 2, 1, c);
  }
}

function buildToki(o) {
  return sprite(28, 22, (P) => {
    const b = o.bob || 0;
    tokiLeg(P, 9, o.legs[1], TK.G, true, b);
    tokiLeg(P, 17, o.legs[3], TK.G, false, b);
    // cola
    const t = o.tail;
    if (t === 0) { P.r(5, 7 + b, 3, 2, TK.B); P.r(3, 5 + b, 3, 3, TK.B); P.r(2, 3 + b, 2, 3, TK.B); P.r(1, 2 + b, 2, 2, TK.W); P.p(4, 5 + b, TK.L); }
    else if (t === 1) { P.r(5, 8 + b, 3, 2, TK.B); P.r(2, 6 + b, 4, 3, TK.B); P.r(1, 5 + b, 2, 2, TK.W); P.p(3, 6 + b, TK.L); }
    else if (t === 2) { P.r(5, 8 + b, 3, 2, TK.B); P.r(3, 7 + b, 3, 2, TK.B); P.r(1, 7 + b, 2, 2, TK.W); }
    else { P.r(6, 10 + b, 2, 3, TK.B); P.r(5, 12 + b, 2, 2, TK.W); }
    // cuerpo
    P.r(8, 8 + b, 11, 6, TK.B); P.r(7, 9 + b, 1, 4, TK.B); P.r(9, 7 + b, 8, 1, TK.B);
    P.r(10, 7 + b, 5, 1, TK.L); P.r(9, 8 + b, 3, 1, TK.L);
    P.r(9, 13 + b, 5, 1, TK.D); P.p(11, 10 + b, TK.D); P.p(12, 11 + b, TK.D); P.p(12, 12 + b, TK.D);
    // pecho blanco
    P.r(14, 11 + b, 3, 3, TK.W); P.r(16, 9 + b, 4, 5, TK.W); P.r(15, 13 + b, 4, 1, TK.G);
    // cuello
    P.r(18, 5 + b, 2, 4, TK.B); P.r(19, 6 + b, 3, 5, TK.W);
    // cabeza
    P.r(18, 2 + b, 6, 5, TK.B); P.r(19, 1 + b, 4, 1, TK.B);
    if (o.mouth) {
      P.r(23, 4 + b, 3, 2, TK.W); P.r(23, 6 + b, 3, 1, TK.M); P.p(24, 6 + b, TK.T); P.r(22, 7 + b, 3, 1, TK.W);
    } else {
      P.r(23, 4 + b, 3, 3, TK.W); P.r(23, 6 + b, 2, 1, TK.G);
    }
    P.r(26, 4 + b, 1, 2, TK.N);
    P.r(20, 6 + b, 3, 2, TK.W);
    P.p(21, 1 + b, TK.W); P.p(22, 2 + b, TK.W); P.p(23, 3 + b, TK.W);
    if (o.eye === 'closed') P.r(20, 4 + b, 2, 1, TK.E);
    else if (o.eye === 'wide') { P.r(20, 3 + b, 2, 2, '#ffffff'); P.p(21, 4 + b, TK.E); }
    else { P.p(21, 4 + b, TK.E); P.p(21, 3 + b, TK.D); }
    if (o.pant) { P.p(24, 7 + b, TK.T); P.p(24, 8 + b, TK.T); }
    // oreja
    const e = o.ear || 0;
    if (e === 0) { P.r(17, 2 + b, 2, 4, TK.D); P.p(18, 1 + b, TK.D); }
    else if (e === 1) { P.r(16, 2 + b, 3, 2, TK.D); P.p(15, 3 + b, TK.D); }
    else if (e === 2) { P.r(17, 0 + b, 2, 3, TK.D); P.p(16, 0 + b, TK.D); }
    else { P.r(18, 3 + b, 2, 5, TK.D); }
    // patas cercanas
    tokiLeg(P, 7, o.legs[0], TK.W, true, b);
    tokiLeg(P, 15, o.legs[2], TK.W, false, b);
  }, OUT, 0, 2);
}

function buildTokiSet() {
  const RUN = [
    { legs: [[-3, 0], [-2, 1], [3, 1], [2, 0]], bob: 0, tail: 2, ear: 1 },
    { legs: [[-1, 1], [0, 0], [1, 0], [0, 1]], bob: 0, tail: 1, ear: 0 },
    { legs: [[2, 2], [3, 1], [-2, 2], [-1, 1]], bob: -1, tail: 2, ear: 1 },
    { legs: [[0, 0], [1, 1], [0, 1], [-1, 0]], bob: 0, tail: 1, ear: 0 },
  ];
  const JUMP = { legs: [[-3, 1], [-2, 2], [3, 2], [4, 3]], bob: -1, tail: 0, ear: 2 };
  const FALL = { legs: [[-1, 0], [0, 0], [2, 0], [1, 0]], bob: 0, tail: 0, ear: 2 };
  const IDLE = [
    { legs: [[-1, 0], [0, 0], [0, 0], [1, 0]], tail: 0, ear: 0, pant: true },
    { legs: [[-1, 0], [0, 0], [0, 0], [1, 0]], tail: 1, ear: 0, pant: true },
  ];
  const set = {
    run: RUN.map((f) => buildToki(f)),
    runBark: RUN.map((f) => buildToki({ ...f, mouth: true })),
    jump: buildToki(JUMP), jumpBark: buildToki({ ...JUMP, mouth: true }),
    fall: buildToki(FALL), fallBark: buildToki({ ...FALL, mouth: true }),
    idle: IDLE.map((f) => buildToki(f)),
    idleBark: buildToki({ ...IDLE[0], pant: false, mouth: true, ear: 1 }),
    wet: buildToki({ legs: [[0, 0], [0, 0], [0, 0], [0, 0]], tail: 3, ear: 3, eye: 'closed' }),
    scared: buildToki({ legs: [[-2, 0], [-1, 0], [2, 0], [1, 0]], tail: 3, ear: 2, eye: 'wide', bob: -1 }),
  };
  set.wetRun = set.run.map((c) => tint(c, '#4a8ad8', 0.35));
  set.wetJump = tint(set.jump, '#4a8ad8', 0.35);
  set.wetFall = tint(set.fall, '#4a8ad8', 0.35);
  set.wetWet = tint(set.wet, '#4a8ad8', 0.3);
  return set;
}

function buildPortrait() {
  return sprite(40, 40, (P) => {
    const B = TK.B, D = TK.D, L = TK.L, Wh = TK.W, G = TK.G, E = TK.E;
    P.e(20, 38, 14, 7, Wh);
    P.e(8, 12, 5, 7, B); P.e(32, 12, 5, 7, B);
    P.e(8, 13, 3, 5, D); P.e(32, 13, 3, 5, D);
    P.e(6, 6, 3, 2, D); P.e(34, 6, 3, 2, D);
    P.e(20, 19, 11, 10, B);
    P.e(10, 25, 4, 4, B); P.e(30, 25, 4, 4, B);
    P.r(14, 10, 3, 1, L); P.r(23, 10, 3, 1, L); P.r(12, 12, 2, 1, L);
    P.r(18, 7, 4, 9, Wh); P.r(17, 14, 6, 3, Wh);
    P.e(20, 32, 9, 4, Wh);
    P.e(20, 24, 6, 5, Wh);
    P.r(15, 28, 10, 1, G);
    P.r(13, 17, 3, 3, E); P.p(13, 17, '#ffffff'); P.r(24, 17, 3, 3, E); P.p(24, 17, '#ffffff');
    P.r(12, 15, 4, 1, D); P.r(24, 15, 4, 1, D);
    P.e(20, 21, 2.5, 1.5, '#8a4a40'); P.r(19, 20, 2, 1, '#c07a70');
    P.p(20, 23, '#5a2a24'); P.p(19, 24, '#5a2a24'); P.p(21, 24, '#5a2a24'); P.p(18, 24, '#5a2a24'); P.p(22, 24, '#5a2a24');
    P.r(19, 25, 3, 2, TK.T); P.p(20, 26, '#c04858');
  }, OUT);
}

// ================= ANIMALES =================
function buildCat(pal) {
  const { C, S, Y } = pal;
  const K = '#e89090';
  const sit = (flick) => sprite(19, 15, (P) => {
    P.e(10, 8, 4, 3.5, C); P.r(4, 5, 4, 6, C); P.e(5, 3, 3, 2.5, C);
    P.p(3, 0, C); P.r(3, 1, 2, 1, C); P.p(7, 0, C); P.r(6, 1, 2, 1, C);
    P.p(4, 3, Y); P.p(6, 3, Y); P.p(5, 4, K);
    P.r(4, 11, 2, 1, C); P.r(7, 11, 2, 1, C);
    if (flick) { P.r(15, 5, 1, 6, C); P.p(16, 4, C); } else { P.r(14, 10, 2, 1, C); P.r(15, 7, 1, 4, C); P.p(16, 6, C); }
    P.p(9, 6, S); P.p(11, 7, S); P.p(10, 9, S); P.p(12, 9, S); P.p(5, 1, S); P.p(13, 8, S);
  }, '#1a1016', 1, 1);
  const run = (f) => sprite(22, 13, (P) => {
    P.r(4, 4, 10, 4, C); P.e(15, 4, 3, 2.5, C);
    P.p(13, 0, C); P.r(13, 1, 2, 1, C); P.p(17, 0, C); P.r(16, 1, 2, 1, C);
    P.p(17, 3, Y); P.p(18, 5, K);
    P.r(1, 0, 1, 4, C); P.r(2, 3, 2, 2, C);
    P.p(6, 5, S); P.p(8, 4, S); P.p(10, 5, S); P.p(12, 4, S);
    if (f === 0) { P.r(3, 8, 1, 1, C); P.r(2, 9, 1, 2, C); P.r(5, 8, 1, 3, C); P.r(12, 8, 1, 3, C); P.r(14, 8, 1, 1, C); P.r(15, 9, 1, 2, C); }
    else { P.r(6, 8, 1, 3, C); P.r(8, 8, 1, 2, C); P.r(10, 8, 1, 3, C); P.r(11, 8, 1, 2, C); }
  }, '#1a1016', 1, 1);
  return { sit: [sit(0), sit(1)], run: [run(0), run(1)] };
}

function buildBird(p) {
  const E = '#140a06', LG = p.leg || '#6a4a30';
  const sit = (peck) => sprite(13, 11, (P) => {
    P.r(9, 3, 2, 2, p.tail); P.p(10, 2, p.tail);
    P.e(6, 5, 3, 2, p.body); P.r(4, 6, 4, 1, p.belly); P.r(6, 4, 3, 1, p.wing);
    const hy = peck ? 2 : 0;
    P.e(3, 3 + hy, 2, 1.5, p.head); P.p(0, 3 + hy, p.beak); P.p(2, 2 + hy, E);
    P.p(5, 8, LG); P.p(7, 8, LG);
  }, '#1a1016', 1, 1);
  const fly = (up) => sprite(15, 11, (P) => {
    P.r(1, 4, 3, 2, p.tail); P.e(6, 5, 3, 1.5, p.body); P.r(5, 6, 3, 1, p.belly);
    P.e(10, 4, 1.5, 1.5, p.head); P.p(12, 4, p.beak); P.p(10, 3, E);
    if (up) { P.r(5, 1, 3, 3, p.wing); P.p(4, 1, p.wing); } else { P.r(5, 6, 3, 3, p.wing); P.p(4, 8, p.wing); }
  }, '#1a1016', 1, 1);
  return { sit: [sit(0), sit(1)], fly: [fly(1), fly(0)] };
}

function buildHare() {
  const C = '#a88e6a', D = '#6e5840', Wt = '#efe6d4', E = '#140a06', Pk = '#d89a90';
  const sit = (f) => sprite(19, 16, (P) => {
    P.e(11, 10, 5, 3.5, C); P.r(8, 12, 7, 2, C);
    P.e(5, 8, 2.5, 2, C);
    if (f) { P.r(6, 2, 1, 5, C); P.r(8, 3, 1, 4, C); P.p(6, 2, D); P.p(8, 3, D); }
    else { P.r(5, 1, 1, 6, C); P.r(7, 1, 1, 6, C); P.p(5, 1, D); P.p(7, 1, D); }
    P.p(4, 7, E); P.p(2, 8, Pk);
    P.r(16, 8, 2, 2, Wt); P.r(9, 13, 4, 1, Wt);
    P.r(5, 10, 1, 4, C); P.r(7, 11, 1, 3, C);
  }, '#1a1016', 1, 1);
  const run = (f) => sprite(23, 13, (P) => {
    P.e(9, 6, 6, 2.5, C); P.e(16, 5, 2, 2, C);
    P.r(11, 2, 4, 1, C); P.r(12, 1, 3, 1, C); P.p(11, 2, D);
    P.p(17, 4, E); P.p(18, 6, Pk); P.r(1, 5, 2, 2, Wt); P.r(7, 8, 4, 1, Wt);
    if (f === 0) { P.r(1, 8, 4, 1, C); P.r(3, 7, 2, 1, C); P.r(15, 8, 4, 1, C); }
    else { P.r(7, 8, 1, 3, C); P.r(11, 8, 1, 3, C); P.r(6, 10, 2, 1, C); }
  }, '#1a1016', 1, 1);
  return { sit: [sit(0), sit(1)], run: [run(0), run(1)] };
}

// ================= OBJETOS =================
function buildItems() {
  ART.soga = sprite(12, 12, (P) => P.map([
    '........ba',
    '.......bab',
    '......cab.',
    '....bbac..',
    '...baabc..',
    '..cbaacb..',
    '..cabb....',
    '.bac......',
    'bab.......',
    'ab........',
  ], { a: '#f4dca4', b: '#c8964e', c: '#8a5e2c' }), '#4a2a14', 1, 1);

  const HEART = ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
  ART.heart = sprite(9, 8, (P) => P.map(HEART, { r: '#e83848', w: '#ffc0c0' }), '#2a0c10', 1, 1);
  ART.heartEmpty = sprite(9, 8, (P) => P.map(HEART, { r: '#4a3a52', w: '#5a4a62' }), '#140a14', 1, 1);

  ART.bone = sprite(14, 7, (P) => P.map([
    '.ww......ww.',
    'wwwwwwwwwwww',
    '.wwwwwwwwww.',
    'wwwwwwwwwggw',
    '.ww......ww.',
  ], { w: '#f6eedc', g: '#d4c6a8' }), '#3a2a1a', 1, 1);

  ART.umbrella = sprite(17, 16, (P) => {
    for (let y = 0; y <= 6; y++) {
      for (let x = -7; x <= 7; x++) {
        if ((x * x) / 49 + ((6 - y) * (6 - y)) / 36 <= 1) {
          const seg = Math.floor((x + 7.5) / 3);
          P.p(x + 7, y, seg % 2 ? '#f8d040' : '#e83848');
        }
      }
    }
    P.r(2, 1, 2, 1, '#ffffff');
    P.r(7, 6, 1, 7, '#5a3a20'); P.r(5, 12, 2, 1, '#5a3a20'); P.p(5, 11, '#5a3a20');
  }, '#2a1010', 1, 1);

  const cloud = (c, light, dark, angry) => sprite(42, 20, (P) => {
    P.e(10, 12, 8, 5, c); P.e(21, 9, 10, 7, c); P.e(32, 12, 8, 5, c); P.r(4, 12, 34, 5, c);
    P.e(18, 5, 5, 2, light); P.e(9, 9, 3, 1.5, light); P.e(31, 9, 3, 1, light);
    P.r(5, 16, 32, 1, dark);
    const F = '#1e1e28';
    P.r(15, 10, 2, 2, F); P.r(25, 10, 2, 2, F);
    if (angry) {
      P.p(13, 8, F); P.p(14, 8, F); P.p(15, 9, F); P.p(16, 9, F);
      P.p(28, 8, F); P.p(27, 8, F); P.p(26, 9, F); P.p(25, 9, F);
      P.r(19, 14, 4, 1, F); P.p(18, 15, F); P.p(23, 15, F);
    } else {
      P.r(19, 14, 4, 1, F);
    }
  }, '#20202c');
  ART.cloud = cloud('#9ea4b6', '#c6cad8', '#7a8092', false);
  ART.cloudRain = cloud('#666c80', '#8a90a4', '#484c5e', true);

  ART.tub = sprite(28, 19, (P) => {
    P.e(7, 6, 4, 3, '#ffffff'); P.e(13, 5, 4, 3.5, '#f0f8ff'); P.e(19, 6, 4, 3, '#ffffff'); P.e(10, 4, 2, 2, '#dcefff');
    P.e(15, 3, 2.5, 1.5, '#f8d030'); P.e(17, 1, 1.2, 1.2, '#f8d030'); P.p(19, 1, '#f08020'); P.p(17, 1, '#1a1a1a');
    P.r(2, 8, 24, 6, '#f2f2f6'); P.r(3, 14, 22, 1, '#f2f2f6'); P.r(1, 7, 26, 1, '#ffffff');
    P.r(3, 13, 22, 1, '#c8ccd8'); P.r(2, 10, 24, 1, '#e2e4ec'); P.r(4, 11, 20, 1, '#9ac8f0');
    P.r(4, 15, 2, 2, '#d4a040'); P.r(22, 15, 2, 2, '#d4a040');
    P.r(24, 1, 1, 6, '#a8b0c0'); P.r(22, 1, 3, 1, '#a8b0c0');
  }, '#1e1a2a', 0, 1);

  ART.sprinkler = sprite(10, 8, (P) => {
    P.r(2, 3, 6, 3, '#3a8a4a'); P.r(3, 2, 4, 1, '#4aa05a'); P.r(4, 0, 2, 2, '#b8c0c8');
  }, '#142018', 0, 1);

  // Botones táctiles
  const btn = (icon) => sprite(34, 34, (P) => {
    P.e(16, 16, 15, 15, 'rgba(255,255,255,0.9)');
    P.e(16, 16, 13, 13, 'rgba(40,24,60,0.9)');
    icon(P);
  }, null, 1, 1);
  ART.btnJump = btn((P) => {
    const c = '#ffffff';
    for (let i = 0; i < 7; i++) P.r(16 - i, 9 + i, 1 + i * 2, 1, c);
    P.r(13, 16, 7, 7, c);
  });
  ART.btnBark = btn((P) => {
    const c = '#ffffff';
    P.e(16, 19, 5, 4, c); P.e(10, 13, 2, 2.5, c); P.e(14, 10, 2, 2.5, c); P.e(19, 10, 2, 2.5, c); P.e(23, 13, 2, 2.5, c);
  });
}

// ================= DECORACIÓN =================
function buildDeco() {
  ART.espinillo = sprite(34, 30, (P) => {
    const T = '#5a3a24', C1 = '#3f6a2c', C2 = '#56883a', C3 = '#74a448', F = '#f2d24a';
    P.r(16, 13, 2, 16, T); P.r(14, 17, 2, 1, T); P.r(12, 15, 2, 2, T); P.r(18, 16, 3, 1, T); P.r(20, 14, 2, 2, T);
    P.e(10, 13, 7, 3, C1); P.e(22, 12, 8, 3.5, C1); P.e(16, 10, 9, 3, C2); P.e(12, 11, 5, 2, C2); P.e(23, 10, 5, 2, C2);
    P.e(15, 8, 5, 1.5, C3); P.e(22, 9, 3, 1, C3);
    [[8, 12], [12, 9], [19, 8], [25, 11], [28, 12], [15, 12], [21, 10], [6, 13], [17, 9], [26, 13]].forEach(([x, y]) => P.p(x, y, F));
  }, '#1c2414');

  ART.palm = sprite(30, 44, (P) => {
    const T = '#8c7454', TD = '#6a563c', L1 = '#4f8a44', L2 = '#6fa858', L3 = '#8cc070';
    for (let y = 12; y < 43; y++) {
      const x = 14 + Math.round(Math.sin(y * 0.12) * 1.2);
      P.r(x, y, 2, 1, y % 3 === 0 ? TD : T);
    }
    const cx = 15, cy = 11;
    for (let a = 0; a < 15; a++) {
      const ang = Math.PI * (0.92 + (a / 14) * 1.16);
      const len = 10 + (a % 3);
      for (let r = 2; r <= len; r++) {
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r + (Math.abs(Math.cos(ang)) * r * r) / 30;
        P.p(x, y, r > len - 3 ? L3 : a % 2 ? L1 : L2);
      }
    }
    P.e(15, 11, 2, 1.5, '#5a4a30');
  }, '#1c2414');

  ART.cardon = sprite(16, 28, (P) => {
    const C = '#5a9a4a', D = '#3e7636', L = '#7cbc5c';
    P.r(6, 2, 4, 25, C); P.r(7, 1, 2, 1, C); P.r(7, 3, 1, 23, L); P.r(9, 3, 1, 23, D);
    P.r(2, 10, 2, 8, C); P.r(2, 17, 4, 2, C); P.p(2, 9, C);
    P.r(12, 6, 2, 8, C); P.r(10, 13, 4, 2, C); P.p(12, 5, C);
    P.p(7, 0, '#f06080');
  }, '#14240e', 0, 1);

  ART.pasto = sprite(14, 9, (P) => {
    const c = ['#d8c068', '#b8a048', '#e8d488'];
    for (let i = 0; i < 9; i++) {
      const x = 2 + i + (i % 2);
      const h = 3 + ((i * 7) % 5);
      for (let y = 0; y < h; y++) P.p(x + Math.round((i - 4) * y * 0.12), 8 - y, c[i % 3]);
    }
  }, null);

  ART.stone = sprite(16, 9, (P) => {
    P.e(7, 5, 6, 3.5, '#9c9090'); P.e(6, 4, 4, 2, '#bcb0aa'); P.p(9, 6, '#7a6e6c'); P.p(4, 6, '#c49c92');
    P.e(13, 6, 2.5, 2, '#8a7e7c');
  }, '#2e2626');

  ART.lamp = sprite(14, 46, (P) => {
    const C = '#3e4450', L = '#5a6270';
    P.r(5, 5, 2, 40, C); P.r(5, 5, 1, 40, L); P.r(4, 42, 4, 3, C);
    P.r(5, 3, 7, 2, C); P.r(9, 5, 4, 2, '#2a2e36'); P.r(9, 7, 4, 1, '#fff4c0');
  }, '#14161c');

  ART.lapacho = sprite(40, 46, (P) => {
    const T = '#5a3c2c', A = '#e070a8', B = '#c44c88', Cc = '#f8a4cc';
    P.r(18, 22, 3, 23, T); P.r(14, 20, 5, 2, T); P.r(21, 18, 5, 2, T); P.r(12, 18, 2, 3, T); P.r(26, 16, 2, 3, T);
    P.e(12, 15, 8, 6, B); P.e(28, 14, 8, 6, B); P.e(20, 11, 10, 8, A); P.e(11, 13, 5, 4, A); P.e(29, 12, 5, 4, A);
    P.e(18, 7, 5, 3, Cc); P.e(27, 10, 3, 2, Cc); P.e(9, 11, 3, 2, Cc);
    const R = mulberry32(7);
    for (let i = 0; i < 18; i++) P.p(6 + R() * 28, 5 + R() * 14, i % 2 ? '#ffd0e4' : B);
  }, '#2a1420');

  ART.tree = sprite(34, 44, (P) => {
    const T = '#5a4030', A = '#3f7f3a', B = '#2e6a2e', Cc = '#62a44c';
    P.r(16, 22, 3, 21, T);
    P.e(17, 16, 12, 10, B); P.e(17, 13, 10, 8, A); P.e(12, 11, 4, 3, Cc); P.e(21, 8, 4, 2, Cc);
  }, '#142214');

  ART.bush = sprite(22, 12, (P) => {
    P.e(6, 7, 5, 4, '#3a7a36'); P.e(15, 7, 6, 4, '#3a7a36'); P.e(10, 5, 6, 4, '#4f9a44'); P.e(9, 3, 3, 1.5, '#72b85a');
    P.p(5, 6, '#f0e060'); P.p(14, 5, '#f0e060'); P.p(17, 8, '#f07070');
  }, '#122012');
}

// Plataformas (con caché por tamaño)
const platCache = {};
function platImage(kind, w, h) {
  const key = kind + w + 'x' + h;
  if (platCache[key]) return platCache[key];
  let c;
  const R = mulberry32(w * 31 + h * 7);
  if (kind === 'rock') {
    c = sprite(w + 2, h + 2, (P) => {
      P.r(1, 2, w - 2, h - 1, '#a89a96'); P.r(0, 4, w, h - 4, '#a89a96'); P.r(2, 1, w - 4, 1, '#a89a96');
      P.r(2, 1, w - 4, 2, '#cbbfb8'); P.r(1, 3, w - 2, 1, '#bcb0aa');
      P.r(1, h - 1, w - 2, 2, '#857874');
      for (let i = 0; i < (w * h) / 10; i++) P.p(1 + R() * (w - 2), 4 + R() * (h - 5), R() < 0.5 ? '#c49c92' : '#7a6e6c');
      for (let i = 0; i < w / 14; i++) { const x = 4 + R() * (w - 8); for (let y = 4; y < 4 + R() * (h - 6); y++) P.p(x + (y % 3 === 0 ? 1 : 0), y, '#6e6260'); }
      for (let x = 2; x < w - 2; x++) if (R() < 0.35) P.p(x, 1, '#7ab048');
    }, '#3a2e2e', 1, 0);
  } else if (kind === 'hedge') {
    c = sprite(w + 2, h + 2, (P) => {
      P.r(1, 1, w, h + 1, '#3a803a'); P.r(1, 1, w, 2, '#5aa84a');
      for (let i = 0; i < (w * h) / 5; i++) P.p(1 + R() * w, 2 + R() * h, R() < 0.5 ? '#2c662c' : '#52984a');
      for (let i = 0; i < w / 6; i++) P.p(2 + R() * (w - 2), 2 + R() * (h - 2), R() < 0.5 ? '#f4f0f0' : '#f0b0c8');
    }, '#122012', 0, 0);
  } else if (kind === 'bench') {
    c = sprite(w + 2, h + 2, (P) => {
      P.r(3, 3, 2, h - 2, '#2e2e36'); P.r(w - 4, 3, 2, h - 2, '#2e2e36');
      P.r(1, 1, w, 2, '#b8743e'); P.r(1, 3, w, 1, '#8a5428'); P.r(1, 1, w, 1, '#d08c50');
    }, '#1a120c', 0, 0);
  } else if (kind === 'container') {
    c = sprite(w + 2, h + 2, (P) => {
      P.r(1, 3, w, h - 2, '#2e7a4a'); P.r(0, 1, w + 2, 3, '#23603a'); P.r(1, 1, w, 1, '#3a9058');
      for (let x = 4; x < w - 2; x += 4) P.r(x, 5, 1, h - 7, '#23603a');
      P.r(3, h - 1, 3, 2, '#1a1a1a'); P.r(w - 4, h - 1, 3, 2, '#1a1a1a');
      P.r(w / 2 - 4, 6, 8, 3, '#e8e8e8'); P.r(w / 2 - 3, 7, 6, 1, '#2e7a4a');
    }, '#0e1e14', 0, 0);
  }
  platCache[key] = c;
  return c;
}

// ================= FONDOS =================
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function makeSky(colors, sun) {
  const w = 420, c = makeCanvas(w, H), g = c.getContext('2d');
  const img = g.createImageData(w, H), d = img.data;
  const rgb = colors.map(hexToRgb);
  const n = rgb.length;
  const sunRgb = hexToRgb(sun.col), glowRgb = hexToRgb(sun.glow);
  for (let y = 0; y < H; y++) {
    const f = (y / (H - 1)) * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const fr = clamp((f - i - 0.3) / 0.4, 0, 1);
    for (let x = 0; x < w; x++) {
      const th = BAYER[(y % 4) * 4 + (x % 4)] / 16;
      let col = fr > th ? rgb[i + 1] : rgb[i];
      const dist = Math.hypot(x - sun.x, y - sun.y);
      if (dist < sun.r) col = sunRgb;
      else if (dist < sun.r + 5 && th < 0.5) col = glowRgb;
      else if (dist < sun.r + 10 && th < 0.2) col = glowRgb;
      const k = (y * w + x) * 4;
      d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function makeCloudLayer(w, seed, col, shade, count, yMin, yMax) {
  const c = makeCanvas(w, H), g = c.getContext('2d');
  const P = painter(g);
  const R = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const cx = R() * w, cy = yMin + R() * (yMax - yMin), s = 0.6 + R() * 0.8;
    for (const off of [-w, 0, w]) {
      const x = cx + off;
      P.e(x, cy + 3 * s, 16 * s, 3 * s, shade);
      P.e(x - 8 * s, cy, 7 * s, 4 * s, col);
      P.e(x + 2 * s, cy - 3 * s, 9 * s, 6 * s, col);
      P.e(x + 11 * s, cy + 1 * s, 6 * s, 3 * s, col);
      P.r(x - 14 * s, cy + 2 * s, 30 * s, 2, col);
    }
  }
  return c;
}

function ridgeHeights(w, base, harm, seed) {
  const R = mulberry32(seed);
  const ph = harm.map(() => R() * Math.PI * 2);
  const hs = [];
  for (let x = 0; x < w; x++) {
    let y = base;
    harm.forEach(([k, a], i) => { y -= a * (0.5 + 0.5 * Math.sin((2 * Math.PI * k * x) / w + ph[i])); });
    hs.push(Math.round(y));
  }
  return hs;
}

function makeRidge(w, hs, fill, ridge, shade) {
  const c = makeCanvas(w, H), g = c.getContext('2d');
  for (let x = 0; x < w; x++) {
    const y = hs[x];
    g.fillStyle = fill; g.fillRect(x, y, 1, H - y);
    const slope = hs[(x + 1) % w] - hs[(x - 1 + w) % w];
    if (slope > 0 && shade) {
      g.fillStyle = shade;
      const len = Math.min(H - y, 4 + slope * 2, 10);
      for (let yy = 1; yy < len; yy++) if (((x + yy) & 1) === 0 || yy < 3) g.fillRect(x, y + yy, 1, 1);
    }
    g.fillStyle = ridge; g.fillRect(x, y, 1, 1);
    if (slope < 0) g.fillRect(x, y + 1, 1, 1);
  }
  return c;
}

function stampWrapped(g, img, x, y, w) {
  for (const off of [-w, 0, w]) g.drawImage(img, Math.round(x + off), Math.round(y));
}

function buildSierrasBG() {
  const bg = {};
  bg.sky = makeSky(['#4f9fe0', '#63ade6', '#79bbec', '#8fc8f0', '#a7d5f3', '#c0e1f5', '#d8ecf5'], { x: 250, y: 30, r: 10, col: '#fffbe0', glow: '#fff0b0' });
  bg.clouds = makeCloudLayer(600, 11, '#ffffff', '#dbe8f4', 6, 18, 70);

  const fw = 520;
  const fh = ridgeHeights(fw, 120, [[1, 30], [2, 16], [5, 8], [11, 3]], 3);
  bg.far = makeRidge(fw, fh, '#8e9cd0', '#aab4e0', '#7f8cc2');
  {
    // Cruz en el pico más alto (como en los cerros cordobeses)
    let mx = 0; for (let x = 0; x < fw; x++) if (fh[x] < fh[mx]) mx = x;
    const g = bg.far.getContext('2d');
    g.fillStyle = '#e8ecf8'; g.fillRect(mx, fh[mx] - 7, 1, 7); g.fillRect(mx - 2, fh[mx] - 5, 5, 1);
  }

  const mw = 600;
  const mh = ridgeHeights(mw, 134, [[1, 18], [3, 12], [7, 5], [13, 2]], 5);
  bg.mid = makeRidge(mw, mh, '#6f9a86', '#8ab09a', '#5f8a78');
  {
    const g = bg.mid.getContext('2d'), P = painter(g), R = mulberry32(9);
    for (let i = 0; i < 140; i++) {
      const x = Math.floor(R() * mw), y = mh[x] + 3 + R() * (H - mh[x]);
      if (y > 150) continue;
      for (const off of [-mw, 0, mw]) { P.r(x + off, y, 2, 2, '#4d7a62'); P.p(x + off, y, '#7aa48c'); }
    }
    // Capillita serrana
    const cx = 380, cy = mh[cx];
    P.r(cx - 5, cy - 6, 10, 7, '#f2eee2'); P.r(cx - 6, cy - 7, 12, 1, '#b8583a'); P.r(cx - 5, cy - 8, 10, 1, '#b8583a'); P.r(cx - 3, cy - 9, 6, 1, '#b8583a');
    P.r(cx + 2, cy - 13, 3, 7, '#f2eee2'); P.p(cx + 3, cy - 11, '#4a3a2a'); P.r(cx + 3, cy - 16, 1, 3, '#4a3a2a'); P.r(cx + 2, cy - 15, 3, 1, '#4a3a2a');
    P.r(cx - 1, cy - 3, 2, 4, '#6a4a30');
  }

  const nw = 480;
  const nh = ridgeHeights(nw, 148, [[2, 12], [5, 6], [9, 3]], 8);
  bg.near = makeRidge(nw, nh, '#94ac50', '#b4c868', '#84a048');
  {
    const g = bg.near.getContext('2d'), R = mulberry32(21);
    for (let x = 0; x < nw; x++) for (let y = nh[x] + 2; y < H; y++) if (R() < 0.06) { g.fillStyle = R() < 0.5 ? '#a8bc5c' : '#7e9642'; g.fillRect(x, y, 1, 1); }
    const smallTree = sprite(18, 16, (P) => {
      P.r(8, 8, 2, 8, '#4a3020'); P.e(9, 6, 7, 3, '#4d7a34'); P.e(8, 4, 4, 1.5, '#6a9a44');
    }, '#243018');
    const smallPalm = sprite(14, 22, (P) => {
      P.r(6, 7, 2, 15, '#7a6448');
      for (let a = 0; a < 9; a++) { const ang = Math.PI * (0.95 + (a / 8) * 1.1); for (let r = 1; r < 7; r++) P.p(7 + Math.cos(ang) * r, 6 + Math.sin(ang) * r + r * r * 0.04, '#5a8a48'); }
    }, '#243018');
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(R() * nw);
      const img = R() < 0.6 ? smallTree : smallPalm;
      stampWrapped(g, img, x - img.width / 2, nh[x] - img.height + 4, nw);
    }
  }

  bg.ground = sprite(64, 32, (P) => {
    const R = mulberry32(4);
    P.r(0, 2, 64, 30, '#a3653c');
    for (let y = 16; y < 32; y++) for (let x = 0; x < 64; x++) if (((x + y) & 1) === 0 && y > 22 - (x % 5)) P.p(x, y, '#8e5634');
    for (let i = 0; i < 60; i++) P.p(R() * 64, 6 + R() * 26, R() < 0.5 ? '#86502e' : '#c08858');
    for (let i = 0; i < 5; i++) { const x = R() * 60, y = 9 + R() * 18; P.r(x, y, 3, 2, '#c4a28a'); P.r(x, y + 2, 3, 1, '#7a4a2a'); P.p(x, y, '#e0c4ac'); }
    P.r(0, 2, 64, 3, '#6fae3c');
    for (let x = 0; x < 64; x++) {
      if (x % 2 === 0) P.p(x, 2, '#8cc84c');
      if (R() < 0.5) P.p(x, 5, '#4f8a2c');
      if (R() < 0.3) P.p(x, 1, '#6fae3c');
      if (R() < 0.12) { P.p(x, 0, '#8cc84c'); P.p(x, 1, '#8cc84c'); }
    }
  }, null);

  bg.layers = [
    { img: bg.clouds, f: 0.05, drift: 5 },
    { img: bg.far, f: 0.12 },
    { img: bg.mid, f: 0.26 },
    { img: bg.near, f: 0.5 },
  ];
  return bg;
}

function drawHouse(P, R, x0, base, hw, hh) {
  const walls = ['#eeeae2', '#e2ddd4', '#f5f2ea', '#d6d0c6', '#c9c2b8', '#e8dccb'];
  const wall = walls[Math.floor(R() * walls.length)];
  const wallD = '#a8a298';
  const top = base - hh;
  const pitched = R() < 0.3;
  // planta baja
  P.r(x0, top + 12, hw, hh - 12, wall);
  P.r(x0, base - 2, hw, 2, wallD);
  // planta alta desplazada
  const ux = x0 + Math.floor(R() * 8), uw = hw - 6 - Math.floor(R() * 10);
  P.r(ux, top, uw, 13, wall);
  if (pitched) {
    for (let i = 0; i < 7; i++) P.r(ux - 1 + i, top - i, uw + 2 - i * 2, 1, i % 2 ? '#a44a30' : '#b8583a');
  } else {
    P.r(ux - 1, top - 1, uw + 2, 2, '#4e4e56');
  }
  P.r(x0 - 1, top + 11, hw + 2, 2, '#4e4e56');
  P.r(ux, top + 1, uw, 1, wallD);
  // listones de madera
  if (R() < 0.7) {
    const sw = 10 + Math.floor(R() * 8), sx = ux + uw - sw - 2;
    P.r(sx, top + 2, sw, 9, '#a8683a');
    for (let x = sx + 1; x < sx + sw; x += 2) P.r(x, top + 2, 1, 9, '#86502a');
  }
  // ventanales
  const glass = (x, y, w, h) => {
    P.r(x, y, w, h, '#2e3e52');
    for (let i = 0; i < w + h; i += 5) for (let j = 0; j < 2; j++) {
      for (let k = 0; k < h; k++) { const xx = x + i - k + j; if (xx >= x && xx < x + w) P.p(xx, y + k, '#6f96c0'); }
    }
    P.r(x, y, w, 1, '#1e2a38');
  };
  glass(ux + 3, top + 3, Math.min(14, uw - 16 > 6 ? uw - 18 : 8), 6);
  glass(x0 + 4, top + 16, 16, hh - 20);
  // portón / puerta
  if (hw > 50) {
    const gx = x0 + hw - 22;
    P.r(gx, top + 17, 18, hh - 19, '#8a8a90');
    for (let y = top + 19; y < base - 2; y += 3) P.r(gx, y, 18, 1, '#6e6e76');
  } else {
    P.r(x0 + hw - 10, top + 20, 6, hh - 22, '#6a4a30'); P.p(x0 + hw - 6, top + 26, '#e0c060');
  }
  // luz cálida
  if (R() < 0.4) P.r(x0 + 6, top + 18, 3, 2, '#ffe8a0');
}

function buildDoctaBG() {
  const bg = {};
  bg.sky = makeSky(['#4a86d0', '#5e96d8', '#78a8de', '#96badf', '#b8c6d8', '#dccdbe', '#f2d2a4'], { x: 110, y: 74, r: 11, col: '#fff2c8', glow: '#ffe0a0' });
  bg.clouds = makeCloudLayer(600, 31, '#fff6ec', '#f0d8c8', 5, 16, 60);

  const fw = 540;
  bg.far = makeRidge(fw, ridgeHeights(fw, 132, [[1, 16], [3, 7], [7, 3]], 13), '#a4a4cc', '#b8b8da', '#9696c0');

  const cw = 520;
  bg.city = makeCanvas(cw, H);
  {
    const g = bg.city.getContext('2d'), P = painter(g), R = mulberry32(17);
    let x = 0;
    while (x < cw - 12) {
      const bw = 8 + Math.floor(R() * 14), bh = 8 + Math.floor(R() * 26);
      P.r(x, 142 - bh, bw, bh, '#aeb2d2');
      for (let yy = 142 - bh + 3; yy < 140; yy += 3) for (let xx = x + 2; xx < x + bw - 1; xx += 3) if (R() < 0.6) P.p(xx, yy, '#c4c8e2');
      x += bw + Math.floor(R() * 5);
    }
    // Faro del Bicentenario
    const fx = 300;
    for (let i = 0; i < 52; i++) { const ww = Math.max(2, 6 - Math.floor(i / 11)); P.r(fx - Math.floor(ww / 2), 142 - i, ww, 1, i % 6 < 3 ? '#c8cce6' : '#b4b8d8'); }
    P.r(fx - 2, 88, 4, 3, '#fff4c0'); P.r(fx - 1, 85, 2, 3, '#c8cce6');
  }

  const hw = 720;
  bg.houses = makeCanvas(hw, H);
  {
    const g = bg.houses.getContext('2d'), P = painter(g), R = mulberry32(23);
    P.r(0, 140, hw, 10, '#6aa848');
    for (let x = 0; x < hw; x++) { if (x % 2 === 0) P.p(x, 140, '#86c05a'); if (R() < 0.4) P.p(x, 141 + Math.floor(R() * 8), '#5a9a3e'); }
    const lap = sprite(30, 36, (Q) => {
      Q.r(14, 18, 2, 18, '#5a3c2c'); Q.e(9, 13, 6, 5, '#c44c88'); Q.e(21, 12, 6, 5, '#c44c88'); Q.e(15, 9, 8, 6, '#e070a8'); Q.e(14, 6, 4, 2, '#f8a4cc');
    }, '#2a1420');
    const grn = sprite(24, 36, (Q) => {
      Q.r(11, 20, 2, 16, '#5a4030'); Q.e(12, 13, 9, 9, '#2e6a2e'); Q.e(12, 11, 7, 6, '#3f7f3a'); Q.e(9, 8, 3, 2, '#62a44c');
    }, '#142214');
    const cypress = sprite(10, 34, (Q) => { Q.e(5, 17, 3.5, 15, '#2e5e36'); Q.e(4, 14, 1.5, 9, '#3e7a44'); }, '#122012');
    let x = 6;
    while (x < hw - 90) {
      const w = 46 + Math.floor(R() * 26), h = 30 + Math.floor(R() * 14);
      drawHouse(P, R, x, 144, w, h);
      x += w;
      const gap = 10 + Math.floor(R() * 14);
      const t = R();
      const tree = t < 0.45 ? lap : t < 0.8 ? grn : cypress;
      g.drawImage(tree, Math.round(x + gap / 2 - tree.width / 2), 146 - tree.height);
      x += gap;
    }
    while (x < hw - 20) { g.drawImage(R() < 0.5 ? lap : grn, x, 110); x += 26; }
    for (let i = 0; i < hw; i += 6) { P.r(i, 138, 1, 7, '#34343c'); }
    P.r(0, 138, hw, 1, '#34343c'); P.r(0, 142, hw, 1, '#34343c');
  }

  bg.ground = sprite(64, 32, (P) => {
    const R = mulberry32(6);
    P.r(0, 2, 64, 12, '#c2bdb3'); P.r(0, 2, 64, 1, '#dcd8d0');
    for (let x = 0; x < 64; x += 16) P.r(x, 3, 1, 11, '#a29d93');
    P.r(0, 8, 64, 1, '#a9a49a');
    for (let i = 0; i < 30; i++) P.p(R() * 64, 3 + R() * 11, R() < 0.5 ? '#b4afa5' : '#d0cbc1');
    P.r(0, 14, 64, 2, '#9a958c'); P.r(0, 16, 64, 1, '#6e6a64');
    P.r(0, 17, 64, 15, '#50505a'); P.r(0, 17, 64, 2, '#3e3e46');
    for (let i = 0; i < 80; i++) P.p(R() * 64, 19 + R() * 13, R() < 0.5 ? '#5c5c66' : '#46464e');
    P.r(4, 25, 20, 2, '#e8d068');
  }, null);

  bg.layers = [
    { img: bg.clouds, f: 0.05, drift: 5 },
    { img: bg.far, f: 0.1 },
    { img: bg.city, f: 0.18 },
    { img: bg.houses, f: 0.45 },
  ];
  return bg;
}

function buildArt() {
  ART.toki = buildTokiSet();
  ART.portrait = buildPortrait();
  ART.cats = [
    buildCat({ C: '#e89040', S: '#b0602a', Y: '#b8e050' }),
    buildCat({ C: '#3a3642', S: '#26222c', Y: '#f0d040' }),
    buildCat({ C: '#a2a2ae', S: '#6e6e7c', Y: '#90e070' }),
  ];
  ART.birds = {
    hornero: buildBird({ body: '#b07040', belly: '#ecd2a8', head: '#9a6038', tail: '#c8602c', beak: '#e0c890', wing: '#8a5028' }),
    paloma: buildBird({ body: '#8e94a8', belly: '#b0b4c4', head: '#6e8a92', tail: '#5a6070', beak: '#d8a0a0', wing: '#70768a', leg: '#d06060' }),
    cotorra: buildBird({ body: '#5cb848', belly: '#b8d4a8', head: '#a8c4b0', tail: '#3c9038', beak: '#e8c090', wing: '#3a8a3a' }),
  };
  ART.hare = buildHare();
  buildItems();
  buildDeco();
  ART.bg = { sierras: buildSierrasBG(), docta: buildDoctaBG() };
}

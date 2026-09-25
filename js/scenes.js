'use strict';

function setState(s) {
  Game.state = s;
  Game.stateT = 0;
}

function blinkOn(rate = 2) { return Math.floor(Game.t * rate * 2) % 2 === 0; }

function drawPanel(x, y, w, h) {
  ctx.fillStyle = '#0e0a18'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#f0e0c0'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#6a5a9a'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#1c1638'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
}

function drawDim(a = 0.55, col = '#0e0a18') {
  ctx.globalAlpha = a;
  ctx.fillStyle = col;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

function drawRope(x0, x1, y) {
  ctx.fillStyle = '#4a2a14'; ctx.fillRect(x0 - 1, y - 1, x1 - x0 + 2, 4);
  for (let x = x0; x < x1; x++) {
    ctx.fillStyle = ((x + y) >> 1) % 2 ? '#c8964e' : '#f4dca4';
    ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = ((x + y + 1) >> 1) % 2 ? '#c8964e' : '#8a5e2c';
    ctx.fillRect(x, y + 1, 1, 1);
  }
}

function drawLogo(x, y, s = 5) {
  const str = 'TOKI';
  drawText(str, x + 3, y + 4, '#140806', { align: 'center', scale: s });
  drawText(str, x, y, '#f08a24', { align: 'center', scale: s, outline: '#3a1608', ow: 2 });
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, y + s * 3); ctx.clip();
  drawText(str, x, y, '#ffd84a', { align: 'center', scale: s });
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.rect(0, y + s, W, 1); ctx.clip();
  drawText(str, x, y, '#fff6c8', { align: 'center', scale: s });
  ctx.restore();
}

function drawDialog(text, typed, portrait) {
  const bh = 44, by = 18, bx = 6, bw = W - 12;
  drawPanel(bx, by, bw, bh);
  let tx = bx + 8;
  if (portrait) {
    ctx.fillStyle = '#f0e0c0'; ctx.fillRect(bx + 4, by + 3, 38, 38);
    ctx.fillStyle = '#5a8ad0'; ctx.fillRect(bx + 5, by + 4, 36, 36);
    ctx.fillStyle = '#7aa8e0'; ctx.fillRect(bx + 5, by + 4, 36, 12);
    ctx.drawImage(ART.portrait, bx + 3, by + 3, 40, 40);
    tx = bx + 48;
  }
  const maxChars = Math.floor((bx + bw - 6 - tx) / 6);
  const lines = wrapText(text.slice(0, Math.floor(typed)), maxChars);
  const full = wrapText(text, maxChars);
  const ty = by + 8 + Math.max(0, (3 - full.length) * 5);
  lines.forEach((l, i) => drawText(l, tx, ty + i * 11, '#fff4d8', { shadow: '#0a0614' }));
  if (typed >= text.length && blinkOn(2)) {
    ctx.fillStyle = '#ffd84a';
    const ax = bx + bw - 10, ay = by + bh - 8;
    ctx.fillRect(ax, ay, 5, 1); ctx.fillRect(ax + 1, ay + 1, 3, 1); ctx.fillRect(ax + 2, ay + 2, 1, 1);
  }
}

// ================= Pantalla inicial =================
const Boot = {
  update() {
    if (Input.action) {
      Sound.init();
      Sound.sfx('select');
      Intro.start();
      setState('intro');
      Game.fade = 1;
    }
  },
  draw() {
    ctx.fillStyle = '#140e22'; ctx.fillRect(0, 0, W, H);
    const R = mulberry32(3);
    for (let i = 0; i < 60; i++) {
      const x = Math.floor(R() * W), y = Math.floor(R() * H);
      ctx.fillStyle = (i + Math.floor(Game.t * 2)) % 7 === 0 ? '#ffffff' : '#5a4a7a';
      ctx.fillRect(x, y, 1, 1);
    }
    const img = ART.toki.idle[Math.floor(Game.t * 3) % 2];
    ctx.drawImage(img, Math.round(W / 2 - 28), 40, 56, 44);
    drawText('TOKI', W / 2, 96, '#ffd84a', { align: 'center', scale: 2, outline: '#3a1608' });
    if (blinkOn(1.5)) drawText(IS_TOUCH ? 'TOCÁ PARA COMENZAR' : 'HACÉ CLIC O PRESIONÁ ENTER', W / 2, 126, '#ffffff', { align: 'center', outline: '#1a1020' });
    drawText('(MEJOR CON SONIDO)', W / 2, 142, '#8a7aaa', { align: 'center' });
  },
};

// ================= Intro =================
const Intro = {
  start() {
    this.i = -1;
    this.cam = 0;
    this.camV = 22;
    this.dark = 0;
    this.darkTarget = 0;
    this.flash = 0;
    this.shake = 0;
    this.toki = { x: -40, y: GROUND, vy: 0, mode: 'hidden', anim: 0, barkT: 0, jumps: [] };
    this.animals = [];
    this.sogas = [];
    this.cloud = null;
    this.tub = null;
    this.alertT = 0;
    this.decos = [
      { img: ART.espinillo, x: 60 }, { img: ART.palm, x: 200 }, { img: ART.pasto, x: 150 },
      { img: ART.espinillo, x: 330 }, { img: ART.pasto, x: 410 }, { img: ART.palm, x: 470 }, { img: ART.stone, x: 520 },
    ];
    particles = []; texts = [];
    Sound.play('title');
    this.next();
  },

  scenes: [
    {
      text: 'En las Sierras de Córdoba, donde el viento huele a peperina y los arroyos cantan entre las piedras...',
      hold: 2.2,
    },
    {
      text: '...vive una perrita muy especial. ¡Se llama TOKI!',
      portrait: true,
      enter(I) { I.toki.mode = 'run'; I.toki.x = -30; I.toki.target = Math.round(W * 0.28); },
    },
    {
      text: 'A Toki le encanta juntar pedacitos de soga. ¡Los colecciona todos!',
      portrait: true,
      enter(I) {
        const tx = I.toki.x;
        I.sogas = [
          { x: tx + 30, y: GROUND - 34, t: 0 }, { x: tx + 60, y: GROUND - 46, t: 1 }, { x: tx + 90, y: GROUND - 34, t: 2 },
        ];
        I.toki.mode = 'hop';
        I.toki.jumps = [0.35, 1.05, 1.75];
        I.toki.hopEnd = 2.4;
      },
    },
    {
      text: '...y corretear gatos y pájaros. ¡Pero solo para jugar!',
      enter(I) {
        I.toki.mode = 'idle';
        I.toki.y = GROUND;
        I.sogas = [];
        I.animals = [
          { kind: 'hornero', x: Math.round(W * 0.66), y: GROUND, state: 'idle', t: 0, pal: 0 },
          { kind: 'cat', x: Math.round(W * 0.82), y: GROUND, state: 'idle', t: 0.5, pal: 0 },
        ];
        I.barkAt = 1.1;
      },
    },
    {
      text: 'Pero hay algo que Toki odia más que nada en el mundo...',
      enter(I) {
        Sound.play('storm');
        I.darkTarget = 0.45;
        I.toki.mode = 'idle';
        I.animals = [];
        I.cloud = { x: W + 20, y: 72, tx: I.toki.x - 22 };
      },
      hold: 1.6,
    },
    {
      big: '¡¡EL AGUA!!',
      enter(I) {
        Sound.stop();
        Sound.sfx('sting');
        Sound.sfx('thunder');
        I.flash = 1;
        I.shake = 0.6;
        I.darkTarget = 0.55;
        I.toki.mode = 'wet';
        I.raining = true;
      },
      hold: 2.4,
    },
    {
      text: 'Y para colmo, hoy... ¡es DÍA DE BAÑO!',
      enter(I) {
        I.raining = false;
        I.darkTarget = 0.12;
        I.cloud.tx = -80;
        I.toki.mode = 'idle';
        I.tub = { x: W + 10, tx: I.toki.x + 60 };
        I.scaredAt = 1.3;
        Sound.play('title');
      },
    },
    {
      text: '¡Ayudá a Toki a escapar del agua y volver a su casa en Barrio Docta!',
      portrait: true,
      enter(I) { I.toki.mode = 'flee'; I.darkTarget = 0; Sound.sfx('whoosh'); },
      hold: 2.6,
    },
  ],

  next() {
    this.i++;
    if (this.i >= this.scenes.length) { this.finish(); return; }
    this.t = 0;
    this.typed = 0;
    const s = this.scenes[this.i];
    if (s.enter) s.enter(this);
  },

  finish() {
    particles = []; texts = [];
    Title.start();
  },

  update(dt) {
    const s = this.scenes[this.i];
    this.t += dt;
    const p = Input.tap;
    if (Input.esc || (p && p.x > W - 64 && p.y < 18)) { Sound.sfx('select'); this.finish(); return; }

    const text = s.text || s.big;
    if (s.text && this.typed < text.length) {
      const before = Math.floor(this.typed);
      this.typed = Math.min(text.length, this.typed + dt * 38);
      if (Math.floor(this.typed) !== before && before % 2 === 0 && text[before] !== ' ') Sound.sfx('blip');
    }
    const complete = !s.text || this.typed >= text.length;
    if (Input.action) {
      if (!complete) this.typed = text.length;
      else if (this.t > 0.6) { this.next(); return; }
    }
    if (complete && this.t > (s.text ? text.length / 38 : 0) + (s.hold || 2.8)) { this.next(); return; }

    // cámara
    if (this.i === 0) this.cam += this.camV * dt;
    else this.camV = Math.max(0, this.camV - 30 * dt), this.cam += this.camV * dt;
    this.dark += (this.darkTarget - this.dark) * Math.min(1, dt * 3);
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.shake = Math.max(0, this.shake - dt);
    if (this.i === 5 && Math.random() < dt * 0.6) { this.flash = 0.8; Sound.sfx('thunder'); }

    this.updateToki(dt, s);

    for (const sg of this.sogas) {
      sg.t += dt;
      if (!sg.dead && Math.abs(sg.x - (this.toki.x + 2)) < 12 && Math.abs(sg.y - (this.toki.y - 10)) < 14) {
        sg.dead = true;
        Sound.sfx('soga');
        sparkle(sg.x, sg.y);
        floatText(sg.x, sg.y - 12, '+10', '#ffe070', 0.7);
      }
    }

    if (this.i === 3 && this.barkAt && this.t > this.barkAt) {
      this.barkAt = null;
      this.toki.barkT = 0.4;
      Sound.sfx('bark');
      floatText(this.toki.x + 18, this.toki.y - 30, '¡GUAU!', '#ffffff', 0.7);
      for (const a of this.animals) { a.state = 'alert'; a.t = 0; }
      setTimeout(() => Sound.sfx('cat'), 200);
      Sound.sfx('bird');
    }
    for (const a of this.animals) {
      a.t += dt;
      if (a.state === 'alert' && a.t > 0.25) {
        a.state = 'flee'; a.t = 0;
        a.vx = a.kind === 'cat' ? 170 : 90; a.vy = a.kind === 'cat' ? -150 : -60;
      }
      if (a.state === 'flee') {
        if (a.kind === 'cat') { a.vy += GRAV * dt; if (a.y + a.vy * dt >= GROUND) { a.vy = -60; } }
        else a.vy -= 70 * dt;
        a.x += a.vx * dt; a.y = Math.min(GROUND, a.y + a.vy * dt);
      }
    }

    if (this.cloud) {
      this.cloud.x += (this.cloud.tx - this.cloud.x) * Math.min(1, dt * 1.6);
      if (this.raining) {
        for (let k = 0; k < 4; k++) spawn(this.cloud.x + rand(4, 38), this.cloud.y + 16, -10, 250, 1, k % 2 ? '#8cc8f4' : '#dff2ff', { kind: 'rain', floor: true });
        for (let k = 0; k < 2; k++) spawn(rand(0, W), -4, -20, 260, 1, '#6a8ab0', { kind: 'rain', floor: true });
      } else if (this.i === 4 && this.t > 1 && Math.random() < 0.4) {
        spawn(this.cloud.x + rand(4, 38), this.cloud.y + 16, 0, 200, 1, '#b8e0ff', { kind: 'rain', floor: true });
      }
    }
    if (this.tub) {
      this.tub.x += (this.tub.tx - this.tub.x) * Math.min(1, dt * 2.5);
      if (Math.random() < dt * 4) spawn(this.tub.x + rand(6, 20), GROUND - 16, rand(-5, 5), -15, 0.9, '#ffffff', { kind: 'bubble' });
      if (this.scaredAt && this.t > this.scaredAt) {
        this.scaredAt = null;
        this.toki.mode = 'scared';
        Sound.sfx('shock');
        this.alertT = 1.5;
      }
    }
    this.alertT = Math.max(0, this.alertT - dt);
    updateParticles(dt);
  },

  updateToki(dt, s) {
    const T = this.toki;
    T.barkT = Math.max(0, T.barkT - dt);
    T.anim += dt * 10;
    if (T.mode === 'run') {
      T.x += 70 * dt;
      if (T.x >= T.target) { T.x = T.target; T.mode = 'idle'; }
    } else if (T.mode === 'hop') {
      if (this.t < T.hopEnd) T.x += 42 * dt;
      else if (T.y >= GROUND) T.mode = 'idle';
      if (T.jumps.length && this.t > T.jumps[0]) { T.jumps.shift(); T.vy = -230; Sound.sfx('jump'); }
    } else if (T.mode === 'flee') {
      T.x += 230 * dt;
      T.anim += dt * 8;
      if (Math.random() < 0.5) spawn(T.x - 8, GROUND - 1, rand(-40, -10), rand(-15, -4), 0.4, '#c89a6a', { kind: 'dust', size: 3 });
    }
    T.vy += GRAV * dt;
    T.y += T.vy * dt;
    if (T.y >= GROUND) { T.y = GROUND; T.vy = 0; }
    if (T.mode === 'wet' && Math.random() < 0.4) spawn(T.x + rand(-6, 8), T.y - rand(4, 14), 0, 20, 0.4, '#8cc8f4', { g: 300, kind: 'drop' });
  },

  tokiImage() {
    const T = this.toki, S = ART.toki;
    if (T.y < GROUND - 0.5) return T.vy < 0 ? S.jump : S.fall;
    if (T.barkT > 0) return S.idleBark;
    switch (T.mode) {
      case 'run': case 'hop': case 'flee': return S.run[Math.floor(T.anim) % 4];
      case 'wet': return S.wetWet;
      case 'scared': return S.scared;
      default: return S.idle[Math.floor(Game.t * 4) % 2];
    }
  },

  draw() {
    const s = this.scenes[this.i];
    const cx = Math.round(this.cam);
    const shx = this.shake > 0 ? Math.round(rand(-3, 3)) : 0;
    ctx.save();
    ctx.translate(shx, 0);
    drawBG('sierras', cx, Game.t);
    for (const d of this.decos) {
      const x = Math.round(d.x - cx - d.img.width / 2);
      if (x > -60 && x < W + 20) ctx.drawImage(d.img, x, GROUND + 1 - d.img.height);
    }
    drawLayerImg(ART.bg.sierras.ground, 1, cx, GROUND - 2);

    if (this.tub) ctx.drawImage(ART.tub, Math.round(this.tub.x), GROUND - 18);
    for (const sg of this.sogas) {
      if (sg.dead) continue;
      const w = Math.max(2, Math.round(12 * Math.abs(Math.cos(sg.t * 3))));
      ctx.drawImage(ART.soga, Math.round(sg.x - w / 2), Math.round(sg.y - 6 + Math.sin(sg.t * 4) * 1.5), w, 12);
    }
    for (const a of this.animals) DRAW.animal(a, 0);

    const T = this.toki;
    if (T.mode !== 'hidden' && T.x < W + 30) {
      const shiver = T.mode === 'wet' ? Math.round(Math.sin(Game.t * 60)) : 0;
      ctx.drawImage(this.tokiImage(), Math.round(T.x) - 14 + shiver, Math.round(T.y) - 21);
      if (this.alertT > 0) drawText('!', Math.round(T.x) + 6, Math.round(T.y) - 36, '#ff4050', { outline: '#1a1020', scale: 2, align: 'center' });
    }
    if (this.cloud) ctx.drawImage(this.raining || this.i === 4 ? ART.cloudRain : ART.cloud, Math.round(this.cloud.x), this.cloud.y);
    drawParticles(0);
    drawTexts(0);
    ctx.restore();

    if (this.dark > 0.01) drawDim(this.dark, '#0a0a2a');
    if (this.flash > 0) drawDim(this.flash * 0.9, '#ffffff');

    if (s.big) {
      const k = clamp(this.t * 3, 0, 1);
      const maxS = Math.floor((W - 12) / textWidth(s.big));
      const sc = clamp(Math.round(1 + easeOutBack(k) * 3), 1, maxS);
      const jx = Math.round(rand(-1, 1)), jy = Math.round(rand(-1, 1));
      drawText(s.big, W / 2 + jx, 52 + jy, '#8cc8f4', { align: 'center', scale: sc, outline: '#0a1a3a', ow: 2, shadow: '#000814', sd: 3 });
    } else {
      drawDialog(s.text, this.typed, s.portrait);
    }
    drawText('SALTAR >', W - 6, 5, '#ffffff', { align: 'right', outline: '#1a1020' });
  },
};

// ================= Título =================
const Title = {
  start() {
    setState('title');
    this.cam = 0;
    Game.fade = 1;
    Sound.play('title');
  },
  buttons() {
    return { intro: { x: 4, y: H - 16, w: 58, h: 12 }, sound: { x: W - 16, y: 3, w: 13, h: 13 } };
  },
  update(dt) {
    this.cam += 50 * dt;
    const b = this.buttons();
    const p = Input.tap;
    if (p && inRect(p, b.sound)) { Sound.toggleMute(); return; }
    if ((p && inRect(p, b.intro)) || Input.keyI) { Sound.sfx('select'); Intro.start(); setState('intro'); Game.fade = 1; return; }
    if (Input.action && Game.stateT > 0.3) { Sound.sfx('select'); newGame(); Game.fade = 1; }
    if (Math.random() < dt * 8) spawn(this.cam + W / 2 - 22, GROUND - 1, rand(-40, -10), rand(-12, -4), 0.4, '#c89a6a', { kind: 'dust', size: 3 });
    updateParticles(dt);
  },
  draw() {
    const cx = Math.round(this.cam);
    drawBG('sierras', cx, Game.t);
    drawLayerImg(ART.bg.sierras.ground, 1, cx, GROUND - 2);
    drawParticles(cx);
    ctx.drawImage(ART.toki.run[Math.floor(Game.t * 12) % 4], Math.round(W / 2 - 28), GROUND - 21);
    const st = Game.t % 3;
    if (st < 1.5) {
      const w = Math.max(2, Math.round(12 * Math.abs(Math.cos(Game.t * 4))));
      ctx.drawImage(ART.soga, Math.round(W / 2 + 40 - st * 50 - w / 2), GROUND - 34, w, 12);
    }

    const bob = Math.round(Math.sin(Game.t * 2) * 2);
    drawLogo(Math.round(W / 2), 22 + bob, 5);
    const lw = textWidth('TOKI', 5);
    drawRope(Math.round(W / 2 - lw / 2 - 6), Math.round(W / 2 + lw / 2 + 6), 63 + bob);
    drawText('UNA AVENTURA EN CÓRDOBA', W / 2, 71, '#ffffff', { align: 'center', outline: '#2a1a3a' });

    if (blinkOn(1.2)) {
      drawText(IS_TOUCH ? 'TOCÁ PARA JUGAR' : 'PRESIONÁ ESPACIO O ENTER', W / 2, 92, '#ffd84a', { align: 'center', outline: '#3a1608' });
    }
    if (IS_TOUCH) {
      drawText('DERECHA: SALTAR   IZQUIERDA: LADRAR', W / 2, 108, '#fff4d8', { align: 'center', outline: '#1a1020' });
    } else {
      drawText('ESPACIO/^: SALTAR   X: LADRAR', W / 2, 108, '#fff4d8', { align: 'center', outline: '#1a1020' });
    }
    drawText(IS_TOUCH ? 'TOCÁ DOS VECES = SALTO DOBLE' : 'SALTÁ 2 VECES = SALTO DOBLE', W / 2, 119, '#c8e0ff', { align: 'center', outline: '#1a1020' });

    drawText('RÉCORD ' + String(Game.high).padStart(6, '0'), 5, 5, '#ffe070', { outline: '#1a1020' });
    const b = this.buttons();
    drawButtonFrame(b.intro);
    drawText('VER INTRO', b.intro.x + 3, b.intro.y + 3, '#ffffff');
    drawSoundButton(b.sound);
  },
};

// ================= Overlays de juego =================
function drawLevelIntro() {
  const k = clamp(Game.stateT * 4, 0, 1);
  const bw = Math.round(W * k);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#140e22';
  ctx.fillRect(Math.round(W / 2 - bw / 2), 42, bw, 70);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f0e0c0';
  ctx.fillRect(Math.round(W / 2 - bw / 2), 42, bw, 1);
  ctx.fillRect(Math.round(W / 2 - bw / 2), 111, bw, 1);
  if (k < 1) return;
  const n = Game.levelIndex + 1;
  const loop = L.loop > 0 ? ' - VUELTA ' + (L.loop + 1) : '';
  drawText('NIVEL ' + n + loop, W / 2, 50, '#ffd84a', { align: 'center', scale: 2, outline: '#3a1608' });
  drawText(L.def.name, W / 2, 70, '#ffffff', { align: 'center', outline: '#1a1020' });
  drawText(L.def.tip, W / 2, 86, '#9ad2f6', { align: 'center' });
  if (Game.stateT > 0.6 && blinkOn(2)) drawText('¡PREPARADA!', W / 2, 118, '#ffffff', { align: 'center', outline: '#1a1020' });
}

function pauseButtons() {
  return { menu: { x: Math.round(W / 2 - 30), y: 112, w: 60, h: 13 } };
}

function drawPause() {
  drawDim(0.6);
  drawText('PAUSA', W / 2, 52, '#ffd84a', { align: 'center', scale: 3, outline: '#3a1608' });
  drawText(IS_TOUCH ? 'TOCÁ PARA SEGUIR' : 'ESPACIO PARA SEGUIR', W / 2, 90, '#ffffff', { align: 'center', outline: '#1a1020' });
  const b = pauseButtons().menu;
  drawButtonFrame(b);
  drawText('MENÚ', b.x + b.w / 2, b.y + 3, '#ffffff', { align: 'center' });
}

function drawLevelDone() {
  if (Game.stateT < 0.7) return;
  const pw = 180, ph = 104, px = Math.round(W / 2 - pw / 2), py = 34;
  drawPanel(px, py, pw, ph);
  drawText('¡NIVEL COMPLETO!', W / 2, py + 8, '#ffd84a', { align: 'center', outline: '#3a1608' });
  const rows = [
    ['SOGAS', 'X' + L.sogas],
    ['ANIMALES', String(L.animals)],
    [L.damage ? 'TE MOJASTE...' : '¡SIN MOJARSE!', L.damage ? '+0' : '+' + L.bonus],
    ['PUNTOS', String(Game.score).padStart(6, '0')],
  ];
  rows.forEach(([a, b], i) => {
    if (Game.stateT < 0.9 + i * 0.25) return;
    const y = py + 26 + i * 13;
    drawText(a, px + 12, y, i === 3 ? '#ffe070' : '#fff4d8');
    drawText(b, px + pw - 12, y, i === 3 ? '#ffe070' : '#ffffff', { align: 'right' });
  });
  ctx.drawImage(ART.soga, px + pw - 12 - textWidth('X' + L.sogas) - 14, py + 23);
  if (Game.stateT > 1.8 && blinkOn(2)) drawText(IS_TOUCH ? 'TOCÁ PARA SEGUIR' : 'ESPACIO PARA SEGUIR', W / 2, py + ph - 14, '#ffffff', { align: 'center' });
}

// ================= Game Over =================
const GameOverScene = {
  buttons() { return { menu: { x: 6, y: H - 18, w: 40, h: 13 } }; },
  draw() {
    ctx.fillStyle = '#7fb0d0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#6a9cc0';
    for (let x = 0; x < W; x += 12) ctx.fillRect(x, 0, 1, 128);
    for (let y = 0; y < 128; y += 12) ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = '#e0dcd0'; ctx.fillRect(0, 128, W, H - 128);
    ctx.fillStyle = '#c8c4b8';
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 128, 1, H);
    for (let y = 136; y < H; y += 8) ctx.fillRect(0, y, W, 1);

    const cx = Math.round(W / 2);
    const shiver = Math.round(Math.sin(Game.t * 40));
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - 38, 0, 70, 97); ctx.clip();
    ctx.drawImage(ART.toki.wet, cx - 66 + shiver, 54, 84, 66);
    ctx.restore();
    ctx.drawImage(ART.tub, cx - 42, 76, 84, 57);
    drawParticles(0);

    drawText('¡TOKI TERMINÓ BAÑADA!', cx, 12, '#ffffff', { align: 'center', scale: 2, outline: '#0a1a3a' });
    drawText('PUNTOS ' + String(Game.score).padStart(6, '0'), cx, 36, '#ffe070', { align: 'center', outline: '#1a1020' });
    drawText('RÉCORD ' + String(Game.high).padStart(6, '0'), cx, 47, '#ffffff', { align: 'center', outline: '#1a1020' });
    if (Game.stateT > 1.2 && blinkOn(1.5)) drawText(IS_TOUCH ? 'TOCÁ PARA REINTENTAR' : 'ESPACIO PARA REINTENTAR', cx, 150, '#1a2240', { align: 'center' });
    const b = this.buttons().menu;
    drawButtonFrame(b);
    drawText('MENÚ', b.x + b.w / 2, b.y + 3, '#ffffff', { align: 'center' });
  },
  update(dt) {
    if (Math.random() < dt * 6) spawn(W / 2 + rand(-30, 30), 82, rand(-8, 8), -20, 1.2, '#f4fbff', { kind: 'bubble' });
    if (Math.random() < dt * 4) spawn(W / 2 + rand(-20, 20), 70, rand(-30, 30), -40, 0.6, '#8cc8f4', { g: 200, kind: 'drop' });
    updateParticles(dt);
    if (Game.stateT > 1.2) {
      const p = Input.tap;
      if (p && inRect(p, this.buttons().menu)) { Sound.sfx('select'); Title.start(); return; }
      if (Input.esc) { Title.start(); return; }
      if (Input.action) { Sound.sfx('select'); particles = []; retryLevel(); Game.fade = 1; }
    }
  },
};

// ================= Victoria =================
const VictoryScene = {
  start() {
    setState('victory');
    particles = []; texts = [];
    Game.fade = 1;
    Sound.sfx('victory');
    setTimeout(() => { if (Game.state === 'victory') Sound.play('title'); }, 1400);
  },
  update(dt) {
    if (Math.random() < dt * 10) spawn(rand(0, W), -4, rand(-10, 10), rand(30, 60), 4, choice(['#ffd84a', '#ff7aa8', '#8cd0ff', '#9ae070', '#ffffff']), { size: 2 });
    updateParticles(dt);
    if (Game.stateT > 2 && Input.action) {
      Sound.sfx('select');
      particles = [];
      startLevel(Game.levelIndex + 1);
      Game.fade = 1;
    }
  },
  draw() {
    const B = ART.bg.docta;
    ctx.drawImage(B.sky, 0, 0);
    drawLayerImg(B.clouds, 0.05, Game.t * 100);
    drawLayerImg(B.far, 0.1, 400);
    drawLayerImg(B.city, 0.18, 400);
    drawLayerImg(B.houses, 0.45, 400);
    drawLayerImg(B.ground, 1, 0, GROUND - 2);
    const hx = Math.round(W / 2 - 40);
    const home = DECO_IMG.home;
    ctx.drawImage(home, hx, GROUND + 1 - home.height);
    ctx.drawImage(ART.toki.idle[Math.floor(Game.t * 4) % 2], hx + 120, GROUND - 21);
    ctx.drawImage(ART.soga, hx + 142, GROUND - 11);
    ctx.drawImage(ART.soga, hx + 150, GROUND - 11);
    drawParticles(0);
    const bob = Math.round(Math.sin(Game.t * 3) * 2);
    drawText('¡TOKI LLEGÓ A CASA!', W / 2, 10 + bob, '#ffd84a', { align: 'center', scale: 2, outline: '#3a1608' });
    drawText('...Y SIN BAÑARSE. ¡POR HOY!', W / 2, 32, '#ffffff', { align: 'center', outline: '#1a1020' });
    drawText('PUNTOS ' + String(Game.score).padStart(6, '0') + '   RÉCORD ' + String(Game.high).padStart(6, '0'), W / 2, 45, '#ffe070', { align: 'center', outline: '#1a1020' });
    if (Game.stateT > 2 && blinkOn(1.5)) {
      drawText(IS_TOUCH ? 'TOCÁ PARA SEGUIR JUGANDO' : 'ESPACIO PARA SEGUIR JUGANDO', W / 2, 60, '#ffffff', { align: 'center', outline: '#1a1020' });
      drawText('(¡MÁS RÁPIDO!)', W / 2, 71, '#ff9ad0', { align: 'center', outline: '#1a1020' });
    }
  },
};

'use strict';

const Input = {
  jumpHeld: false, jumpPressed: false, barkPressed: false, action: false, esc: false, keyI: false,
  tap: null, jumpPointer: null, barkFlash: 0,
  endFrame() {
    this.jumpPressed = false; this.barkPressed = false; this.action = false;
    this.esc = false; this.keyI = false; this.tap = null;
  },
};

function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

function tryFullscreen() {
  if (!IS_TOUCH || document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const lock = () => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); };
  if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(lock).catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function pauseGame() {
  if (Game.state !== 'play') return;
  setState('paused');
  Input.jumpHeld = false;
  Sound.suspend();
}

function resumeGame() {
  setState('play');
  Sound.resume();
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  Sound.init();
  if (Game.state === 'boot' || Game.state === 'title') tryFullscreen();
  const p = toGame(e);
  Input.tap = p;
  if (Game.state === 'play') {
    const b = hudButtons();
    if (inRect(p, b.pause)) { pauseGame(); return; }
    if (inRect(p, b.sound)) { Sound.toggleMute(); return; }
    if (p.x > W * 0.42) {
      Input.jumpHeld = true;
      Input.jumpPressed = true;
      Input.jumpPointer = e.pointerId;
    } else {
      Input.barkPressed = true;
      Input.barkFlash = 0.15;
    }
  } else {
    Input.action = true;
  }
});

function releasePointer(e) {
  if (e.pointerId === Input.jumpPointer) {
    Input.jumpHeld = false;
    Input.jumpPointer = null;
  }
}
canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointercancel', releasePointer);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'];
const BARK_KEYS = ['KeyX', 'KeyC', 'KeyB', 'ShiftLeft', 'ShiftRight', 'ArrowRight'];

window.addEventListener('keydown', (e) => {
  const k = e.code;
  if (k === 'Space' || k.startsWith('Arrow')) e.preventDefault();
  Sound.init();
  if (e.repeat) return;
  if (JUMP_KEYS.includes(k)) { Input.jumpHeld = true; Input.jumpPressed = true; Input.action = true; }
  if (BARK_KEYS.includes(k)) { Input.barkPressed = true; Input.barkFlash = 0.15; }
  if (k === 'Enter') Input.action = true;
  if (k === 'Escape' || k === 'KeyP') Input.esc = true;
  if (k === 'KeyM') Sound.toggleMute();
  if (k === 'KeyI') Input.keyI = true;
});

window.addEventListener('keyup', (e) => {
  if (JUMP_KEYS.includes(e.code)) Input.jumpHeld = false;
});

window.addEventListener('blur', () => {
  Input.jumpHeld = false;
  pauseGame();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pauseGame(); Sound.suspend(); }
  else if (Game.state !== 'paused') Sound.resume();
});

// ================= Bucle =================
function update(dt) {
  switch (Game.state) {
    case 'boot': Boot.update(dt); break;
    case 'intro': Intro.update(dt); break;
    case 'title': Title.update(dt); break;
    case 'levelIntro':
      updateParticles(dt);
      if (Game.stateT > 2.8 || (Input.action && Game.stateT > 0.5)) {
        setState('play');
        floatText(toki.x + 8, toki.y - 32, '¡VAMOS TOKI!', '#ffe070', 1.2);
      }
      break;
    case 'play':
      if (Input.esc) { pauseGame(); break; }
      updateWorld(dt, true);
      break;
    case 'paused': {
      const p = Input.tap;
      if (p && inRect(p, hudButtons().sound)) { Sound.toggleMute(); break; }
      if (p && inRect(p, pauseButtons().menu)) { Sound.resume(); Sound.sfx('select'); Title.start(); break; }
      if (Input.action || Input.esc) resumeGame();
      break;
    }
    case 'levelDone':
      updateWorld(dt, false);
      if (Game.stateT > 1.8 && Input.action) {
        Sound.sfx('select');
        if (L.theme === 'docta') VictoryScene.start();
        else { startLevel(Game.levelIndex + 1); Game.fade = 1; }
      }
      break;
    case 'gameover': GameOverScene.update(dt); break;
    case 'victory': VictoryScene.update(dt); break;
  }
}

function render() {
  ctx.imageSmoothingEnabled = false;
  switch (Game.state) {
    case 'boot': Boot.draw(); break;
    case 'intro': Intro.draw(); break;
    case 'title': Title.draw(); break;
    case 'levelIntro': drawWorld(); drawHUD(); drawLevelIntro(); break;
    case 'play': drawWorld(); drawHUD(); break;
    case 'paused': drawWorld(); drawHUD(); drawPause(); break;
    case 'levelDone': drawWorld(); drawHUD(); drawLevelDone(); break;
    case 'gameover': GameOverScene.draw(); break;
    case 'victory': VictoryScene.draw(); break;
  }
  if (Game.fade > 0) drawDim(Game.fade, '#000000');
}

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  Game.t += dt;
  Game.stateT += dt;
  Game.fade = Math.max(0, Game.fade - dt * 2.5);
  Input.barkFlash -= dt;
  update(dt);
  render();
  Input.endFrame();
  requestAnimationFrame(frame);
}

buildArt();
buildGameArt();
requestAnimationFrame(frame);

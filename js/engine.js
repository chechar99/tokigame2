'use strict';

// ---------- Pantalla ----------
const H = 180;
const GROUND = 150;
let W = 320;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function resize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  W = Math.max(250, Math.min(420, Math.round(H * vw / vh)));
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const s = Math.min(vw / W, vh / H);
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.style.left = Math.floor((vw - W * s) / 2) + 'px';
  canvas.style.top = Math.floor((vh - H * s) / 2) + 'px';
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();

// ---------- Utilidades ----------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weighted(list) {
  let sum = 0;
  for (const it of list) sum += it[1];
  let r = Math.random() * sum;
  for (const it of list) {
    r -= it[1];
    if (r < 0) return it[0];
  }
  return list[list.length - 1][0];
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---------- Sprites ----------
function addOutline(c, col) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const a = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  const [r, gg, b] = hexToRgb(col);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (a[i]) continue;
      if ((x > 0 && a[i - 1]) || (x < w - 1 && a[i + 1]) || (y > 0 && a[i - w]) || (y < h - 1 && a[i + w])) {
        d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);
}

function painter(g, ox = 0, oy = 0) {
  return {
    g,
    r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x) + ox, Math.round(y) + oy, Math.round(w), Math.round(h)); },
    p(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x) + ox, Math.round(y) + oy, 1, 1); },
    e(cx, cy, rx, ry, col) {
      g.fillStyle = col;
      for (let y = Math.floor(-ry); y <= Math.ceil(ry); y++) {
        for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
          if ((x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01) <= 1) {
            g.fillRect(Math.round(cx + x) + ox, Math.round(cy + y) + oy, 1, 1);
          }
        }
      }
    },
    clear(x, y, w, h) { g.clearRect(x + ox, y + oy, w, h); },
    map(rows, pal, x0 = 0, y0 = 0) {
      rows.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const col = pal[row[x]];
          if (col) { g.fillStyle = col; g.fillRect(x0 + x + ox, y0 + y + oy, 1, 1); }
        }
      });
    },
  };
}

function sprite(w, h, fn, outline = '#1e1218', ox = 0, oy = 0) {
  const c = makeCanvas(w, h);
  fn(painter(c.getContext('2d'), ox, oy));
  if (outline) addOutline(c, outline);
  return c;
}

function flipH(src) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

function tint(src, col, alpha) {
  const c = makeCanvas(src.width, src.height);
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.globalAlpha = alpha;
  g.fillStyle = col;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- Fuente pixel 5x7 ----------
const FONT_SRC = {
  A: '01110|10001|10001|11111|10001|10001|10001', B: '11110|10001|10001|11110|10001|10001|11110',
  C: '01110|10001|10000|10000|10000|10001|01110', D: '11110|10001|10001|10001|10001|10001|11110',
  E: '11111|10000|10000|11110|10000|10000|11111', F: '11111|10000|10000|11110|10000|10000|10000',
  G: '01110|10001|10000|10111|10001|10001|01111', H: '10001|10001|10001|11111|10001|10001|10001',
  I: '01110|00100|00100|00100|00100|00100|01110', J: '00111|00010|00010|00010|00010|10010|01100',
  K: '10001|10010|10100|11000|10100|10010|10001', L: '10000|10000|10000|10000|10000|10000|11111',
  M: '10001|11011|10101|10101|10001|10001|10001', N: '10001|10001|11001|10101|10011|10001|10001',
  O: '01110|10001|10001|10001|10001|10001|01110', P: '11110|10001|10001|11110|10000|10000|10000',
  Q: '01110|10001|10001|10001|10101|10010|01101', R: '11110|10001|10001|11110|10100|10010|10001',
  S: '01111|10000|10000|01110|00001|00001|11110', T: '11111|00100|00100|00100|00100|00100|00100',
  U: '10001|10001|10001|10001|10001|10001|01110', V: '10001|10001|10001|10001|10001|01010|00100',
  W: '10001|10001|10001|10101|10101|10101|01010', X: '10001|10001|01010|00100|01010|10001|10001',
  Y: '10001|10001|01010|00100|00100|00100|00100', Z: '11111|00001|00010|00100|01000|10000|11111',
  0: '01110|10001|10011|10101|11001|10001|01110', 1: '00100|01100|00100|00100|00100|00100|01110',
  2: '01110|10001|00001|00010|00100|01000|11111', 3: '11111|00010|00100|00010|00001|10001|01110',
  4: '00010|00110|01010|10010|11111|00010|00010', 5: '11111|10000|11110|00001|00001|10001|01110',
  6: '00110|01000|10000|11110|10001|10001|01110', 7: '11111|00001|00010|00100|01000|01000|01000',
  8: '01110|10001|10001|01110|10001|10001|01110', 9: '01110|10001|10001|01111|00001|00010|01100',
  '.': '00000|00000|00000|00000|00000|01100|01100', ',': '00000|00000|00000|00000|01100|00100|01000',
  '!': '00100|00100|00100|00100|00100|00000|00100', '¡': '00100|00000|00100|00100|00100|00100|00100',
  '?': '01110|10001|00001|00010|00100|00000|00100', '¿': '00100|00000|00100|01000|10000|10001|01110',
  ':': '00000|01100|01100|00000|01100|01100|00000', '-': '00000|00000|00000|11111|00000|00000|00000',
  '+': '00000|00100|00100|11111|00100|00100|00000', '/': '00001|00010|00010|00100|01000|01000|10000',
  '(': '00010|00100|01000|01000|01000|00100|00010', ')': '01000|00100|00010|00010|00010|00100|01000',
  '>': '10000|01000|00100|00010|00100|01000|10000', '<': '00001|00010|00100|01000|00100|00010|00001',
  '=': '00000|00000|11111|00000|11111|00000|00000', '*': '00000|00100|10101|01110|10101|00100|00000',
  "'": '00100|00100|01000|00000|00000|00000|00000', '"': '01010|01010|00000|00000|00000|00000|00000',
  '°': '01100|10010|01100|00000|00000|00000|00000', '♥': '00000|01010|11111|11111|01110|00100|00000',
  '^': '00100|01110|10101|00100|00100|00100|00100', '_': '00000|00000|00000|00000|00000|00000|11111',
};
const FONT = {};
for (const k in FONT_SRC) FONT[k] = FONT_SRC[k].replace(/\|/g, '');
const ACCENT = { 'Á': ['A', 'a'], 'É': ['E', 'a'], 'Í': ['I', 'a'], 'Ó': ['O', 'a'], 'Ú': ['U', 'a'], 'Ñ': ['N', 't'], 'Ü': ['U', 'd'] };
const ACCENT_PIX = { a: [[3, 0], [2, 1]], t: [[1, 0], [2, 0], [4, 0], [0, 1], [3, 1]], d: [[1, 1], [3, 1]] };
const glyphCache = {};

function getGlyph(ch, col) {
  const key = ch + col;
  if (glyphCache[key]) return glyphCache[key];
  let base = ch, acc = null;
  if (ACCENT[ch]) { base = ACCENT[ch][0]; acc = ACCENT[ch][1]; }
  const bits = FONT[base];
  if (!bits) return null;
  const c = makeCanvas(5, 10);
  const g = c.getContext('2d');
  g.fillStyle = col;
  for (let i = 0; i < 35; i++) if (bits[i] === '1') g.fillRect(i % 5, 3 + Math.floor(i / 5), 1, 1);
  if (acc) for (const [x, y] of ACCENT_PIX[acc]) g.fillRect(x, y, 1, 1);
  glyphCache[key] = c;
  return c;
}

function textWidth(str, scale = 1) {
  return Math.max(0, str.length * 6 - 1) * scale;
}

function drawTextLine(line, x, y, col, s, c = ctx) {
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === ' ') continue;
    const g = getGlyph(ch, col);
    if (g) c.drawImage(g, Math.round(x + i * 6 * s), Math.round(y - 3 * s), 5 * s, 10 * s);
  }
}

// y = parte superior de las letras mayúsculas
function drawText(str, x, y, col = '#ffffff', opt = {}) {
  const s = opt.scale || 1;
  const lines = String(str).toUpperCase().split('\n');
  const lh = (opt.lh || 10) * s;
  const c = opt.ctx || ctx;
  lines.forEach((line, li) => {
    const w = textWidth(line, s);
    let lx = x;
    if (opt.align === 'center') lx = x - Math.floor(w / 2);
    else if (opt.align === 'right') lx = x - w;
    const ly = y + li * lh;
    if (opt.shadow) drawTextLine(line, lx + (opt.sd || s), ly + (opt.sd || s), opt.shadow, s, c);
    if (opt.outline) {
      const o = opt.ow || 1;
      for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]]) {
        drawTextLine(line, lx + dx, ly + dy, opt.outline, s, c);
      }
    }
    drawTextLine(line, lx, ly, col, s, c);
  });
}

function wrapText(str, maxChars) {
  const out = [];
  for (const para of str.split('\n')) {
    let cur = '';
    for (const word of para.split(' ')) {
      if (cur && (cur + ' ' + word).length > maxChars) { out.push(cur); cur = word; }
      else cur = cur ? cur + ' ' + word : word;
    }
    out.push(cur);
  }
  return out;
}

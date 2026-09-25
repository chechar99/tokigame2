'use strict';

const Sound = (() => {
  let ac = null, master, musicG, sfxG, noiseBuf;
  let muted = localStorage.getItem('toki_muted') === '1';
  let song = null, songName = null, step = 0, nextT = 0, timer = null;

  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) {
    const m = n.match(/^([A-G])(#|b)?(\d)$/);
    return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const mfreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const freq = (n) => (typeof n === 'number' ? mfreq(n) : mfreq(midi(n)));

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ac.destination);
    musicG = ac.createGain(); musicG.gain.value = 0.3; musicG.connect(master);
    sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (songName) { const n = songName; songName = null; play(n); }
  }

  function toneAt(t, f, dur, type = 'square', vol = 0.2, f2 = null, dest = null) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noiseAt(t, dur, vol = 0.2, filt = 1000, filt2 = null, type = 'lowpass', dest = null) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(filt, t);
    if (filt2) f.frequency.exponentialRampToValueAtTime(filt2, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxG);
    s.start(t); s.stop(t + dur + 0.03);
  }

  const tone = (f, dur, type, vol, f2, delay = 0) => ac && toneAt(ac.currentTime + delay, f, dur, type, vol, f2);
  const noise = (dur, vol, filt, filt2, delay = 0, type) => ac && noiseAt(ac.currentTime + delay, dur, vol, filt, filt2, type);
  const seq = (notes, stepT, type = 'square', vol = 0.15, len = 0.9) => {
    notes.forEach((n, i) => { if (n) tone(freq(n), stepT * len, type, vol, null, i * stepT); });
  };

  const SFX = {
    jump() { tone(260, 0.14, 'square', 0.12, 560); },
    djump() { tone(420, 0.14, 'square', 0.12, 900); noise(0.1, 0.08, 3000, 800, 0, 'bandpass'); },
    soga() { tone(988, 0.05, 'square', 0.1); tone(1319, 0.14, 'square', 0.1, null, 0.05); },
    bark() {
      noise(0.07, 0.3, 1400, 300);
      tone(330, 0.13, 'sawtooth', 0.22, 150);
      tone(165, 0.13, 'square', 0.1, 90);
    },
    cat() { tone(700, 0.08, 'triangle', 0.16, 1100); tone(1100, 0.2, 'triangle', 0.14, 500, 0.08); },
    bird() { for (let i = 0; i < 3; i++) tone(2000 + i * 200, 0.05, 'triangle', 0.1, 2800, i * 0.06); },
    hare() { tone(500, 0.06, 'square', 0.08, 900); tone(600, 0.06, 'square', 0.08, 1000, 0.08); },
    splash() { noise(0.5, 0.35, 3500, 250); tone(600, 0.25, 'sine', 0.15, 120); },
    hurt() { tone(520, 0.3, 'square', 0.12, 110); },
    power() { seq(['C5', 'E5', 'G5', 'C6', 'E6'], 0.06, 'square', 0.12); },
    heart() { seq(['E5', 'A5', 'C#6', 'E6'], 0.07, 'triangle', 0.2); },
    land() { noise(0.05, 0.08, 500); },
    select() { tone(660, 0.05, 'square', 0.1); tone(990, 0.08, 'square', 0.1, null, 0.05); },
    thunder() { noise(1.6, 0.55, 500, 50); noise(0.3, 0.4, 3000, 400); },
    sting() { tone(233, 0.9, 'sawtooth', 0.18, 116); tone(220, 0.9, 'square', 0.12, 110); noise(1.2, 0.3, 400, 60); },
    shock() { tone(1200, 0.15, 'square', 0.12, 1800); tone(1600, 0.2, 'square', 0.1, 2400, 0.1); },
    umbrella() { noise(0.12, 0.12, 5000, 1500, 0, 'bandpass'); tone(1500, 0.06, 'triangle', 0.08); },
    levelDone() { seq(['C5', 'E5', 'G5', 'C6', '', 'G5', 'C6'], 0.11, 'square', 0.14); seq(['C3', '', 'G3', '', 'C4', '', 'C4'], 0.11, 'triangle', 0.25); },
    victory() { seq(['G4', 'C5', 'E5', 'G5', '', 'E5', 'G5', '', 'C6', 'C6'], 0.12, 'square', 0.14); seq(['C3', '', 'E3', '', 'G3', '', 'C4', '', 'C3', ''], 0.12, 'triangle', 0.25); },
    gameover() { seq(['G4', '', 'E4', '', 'C4', '', 'B3', 'C4'], 0.18, 'triangle', 0.25, 1.2); },
    whoosh() { noise(0.3, 0.15, 400, 3000, 0, 'bandpass'); },
    blip() { tone(740, 0.025, 'square', 0.035); },
  };

  function sfx(name) {
    if (!ac || muted) return;
    if (SFX[name]) SFX[name]();
  }

  // ---------- Música ----------
  function bassLine(roots, pattern) {
    const out = [];
    for (const r of roots) {
      const m = midi(r);
      for (const p of pattern) out.push(p === 'r' ? m : p === 'f' ? m + 7 : p === 'o' ? m + 12 : p === 't' ? m + 3 : '');
    }
    return out;
  }
  const S = (s) => s.split(' ').map((x) => (x === '-' ? '' : x));

  const SONGS = {
    title: {
      step: 0.19,
      tracks: [
        { wave: 'square', vol: 0.08, gate: 0.8, notes: S('G4 - C5 - E5 - D5 C5 D5 - - - G4 - - - A4 - C5 - F5 - E5 D5 E5 - - - - - - - G4 - C5 - E5 - G5 E5 F5 - D5 - B4 - - - C5 - D5 - E5 - D5 B4 C5 - - - - - - -') },
        { wave: 'triangle', vol: 0.22, gate: 0.9, notes: bassLine(['C3', 'G2', 'F2', 'C3', 'C3', 'G2', 'F2', 'C3'], ['r', '', 'f', '', 'o', '', 'f', '']) },
        { wave: 'triangle', vol: 0.05, gate: 0.5, notes: S('C6 E6 G6 E6 C6 E6 G6 E6 B5 D6 G6 D6 B5 D6 G6 D6 A5 C6 F6 C6 A5 C6 F6 C6 G5 C6 E6 C6 G5 C6 E6 C6') },
      ],
    },
    sierras: {
      step: 0.15,
      tracks: [
        { wave: 'square', vol: 0.09, gate: 0.75, notes: S('E5 - E5 D5 C5 B4 C5 - A4 - E4 - A4 - B4 C5 D5 E5 D5 - B4 - G4 - E5 - E5 F5 E5 D5 C5 - B4 A4 - G#4 A4 B4 C5 B4 A4 G#4 A4 - - E4 - -') },
        { wave: 'triangle', vol: 0.26, gate: 0.85, notes: bassLine(['A2', 'A2', 'F2', 'G2', 'A2', 'D2', 'E2', 'A2'], ['r', '', '', 'f', '', 'o']) },
        { drum: true, notes: S('k - h k h - k - h k h s') },
      ],
    },
    docta: {
      step: 0.13,
      tracks: [
        { wave: 'square', vol: 0.085, gate: 0.7, notes: S('D5 - F#5 - A5 - F#5 - G5 - E5 - C#5 - E5 - F#5 - D5 - A4 - D5 - E5 - C#5 - A4 - - - B4 - D5 - G5 - F#5 E5 F#5 - A5 - D5 - - - E5 - E5 F#5 G5 - E5 - D5 - - - A4 - D5 -') },
        { wave: 'triangle', vol: 0.26, gate: 0.8, notes: bassLine(['D3', 'A2', 'D3', 'A2', 'G2', 'D3', 'A2', 'D3'], ['r', '', 'o', '', 'r', '', 'o', 'f']) },
        { drum: true, notes: S('k - h - s - h h k - h k s - h -') },
      ],
    },
    storm: {
      step: 0.22,
      tracks: [
        { wave: 'triangle', vol: 0.25, gate: 0.95, notes: bassLine(['A2', 'G#2', 'G2', 'F#2'], ['r', '', '', '', 't', '', '', '']) },
        { wave: 'sawtooth', vol: 0.04, gate: 0.9, notes: S('E5 - - - D#5 - - - D5 - - - C#5 - - -') },
      ],
    },
  };

  function playNote(t, tr, n) {
    if (tr.drum) {
      if (n === 'k') toneAt(t, 150, 0.12, 'sine', 0.5, 40, musicG);
      else if (n === 's') { noiseAt(t, 0.12, 0.2, 2500, 700, 'bandpass', musicG); toneAt(t, 200, 0.06, 'triangle', 0.15, 120, musicG); }
      else if (n === 'h') noiseAt(t, 0.04, 0.1, 7000, null, 'highpass', musicG);
      return;
    }
    const f = typeof n === 'number' ? mfreq(n) : freq(n);
    toneAt(t, f, song.step * (tr.gate || 0.8), tr.wave, tr.vol, null, musicG);
  }

  function schedule() {
    if (!ac || !song) return;
    if (nextT < ac.currentTime - 0.3) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.15) {
      for (const tr of song.tracks) {
        const n = tr.notes[step % tr.notes.length];
        if (n !== '' && n !== undefined) playNote(nextT, tr, n);
      }
      nextT += song.step;
      step++;
    }
  }

  function play(name) {
    if (songName === name && timer) return;
    stop();
    songName = name;
    if (!ac) return;
    song = SONGS[name];
    step = 0;
    nextT = ac.currentTime + 0.08;
    timer = setInterval(schedule, 25);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    song = null;
    songName = null;
  }

  function setMuted(m) {
    muted = m;
    localStorage.setItem('toki_muted', m ? '1' : '0');
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.6, ac.currentTime, 0.02);
  }

  function suspend() { if (ac && ac.state === 'running') ac.suspend(); }
  function resume() { if (ac && ac.state === 'suspended') ac.resume(); }

  return {
    init, sfx, play, stop, suspend, resume,
    get muted() { return muted; },
    toggleMute() { setMuted(!muted); },
  };
})();

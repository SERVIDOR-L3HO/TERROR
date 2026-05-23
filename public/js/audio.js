// ═══════════════════════════════════════════════
// HORROR AUDIO ENGINE — Voice Synthesis + Presets
// ═══════════════════════════════════════════════

// TikTok horror style: natural pitch 1.0, clear & slightly slow — like real TikTok horror narrators
const PRESETS = {
  tiktok:   { rate: 0.88, pitch: 1.00, label: 'TikTok',   icon: '📱', desc: 'Natural & claro'     },
  dramatico:{ rate: 0.80, pitch: 0.95, label: 'Dramático', icon: '🕯', desc: 'Suave & tenso'       },
  ritual:   { rate: 0.72, pitch: 0.90, label: 'Ritual',   icon: '💀', desc: 'Pausado & grave'      },
  susurro:  { rate: 0.75, pitch: 1.08, label: 'Susurro',  icon: '👁',  desc: 'Íntimo & susurrante' },
};
let activePreset    = 'tiktok';
let currentPlayingId = null;
let isPlaying        = false;
let currentUtterance = null;
let availableVoices  = [];
let waveformInterval = null;

// ── Load & filter voices ──
function loadVoices() {
  availableVoices = window.speechSynthesis.getVoices();
  if (!availableVoices.length) {
    window.speechSynthesis.onvoiceschanged = () => {
      availableVoices = window.speechSynthesis.getVoices();
      document.querySelectorAll('.voice-select-simple, .voice-picker').forEach(s => populateSelect(s));
    };
  } else {
    document.querySelectorAll('.voice-select-simple, .voice-picker').forEach(s => populateSelect(s));
  }
}

function populateSelect(sel) {
  if (!sel) return;
  const saved = sel.value;
  sel.innerHTML = '<option value="">🎙 Voz del sistema</option>';

  const es = availableVoices.filter(v => v.lang.startsWith('es'));
  if (es.length) {
    const g = document.createElement('optgroup');
    g.label = '🇪🇸 Español';
    es.forEach(v => {
      const o = document.createElement('option');
      o.value = v.name;
      // Clean name for display
      let name = v.name.replace(/Microsoft |Google |Apple /gi,'').trim();
      o.textContent = name;
      g.appendChild(o);
    });
    sel.appendChild(g);
  }

  // If no Spanish voices, add best English options
  if (!es.length) {
    const eng = availableVoices.filter(v => v.lang.startsWith('en')).slice(0, 6);
    if (eng.length) {
      const g = document.createElement('optgroup');
      g.label = '🌐 English';
      eng.forEach(v => {
        const o = document.createElement('option');
        o.value = v.name;
        o.textContent = v.name.replace(/Microsoft |Google |Apple /gi,'').trim();
        g.appendChild(o);
      });
      sel.appendChild(g);
    }
  }
  if (saved) sel.value = saved;
}

window.populateVoices = function(idOrEl) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (el) populateSelect(el);
};

// ── Apply horror preset ──
window.applyVoicePreset = function(btn) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activePreset = btn.dataset.preset;
};

// ── Waveform ──
window.buildWaveform = function(id, bars = 44) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array.from({ length: bars }, (_, i) => {
    const h = Math.sin(i * 0.55) * 14 + Math.random() * 12 + 5;
    return `<div class="wave-bar" style="height:${h}px;"></div>`;
  }).join('');
};

function animateWave(id) {
  stopWave();
  waveformInterval = setInterval(() => {
    const el = document.getElementById(id);
    if (!el) { stopWave(); return; }
    el.querySelectorAll('.wave-bar').forEach(b => {
      b.style.height = (Math.random() * 32 + 5) + 'px';
      b.classList.add('active');
    });
  }, 100);
}

function stopWave() {
  if (waveformInterval) { clearInterval(waveformInterval); waveformInterval = null; }
}

function resetWave(id) {
  stopWave();
  const el = document.getElementById(id);
  if (!el) return;
  el.querySelectorAll('.wave-bar').forEach(b => { b.classList.remove('active'); b.style.height = '6px'; });
}

// ── Voice picker ──
// Priority order for best natural Spanish voices (TikTok-style clarity)
const VOICE_PRIORITY = [
  'Google español de Estados Unidos',
  'Google español',
  'Microsoft Sabina Online (Natural)',
  'Microsoft Sabina',
  'Mónica',
  'Microsoft Pablo Online (Natural)',
  'Microsoft Pablo',
  'Paulina',
  'Jorge',
  'Google español de Argentina',
  'Google Spanish',
];

function pickVoice(selId) {
  const sel = document.getElementById(selId);
  const name = sel ? sel.value : '';
  // User manually selected a voice
  if (name) {
    const v = availableVoices.find(v => v.name === name);
    if (v) return v;
  }
  // Try priority list first for best natural TikTok-style voice
  for (const pname of VOICE_PRIORITY) {
    const v = availableVoices.find(v => v.name.toLowerCase().includes(pname.toLowerCase()));
    if (v) return v;
  }
  // Any Spanish voice
  const esVoice = availableVoices.find(v => v.lang.startsWith('es'));
  return esVoice || null;
}

function buildUtterance(text, selId) {
  const p   = PRESETS[activePreset] || PRESETS.ritual;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang   = 'es-ES';
  utt.rate   = p.rate;
  utt.pitch  = p.pitch;
  utt.volume = 1;
  const voice = pickVoice(selId);
  if (voice) utt.voice = voice;
  return utt;
}

function stopAll() {
  window.speechSynthesis.cancel();
  isPlaying = false; currentPlayingId = null; stopWave();
}

// ── Main story player ──
window.toggleStoryAudio = function(id, title, text, playBtnId, waveId, statusId, _ignored) {
  const playBtn  = document.getElementById(playBtnId);
  const statusEl = document.getElementById(statusId);

  if (currentPlayingId === id && isPlaying) {
    stopAll();
    if (playBtn)  { playBtn.innerHTML = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Pausado';
    resetWave(waveId); return;
  }

  stopAll(); stopAllMiniPlayers();
  currentPlayingId = id; isPlaying = true;

  if (playBtn)  { playBtn.innerHTML = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'Narrando...';
  window.buildWaveform(waveId, 50);
  animateWave(waveId);

  const utt = buildUtterance(`${title}. ${text}`, 'mainVoiceSelect');
  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null; stopWave();
    if (playBtn)  { playBtn.innerHTML = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = '— Fin —';
    resetWave(waveId);
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// ── Mini card player ──
function stopAllMiniPlayers() {
  document.querySelectorAll('.mini-play-btn').forEach(b => b.textContent = '▶');
  document.querySelectorAll('.mini-wave').forEach(w => w.classList.remove('playing'));
}

window.playCardAudio = function(id, title, text) {
  const btn  = document.getElementById(`miniplay-${id}`);
  const wave = document.getElementById(`miniwave-${id}`);

  if (currentPlayingId === `mini-${id}` && isPlaying) {
    stopAll(); stopAllMiniPlayers(); return;
  }
  stopAll(); stopAllMiniPlayers();
  currentPlayingId = `mini-${id}`; isPlaying = true;

  if (btn)  btn.textContent = '⏸';
  if (wave) wave.classList.add('playing');

  const utt = buildUtterance(`${title}. ${text}`, '');
  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null;
    if (btn)  btn.textContent = '▶';
    if (wave) wave.classList.remove('playing');
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// ── Preview (subir page) ──
window.previewAudio = function() {
  const titulo   = document.getElementById('titulo');
  const historia = document.getElementById('historia');
  const playBtn  = document.getElementById('previewPlayBtn');
  const statusEl = document.getElementById('previewStatus');
  if (!titulo || !historia) return;

  const snippet = `${titulo.value || 'Sin título'}. ${(historia.value || 'Escribe tu historia para escuchar la vista previa.').substring(0, 500)}`;

  if (currentPlayingId === 'preview' && isPlaying) {
    stopAll();
    if (playBtn)  { playBtn.innerHTML = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Listo';
    resetWave('previewWaveform'); return;
  }
  stopAll();
  currentPlayingId = 'preview'; isPlaying = true;
  if (playBtn)  { playBtn.innerHTML = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'Narrando...';
  window.buildWaveform('previewWaveform', 40);
  animateWave('previewWaveform');

  const utt = buildUtterance(snippet, 'voiceSelect');
  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null; stopWave();
    if (playBtn)  { playBtn.innerHTML = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Listo';
    resetWave('previewWaveform');
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// ── Build voice panel HTML ──
window.buildVoicePanel = function(playBtnId, waveId, statusId, voiceSelId) {
  const presetsHtml = Object.entries(PRESETS).map(([key, p]) =>
    `<button class="preset-btn${key==='ritual'?' active':''}" data-preset="${key}" onclick="applyVoicePreset(this)">
      <span class="preset-icon">${p.icon}</span>
      <span class="preset-name">${p.label}</span>
      <span class="preset-desc">${p.desc}</span>
    </button>`
  ).join('');

  return `
    <div class="audio-player">
      <div class="audio-player-header">
        <div class="audio-icon">🎙</div>
        <div>
          <div class="audio-player-title">Narrador del Terror</div>
          <div class="audio-player-sub">Síntesis de voz — elige tu tono oscuro</div>
        </div>
      </div>
      <div class="audio-controls-row">
        <button type="button" class="audio-play-btn" id="${playBtnId}" onclick="window.__onAudioPlay&&window.__onAudioPlay()">▶</button>
        <div class="audio-waveform" id="${waveId}"></div>
        <span class="audio-status-text" id="${statusId}">Listo</span>
      </div>
      <div class="voice-panel">
        <div class="voice-panel-label">Tono de Narración</div>
        <div class="voice-presets-grid">${presetsHtml}</div>
        <div class="voice-select-row">
          <span class="voice-select-label">Voz:</span>
          <select class="voice-select-simple" id="${voiceSelId}">
            <option value="">🎙 Automática</option>
          </select>
        </div>
      </div>
    </div>`;
};

window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());

// ── Init ──
if (window.speechSynthesis) {
  loadVoices();
  document.querySelectorAll('.audio-waveform').forEach(el => { if (el.id) window.buildWaveform(el.id, 40); });
}

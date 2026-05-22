// ═══════════════════════════════
// AUDIO ENGINE — Text to Speech
// ═══════════════════════════════

let currentPlayingId  = null;
let isPlaying         = false;
let currentUtterance  = null;
let availableVoices   = [];
let waveformInterval  = null;

// Load voices
function loadVoices() {
  availableVoices = window.speechSynthesis.getVoices();
  if (!availableVoices.length) {
    window.speechSynthesis.onvoiceschanged = () => {
      availableVoices = window.speechSynthesis.getVoices();
      document.querySelectorAll('.voice-picker').forEach(sel => window.populateVoices(sel.id || sel));
    };
  } else {
    document.querySelectorAll('.voice-picker').forEach(sel => window.populateVoices(sel.id || sel));
  }
}

window.populateVoices = function(selectIdOrEl) {
  const sel = typeof selectIdOrEl === 'string' ? document.getElementById(selectIdOrEl) : selectIdOrEl;
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">🎙 Voz automática del sistema</option>';

  const esVoices = availableVoices.filter(v => v.lang.startsWith('es') || v.name.toLowerCase().includes('spanish'));
  const other    = availableVoices.filter(v => !v.lang.startsWith('es') && !v.name.toLowerCase().includes('spanish'));

  if (esVoices.length) {
    const grp = document.createElement('optgroup');
    grp.label = '🇪🇸 Voces en Español';
    esVoices.forEach(v => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; grp.appendChild(o); });
    sel.appendChild(grp);
  }
  if (other.length) {
    const grp = document.createElement('optgroup');
    grp.label = '🌍 Otras Voces';
    other.slice(0,8).forEach(v => { const o = document.createElement('option'); o.value = v.name; o.textContent = `${v.name} (${v.lang})`; grp.appendChild(o); });
    sel.appendChild(grp);
  }
  if (current) sel.value = current;
};

// Build waveform bars
window.buildWaveform = function(containerId, bars = 40) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: bars }, (_, i) => {
    const h = Math.sin(i * 0.5) * 15 + Math.random() * 15 + 6;
    return `<div class="wave-bar" style="height:${h}px;"></div>`;
  }).join('');
};

function startWaveAnim(containerId) {
  stopWaveAnim();
  waveformInterval = setInterval(() => {
    const el = document.getElementById(containerId);
    if (!el) { stopWaveAnim(); return; }
    el.querySelectorAll('.wave-bar').forEach(b => {
      b.style.height = (Math.random() * 34 + 6) + 'px';
      b.classList.add('active');
    });
  }, 110);
}

function stopWaveAnim() {
  if (waveformInterval) { clearInterval(waveformInterval); waveformInterval = null; }
}

function resetWave(containerId) {
  stopWaveAnim();
  const el = document.getElementById(containerId);
  if (!el) return;
  el.querySelectorAll('.wave-bar').forEach(b => { b.classList.remove('active'); b.style.height = '8px'; });
}

function pickVoice(name) {
  if (!availableVoices.length) return null;
  if (name) { const v = availableVoices.find(v => v.name === name); if (v) return v; }
  return availableVoices.find(v => v.lang.startsWith('es')) || null;
}

function stopAll() {
  window.speechSynthesis.cancel();
  isPlaying = false; currentPlayingId = null;
  stopWaveAnim();
}

// ── Main story player ──
window.toggleStoryAudio = function(id, title, text, playBtnId, waveformId, statusId, voiceName) {
  const playBtn  = document.getElementById(playBtnId);
  const statusEl = document.getElementById(statusId);

  if (currentPlayingId === id && isPlaying) {
    stopAll();
    if (playBtn)  { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Pausado';
    resetWave(waveformId);
    return;
  }

  stopAll();
  stopAllMiniPlayers();
  currentPlayingId = id; isPlaying = true;

  if (playBtn)  { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'Narrando...';
  window.buildWaveform(waveformId, 50);
  startWaveAnim(waveformId);

  const utt    = new SpeechSynthesisUtterance(`${title}. ${text}`);
  utt.rate     = 0.85; utt.pitch = 0.75; utt.volume = 1; utt.lang = 'es-ES';
  const voice  = pickVoice(voiceName);
  if (voice) utt.voice = voice;

  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null;
    stopWaveAnim();
    if (playBtn)  { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Terminado';
    resetWave(waveformId);
  };

  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// ── Mini card player ──
function stopAllMiniPlayers() {
  document.querySelectorAll('.mini-play-btn').forEach(b => { b.textContent = '▶'; });
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

  const utt    = new SpeechSynthesisUtterance(`${title}. ${text}`);
  utt.rate     = 0.85; utt.pitch = 0.75; utt.volume = 1; utt.lang = 'es-ES';
  const voice  = pickVoice('');
  if (voice) utt.voice = voice;

  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null;
    if (btn)  btn.textContent = '▶';
    if (wave) wave.classList.remove('playing');
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// ── Preview on upload page ──
window.previewAudio = function() {
  const titulo   = document.getElementById('titulo');
  const historia = document.getElementById('historia');
  const playBtn  = document.getElementById('previewPlayBtn');
  const statusEl = document.getElementById('previewStatus');
  const voiceSel = document.getElementById('voiceSelect');
  if (!titulo || !historia) return;

  const text = `${titulo.value || 'Sin título'}. ${historia.value || 'Escribe tu historia para escuchar la vista previa.'}`;

  if (currentPlayingId === 'preview' && isPlaying) {
    stopAll();
    if (playBtn)  { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Listo';
    resetWave('previewWaveform');
    return;
  }

  stopAll();
  currentPlayingId = 'preview'; isPlaying = true;
  if (playBtn)  { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'Narrando...';
  window.buildWaveform('previewWaveform', 40);
  startWaveAnim('previewWaveform');

  const utt    = new SpeechSynthesisUtterance(text.substring(0, 600));
  utt.rate     = 0.85; utt.pitch = 0.75; utt.volume = 1; utt.lang = 'es-ES';
  const voice  = pickVoice(voiceSel ? voiceSel.value : '');
  if (voice) utt.voice = voice;

  utt.onend = utt.onerror = () => {
    isPlaying = false; currentPlayingId = null;
    stopWaveAnim();
    if (playBtn)  { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'Listo';
    resetWave('previewWaveform');
  };
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
};

// Stop on page leave
window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());

// ── Init ──
if (window.speechSynthesis) {
  loadVoices();
  document.querySelectorAll('.audio-waveform').forEach(el => { if (el.id) window.buildWaveform(el.id, 40); });
} else {
  document.querySelectorAll('.audio-player').forEach(el => {
    el.innerHTML += '<p style="font-size:0.8rem;color:var(--text-3);margin-top:0.5rem;">⚠ Tu navegador no soporta síntesis de voz.</p>';
  });
}

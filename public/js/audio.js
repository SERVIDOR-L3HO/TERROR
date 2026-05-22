// ====== AUDIO ENGINE — Text to Speech Horror Narrator ======

let currentUtterance = null;
let currentPlayingId = null;
let isPlaying = false;
let availableVoices = [];

// Load voices
function loadVoices() {
  availableVoices = window.speechSynthesis.getVoices();
  if (availableVoices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      availableVoices = window.speechSynthesis.getVoices();
      populateAllVoiceSelects();
    };
  } else {
    populateAllVoiceSelects();
  }
}

function populateAllVoiceSelects() {
  document.querySelectorAll('.voice-select').forEach(sel => {
    populateVoices(sel.id || sel);
  });
}

window.populateVoices = function(selectIdOrEl) {
  const sel = typeof selectIdOrEl === 'string'
    ? document.getElementById(selectIdOrEl)
    : selectIdOrEl;
  if (!sel) return;

  const current = sel.value;
  sel.innerHTML = '<option value="">🎙 Voz automática del sistema</option>';

  const preferred = availableVoices.filter(v =>
    v.lang.startsWith('es') || v.name.toLowerCase().includes('spanish')
  );
  const others = availableVoices.filter(v =>
    !v.lang.startsWith('es') && !v.name.toLowerCase().includes('spanish')
  );

  if (preferred.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '🇪🇸 Voces en Español';
    preferred.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang})`;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }

  if (others.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '🌍 Otras Voces';
    others.slice(0, 10).forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang})`;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }

  if (current) sel.value = current;
};

// Build waveform bars
function buildWaveform(containerId, barCount = 40) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: barCount }, (_, i) => {
    const h = Math.sin(i * 0.5) * 20 + Math.random() * 20 + 8;
    return `<div class="wave-bar" style="height:${h}px;animation-delay:${(i * 0.04) % 0.8}s"></div>`;
  }).join('');
}

// Animate waveform while playing
function animateWaveform(containerId, playing) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.querySelectorAll('.wave-bar').forEach((bar, i) => {
    if (playing) {
      bar.classList.add('active');
      const randomH = Math.random() * 40 + 8;
      bar.style.height = randomH + 'px';
    } else {
      bar.classList.remove('active');
    }
  });
}

// Animate waveform continuously while playing
let waveformInterval = null;
function startWaveformAnimation(containerId) {
  stopWaveformAnimation();
  waveformInterval = setInterval(() => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.querySelectorAll('.wave-bar').forEach(bar => {
      bar.style.height = (Math.random() * 45 + 5) + 'px';
    });
  }, 120);
}

function stopWaveformAnimation() {
  if (waveformInterval) { clearInterval(waveformInterval); waveformInterval = null; }
}

// ====== MAIN STORY AUDIO TOGGLE ======
window.toggleStoryAudio = function(id, title, text, playBtnId, waveformId, statusId, voiceName) {
  const playBtn = document.getElementById(playBtnId);
  const statusEl = document.getElementById(statusId);

  // If same story is playing, pause/stop it
  if (currentPlayingId === id && isPlaying) {
    window.speechSynthesis.cancel();
    stopPlayback(playBtnId, waveformId, statusId);
    return;
  }

  // Stop any current playback
  if (isPlaying) {
    window.speechSynthesis.cancel();
    stopAllMiniPlayers();
  }

  // Start new playback
  currentPlayingId = id;
  isPlaying = true;

  if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'NARRANDO...';
  buildWaveform(waveformId, 50);
  startWaveformAnimation(waveformId);

  const utterance = new SpeechSynthesisUtterance();
  utterance.text = `${title}. ${text}`;
  utterance.rate = 0.85;
  utterance.pitch = 0.7;
  utterance.volume = 1;
  utterance.lang = 'es-ES';

  // Set voice
  if (voiceName && availableVoices.length) {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) utterance.voice = voice;
  } else if (availableVoices.length) {
    const esVoice = availableVoices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
  }

  utterance.onend = () => stopPlayback(playBtnId, waveformId, statusId);
  utterance.onerror = () => stopPlayback(playBtnId, waveformId, statusId);

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

function stopPlayback(playBtnId, waveformId, statusId) {
  isPlaying = false;
  currentPlayingId = null;
  stopWaveformAnimation();

  const playBtn = document.getElementById(playBtnId);
  if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }

  const statusEl = document.getElementById(statusId);
  if (statusEl) statusEl.textContent = 'TERMINADO';

  animateWaveform(waveformId, false);
}

function stopAllMiniPlayers() {
  document.querySelectorAll('.mini-play').forEach(btn => {
    btn.textContent = '▶';
    btn.classList.remove('playing');
  });
  document.querySelectorAll('.mini-wave').forEach(w => w.classList.remove('playing'));
}

// ====== MINI CARD PLAYER ======
window.playCardAudio = function(id, title, text) {
  const playBtn = document.getElementById(`miniplay-${id}`);
  const wave = document.getElementById(`miniwave-${id}`);

  if (currentPlayingId === `mini-${id}` && isPlaying) {
    window.speechSynthesis.cancel();
    isPlaying = false;
    currentPlayingId = null;
    stopWaveformAnimation();
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (wave) wave.classList.remove('playing');
    return;
  }

  // Stop all
  window.speechSynthesis.cancel();
  stopAllMiniPlayers();
  stopWaveformAnimation();

  currentPlayingId = `mini-${id}`;
  isPlaying = true;

  if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
  if (wave) wave.classList.add('playing');

  const utterance = new SpeechSynthesisUtterance();
  utterance.text = `${title}. ${text}`;
  utterance.rate = 0.85;
  utterance.pitch = 0.7;
  utterance.volume = 1;
  utterance.lang = 'es-ES';

  if (availableVoices.length) {
    const esVoice = availableVoices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
  }

  utterance.onend = () => {
    isPlaying = false;
    currentPlayingId = null;
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (wave) wave.classList.remove('playing');
  };
  utterance.onerror = utterance.onend;

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
};

// ====== PREVIEW AUDIO (upload page) ======
window.previewAudio = function() {
  const titulo = document.getElementById('titulo');
  const historia = document.getElementById('historia');
  const voiceSelect = document.getElementById('voiceSelect');
  const playBtn = document.getElementById('previewPlayBtn');
  const statusEl = document.getElementById('previewStatus');

  if (!titulo || !historia) return;

  const text = `${titulo.value || 'Historia sin título'}. ${historia.value || 'Escribe tu historia para escuchar la vista previa.'}`;

  if (isPlaying && currentPlayingId === 'preview') {
    window.speechSynthesis.cancel();
    isPlaying = false;
    currentPlayingId = null;
    stopWaveformAnimation();
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'LISTO';
    return;
  }

  window.speechSynthesis.cancel();
  currentPlayingId = 'preview';
  isPlaying = true;

  if (playBtn) { playBtn.textContent = '⏸'; playBtn.classList.add('playing'); }
  if (statusEl) statusEl.textContent = 'NARRANDO...';

  buildWaveform('previewWaveform', 40);
  startWaveformAnimation('previewWaveform');

  const utterance = new SpeechSynthesisUtterance();
  utterance.text = text.substring(0, 500);
  utterance.rate = 0.85;
  utterance.pitch = 0.7;
  utterance.volume = 1;
  utterance.lang = 'es-ES';

  if (voiceSelect && voiceSelect.value && availableVoices.length) {
    const voice = availableVoices.find(v => v.name === voiceSelect.value);
    if (voice) utterance.voice = voice;
  } else if (availableVoices.length) {
    const esVoice = availableVoices.find(v => v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;
  }

  utterance.onend = () => {
    isPlaying = false;
    currentPlayingId = null;
    stopWaveformAnimation();
    if (playBtn) { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); }
    if (statusEl) statusEl.textContent = 'LISTO';
    animateWaveform('previewWaveform', false);
  };
  utterance.onerror = utterance.onend;

  window.speechSynthesis.speak(utterance);
};

// Stop TTS when leaving page
window.addEventListener('beforeunload', () => {
  window.speechSynthesis.cancel();
});

// ====== INIT ======
if (window.speechSynthesis) {
  loadVoices();
  // Build waveform bars on any page that has them
  document.querySelectorAll('.audio-waveform').forEach(el => {
    buildWaveform(el.id, 40);
  });
} else {
  document.querySelectorAll('.audio-section').forEach(el => {
    el.innerHTML += '<p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem;">⚠ Tu navegador no soporta síntesis de voz.</p>';
  });
}
